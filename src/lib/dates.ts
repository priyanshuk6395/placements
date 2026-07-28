export function parsePlacementDate(value: string | number): Date | null {
  if (value === null || value === undefined) return null;

  const str = String(value).trim();
  if (!str) return null;

  // Excel serial dates: 5 digits (common in exported sheets)
  if (/^\d{5}$/.test(str)) {
    const serial = Number(str);
    const date = new Date((serial - 25569) * 86400 * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const date = new Date(str);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Indian format: DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [day, month, year] = str.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Safe fallback for mixed delimiters/content
  const normalized = str.replace(/-/g, "/");
  const fallback = new Date(normalized);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}
