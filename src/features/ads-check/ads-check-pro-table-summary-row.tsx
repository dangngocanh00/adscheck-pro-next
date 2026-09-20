import { useAppLanguage, tx, m } from '@/i18n'
import type { CSSProperties, ReactNode, RefObject } from 'react'

type SummaryRowColumn = { key: string; width: number }

// Shared Table Scroll Sync — the summary row's OWN geometry (checkbox
// width, viewport-pinned box width, per-column width/class/style), used
// identically by TKQC (the confirmed-correct reference)/BM/Page/Pixel so
// there is exactly one JSX implementation instead of four parallel copies
// that can silently drift apart (see useTableScrollSync's own header
// comment in ads-check-pro-column-config.ts for why that already
// happened once). Column class/style/total content stay pluggable since
// each table's own cell-class helper and aggregation differ.
export function AdsProTableSummaryRow<C extends SummaryRowColumn>({
  assetLabel, orderedColumns, checkboxWidth, viewportWidth, footerTrackRef,
  cellClassName, cellStyle, renderTotal,
}: {
  assetLabel: string
  orderedColumns: C[]
  checkboxWidth: number
  viewportWidth: number
  footerTrackRef: RefObject<HTMLDivElement | null>
  cellClassName: (column: C) => string
  cellStyle: (column: C) => CSSProperties | undefined
  renderTotal: (column: C) => ReactNode
}) {
  useAppLanguage();
  return <div className="ads-tkqc-footer-summary-track" ref={footerTrackRef} role="row" aria-label={tx(m("ui.0e03997510", { 0: assetLabel }))} style={{ width: viewportWidth || undefined }}>
    <span className="is-sticky-checkbox" style={{ width: checkboxWidth }} />
    {orderedColumns.map((column) => <span key={column.key} className={cellClassName(column)} style={{ width: column.width, ...cellStyle(column) }}>{renderTotal(column)}</span>)}
  </div>
}
