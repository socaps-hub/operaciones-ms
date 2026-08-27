import { formatYYYYMMDD } from "./date.util";

export class ExcelUtils {
  /**
   * Convierte fechas provenientes de Excel (serial, texto o ISO)
   */
  // static parseExcelDate(value: any): string | null {
  //   if (!value) return null;

  //   if (typeof value === 'number') {
  //     const baseDate = new Date(Date.UTC(1899, 11, 30));
  //     const fecha = new Date(baseDate.getTime() + value * 86400000);
  //     return fecha.toISOString();
  //   }

  //   if (typeof value === 'string') {
  //     const parts = value.includes('/') ? value.split('/') : value.split('-');
  //     if (parts.length === 3) {
  //       if (parts[0].length === 2) {
  //         const [d, m, y] = parts;
  //         return new Date(+y, +m - 1, +d).toISOString();
  //       } else {
  //         const [y, m, d] = parts;
  //         return new Date(+y, +m - 1, +d).toISOString();
  //       }
  //     }
  //   }

  //   const fecha = new Date(value);
  //   return isNaN(fecha.getTime()) ? null : fecha.toISOString();
  // }

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
