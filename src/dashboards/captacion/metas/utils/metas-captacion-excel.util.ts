import {
  MetaCaptacionMesNumero,
  MetaCaptacionMensualExcel,
  MetaCaptacionSucursalExcel,
} from '../types/meta-captacion.types';
import { normalizeSucursalName } from '../../../common/utils/meta-sucursal.util';

type MesConfig = {
  numero: MetaCaptacionMesNumero;
  aliases: string[];
};

type SucursalBlock = {
  sucursalNombre: string;
  startColumn: number;
};

export class MetasCaptacionExcelUtil {
  private static readonly TOTAL_TOLERANCE = 0.01;

  private static readonly EXPECTED_SUBHEADERS = [
    'vista',
    'plazo',
    'infantil',
    'total',
  ] as const;

  private static readonly MESES: MesConfig[] = [
    { numero: 1, aliases: ['ene', 'enero'] },
    { numero: 2, aliases: ['feb', 'febrero'] },
    { numero: 3, aliases: ['mar', 'marzo'] },
    { numero: 4, aliases: ['abr', 'abril'] },
    { numero: 5, aliases: ['may', 'mayo'] },
    { numero: 6, aliases: ['jun', 'junio'] },
    { numero: 7, aliases: ['jul', 'julio'] },
    { numero: 8, aliases: ['ago', 'agosto'] },
    { numero: 9, aliases: ['sep', 'sept', 'septiembre'] },
    { numero: 10, aliases: ['oct', 'octubre'] },
    { numero: 11, aliases: ['nov', 'noviembre'] },
    { numero: 12, aliases: ['dic', 'diciembre'] },
  ];

  public static parse(rows: unknown[][]): MetaCaptacionSucursalExcel[] {
    if (!rows?.length) {
      throw new Error('El archivo de metas de captación está vacío.');
    }

    const structure = this._findStructure(rows);

    const sucursales = structure.blocks.map((block) =>
      this._parseSucursal(rows, structure.subheaderRowIndex, block),
    );

    this._validateDuplicateSucursales(sucursales);

    this._validateGlobal(sucursales);

    return sucursales;
  }

  private static _findStructure(rows: unknown[][]): { subheaderRowIndex: number; blocks: SucursalBlock[]; } {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex] ?? [];

      const starts = this._findSubheaderBlocks(row);

      if (!starts.length) {
        continue;
      }

      const blocks: SucursalBlock[] = [];

      for (const startColumn of starts) {
        const sucursalNombre = this._findSucursalName(
          rows,
          rowIndex,
          startColumn,
        );

        if (!sucursalNombre) {
          throw new Error(
            `No se pudo identificar la sucursal asociada al bloque que inicia en la columna ${
              startColumn + 1
            }.`,
          );
        }

        blocks.push({
          sucursalNombre,
          startColumn,
        });
      }

