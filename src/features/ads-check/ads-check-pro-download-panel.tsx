import { useAppLanguage, tx, m, t } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Pencil, X } from 'lucide-react'
import { buildExportMatrix, defaultExportFilename, matrixToTabText, triggerExportDownload, type ExportColumn, type ExportFormat } from './ads-check-pro-export'

type DownloadPanelProps<T> = {
  anchorRect: DOMRect
  rows: T[]
  selectedRows: T[]
  columns: ExportColumn<T>[]
  tableName: string
  // Traced production (Part B8): "Chỉ tải ID" filters exportable columns
  // down to whichever one has this key — for VIA, production's own real
  // export column set has no `field:"id"` entry at all, so the checkbox
  // has NO visible effect there. Reproduced as-is, not "fixed" — a
  // confirmed production quirk, not a clone bug.
  idOnlyKey: string
  onClose: () => void
}

const PANEL_WIDTH = 360

// VIA Audit Batch 1 Part B — shared Download panel, an inline/floating
// popover anchored under the toolbar's Tải xuống trigger (never a centered
// modal), portaled + position:fixed exactly like the Tag picker/column
// menu so it is never clipped by the toolbar's own overflow. Traced
// production (references/remotes/adaccounts/897.0e915523.js's ExportMenu):
// real SheetJS-backed CSV/XLSX (Part B10), count/dataset = selected rows
// if any else the full current filtered dataset (Part B9/B2), filename
// input starts EMPTY with the generated default only as its placeholder
// (Part B7), pencil icon is purely decorative (no click handler in
// production). Exact Vietnamese copy below is taken verbatim from the
// user's own production screenshot — the bundle's i18n values for this
// panel were not recoverable (key paths only), so screenshot text is the
// ground truth here.
export function AdsProDownloadPanel<T>({ anchorRect, rows, selectedRows, columns, tableName, idOnlyKey, onClose }: DownloadPanelProps<T>) {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos] = useState(() => {
    const left = Math.min(anchorRect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8)
    return { top: anchorRect.bottom + 6, left: Math.max(8, left) }
  })
  const [format, setFormat] = useState<ExportFormat>('text')
  const [filename, setFilename] = useState('')
  const [idOnly, setIdOnly] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      onClose()
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  // Part B9: selected rows take priority; zero selection exports the full
  // current filtered dataset (not just the visible page).
  const dataset = selectedRows.length > 0 ? selectedRows : rows
  const exportColumns = useMemo(() => {
    if (!idOnly) return columns
    const idColumns = columns.filter((column) => column.key === idOnlyKey)
    return idColumns.length > 0 ? idColumns : columns
  }, [columns, idOnly, idOnlyKey])
  const matrix = useMemo(() => buildExportMatrix(dataset, exportColumns), [exportColumns, dataset])
  const previewText = useMemo(() => matrixToTabText(matrix), [matrix])

  const handleDownload = () => {
    const finalName = filename.trim() || defaultExportFilename(tableName)
    void triggerExportDownload(matrix, format, finalName)
    onClose()
  }
  const selectPreview = () => textareaRef.current?.select()

  return createPortal(
    <div ref={panelRef} className="ads-download-panel" role="dialog" aria-label={tx(m("ui.83aa7196b1", { 0: dataset.length }))} style={{ top: pos.top, left: pos.left }}>
      <header>
        <Download size={16} className="ads-download-panel-icon" aria-hidden="true" />
        <h2>{t("ui.ca78e23a14")}{" "}<span className="ads-download-panel-count">({dataset.length})</span></h2>
        <button type="button" className="ads-download-panel-close" aria-label={t("ui.b2215f34af")} onClick={onClose}><X size={16} /></button>
      </header>
      <p className="ads-download-panel-hint">{t("ui.d2b14a9450")}</p>
      <div className="ads-download-format" role="radiogroup" aria-label={t("ui.69789860f1")}>
        {tx((['text', 'xlsx', 'csv'] as const).map((option) => <button key={option} type="button" role="radio" aria-checked={format === option} className={`ads-download-format-pill${format === option ? ' is-active' : ''}`} onClick={() => setFormat(option)}>
          {tx(option === 'text' ? 'Text' : option === 'xlsx' ? '.xlsx' : '.csv')}
        </button>))}
      </div>
      {format === 'text' && <>
        <textarea ref={textareaRef} className="ads-download-preview" readOnly value={previewText} onFocus={selectPreview} onClick={selectPreview} aria-label={t("ui.546a435858")} />
        <p className="ads-download-copy-hint">{t("ui.971b9121db")}</p>
      </>}
      <label className="ads-download-filename">
        <span>{t("ui.7fc25c0d12")}</span>
        <span className="ads-download-filename-input">
          <input aria-label={t("ui.7fc25c0d12")} placeholder={tx(defaultExportFilename(tableName))} value={filename} onChange={(event) => setFilename(event.target.value)} />
          <Pencil size={13} aria-hidden="true" />
        </span>
      </label>
      <label className="ads-download-id-only">
        <input type="checkbox" checked={idOnly} onChange={(event) => setIdOnly(event.target.checked)} />
        <span>{t("ui.31e86d52ac")}</span>
      </label>
      <button type="button" className="ads-download-cta" onClick={handleDownload}><Download size={15} />{t("ui.ca78e23a14")}</button>
    </div>,
    document.body,
  )
}
