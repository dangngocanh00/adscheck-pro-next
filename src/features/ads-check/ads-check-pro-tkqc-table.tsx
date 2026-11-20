import { useAppLanguage, tx, m, t } from '@/i18n'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Lock, Pencil, SearchX } from 'lucide-react'
import { AdsProColumnMenu, ColumnResizeHandle, evaluateAdvancedFilter, type ColumnFilterValue, type ColumnMenuState } from './ads-check-pro-column-menu'
import { CHECKBOX_COLUMN_WIDTH, useColumnConfig, useTableScrollSync } from './ads-check-pro-column-config'
import { AdsProColumnSettingsModal } from './ads-check-pro-column-settings-modal'
import { AdsProTableSummaryRow } from './ads-check-pro-table-summary-row'
import { formatCurrency, TKQC_COLUMNS, type TkqcColumnDataType, type TkqcColumnKey, type TkqcRow } from './ads-check-pro-tkqc-data'
import { buildAccountQualityUrl, buildAdAccountSetupUrl, buildAdsManagerCampaignsUrl, buildBillingHubUrl, formatDueDateDays, maskAccountId } from './ads-check-pro-tkqc-format'
import type { TagDefinition } from './ads-check-pro-tag-system'
import { ResourceCountPill } from './ads-check-pro-resource-count-pill'
import { uiSettingsDataAttrs, type UiSettings } from './ads-check-pro-ui-settings'

type SortState = { columnKey: TkqcColumnKey; direction: 'asc' | 'desc' } | null

type TkqcTableProps = {
  rows: TkqcRow[]
  restrictedRows: TkqcRow[]
  totalCount: number
  selectedIds: string[]
  uiSettings: UiSettings
  tags: TagDefinition[]
  getRowTagIds: (rowId: string) => string[]
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
  onOpenTagPickerForRow: (rowId: string, anchorEl: HTMLElement) => void
  onOpenSpendLimitModal: (row: TkqcRow) => void
  onEditNote: (row: TkqcRow) => void
  onCheckHoldNeed: (rowId: string) => void
  onOpenAdminPanel: (row: TkqcRow) => void
  columnSettingsOpen: boolean
  onCloseColumnSettings: () => void
  // Round 1 Part 7 — presentation-only; the real accountId is always used
  // for search/sort/filter/navigation, only the DISPLAYED string masks.
  idMasked: boolean
  // Round 1 Parts 11/12 — shared execution/history model (see
  // ads-check-pro-execution-history.ts); null progress = never run.
  progressFor: (rowId: string) => { completed: number; total: number } | null
  onOpenRunLog: (row: TkqcRow) => void
  onOpenPaymentPopover: (row: TkqcRow, anchorRect: DOMRect) => void
}