      if (blocks.length) {
        return {
          subheaderRowIndex: rowIndex,
          blocks,
        };
      }
    }

    throw new Error(
      'No se encontró la estructura esperada de metas de captación. ' +
        'Cada sucursal debe contener las columnas Vista, Plazo, Infantil y Total.',
    );
  }

  private static _findSubheaderBlocks(row: unknown[]): number[] {
    const blocks: number[] = [];

    for (let columnIndex = 0; columnIndex <= row.length - 4; columnIndex++) {
      const headers = [
        this._normalizeText(row[columnIndex]),
        this._normalizeText(row[columnIndex + 1]),
        this._normalizeText(row[columnIndex + 2]),
        this._normalizeText(row[columnIndex + 3]),
      ];

      const valid = this.EXPECTED_SUBHEADERS.every(
        (expected, index) => headers[index] === expected,
      );

      if (!valid) {
        continue;
      }

      blocks.push(columnIndex);

      // Ya sabemos que este bloque ocupa cuatro columnas.
      columnIndex += 3;
    }

    return blocks;
  }

  private static _findSucursalName(
    rows: unknown[][],
    subheaderRowIndex: number,
    startColumn: number,
  ): string | null {
    if (subheaderRowIndex === 0) {
      return null;
    }

    const value = this._cellToText(rows[subheaderRowIndex - 1]?.[startColumn]);

    return value || null;
  }

  private static _parseSucursal(
    rows: unknown[][],
    subheaderRowIndex: number,
    block: SucursalBlock,
  ): MetaCaptacionSucursalExcel {
    const metas: MetaCaptacionMensualExcel[] = [];

    let totalRow: unknown[] | null = null;

    for (
      let rowIndex = subheaderRowIndex + 1;
      rowIndex < rows.length;
      rowIndex++
    ) {
      const row = rows[rowIndex] ?? [];

      const rowLabel = this._normalizeText(row[0]);

      if (!rowLabel) {
        continue;
      }

      if (rowLabel === 'total') {
        totalRow = row;
        break;
      }

      const mes = this._resolveMes(rowLabel);

      if (!mes) {
        continue;
      }

      const vista = this._parseAmount(
        row[block.startColumn],
        block.sucursalNombre,
        rowLabel,
        'Vista',
      );

      const plazo = this._parseAmount(
        row[block.startColumn + 1],
        block.sucursalNombre,
        rowLabel,
        'Plazo',
      );

      const infantil = this._parseAmount(
        row[block.startColumn + 2],
        block.sucursalNombre,
        rowLabel,
        'Infantil',
      );

      const total = this._parseAmount(
        row[block.startColumn + 3],
        block.sucursalNombre,
        rowLabel,
        'Total',
      );

      this._validateMonthlyTotal({
        sucursalNombre: block.sucursalNombre,
        mes,
        vista,
        plazo,
        infantil,
        total,
      });

      metas.push({
        mes,
        vista,
        plazo,
        infantil,
        total,
      });
    }

    this._validateAllMonths(block.sucursalNombre, metas);

    if (!totalRow) {
      throw new Error(
        `No se encontró la fila Total para la sucursal "${block.sucursalNombre}".`,
      );
    }

    const totalAnual = {
      vista: this._parseAmount(
        totalRow[block.startColumn],
        block.sucursalNombre,
        'Total',
        'Vista',
      ),

      plazo: this._parseAmount(
        totalRow[block.startColumn + 1],
        block.sucursalNombre,
        'Total',
        'Plazo',
      ),

      infantil: this._parseAmount(
        totalRow[block.startColumn + 2],
        block.sucursalNombre,
        'Total',
        'Infantil',
      ),

      total: this._parseAmount(
        totalRow[block.startColumn + 3],
        block.sucursalNombre,
        'Total',
        'Total',
      ),
    };

    this._validateAnnualTotals(block.sucursalNombre, metas, totalAnual);

    return {
      sucursalNombre: block.sucursalNombre,
      metas,
      totalAnual,
    };
  }

  private static _validateMonthlyTotal(params: {
    sucursalNombre: string;
    mes: MetaCaptacionMesNumero;
    vista: number;
    plazo: number;
    infantil: number;
    total: number;
  }): void {
    const { sucursalNombre, mes, vista, plazo, infantil, total } = params;

    const calculated = vista + plazo + infantil;

    if (!this._amountsMatch(calculated, total)) {
      throw new Error(
        `El total mensual de la sucursal "${sucursalNombre}" ` +
          `para ${this._getMonthName(mes)} no coincide. ` +
          `Esperado: ${calculated}. Archivo: ${total}.`,
      );
    }
  }

  private static _validateAnnualTotals(
    sucursalNombre: string,
    metas: MetaCaptacionMensualExcel[],
    totalAnual: {
      vista: number;
      plazo: number;
      infantil: number;
      total: number;
    },
  ): void {
    const calculated = metas.reduce(
      (acc, meta) => {
        acc.vista += meta.vista;
        acc.plazo += meta.plazo;
        acc.infantil += meta.infantil;
        acc.total += meta.total;

        return acc;
      },
      {
        vista: 0,
        plazo: 0,
        infantil: 0,
        total: 0,
      },
    );

    const fields = [
      {
        label: 'Vista',
        calculated: calculated.vista,
        excel: totalAnual.vista,
      },
      {
        label: 'Plazo',
        calculated: calculated.plazo,
        excel: totalAnual.plazo,
      },
      {
        label: 'Infantil',
        calculated: calculated.infantil,
        excel: totalAnual.infantil,
      },
      {
        label: 'Total',
        calculated: calculated.total,
        excel: totalAnual.total,
      },
    ];

    for (const field of fields) {
      if (!this._amountsMatch(field.calculated, field.excel)) {
        throw new Error(
          `El total anual de ${field.label} para la sucursal ` +
            `"${sucursalNombre}" no coincide. ` +
            `Esperado: ${field.calculated}. ` +
            `Archivo: ${field.excel}.`,
        );
      }
    }

    const annualCalculated =
      totalAnual.vista + totalAnual.plazo + totalAnual.infantil;

    if (!this._amountsMatch(annualCalculated, totalAnual.total)) {
      throw new Error(
        `El total anual general de la sucursal ` +
          `"${sucursalNombre}" no coincide con ` +
          'Vista + Plazo + Infantil.',
      );
    }
  }

  private static _validateAllMonths(
    sucursalNombre: string,
    metas: MetaCaptacionMensualExcel[],
  ): void {
    const meses = new Set(metas.map((meta) => meta.mes));

    if (meses.size !== 12) {
      const faltantes = this.MESES.filter((mes) => !meses.has(mes.numero)).map(
        (mes) => this._getMonthName(mes.numero),
      );

      throw new Error(
        `La sucursal "${sucursalNombre}" no contiene los 12 meses.` +
          (faltantes.length ? ` Faltan: ${faltantes.join(', ')}.` : ''),
      );
    }
  }

  private static _validateDuplicateSucursales(
    sucursales: MetaCaptacionSucursalExcel[],
  ): void {
    const names = new Set<string>();

    for (const sucursal of sucursales) {
      const normalized = normalizeSucursalName(sucursal.sucursalNombre);

      if (names.has(normalized)) {
        throw new Error(
          `La sucursal "${sucursal.sucursalNombre}" aparece más de una vez en el archivo.`,
        );
      }

      names.add(normalized);
    }
  }

  private static _validateGlobal(
    sucursales: MetaCaptacionSucursalExcel[],
  ): void {
    const hasGlobal = sucursales.some(
      (sucursal) => normalizeSucursalName(sucursal.sucursalNombre) === 'global',
    );

    if (!hasGlobal) {
      throw new Error(
        'El archivo de metas de captación no contiene el bloque Global.',
      );
    }
  }

  private static _resolveMes(value: string): MetaCaptacionMesNumero | null {
    const mes = this.MESES.find((item) => item.aliases.includes(value));

    return mes?.numero ?? null;
  }

  private static _parseAmount(
    value: unknown,
    sucursal: string,
    periodo: string,
    columna: string,
  ): number {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      value === '-'
    ) {
      return 0;
    }

    let parsed: number;

    if (typeof value === 'number') {
      parsed = value;
    } else {
      const normalized = String(value)
        .trim()
        .replace(/\$/g, '')
        .replace(/,/g, '');

      parsed = Number(normalized);
    }

    if (!Number.isFinite(parsed)) {
      throw new Error(
        `Valor inválido en "${sucursal}", ` +
          `${periodo}, ${columna}: "${String(value)}".`,
      );
    }

    if (parsed < 0) {
      throw new Error(
        `No se permiten metas negativas en "${sucursal}", ` +
          `${periodo}, ${columna}.`,
      );
    }

    return parsed;
  }

  private static _amountsMatch(first: number, second: number): boolean {
    return Math.abs(first - second) <= this.TOTAL_TOLERANCE;
  }

  private static _normalizeText(value: unknown): string {
    return this._cellToText(value)
      .toLocaleLowerCase('es-MX')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private static _cellToText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private static _getMonthName(mes: MetaCaptacionMesNumero): string {
    return (
      this.MESES.find((item) => item.numero === mes)?.aliases[1] ?? String(mes)
    );
  }
}
