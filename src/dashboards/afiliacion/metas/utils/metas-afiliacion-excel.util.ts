import {
  MetaAfiliacionHojaParsed,
  MetaAfiliacionMesNumero,
  MetaAfiliacionSucursalExcel,
  MetaAfiliacionValores,
  MetasAfiliacionExcelParsed,
} from '../types/metas-afiliacion.types';
import { normalizeSucursalName } from '../../../common/utils/meta-sucursal.util';

const MONTH_HEADERS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

const MONTH_NUMBERS: MetaAfiliacionMesNumero[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

const EXPECTED_HEADERS = ['Sucursal', ...MONTH_HEADERS, 'Total'];

export class MetasAfiliacionExcelUtil {
  static parse(
    sheets: Record<string, unknown[][]>,
  ): MetasAfiliacionExcelParsed {
    return {
      integral: this.parseSheet(sheets['Meta Integral'], 'Meta Integral'),
      ahorradorMenor: this.parseSheet(
        sheets['Meta Ahorradores'],
        'Meta Ahorradores',
      ),
    };
  }

  private static parseSheet(
    rows: unknown[][] | undefined,
    sheetName: string,
  ): MetaAfiliacionHojaParsed {
    if (!rows?.length) {
      throw new Error(`La hoja "${sheetName}" está vacía o no existe.`);
    }

    const headerIndex = rows.findIndex(
      (row) =>
        Array.isArray(row) &&
        this.normalizeText(row[0]).toLowerCase() === 'sucursal',
    );

    if (headerIndex === -1) {
      throw new Error(
        `No se encontró el encabezado "Sucursal" ` +
          `en la hoja "${sheetName}".`,
      );
    }

    const headers = rows[headerIndex];

    EXPECTED_HEADERS.forEach((expected, index) => {
      const actual = this.normalizeText(headers[index]);

      if (actual.toLowerCase() !== expected.toLowerCase()) {
        throw new Error(
          `Hoja "${sheetName}": columna ${index + 1}. ` +
            `Se esperaba "${expected}" y se encontró "${actual}".`,
        );
      }
    });

    const sucursales: MetaAfiliacionSucursalExcel[] = [];
    const nombres = new Set<string>();

    let totalCooperativa: MetaAfiliacionValores | null = null;

    for (const row of rows.slice(headerIndex + 1)) {
      if (!Array.isArray(row)) {
        continue;
      }

      if (row.every((value) => this.normalizeText(value) === '')) {
        continue;
      }

      const sucursalNombre = this.normalizeText(row[0]);

      if (!sucursalNombre) {
        throw new Error(
          `Hoja "${sheetName}": existe una fila ` +
            `con metas pero sin sucursal.`,
        );
      }

      const metas = {} as Record<MetaAfiliacionMesNumero, number>;

      MONTH_NUMBERS.forEach((month, index) => {
        metas[month] = this.parseInteger(
          row[index + 1],
          `${sheetName} / ${sucursalNombre} / ` + MONTH_HEADERS[index],
        );
      });

      const totalAnual = this.parseInteger(
        row[13],
        `${sheetName} / ${sucursalNombre} / Total`,
      );

      const totalCalculado = MONTH_NUMBERS.reduce(
        (sum, month) => sum + metas[month],
        0,
      );

      if (totalCalculado !== totalAnual) {
        throw new Error(
          `Hoja "${sheetName}": el total anual de ` +
            `"${sucursalNombre}" no coincide. ` +
            `Calculado: ${totalCalculado}. ` +
            `Excel: ${totalAnual}.`,
        );
      }

      if (sucursalNombre.toLowerCase() === 'total') {
        if (totalCooperativa) {
          throw new Error(
            `Hoja "${sheetName}": existe más de ` + `una fila "Total".`,
          );
        }

        totalCooperativa = {
          metas,
          totalAnual,
        };

        continue;
      }

      const key = normalizeSucursalName(sucursalNombre);

      if (nombres.has(key)) {
        throw new Error(
          `Hoja "${sheetName}": la sucursal ` +
            `"${sucursalNombre}" está duplicada.`,
        );
      }

      nombres.add(key);

      sucursales.push({
        sucursalNombre,
        metas,
        totalAnual,
      });
    }

    if (!sucursales.length) {
      throw new Error(`La hoja "${sheetName}" no contiene sucursales.`);
    }

    if (!totalCooperativa) {
      throw new Error(
        `La hoja "${sheetName}" no contiene ` + `la fila "Total".`,
      );
    }

    for (const month of MONTH_NUMBERS) {
      const calculado = sucursales.reduce(
        (sum, sucursal) => sum + sucursal.metas[month],
        0,
      );

      if (calculado !== totalCooperativa.metas[month]) {
        throw new Error(
          `Hoja "${sheetName}": el total de ` +
            `${MONTH_HEADERS[month - 1]} no coincide. ` +
            `Calculado: ${calculado}. ` +
            `Excel: ${totalCooperativa.metas[month]}.`,
        );
      }
    }

    const totalAnualCalculado = sucursales.reduce(
      (sum, sucursal) => sum + sucursal.totalAnual,
      0,
    );

    if (totalAnualCalculado !== totalCooperativa.totalAnual) {
      throw new Error(
        `Hoja "${sheetName}": el total anual ` + `general no coincide.`,
      );
    }

    return {
      sucursales,
      totalCooperativa,
    };
  }

  private static parseInteger(value: unknown, field: string): number {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim() !== ''
          ? Number(value.trim().replace(/,/g, ''))
          : NaN;

    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new Error(
        `El valor de "${field}" debe ser ` + `un entero mayor o igual a cero.`,
      );
    }

    return parsed;
  }

  private static normalizeText(value: unknown): string {
    return String(value ?? '').trim();
  }
}
