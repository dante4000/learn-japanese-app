"use client";

import { useId, useMemo, useRef, useState } from "react";
import { type DataColumn, type DataRow, type TableSort, formatTableValue, queryTableRows, tableCsv } from "@/lib/table-data";

export type { DataColumn, DataRow } from "@/lib/table-data";

/** Detailed data stays readable while the chart keeps its overview scale. */
export function DataTable({ title, columns, rows, currency = "USD", defaultSort, selectedId, onSelectRow }: {
  title: string;
  columns: DataColumn[];
  rows: DataRow[];
  currency?: string;
  defaultSort?: TableSort;
  selectedId?: string;
  onSelectRow?: (id: string) => void;
}) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TableSort | null>(defaultSort ?? null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const visibleColumns = columns.filter((c, i) => i === 0 || !hiddenColumns.includes(c.key));
  const filtered = useMemo(() => queryTableRows(rows, columns, query, sort, currency), [rows, columns, query, sort, currency]);
  const pages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const currentPage = Math.min(page, pages - 1);
  const start = pageSize ? currentPage * pageSize : 0;
  const displayed = pageSize ? filtered.slice(start, start + pageSize) : filtered;
  const hasLinks = rows.some((row) => row.href);
  const totals = visibleColumns.filter((column) => column.total);
  const numeric = (column: DataColumn) => ["money", "percent", "number"].includes(column.format ?? "text");
  const resetScroll = () => { if (viewport.current) viewport.current.scrollTop = 0; };
  const resetPage = () => { setPage(0); resetScroll(); };

  function download() {
    const url = URL.createObjectURL(new Blob(["\uFEFF", tableCsv(filtered, visibleColumns)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "") || "data"}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="data-table min-w-0 space-y-3">
    <div className="flex flex-wrap items-end gap-2">
      <label className="min-w-44 flex-1 text-xs font-medium text-muted" htmlFor={`${id}-search`}>Search this table
        <input id={`${id}-search`} type="search" value={query} onChange={(e) => { setQuery(e.target.value); resetPage(); }} placeholder="Month, source, amount…" className="mt-1 block min-h-11 w-full rounded-lg border hairline bg-surface px-3 text-base text-cream sm:text-sm" />
      </label>
      <details className="relative">
        <summary className="flex min-h-11 cursor-pointer items-center rounded-lg border hairline bg-surface px-3 text-sm text-cream">Columns · {visibleColumns.length}/{columns.length}</summary>
        <fieldset className="absolute left-0 z-40 sm:left-auto sm:right-0 mt-2 max-h-72 w-64 overflow-auto rounded-xl border hairline bg-surface p-3 shadow-lg">
          <legend className="sr-only">Visible columns</legend>
          {columns.map((c, i) => <label key={c.key} className="flex min-h-11 items-center gap-3 text-sm text-cream">
            <input type="checkbox" checked={i === 0 || !hiddenColumns.includes(c.key)} disabled={i === 0} onChange={() => setHiddenColumns((current) => current.includes(c.key) ? current.filter((key) => key !== c.key) : [...current, c.key])} />{c.label}
          </label>)}
        </fieldset>
      </details>
      <button type="button" onClick={download} disabled={!filtered.length} className="min-h-11 rounded-lg border hairline bg-surface px-3 text-sm text-cream hover:bg-surface-2 disabled:opacity-50">Export CSV</button>
      <button type="button" onClick={() => { setQuery(""); setSort(defaultSort ?? null); setHiddenColumns([]); setPageSize(25); resetPage(); }} className="min-h-11 rounded-lg px-3 text-sm text-muted hover:bg-surface-2 hover:text-cream">Reset</button>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
      <p role="status">{filtered.length ? `${start + 1}–${start + displayed.length}` : "0"} of {filtered.length} rows{filtered.length !== rows.length ? ` · ${rows.length} before search` : ""}</p>
      <label className="flex items-center gap-2">Rows
        <select aria-label={`Rows per page for ${title}`} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }} className="min-h-11 rounded-lg border hairline bg-surface px-2 text-sm text-cream">
          {[10, 25, 50, 100, 0].map((size) => <option key={size} value={size}>{size || "All"}</option>)}
        </select>
      </label>
    </div>
    <div ref={viewport} tabIndex={0} role="region" aria-label={`${title}. Scroll for more rows and columns.`} aria-describedby={`${id}-help`} className="data-table-scroll max-h-[28rem] overflow-auto rounded-xl border hairline" style={{ scrollbarWidth: "auto", scrollbarGutter: "stable" }}>
      <table className="w-full border-separate border-spacing-0 text-sm" style={{ minWidth: Math.max(360, 180 + (visibleColumns.length - 1) * 152 + (hasLinks ? 144 : 0)) }}>
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>{visibleColumns.map((column, i) => <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? sort.direction === "asc" ? "ascending" : "descending" : "none"} className={`sticky top-0 border-b hairline bg-surface-2 ${i === 0 ? "left-0 z-30" : "z-20"}`}>
            <button type="button" title={column.description} onClick={() => { setSort({ key: column.key, direction: sort?.key === column.key && sort.direction === "asc" ? "desc" : "asc" }); resetPage(); }} className={`flex min-h-12 w-full items-center gap-2 whitespace-nowrap px-4 py-3 text-cream hover:bg-[var(--color-line)] ${numeric(column) ? "justify-end" : "text-left"}`}>
              {column.label}<span aria-hidden="true" className={sort?.key === column.key ? "text-blue" : "text-muted"}>{sort?.key === column.key ? sort.direction === "asc" ? "↑" : "↓" : "↕"}</span>
            </button>
          </th>)}{hasLinks && <th scope="col" className="sticky top-0 z-20 border-b hairline bg-surface-2 px-4 py-3 text-left text-cream">Activity</th>}</tr>
        </thead>
        <tbody>
          {displayed.map((row) => <tr key={row.id} className={`group ${selectedId === row.id ? "bg-surface-2" : "bg-surface"}`}>
            {visibleColumns.map((column, i) => {
              const value = formatTableValue(row.values[column.key], column, currency);
              const className = `border-b hairline px-4 py-3 text-cream group-hover:bg-surface-2 ${numeric(column) ? "tnum whitespace-nowrap text-right" : "max-w-80 break-words text-left"} ${i === 0 ? "sticky left-0 z-10 bg-inherit font-medium" : ""}`;
              return i === 0 ? <th key={column.key} scope="row" className={className}>{onSelectRow ? <button type="button" aria-pressed={selectedId === row.id} onClick={() => onSelectRow(row.id)} className="min-h-9 text-left text-blue underline decoration-[var(--color-line-2)] underline-offset-4">{value}</button> : value}</th> : <td key={column.key} className={className}>{value}</td>;
            })}
            {hasLinks && <td className="border-b hairline px-4 py-3">{row.href ? <a href={row.href} className="inline-flex min-h-9 items-center text-blue underline underline-offset-4">{row.linkLabel ?? "View transactions"}</a> : "—"}</td>}
          </tr>)}
          {!displayed.length && <tr><td colSpan={visibleColumns.length + Number(hasLinks)} className="p-8 text-center text-muted">{query ? "No rows match this search. Clear the search to see all data." : "No records for this period."}</td></tr>}
        </tbody>
        {totals.length > 0 && filtered.length > 0 && <tfoot><tr>{visibleColumns.map((column, i) => <th key={column.key} scope={i === 0 ? "row" : undefined} className={`sticky bottom-0 border-t hairline bg-surface-2 px-4 py-3 text-cream ${i === 0 ? "left-0 z-30 text-left" : "z-20 tnum text-right"}`}>{i === 0 ? "Filtered total" : column.total ? formatTableValue(filtered.reduce((sum, row) => sum + (typeof row.values[column.key] === "number" ? row.values[column.key] as number : 0), 0), column, currency) : "—"}</th>)}{hasLinks && <td className="sticky bottom-0 z-20 border-t hairline bg-surface-2" />}</tr></tfoot>}
      </table>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p id={`${id}-help`} className="max-w-lg text-xs text-muted">Scroll in either direction. Headers and the first column stay visible. Sort with a column heading. CSV includes all filtered rows and visible columns.</p>
      <div className="flex items-center gap-2 text-sm text-muted">
        <button type="button" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); resetScroll(); }} aria-label={`Previous page of ${title}`} className="min-h-11 rounded-lg border hairline px-3 hover:bg-surface-2 disabled:opacity-40">Previous</button>
        <span>{currentPage + 1} / {pages}</span>
        <button type="button" disabled={currentPage + 1 >= pages} onClick={() => { setPage(currentPage + 1); resetScroll(); }} aria-label={`Next page of ${title}`} className="min-h-11 rounded-lg border hairline px-3 hover:bg-surface-2 disabled:opacity-40">Next</button>
      </div>
    </div>
  </div>;
}
