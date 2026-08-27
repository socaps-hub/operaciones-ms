
export function getFechaMexicoISO(): string {
  const now = new Date();
  const mexicoOffsetMinutes = -6 * 60; // UTC-6 (México)
  const local = new Date(now.getTime() + mexicoOffsetMinutes * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
