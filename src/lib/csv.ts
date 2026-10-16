// Excel (pt) expects ";" separator and decimal comma; BOM keeps accents.
export function csvCell(v: string | number): string {
  if (typeof v === "number") return v.toFixed(2).replace(".", ",");
  const s = String(v);
  return /[;"\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"` : s;
}
export function buildCsv(header: string[], rows: (string | number)[][]): string {
  return "\uFEFF" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
}
export const luandaDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Luanda", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