// Round 1 Parts 2/14 — wraps a Meta destination in a real, keyboard-
// reachable link (not a div onClick): only the VALUE is clickable (never
// the whole cell), stopPropagation so a future row-click affordance can
// never be triggered by this, and a missing/invalid account id silently
// renders plain (non-fake) text instead of a dead link.
function MetaLink({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  useAppLanguage();
  if (!href) return <>{tx(children)}</>
  return <a className="ads-tkqc-meta-link" href={href} target="_blank" rel="noreferrer" aria-label={tx(label)} onClick={(event) => event.stopPropagation()}>{tx(children)}</a>
}

function SelectionCheckbox({ checked, mixed, label, onChange }: { checked: boolean; mixed?: boolean; label: string; onChange: () => void }) {
  useAppLanguage();
  const ref = useRef<HTMLInputElement>(null)
  useMemo(() => { if (ref.current) ref.current.indeterminate = Boolean(mixed) }, [mixed])
  return <input ref={ref} type="checkbox" aria-label={tx(label)} aria-checked={mixed ? 'mixed' : checked} checked={checked} onChange={onChange} />
}

function Status({ status }: { status: TkqcRow['status'] }) {
  useAppLanguage();
  const label = status === 'active' ? m("ui.ad939f0450") : status === 'restricted' ? m("ui.0fb7591169") : status === 'disabled' ? m("ui.eea204c5c9") : m("ui.39fc933455")
  return <span className={`ads-pro-status is-${status}`}><i />{tx(label)}</span>
}

// Correction Batch 2 Part E: cell is spent/limit/percent + a thin progress
// bar — no longer a bare editable number. Click anywhere on the cell opens
// the "Đặt giới hạn chi tiêu" modal (Part F); there is no inline editor
// anymore.
function SpendLimitCell({ row, onOpen }: { row: TkqcRow; onOpen: () => void }) {
  useAppLanguage();
  const percent = row.spendLimit && row.spendLimit > 0 ? Math.min(100, Math.round((row.spentAgainstLimit / row.spendLimit) * 100)) : 0
  return <button type="button" className="ads-tkqc-spend-limit-cell" aria-label={tx(m("ui.3e1043ad4b", { 0: row.name }))} onClick={onOpen}>
    <span className="ads-tkqc-spend-limit-fraction">
      {tx(formatCurrency(row.spentAgainstLimit, row.currency))} / {tx(row.spendLimit === null ? '-' : formatCurrency(row.spendLimit, row.currency))}
      <b>{percent}%</b>
    </span>
    <span className="ads-tkqc-progress"><i style={{ width: `${percent}%` }} /></span>
  </button>
}

function NoteCell({ row, onEditNote }: { row: TkqcRow; onEditNote: () => void }) {
  useAppLanguage();
  return <span className="ads-tkqc-hover-cell">
    <span>{row.note ?? '-'}</span>
    <button type="button" className="ads-tkqc-cell-edit" aria-label={tx(m("ui.b98f065173", { 0: row.name }))} onClick={onEditNote}><Pencil size={12} /></button>
  </span>
}

// Correction Batch 2 Part H: "[brand badge] - last4  N more..." — not a
// generic "+N" badge. Round 1 Part 3: the whole display is now clickable,
// opening the payment popover (current + history cards, remove/remove-all,
// external Billing Hub link) — captures the DOMRect synchronously in
// onClick, same pattern as every other anchored panel in this codebase.
function PaymentMethodsCell({ row, onOpen }: { row: TkqcRow; onOpen: (anchorRect: DOMRect) => void }) {
  useAppLanguage();
  if (row.paymentMethods.length === 0) return <span>-</span>
  const [first, ...rest] = row.paymentMethods
  return <button type="button" className="ads-tkqc-payment-methods" aria-label={tx(m("ui.77ac7164ea", { 0: row.name }))} onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}>
    <span className={`ads-tkqc-payment-badge is-${first.brand.toLowerCase()}`}>{first.brand}</span>
    <span>- {first.last4}</span>
    {rest.length > 0 && <span className="ads-tkqc-payment-more">{rest.length} {" "}{t("ui.4fd94bf46c")}</span>}
  </button>
}

// HOLD/NEED (Batch Update Part D5) — clone-side demo check, not a real Meta
// request (see onCheckHoldNeed in the workspace). Tooltip text is the exact
// traced production copy (references/remotes/adaccounts/97.fdaad52b.js,
// holdNeed.checkTooltip).
function HoldNeedCell({ row, onCheck }: { row: TkqcRow; onCheck: () => void }) {
  useAppLanguage();
  const { status } = row.holdNeed
  if (status === 'checking') return <span className="ads-tkqc-holdneed is-checking">{t("ui.05a0307a9e")}</span>
  if (status === 'ok') return <span className="ads-tkqc-holdneed is-ok">{t("ui.9ce3bd4224")}</span>
  if (status === 'hold-error') return <span className="ads-tkqc-holdneed is-error">{t("ui.fbba366c29")}</span>
  if (status === 'no-payment') return <span className="ads-tkqc-holdneed is-muted">{t("ui.ac6520fc46")}</span>
  return <button type="button" className="ads-tkqc-holdneed-check" aria-label={tx(m("ui.bcb3855c40", { 0: row.name }))} title={t("ui.8c8c42f35e")} onClick={onCheck}><Eye size={14} /></button>
}

