import {
  MetaColocacionExcelParsed,
  MetaColocacionSucursalExcel,
  MetaMesNumero,
} from '../types/meta-colocacion.types';
import { normalizeSucursalName } from './meta-sucursal.util';

const MONTH_HEADERS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const EXPECTED_HEADERS = ['Sucursal', ...MONTH_HEADERS, 'Total'] as const;

const MONTH_NUMBERS: MetaMesNumero[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export class MetasExcelUtil {
  /**
   * Lee las filas crudas del Excel, valida su estructura
   * y devuelve las metas organizadas por sucursal.
   */
  static parse(rows: unknown[][]): MetaColocacionExcelParsed {
    if (!rows?.length) {
      throw new Error('El archivo de metas está vacío.');
    }

    // Buscar la fila real de encabezados.
    const headerRowIndex = this.findHeaderRow(rows);

    if (headerRowIndex === -1) {
      throw new Error(
        'No se encontró la fila de encabezados de metas. ' +
          `Se esperaban las columnas: ${EXPECTED_HEADERS.join(', ')}.`,
      );
    }

    // Normalizar los nombres de las columnas.
    const headerRow = rows[headerRowIndex].map((value) =>
      this.normalizeText(value),
    );

    this.validateHeaders(headerRow);

    // Tomar únicamente las filas que están después de los encabezados.
    const dataRows = rows
      .slice(headerRowIndex + 1)
      .filter((row) => this.hasData(row));

    if (!dataRows.length) {
      throw new Error(
        'El archivo de metas no contiene registros después de los encabezados.',
      );
    }

    const sucursales: MetaColocacionSucursalExcel[] = [];

    let totalCooperativa: MetaColocacionExcelParsed['totalCooperativa'] | null =
      null;

    // Se usa para evitar sucursales repetidas.
    const nombresSucursales = new Set<string>();

    for (const row of dataRows) {
      const sucursalNombre = this.normalizeText(row[0]);

      if (!sucursalNombre) {
        continue;
      }

      // Extraer Enero-Diciembre.
      const metas = this.extractMonthlyValues(row, sucursalNombre);

      // Leer el total anual informado por el Excel.
      const totalAnual = this.parseAmount(row[13], `${sucursalNombre} - Total`);

      // Calcular nuevamente el total para validar el Excel.
      const totalCalculado = MONTH_NUMBERS.reduce(
        (sum, month) => sum + metas[month],
        0,
      );

      this.assertAmountsEqual(
        totalCalculado,
        totalAnual,
        `El total anual de "${sucursalNombre}" no coincide con la suma de sus 12 meses.`,
      );

      // La fila TOTAL se usa solo para validar.
      // No se guarda como una sucursal.
      if (this.isCooperativaTotalRow(sucursalNombre)) {
        if (totalCooperativa) {
          throw new Error('El archivo contiene más de una fila "Total".');
        }

        totalCooperativa = {
          metas,
          totalAnual,
        };

        continue;
      }

      // Normalizar el nombre para detectar duplicados aunque cambien acentos o mayúsculas.
      const normalizedSucursalKey = normalizeSucursalName(sucursalNombre);

      if (nombresSucursales.has(normalizedSucursalKey)) {
        throw new Error(
          `La sucursal "${sucursalNombre}" aparece más de una vez en el archivo.`,
        );
      }

      nombresSucursales.add(normalizedSucursalKey);

      sucursales.push({
        sucursalNombre,
        metas,
        totalAnual,
      });
    }

    if (!sucursales.length) {
      throw new Error(
        'No se encontraron sucursales válidas en el archivo de metas.',
      );
    }

    if (!totalCooperativa) {
      throw new Error('No se encontró la fila "Total" en el archivo.');
    }

    // Validar que los totales generales coincidan con la suma de sucursales.
    this.validateCooperativaTotals(sucursales, totalCooperativa);

    return {
      sucursales,
      totalCooperativa,
    };
  }

  /**
   * Busca automáticamente la fila donde comienzan
   * los encabezados reales del archivo.
   */
  private static findHeaderRow(rows: unknown[][]): number {
    return rows.findIndex((row) => {
      if (!Array.isArray(row)) {
        return false;
      }

      const normalized = row.map((value) =>
        this.normalizeText(value).toLowerCase(),
      );

      return (
        normalized.includes('sucursal') &&
        normalized.includes('enero') &&
        normalized.includes('diciembre')
      );
    });
  }

  /**
   * Valida que las columnas estén en el orden esperado.
   */
  private static validateHeaders(headers: string[]): void {
    EXPECTED_HEADERS.forEach((expected, index) => {
      const actual = headers[index]?.toLowerCase() ?? '';

      if (actual !== expected.toLowerCase()) {
        throw new Error(
          `Formato inválido en la columna ${index + 1}. ` +
            `Se esperaba "${expected}" y se recibió "${headers[index] ?? ''}".`,
        );
      }
    });
  }

  /**
   * Extrae los valores de Enero a Diciembre
   * de una fila del Excel.
   */
  private static extractMonthlyValues(
    row: unknown[],
    sucursalNombre: string,
  ): Record<MetaMesNumero, number> {
    const metas = {} as Record<MetaMesNumero, number>;

    MONTH_NUMBERS.forEach((month, index) => {
      metas[month] = this.parseAmount(
        row[index + 1],
        `${sucursalNombre} - ${MONTH_HEADERS[index]}`,
      );
    });

    return metas;
  }

  /**
   * Convierte un valor del Excel a número.
   * También acepta valores con "$" y comas.
   */
  private static parseAmount(value: unknown, field: string): number {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(
          `El valor de "${field}" debe ser un monto válido mayor o igual a cero.`,
        );
      }

      return value;
    }

    if (typeof value === 'string') {
      const clean = value.trim().replace(/\$/g, '').replace(/,/g, '');

      // Vacío o "-" se interpreta como cero.
      if (clean === '' || clean === '-') {
        return 0;
      }

      const parsed = Number(clean);

      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(
          `El valor "${value}" de "${field}" no es un monto válido.`,
        );
      }

      return parsed;
    }

    if (value === null || value === undefined) {
      return 0;
    }

    throw new Error(`El valor de "${field}" tiene un formato no reconocido.`);
  }

  /**
   * Valida los totales de la fila CSNI/TOTAL.
   */
  private static validateCooperativaTotals(
    sucursales: MetaColocacionSucursalExcel[],
    totalCooperativa: MetaColocacionExcelParsed['totalCooperativa'],
  ): void {
    // Validar cada mes.
    MONTH_NUMBERS.forEach((month) => {
      const totalCalculado = sucursales.reduce(
        (sum, sucursal) => sum + sucursal.metas[month],
        0,
      );

      this.assertAmountsEqual(
        totalCalculado,
        totalCooperativa.metas[month],
        `El total general del mes ${MONTH_HEADERS[month - 1]} no coincide con la suma de las sucursales.`,
      );
    });

    // Validar el total anual general.
    const totalAnualCalculado = sucursales.reduce(
      (sum, sucursal) => sum + sucursal.totalAnual,
      0,
    );

    this.assertAmountsEqual(
      totalAnualCalculado,
      totalCooperativa.totalAnual,
      'El total anual general no coincide con la suma anual de las sucursales.',
    );
  }

  /**
   * Compara montos permitiendo una diferencia máxima de un centavo.
   */
  private static assertAmountsEqual(
    calculated: number,
    expected: number,
    message: string,
  ): void {
    if (Math.abs(calculated - expected) > 0.01) {
      throw new Error(
        `${message} Calculado: ${calculated}. Esperado: ${expected}.`,
      );
    }
  }

  /**
   * Detecta la fila que representa el total de toda la cooperativa.
   */
  private static isCooperativaTotalRow(value: string): boolean {
    return value.trim().toLowerCase() === 'total';
  }

  /**
   * Convierte cualquier valor a texto limpio.
   */
  private static normalizeText(value: unknown): string {
    return String(value ?? '').trim();
  }

  /**
   * Indica si una fila contiene al menos un valor.
   */
  private static hasData(row: unknown[]): boolean {
    return row.some(
      (value) =>
        value !== null && value !== undefined && String(value).trim() !== '',
    );
  }
}
