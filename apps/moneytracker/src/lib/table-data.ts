import { formatDate, formatMoney } from "./format";

export type TableValue = string | number | null;
export interface DataColumn {
  key: string;
  label: string;
  format?: "text" | "money" | "percent" | "number" | "date" | "month";
  total?: boolean;
  description?: string;
}
export interface DataRow {
  id: string;
  values: Record<string, TableValue>;
  sortValues?: Record<string, TableValue>;
  href?: string;
  linkLabel?: string;
}
export interface TableSort { key: string; direction: "asc" | "desc" }

export function formatTableValue(value: TableValue | undefined, column: DataColumn, currency = "USD"): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (column.format === "money") return formatMoney(value, currency);
    if (column.format === "percent") return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (column.format === "date") return formatDate(value);
  if (column.format === "month") return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`));
  return value;
}

/** Sort raw values, not formatted money or month labels. Missing values stay last. */
export function queryTableRows(rows: DataRow[], columns: DataColumn[], query: string, sort: TableSort | null, currency = "USD"): DataRow[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered = rows.filter((row) => {
    const text = columns.map((column) => `${row.values[column.key] ?? ""} ${formatTableValue(row.values[column.key], column, currency)}`).join(" ").toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
  if (!sort) return filtered;
  return filtered.sort((a, b) => {
    const av = a.sortValues?.[sort.key] ?? a.values[sort.key];
    const bv = b.sortValues?.[sort.key] ?? b.values[sort.key];
    if (av == null) return bv == null ? 0 : 1;
    if (bv == null) return -1;
    const order = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "en", { numeric: true });
    return sort.direction === "asc" ? order : -order;
  });
}

/** Export raw numbers. Escape spreadsheet formulas in bank-provided text. */
export function tableCsv(rows: DataRow[], columns: DataColumn[]): string {
  const cell = (value: TableValue | undefined) => {
    let text = value == null ? "" : String(value);
    if (typeof value === "string" && /^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [columns.map((c) => cell(c.label)).join(","), ...rows.map((r) => columns.map((c) => cell(r.values[c.key])).join(","))].join("\r\n");
}
