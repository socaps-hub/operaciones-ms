/**
 * Normaliza nombres de sucursal para poder compararlos
 * sin considerar espacios, mayúsculas o acentos.
 */
export function normalizeSucursalName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
