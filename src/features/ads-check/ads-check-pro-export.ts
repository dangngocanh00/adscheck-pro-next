// VIA Audit Batch 1 Part B10 — traced production export builder
// (references/remotes/adaccounts/897.0e915523.js, function `tL`): a real
// SheetJS-backed CSV/XLSX writer (lazy-loaded, same as production's own
// chunk-split `import`), not a relabeled/fake format. Text mode is a plain
// tab-separated join of the SAME column matrix CSV/XLSX use, so every
// format always reflects one shared dataset.
export type ExportColumn<T> = { key: string; label: string; value: (row: T, index: number) => string }

export function buildExportMatrix<T>(rows: T[], columns: ExportColumn<T>[]): string[][] {
  return [columns.map((column) => column.label), ...rows.map((row, index) => columns.map((column) => column.value(row, index)))]
}

// Traced production (`ao()`): `smit-adscheck-${table_info.name}-${date}`
// (date-only, no time component) — table_info.name is a static per-table
// string (VIA's confirmed exact value is "via-list-v2", matching the
// user's own screenshot example filename). The "smit-" company prefix is
// dropped per the Adscheck rebrand; the rest of the traced pattern is kept.
export function defaultExportFilename(tableName: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `adscheck-${tableName}-${date}`
}

function escapeTextField(value: string): string {
  return /[\t\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function matrixToTabText(matrix: string[][]): string {
  return matrix.map((row) => row.map(escapeTextField).join('\t')).join('\n')
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export type ExportFormat = 'text' | 'xlsx' | 'csv'

export async function triggerExportDownload(matrix: string[][], format: ExportFormat, filename: string): Promise<void> {
  if (format === 'text') {
    downloadBlob(new Blob([matrixToTabText(matrix)], { type: 'text/plain;charset=utf-8' }), `${filename}.txt`)
    return
  }
  // Lazy-loaded, same as production's own split chunk for this library —
  // never pulled into the main bundle just for an occasional export click.
  const XLSX = await import('xlsx')
  const sheet = XLSX.utils.aoa_to_sheet(matrix)
  if (format === 'csv') {
    // Traced: a UTF-8 BOM prefix + SheetJS's own real CSV quoting, not a
    // hand-rolled comma-join.
    downloadBlob(new Blob(['﻿' + XLSX.utils.sheet_to_csv(sheet)], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`)
    return
  }
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