function TagCell({ tags, tagIds, onOpenPicker }: { tags: TagDefinition[]; tagIds: string[]; onOpenPicker: (anchorEl: HTMLElement) => void }) {
  useAppLanguage();
  const assigned = tagIds.map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is TagDefinition => Boolean(tag))
  return <div className="ads-pro-tag-cell">
    {assigned.map((tag) => <span key={tag.id} className="ads-pro-tag-chip"><i className="ads-pro-tag-chip-dot" style={{ background: tag.colorHex }} aria-hidden="true" /><span>{tag.name}</span></span>)}
    <button type="button" className="ads-pro-tag-add" aria-label={t("ui.97d8de2327")} onClick={(event) => onOpenPicker(event.currentTarget)}>+</button>
  </div>
}

function columnCellClass(column: { key: TkqcColumnKey; dataType: string }, frozenKeys: Set<string>, lastFrozenKey: string | null): string {
  const classes: string[] = []
  if (column.dataType === 'number' || column.dataType === 'currency') classes.push('is-numeric')
  if (frozenKeys.has(column.key)) classes.push('is-frozen')
  if (column.key === lastFrozenKey) classes.push('is-frozen-boundary')
  return classes.join(' ')
}

// Correction Batch 2 Part W: adminCount is DERIVED from row.admins, never a
// separately-maintained duplicate number.
// Correction Batch 3 Part C4/C9: traced production STT is NOT a stable
// stored index — it's recomputed from the row's current rendered position
// (page offset + position in the current filtered/sorted list). Filtering
// STT against that same live position would be circular (the position
// depends on what's already been filtered), so this clone pragmatically
// filters/aggregates STT against the row's own stable demo `order` field
// instead — display still uses the true dynamic position (see renderCell).
function cellValue(row: TkqcRow, key: TkqcColumnKey): unknown {
  if (key === 'tag') return null
  if (key === 'stt') return row.order
  if (key === 'adminCount') return row.admins.length
  return row[key as Exclude<TkqcColumnKey, 'tag' | 'adminCount' | 'stt'>]
}

