import { formatYYYYMMDD } from "./date.util";

export class ExcelUtils {

  /**
   * Convierte fechas provenientes de Excel (serial, texto o Date)
   * Retorna SIEMPRE YYYY-MM-DD (fecha de negocio, sin UTC)
   */
  static parseExcelDate(value: any): string | null {
    if (!value) return null;

    // 1. Serial de Excel
    if (typeof value === 'number') {
      // Excel epoch: 1899-12-30
      const base = new Date(1899, 11, 30);
      base.setDate(base.getDate() + value);
      return formatYYYYMMDD(base);
    }

    // 2. String (dd/MM/yyyy | yyyy-MM-dd)
    if (typeof value === 'string') {
      const clean = value.trim();

      // dd/MM/yyyy
      if (clean.includes('/')) {
        const [d, m, y] = clean.split('/');
        if (d && m && y) {
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }

      // yyyy-MM-dd
      if (clean.includes('-')) {
        const [y, m, d] = clean.split('-');
        if (y && m && d) {
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
    }

    // 3. Date
    if (value instanceof Date && !isNaN(value.getTime())) {
      return formatYYYYMMDD(value);
    }

    return null;
  }
}
