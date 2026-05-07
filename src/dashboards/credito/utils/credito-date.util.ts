export function getMonthDateRange(periodoMes: number, periodoAnio: number) {
  const start = new Date(Date.UTC(periodoAnio, periodoMes - 1, 1));
  const end = new Date(Date.UTC(periodoAnio, periodoMes, 1));

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  return { startDate, endDate };
}

export function getMonthNameUpper(month: number): string {
  const months = [
    'ENERO',
    'FEBRERO',
    'MARZO',
    'ABRIL',
    'MAYO',
    'JUNIO',
    'JULIO',
    'AGOSTO',
    'SEPTIEMBRE',
    'OCTUBRE',
    'NOVIEMBRE',
    'DICIEMBRE',
  ];

  return months[month - 1] ?? '';
}