function renderCell(row: TkqcRow, key: TkqcColumnKey, displayIndex: number, ctx: {
  tags: TagDefinition[]
  getRowTagIds: (rowId: string) => string[]
  onOpenTagPickerForRow: (rowId: string, anchorEl: HTMLElement) => void
  onOpenSpendLimitModal: (row: TkqcRow) => void
  onEditNote: (row: TkqcRow) => void
  onCheckHoldNeed: (rowId: string) => void
  onOpenAdminPanel: (row: TkqcRow) => void
  idMasked: boolean
  progressFor: (rowId: string) => { completed: number; total: number } | null
  onOpenRunLog: (row: TkqcRow) => void
  onOpenPaymentPopover: (row: TkqcRow, anchorRect: DOMRect) => void
}) {
  switch (key) {
    case 'stt': return displayIndex
    case 'status': return <MetaLink href={buildAccountQualityUrl(row.accountId)} label={tx(m("ui.adb4428944", { 0: row.name }))}><Status status={row.status} /></MetaLink>
    case 'name': return <MetaLink href={buildAdsManagerCampaignsUrl(row.accountId)} label={tx(m("ui.a5d7d985f1", { 0: row.name }))}><strong>{row.name}</strong></MetaLink>
    case 'accountId': {
      const display = ctx.idMasked ? maskAccountId(row.accountId) : row.accountId
      return <MetaLink href={buildAdsManagerCampaignsUrl(row.accountId)} label={tx(m("ui.a5d7d985f1", { 0: row.name }))}>{display}</MetaLink>
    }
    case 'balance': return <MetaLink href={buildBillingHubUrl(row.accountId, row.businessId)} label={tx(m("ui.ebf6020244", { 0: row.name }))}>{tx(row.balance === 0 ? '0' : formatCurrency(row.balance, row.currency))}</MetaLink>
    case 'threshold': return row.threshold === null ? '-' : <MetaLink href={buildAdAccountSetupUrl(row.accountId)} label={tx(m("ui.08004b3649", { 0: row.name }))}>{tx(formatCurrency(row.threshold, row.currency))}</MetaLink>
    case 'limit': return row.limit === null ? '-' : <MetaLink href={buildBillingHubUrl(row.accountId, row.businessId)} label={tx(m("ui.ebf6020244", { 0: row.name }))}>{tx(row.limit === 0 ? '0' : formatCurrency(row.limit, row.currency))}</MetaLink>
    case 'progressPercent': {
      const progress = ctx.progressFor(row.id)
      if (!progress) return <span className="ads-tkqc-progress-empty">-</span>
      const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
      return <span className="ads-tkqc-progress-run"><span className="ads-tkqc-progress"><i style={{ width: `${percent}%` }} /></span><small>{progress.completed}/{progress.total}</small><button type="button" aria-label={tx(m("ui.a8e312c38d", { 0: row.name }))} onClick={() => ctx.onOpenRunLog(row)}><Eye size={14} /></button></span>
    }
    case 'totalSpend': return formatCurrency(row.totalSpend, row.currency)
    case 'spendLimit': return <SpendLimitCell row={row} onOpen={() => ctx.onOpenSpendLimitModal(row)} />
    case 'paymentMethods': return <PaymentMethodsCell row={row} onOpen={(anchorRect) => ctx.onOpenPaymentPopover(row, anchorRect)} />
    case 'businessId': return row.businessId ?? '-'
    case 'businessName': return row.businessName ?? '-'
    case 'note': return <NoteCell row={row} onEditNote={() => ctx.onEditNote(row)} />
    case 'thresholdRemaining': return row.thresholdRemaining === null ? '-' : formatCurrency(row.thresholdRemaining, row.currency)
    case 'invoiceDate': return row.invoiceDate ?? '-'
    case 'dueDate': return formatDueDateDays(row.dueDate)
    case 'lockReason': return row.lockReason ?? '-'
    case 'hiddenLimit': return row.hiddenLimit === null ? '-' : formatCurrency(row.hiddenLimit, row.currency)
    case 'adminCount': return <ResourceCountPill count={row.admins.length} onClick={() => ctx.onOpenAdminPanel(row)}>{t("ui.a537f08b4a")}{" "}{row.admins.length}</ResourceCountPill>
    case 'partner': return row.partner ?? '-'
    case 'holdNeed': return <HoldNeedCell row={row} onCheck={() => ctx.onCheckHoldNeed(row.id)} />
    case 'tag': return <TagCell tags={ctx.tags} tagIds={ctx.getRowTagIds(row.id)} onOpenPicker={(anchorEl) => ctx.onOpenTagPickerForRow(row.id, anchorEl)} />
    default: return String(cellValue(row, key) ?? '-')
  }
}

function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1
  if (b === null || b === undefined) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'vi')
}

function matchesFilter(row: TkqcRow, key: TkqcColumnKey, filter: ColumnFilterValue, dataType: TkqcColumnDataType): boolean {
  return evaluateAdvancedFilter(filter, cellValue(row, key), dataType)
}

