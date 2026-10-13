// Report export without extra dependencies: CSV opens in Excel, PDF via the print dialog.

export type Cell = string | number
export interface ExportTable {
  title: string
  columns: string[]
  rows: Cell[][]
}

const escapeCsv = (v: Cell) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportExcel(filename: string, { columns, rows }: ExportTable) {
  const csv = [columns, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\r\n')
  // BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const escapeHtml = (v: Cell) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function exportPdf({ title, columns, rows }: ExportTable) {
  const win = window.open('', '_blank', 'width=1000,height=700')
  if (!win) return
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:24px;color:#111}
  h1{font-size:18px;margin:0 0 4px} p{color:#666;font-size:12px;margin:0 0 16px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #ddd;padding:6px 8px;text-align:left} th{background:#f4f4f5}
</style></head><body>
<h1>${escapeHtml(title)}</h1><p>Generated ${escapeHtml(new Date().toLocaleString())}</p>
<table><thead><tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
</body></html>`)
  win.document.close()
  win.focus()
  win.print()
}
