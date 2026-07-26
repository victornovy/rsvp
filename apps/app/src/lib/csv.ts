function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Builds a CSV string (with header row) from plain objects. No external dependency. */
export function toCsv<T extends Record<string, string>>(rows: T[], columns: (keyof T)[]): string {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((col) => csvEscape(row[col] ?? "")).join(","));
  return [header, ...lines].join("\r\n");
}

const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function slugify(text: string): string {
  const normalized = text.normalize("NFD").replace(DIACRITICS_REGEX, "");
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "evento";
}