export function AdsCheckProTkqcTable({
  rows, restrictedRows, totalCount, selectedIds, uiSettings, tags, getRowTagIds,
  onToggle, onToggleAll, onOpenTagPickerForRow, onOpenSpendLimitModal, onEditNote, onCheckHoldNeed, onOpenAdminPanel,
  columnSettingsOpen, onCloseColumnSettings,
  idMasked, progressFor, onOpenRunLog, onOpenPaymentPopover,
}: TkqcTableProps) {
  useAppLanguage();
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [restrictedOpen, setRestrictedOpen] = useState(true)
  // Shared Table Scroll Sync (ads-check-pro-column-config.ts) — TKQC is
  // the confirmed-correct reference implementation this hook was
  // extracted FROM verbatim; BM/Page/Pixel now call the exact same
  // function instead of their own parallel copies. `scrollRef` also
  // drives the "Tài khoản quảng cáo không có quyền" bar's own width below
  // (TKQC-specific, kept local) — a sticky element's WIDTH still comes
  // from normal layout, so it's capped to the scroll container's real
  // clientWidth instead of stretching to the full scrollable content
  // width (which would push "Xem" off past the visible edge).
  const { scrollRef, footerTrackRef, viewportWidth, handleTableScroll } = useTableScrollSync()
  const [columnFilters, setColumnFilters] = useState<Partial<Record<TkqcColumnKey, ColumnFilterValue>>>({})
  const [sort, setSort] = useState<SortState>(null)
  // Correction Batch 2 Part D5/D6 — order + freeze now live in the shared
  // useColumnConfig hook (persisted via the traced "config_column" key and
  // giving proper cumulative multi-column sticky offsets), not local state.
  // Correction Batch 3 Part B/C: STT is now the first entry INSIDE
  // TKQC_COLUMNS (not a separate hardcoded header), so leadingWidth is just
  // the checkbox column's own 44px.
  const { orderedColumns, allOrderedColumns, frozenKeys, hiddenKeys, frozenOffsets, lastFrozenKey, totalWidth, toggleFreeze, reorder, resizeColumn, resetColumn, minWidthFor, maxWidthFor, applyColumnSettings } = useColumnConfig('adaccounts', TKQC_COLUMNS, CHECKBOX_COLUMN_WIDTH)

  const getColumnState = (key: TkqcColumnKey): ColumnMenuState => ({ sortDirection: sort?.columnKey === key ? sort.direction : null, filter: columnFilters[key] ?? null, frozen: frozenKeys.has(key) })

  // Pipeline (Part G2): raw dataset (already folder/search/availability-
  // filtered upstream) → column filters → sort → current result dataset.
  const filteredRows = useMemo(() => rows.filter((row) => TKQC_COLUMNS.every((column) => matchesFilter(row, column.key, columnFilters[column.key] ?? null, column.dataType))), [rows, columnFilters])
  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows
    // Correction Batch 3 Part C4: STT's value IS the current display
    // position, so "sorting by STT" can't be a value comparison (circular)
    // — traced production still exposes the sort menu item on it, so the
    // only coherent reproduction is: ascending is already-ascending by
    // construction (no-op), descending reverses the current row list.
    if (sort.columnKey === 'stt') return sort.direction === 'desc' ? [...filteredRows].reverse() : filteredRows
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...filteredRows].sort((a, b) => factor * compareValues(cellValue(a, sort.columnKey), cellValue(b, sort.columnKey)))
  }, [filteredRows, sort])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const pagedRows = sortedRows.slice(startIndex, startIndex + pageSize)
  const visibleIds = pagedRows.map((row) => row.id)
  const selectedVisible = visibleIds.filter((id) => selectedIds.includes(id))
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length
  const someSelected = selectedVisible.length > 0 && !allSelected

  const handleSort = (key: TkqcColumnKey, direction: 'asc' | 'desc' | null) => {
    setSort(direction === null ? null : { columnKey: key, direction })
  }
  const handleFilter = (key: TkqcColumnKey, value: ColumnFilterValue) => {
    setColumnFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  // Footer aggregation (Part G) — over the FULL current result dataset
  // (authorized + unauthorized, filtered, all pages), never just the
  // rendered page DOM. Same-currency amounts sum; mixed currencies → MIXED.
  const filteredRestrictedRows = useMemo(() => restrictedRows.filter((row) => TKQC_COLUMNS.every((column) => matchesFilter(row, column.key, columnFilters[column.key] ?? null, column.dataType))), [restrictedRows, columnFilters])
  const aggregationDataset = useMemo(() => [...sortedRows, ...filteredRestrictedRows], [sortedRows, filteredRestrictedRows])
  const aggregateColumn = (key: TkqcColumnKey, kind: 'currency' | 'count'): string => {
    if (kind === 'count') {
      const total = aggregationDataset.reduce((sum, row) => sum + (Number(cellValue(row, key)) || 0), 0)
      return String(total)
    }
    const values = aggregationDataset.map((row) => ({ value: cellValue(row, key) as number | null, currency: row.currency })).filter((entry) => entry.value !== null)
    if (values.length === 0) return '-'
    const currencies = new Set(values.map((entry) => entry.currency))
    if (currencies.size > 1) return 'MIXED'
    const sum = values.reduce((total, entry) => total + (entry.value ?? 0), 0)
    return formatCurrency(sum, values[0].currency)
  }

  const cellCtx = { tags, getRowTagIds, onOpenTagPickerForRow, onOpenSpendLimitModal, onEditNote, onCheckHoldNeed, onOpenAdminPanel, idMasked, progressFor, onOpenRunLog, onOpenPaymentPopover }
  const frozenStyle = (key: TkqcColumnKey) => frozenOffsets.has(key) ? { left: frozenOffsets.get(key) } : undefined

  return <div className="ads-pro-table-shell" {...uiSettingsDataAttrs(uiSettings)}>
    <div className="ads-pro-table-scroll" ref={scrollRef} onScroll={handleTableScroll}>
      {/* Shared Summary Alignment — pinned to `totalWidth` from
          useColumnConfig (the ONE resolved-geometry source, shared with
          BM/Page/Pixel's own tables and this footer's own summary track
          below), not a locally re-derived sum. Without this, the shared
          `.ads-pro-table { width:100% }` + table-layout:fixed rule lets
          the browser proportionally stretch <col> widths past the
          footer's fixed-width spans whenever the viewport is wider than
          the table's own natural content width. */}
      <table className="ads-pro-table is-ad-account is-tkqc-full" style={{ width: totalWidth, minWidth: totalWidth }}>
        <colgroup><col className="is-sticky-checkbox" style={{ width: CHECKBOX_COLUMN_WIDTH }} />{orderedColumns.map((column) => <col key={column.key} style={{ width: column.width }} />)}</colgroup>
        <thead><tr>
          <th className="is-sticky-checkbox"><SelectionCheckbox label={t("ui.5a2482a471")} checked={allSelected} mixed={someSelected} onChange={() => onToggleAll(visibleIds)} /></th>
          {orderedColumns.map((column) => <th key={column.key} className={columnCellClass(column, frozenKeys, lastFrozenKey)} style={frozenStyle(column.key)} draggable={column.key !== 'stt'} onDragStart={(event) => event.dataTransfer.setData('text/tkqc-column', column.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromKey = event.dataTransfer.getData('text/tkqc-column') as TkqcColumnKey; if (fromKey) reorder(fromKey, column.key) }}>
            <span className="ads-sort-label">{tx(column.key === 'stt' ? <span className="ads-column-locked-handle" aria-hidden="true" title={t("ui.7af1ccc039")}><Lock size={11} /></span> : <span className="ads-column-drag-handle" aria-hidden="true">⠿</span>)}{tx(column.label)}<AdsProColumnMenu label={tx(column.label)} dataType={column.dataType} canFreeze={column.key !== 'tag' && column.key !== 'stt'} state={getColumnState(column.key)} onSort={(direction) => handleSort(column.key, direction)} onFilterChange={(value) => handleFilter(column.key, value)} onToggleFreeze={() => toggleFreeze(column.key)} /></span>
            <ColumnResizeHandle width={column.width} minWidth={minWidthFor(column.key)} maxWidth={maxWidthFor(column.key)} onResize={(width) => resizeColumn(column.key, width)} onResetWidth={() => resetColumn(column.key)} />
          </th>)}
        </tr></thead>
        <tbody>
          {tx(pagedRows.map((row, index) => <tr key={row.id} className={selectedIds.includes(row.id) ? 'is-selected' : ''}>
            <td className="is-sticky-checkbox"><SelectionCheckbox label={tx(m("ui.84da3235c3", { 0: row.name }))} checked={selectedIds.includes(row.id)} onChange={() => onToggle(row.id)} /></td>
            {orderedColumns.map((column) => <td key={column.key} className={columnCellClass(column, frozenKeys, lastFrozenKey)} style={frozenStyle(column.key)}>{renderCell(row, column.key, startIndex + index + 1, cellCtx)}</td>)}
          </tr>))}
          {tx(pagedRows.length === 0 && <tr><td colSpan={TKQC_COLUMNS.length + 1} className="ads-pro-table-empty-row"><SearchX size={24} /><span>{t("ui.1a567dab5f")}</span></td></tr>)}
        </tbody>
      </table>

      {/* FINAL CORRECTION A — the unauthorized section is a SECTION-
          DIVIDER row living INSIDE the table's own vertical flow (a
          sibling of the two <table>s, inside the SAME .ads-pro-table-
          scroll), between authorized and unauthorized rows — not an
          external banner. Vertically it scrolls like any other row; the
          divider's OWN content (label/badge/Xem) is pinned via
          `position: sticky; left: 0` so horizontal scroll never moves it,
          while `viewportWidth` (measured off the scroll container's own
          clientWidth) caps its width to the visible viewport instead of
          stretching to the ~1080px+ scrollable content width — otherwise
          "Xem" would sit far past the visible right edge. The unauthorized
          DATA ROWS below use the normal table column coordinate system
          and scroll horizontally like the authorized rows above. Clicking
          EITHER the divider or "Xem" toggles expand/collapse (traced
          production i18n: "Xem"/"Ẩn" is the SAME control's label). */}
      {tx(restrictedRows.length > 0 && <div className="ads-tkqc-restricted-divider" style={{ width: viewportWidth || undefined }}>
        <button type="button" className="ads-pro-restricted-summary" aria-expanded={restrictedOpen} onClick={() => setRestrictedOpen((current) => !current)}>
          {restrictedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{t("ui.570d72c9d8")}</span>
          <span className="ads-pro-restricted-help" title={t("ui.9ac7b506b4")}>?</span>
          <span className="ads-pro-restricted-badge">{restrictedRows.length}</span>
        </button>
        <button type="button" className="ads-pro-restricted-view" aria-expanded={restrictedOpen} onClick={() => setRestrictedOpen((current) => !current)}>{tx(restrictedOpen ? m("ui.f4ea7c3071") : 'Xem')}</button>
      </div>)}

      {tx(restrictedRows.length > 0 && restrictedOpen && <table className="ads-pro-table is-ad-account is-tkqc-full is-restricted" style={{ width: totalWidth, minWidth: totalWidth }}>
        <colgroup><col className="is-sticky-checkbox" style={{ width: CHECKBOX_COLUMN_WIDTH }} />{orderedColumns.map((column) => <col key={column.key} style={{ width: column.width }} />)}</colgroup>
        <tbody>{tx(restrictedRows.map((row, index) => <tr key={row.id} className={selectedIds.includes(row.id) ? 'is-selected' : ''}>
          <td className="is-sticky-checkbox"><SelectionCheckbox label={tx(m("ui.84da3235c3", { 0: row.name }))} checked={selectedIds.includes(row.id)} onChange={() => onToggle(row.id)} /></td>
          {orderedColumns.map((column) => <td key={column.key} className={columnCellClass(column, frozenKeys, lastFrozenKey)} style={frozenStyle(column.key)}>{renderCell(row, column.key, index + 1, cellCtx)}</td>)}
        </tr>))}</tbody>
      </table>)}
    </div>

    <footer className="ads-pro-table-footer is-tkqc-full">
      <AdsProTableSummaryRow
        assetLabel="TKQC"
        orderedColumns={orderedColumns}
        checkboxWidth={CHECKBOX_COLUMN_WIDTH}
        viewportWidth={viewportWidth}
        footerTrackRef={footerTrackRef}
        cellClassName={(column) => columnCellClass(column, frozenKeys, lastFrozenKey)}
        cellStyle={(column) => frozenStyle(column.key)}
        renderTotal={(column) => column.aggregatable ? aggregateColumn(column.key, column.aggregatable) : '-'}
      />
      <div className="ads-tkqc-footer-overlay">
        <label>{t("ui.2a48ea973e")}{" "}<select aria-label={t("ui.4afe43c7e8")} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option>25</option><option>50</option><option>100</option></select></label>
        <span><button type="button" aria-label={t("ui.d676ae2541")} disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14} /></button>{page}/{totalPages}<button type="button" aria-label={t("ui.c4e3d2b807")} disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={14} /></button></span>
        <strong>{t("ui.40b56a1698")}{" "}{selectedIds.length} / {totalCount} {" "}{t("ui.108854e9fd")}</strong>
      </div>
    </footer>
    {tx(columnSettingsOpen && <AdsProColumnSettingsModal
      columns={allOrderedColumns.map((column) => ({ key: column.key, label: column.label, locked: column.key === 'stt' }))}
      frozenKeys={frozenKeys}
      hiddenKeys={hiddenKeys}
      onSave={applyColumnSettings}
      onClose={onCloseColumnSettings}
    />)}
  </div>
}
