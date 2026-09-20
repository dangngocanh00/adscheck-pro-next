import { useAppLanguage, tx, m, t } from '@/i18n'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, Lock, Pencil, SearchX, X } from 'lucide-react'
import { AdsProColumnMenu, ColumnResizeHandle, evaluateAdvancedFilter, type ColumnFilterValue, type ColumnMenuState } from './ads-check-pro-column-menu'
import { CHECKBOX_COLUMN_WIDTH, PAGINATION_ROW_HEIGHT, SUMMARY_ROW_HEIGHT, useColumnConfig, useTableScrollSync } from './ads-check-pro-column-config'
import { AdsProColumnSettingsModal } from './ads-check-pro-column-settings-modal'
import { AdsProTableSummaryRow } from './ads-check-pro-table-summary-row'
import { BM_COLUMNS, type BmColumnDataType, type BmColumnKey, type BmRow } from './ads-check-pro-bm-data'
import { uiSettingsDataAttrs, type UiSettings } from './ads-check-pro-ui-settings'
import type { TagDefinition } from './ads-check-pro-tag-system'
import { buildBmPeopleSettingsUrl } from './ads-check-pro-bm-format'
import { maskAccountId } from './ads-check-pro-tkqc-format'
import { ResourceCountPill } from './ads-check-pro-resource-count-pill'

type SortState = { columnKey: BmColumnKey; direction: 'asc' | 'desc' } | null

type BmTableProps = {
  rows: BmRow[]
  totalCount: number
  selectedIds: string[]
  uiSettings: UiSettings
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
  // Shared Tag system (propagated from VIA/TKQC/Page/Pixel — BM's "Tag"
  // column previously rendered a static "-" placeholder with no wiring at
  // all, see ads-check-pro-asset-table.tsx's `business` branch before this
  // fix).
  tags: TagDefinition[]
  getRowTagIds: (rowId: string) => string[]
  onOpenTagPickerForRow: (rowId: string, anchorEl: HTMLElement) => void
  onEditNote: (row: BmRow) => void
  onOpenResourcePanel: (row: BmRow, kind: 'partner' | 'admin' | 'adAccount' | 'page' | 'instagram' | 'waba') => void
  // BM Round 1 Shared Rule #9 — presentation-only ID mask (same semantics
  // as TKQC's own): masks the ID BM cell's DISPLAY text; the Meta link
  // href, search/filter/sort, and row identity all still use the real id.
  idMasked: boolean
  columnSettingsOpen: boolean
  onCloseColumnSettings: () => void
}

// Same shared pattern/class as ads-check-pro-tkqc-table.tsx's own MetaLink
// (SHARED CONTROL, not a per-asset reimplementation): a real <a> (new tab,
// stopPropagation so it never toggles row selection) when a destination
// URL is traceable, or the plain children otherwise.
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

// BM's own "Trạng thái" is a Live/Die lifecycle state — distinct from the
// new "Hoạt động" (active/disabled) column added by Part H, which is a
// separate field (Part H2: "Không confuse với column Trạng thái").
function LifecycleStatus({ status }: { status: BmRow['status'] }) {
  useAppLanguage();
  return <span className={`ads-pro-status is-${status === 'live' ? 'active' : 'restricted'}`}><i />{tx(status === 'live' ? 'Live' : 'Die')}</span>
}

function ActiveCell({ active }: { active: boolean }) {
  useAppLanguage();
  return <span className={`ads-pro-status is-${active ? 'active' : 'restricted'}`}><i />{tx(active ? m("ui.ad939f0450") : m("ui.eea204c5c9"))}</span>
}

// Correction Batch 2 Part L3: pure visual state, no speculative text.
// BM Round 1 Part 16 — real lucide icons (not text glyphs) so the green
// check and red X have comparable stroke weight/size/opacity; the old
// text-glyph '×' rendered pale and much less prominent than '✓'.
function VerifiedCell({ verified }: { verified: BmRow['verified'] }) {
  useAppLanguage();
  return <span className={`ads-bm-verified is-${verified}`} aria-label={tx(verified === 'verified' ? 'Verified' : m("ui.1648ad17d5"))}>
    {verified === 'verified' ? <Check size={15} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}
  </span>
}

// Same markup/classes as ads-check-pro-generic-table.tsx's TagCell (Page/
// Pixel) — same shared component, same visual rule, per SHARED RULE 11.
function TagCell({ tags, tagIds, onOpenPicker }: { tags: TagDefinition[]; tagIds: string[]; onOpenPicker: (anchorEl: HTMLElement) => void }) {
  useAppLanguage();
  const assigned = tagIds.map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is TagDefinition => Boolean(tag))
  return <div className="ads-pro-tag-cell">
    {assigned.map((tag) => <span key={tag.id} className="ads-pro-tag-chip"><i className="ads-pro-tag-chip-dot" style={{ background: tag.colorHex }} aria-hidden="true" /><span>{tag.name}</span></span>)}
    <button type="button" className="ads-pro-tag-add" aria-label={t("ui.97d8de2327")} onClick={(event) => onOpenPicker(event.currentTarget)}>+</button>
  </div>
}

function NoteCell({ row, onEditNote }: { row: BmRow; onEditNote: () => void }) {
  useAppLanguage();
  return <span className="ads-tkqc-hover-cell">
    <span>{row.note ?? '-'}</span>
    <button type="button" className="ads-tkqc-cell-edit" aria-label={tx(m("ui.b98f065173", { 0: row.name }))} onClick={onEditNote}><Pencil size={12} /></button>
  </span>
}

// Correction Batch 2 Part W: SL* counts are DERIVED from each resource
// array — never a separately-maintained duplicate number.
function derivedCount(row: BmRow, key: BmColumnKey): number {
  switch (key) {
    case 'partnerCount': return row.partners.length
    case 'adminTotal': return row.admins.length
    case 'adAccountTotal': return row.adAccounts.length
    case 'pageCount': return row.pages.length
    case 'igCount': return row.instagramAccounts.length
    case 'wabaCount': return row.wabaAccounts.length
    default: return 0
  }
}

// Correction Batch 3 Part C4/C9: STT display is dynamic (current rendered
// position, see renderCell) — filtering/aggregation pragmatically use the
// row's own stable demo `order` field instead, same reasoning as TKQC.
function cellValue(row: BmRow, key: BmColumnKey): unknown {
  if (key === 'tag') return null
  if (key === 'stt') return row.order
  // Part 15 — "Nút kháng" displays/filters/sorts as the SAME plain-text
  // status mirror shown on screen (row.status), not the raw stored count.
  if (key === 'appealCount') return row.status
  if (key === 'partnerCount' || key === 'adminTotal' || key === 'adAccountTotal' || key === 'pageCount' || key === 'igCount' || key === 'wabaCount') return derivedCount(row, key)
  return row[key as Exclude<BmColumnKey, 'tag' | 'stt' | 'partnerCount' | 'adminTotal' | 'adAccountTotal' | 'pageCount' | 'igCount' | 'wabaCount'>]
}

function columnCellClass(column: { key: BmColumnKey; dataType: string }, frozenKeys: Set<string>, lastFrozenKey: string | null): string {
  const classes: string[] = []
  if (column.dataType === 'number' || column.dataType === 'currency') classes.push('is-numeric')
  if (frozenKeys.has(column.key)) classes.push('is-frozen')
  if (column.key === lastFrozenKey) classes.push('is-frozen-boundary')
  return classes.join(' ')
}

// SHARED system pill (ads-check-pro-resource-count-pill.tsx) — same shell
// for every resource-count cell; only the label/content text differs.
function ResourcePill({ label, count, onClick }: { label: string; count: number; onClick: () => void }) {
  useAppLanguage();
  return <ResourceCountPill count={count} onClick={onClick}>{tx(label)}: {count}</ResourceCountPill>
}

// Resource/Modal UX correction — SL Admin now uses the SAME shared pill
// shell as SL đối tác/SL Page/SL IG (previously a bespoke translucent
// floating/glowing pill, `.ads-bm-admin-pill`, now retired). Traced
// production FORMAT is "Admin {total} - FB: {fb} - IG: {ig}", but neither
// `BmAdmin` nor any other traced field models a per-platform (FB vs IG)
// admin split (see the BM Round 1 report's Part 4 research: only `role`
// admin/employee and a synthetic `uid` exist, neither derivable into FB/
// IG). Showing the real total only — never fabricating FB/IG zeros.
function AdminPill({ count, onClick }: { count: number; onClick: () => void }) {
  useAppLanguage();
  return <ResourceCountPill count={count} onClick={onClick}>{t("ui.4e7afebcfb")}{" "}{count}</ResourceCountPill>
}

type BmTagContext = { tags: TagDefinition[]; getRowTagIds: (rowId: string) => string[]; onOpenTagPickerForRow: (rowId: string, anchorEl: HTMLElement) => void }

// BM Round 1 Part 14 — Tên BM and ID BM both open the SAME traced Meta
// destination (business.facebook.com/settings/people) using the row's own
// real bmId; masking (Part 9) only ever hides the ID BM cell's DISPLAY
// text, never the href.
function renderCell(row: BmRow, key: BmColumnKey, displayIndex: number, onEditNote: (row: BmRow) => void, onOpenResourcePanel: BmTableProps['onOpenResourcePanel'], tagCtx: BmTagContext, idMasked: boolean) {
  const peopleSettingsUrl = buildBmPeopleSettingsUrl(row.bmId)
  switch (key) {
    case 'stt': return displayIndex
    case 'status': return <LifecycleStatus status={row.status} />
    case 'name': return <MetaLink href={peopleSettingsUrl} label={tx(m("ui.d3bcc79e80", { 0: row.name }))}><strong>{row.name}</strong></MetaLink>
    case 'bmId': return <MetaLink href={peopleSettingsUrl} label={tx(m("ui.d3bcc79e80", { 0: row.name }))}>{idMasked ? maskAccountId(row.bmId) : row.bmId}</MetaLink>
    case 'tag': return <TagCell tags={tagCtx.tags} tagIds={tagCtx.getRowTagIds(row.id)} onOpenPicker={(anchorEl) => tagCtx.onOpenTagPickerForRow(row.id, anchorEl)} />
    // BM Round 1 Part 15 — "Nút kháng" is a SEPARATE column from "Trạng
    // thái" (traced production examples: plain-text "Die"/"Live", no pill/
    // badge). This clone has no independently-modeled "appeal button"
    // status field distinct from the BM's own Live/Die lifecycle state, so
    // this mirrors `row.status` as plain text — a documented judgment
    // call (see the batch report), not a fabricated new field.
    case 'appealCount': return row.status === 'die' ? 'Die' : 'Live'
    case 'diedAt': return row.diedAt ?? '-'
    case 'progressPercent': return row.progressPercent === null ? '-' : <span className="ads-tkqc-progress"><i style={{ width: `${row.progressPercent}%` }} /><small>{row.progressPercent}%</small></span>
    case 'verified': return <VerifiedCell verified={row.verified} />
    case 'levelBm': return row.levelBm ?? '-'
    case 'active': return <ActiveCell active={row.active} />
    case 'note': return <NoteCell row={row} onEditNote={() => onEditNote(row)} />
    case 'partnerCount': return <ResourcePill label={t("ui.6cb412db99")} count={row.partners.length} onClick={() => onOpenResourcePanel(row, 'partner')} />
    case 'adminTotal': return <AdminPill count={row.admins.length} onClick={() => onOpenResourcePanel(row, 'admin')} />
    case 'adAccountTotal': return <ResourceCountPill count={row.adAccounts.length} onClick={() => onOpenResourcePanel(row, 'adAccount')}>{t("ui.f325e1a097")}{" "}{row.adAccounts.length} {" "}{t("ui.e514c641f1")}{" "}{row.adAccounts.filter((account) => account.ownership === 'owned').length} {" "}{t("ui.7b7c8ba654")}{" "}{row.adAccounts.filter((account) => account.ownership === 'share').length}</ResourceCountPill>
    case 'pageCount': return <ResourcePill label="Page" count={row.pages.length} onClick={() => onOpenResourcePanel(row, 'page')} />
    case 'igCount': return <ResourcePill label="IG" count={row.instagramAccounts.length} onClick={() => onOpenResourcePanel(row, 'instagram')} />
    case 'wabaCount': return <ResourcePill label="WABA" count={row.wabaAccounts.length} onClick={() => onOpenResourcePanel(row, 'waba')} />
    default: return String(cellValue(row, key) ?? '-')
  }
}

function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1
  if (b === null || b === undefined) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'vi')
}

// Correction Batch 2 Part C: shared multi-condition filter evaluator (see
// ads-check-pro-column-menu.tsx) — same logic every table uses, so ANY/ALL
// semantics and operator behavior stay identical across all 5 tabs.
function matchesFilter(row: BmRow, key: BmColumnKey, filter: ColumnFilterValue, dataType: BmColumnDataType): boolean {
  return evaluateAdvancedFilter(filter, cellValue(row, key), dataType)
}

// BM (Batch Update Part H) — reuses the exact same shared column-menu
// component and sort/filter/freeze/aggregation pipeline as TKQC (Part E5:
// "Không viết 5 menu khác nhau"), independently instantiated since BM's
// column set and row shape are its own.
export function AdsCheckProBmTable({ rows, totalCount, selectedIds, uiSettings, onToggle, onToggleAll, tags, getRowTagIds, onOpenTagPickerForRow, onEditNote, onOpenResourcePanel, idMasked, columnSettingsOpen, onCloseColumnSettings }: BmTableProps) {
  useAppLanguage();
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [columnFilters, setColumnFilters] = useState<Partial<Record<BmColumnKey, ColumnFilterValue>>>({})
  const [sort, setSort] = useState<SortState>(null)
  const { orderedColumns, allOrderedColumns, frozenKeys, hiddenKeys, frozenOffsets, lastFrozenKey, totalWidth, toggleFreeze, reorder, resizeColumn, resetColumn, minWidthFor, maxWidthFor, applyColumnSettings } = useColumnConfig('business', BM_COLUMNS, CHECKBOX_COLUMN_WIDTH)

  // Shared Table Scroll Sync (ads-check-pro-column-config.ts) — extracted
  // from TKQC, the confirmed-correct reference implementation; BM now
  // calls the exact same function instead of its own parallel copy.
  const { scrollRef, footerTrackRef, viewportWidth, handleTableScroll } = useTableScrollSync()

  const getColumnState = (key: BmColumnKey): ColumnMenuState => ({ sortDirection: sort?.columnKey === key ? sort.direction : null, filter: columnFilters[key] ?? null, frozen: frozenKeys.has(key) })

  const filteredRows = useMemo(() => rows.filter((row) => BM_COLUMNS.every((column) => matchesFilter(row, column.key, columnFilters[column.key] ?? null, column.dataType))), [rows, columnFilters])
  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows
    // Correction Batch 3 Part C4: STT is a derived display position, not a
    // comparable value — ascending is already-ascending by construction,
    // descending reverses the current list (same reasoning as TKQC).
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

  const handleSort = (key: BmColumnKey, direction: 'asc' | 'desc' | null) => {
    setSort(direction === null ? null : { columnKey: key, direction })
  }
  const handleFilter = (key: BmColumnKey, value: ColumnFilterValue) => {
    setColumnFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const aggregationDataset = sortedRows
  const aggregateColumn = (key: BmColumnKey): string => {
    const total = aggregationDataset.reduce((sum, row) => sum + (Number(cellValue(row, key)) || 0), 0)
    return String(total)
  }

  const frozenStyle = (key: BmColumnKey) => frozenOffsets.has(key) ? { left: frozenOffsets.get(key) } : undefined

  return <div className="ads-pro-table-shell" {...uiSettingsDataAttrs(uiSettings)}>
    <div className="ads-pro-table-scroll" ref={scrollRef} onScroll={handleTableScroll} style={{ paddingBottom: SUMMARY_ROW_HEIGHT + PAGINATION_ROW_HEIGHT }}>
      {/* Shared Summary Alignment — pinned to `totalWidth` from
          useColumnConfig (the ONE resolved-geometry source, shared with
          TKQC/Page/Pixel's own tables and this footer's own summary track
          below), not a locally re-derived sum. Without this, the shared
          `.ads-pro-table { width:100% }` + table-layout:fixed rule lets
          the browser proportionally stretch <col> widths past the
          footer's fixed-width spans whenever the viewport is wider than
          the table's own natural content width. */}
      <table className="ads-pro-table is-empty is-business is-bm-full" style={{ width: totalWidth, minWidth: totalWidth }}>
        <colgroup><col className="is-sticky-checkbox" style={{ width: CHECKBOX_COLUMN_WIDTH }} />{orderedColumns.map((column) => <col key={column.key} style={{ width: column.width }} />)}</colgroup>
        <thead><tr>
          <th className="is-sticky-checkbox"><SelectionCheckbox label={t("ui.00b9478ebf")} checked={allSelected} mixed={someSelected} onChange={() => onToggleAll(visibleIds)} /></th>
          {orderedColumns.map((column) => <th key={column.key} className={columnCellClass(column, frozenKeys, lastFrozenKey)} style={frozenStyle(column.key)} draggable={column.key !== 'stt'} onDragStart={(event) => event.dataTransfer.setData('text/bm-column', column.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromKey = event.dataTransfer.getData('text/bm-column') as BmColumnKey; if (fromKey) reorder(fromKey, column.key) }}>
            <span className="ads-sort-label">{tx(column.key === 'stt' ? <span className="ads-column-locked-handle" aria-hidden="true" title={t("ui.7af1ccc039")}><Lock size={11} /></span> : <span className="ads-column-drag-handle" aria-hidden="true">⠿</span>)}{tx(column.label)}<AdsProColumnMenu label={tx(column.label)} dataType={column.dataType} canFreeze={column.key !== 'tag' && column.key !== 'stt'} state={getColumnState(column.key)} onSort={(direction) => handleSort(column.key, direction)} onFilterChange={(value) => handleFilter(column.key, value)} onToggleFreeze={() => toggleFreeze(column.key)} /></span>
            <ColumnResizeHandle width={column.width} minWidth={minWidthFor(column.key)} maxWidth={maxWidthFor(column.key)} onResize={(width) => resizeColumn(column.key, width)} onResetWidth={() => resetColumn(column.key)} />
          </th>)}
        </tr></thead>
        <tbody>
          {tx(pagedRows.map((row, index) => <tr key={row.id} className={selectedIds.includes(row.id) ? 'is-selected' : ''}>
            <td className="is-sticky-checkbox"><SelectionCheckbox label={tx(m("ui.84da3235c3", { 0: row.name }))} checked={selectedIds.includes(row.id)} onChange={() => onToggle(row.id)} /></td>
            {orderedColumns.map((column) => <td key={column.key} className={columnCellClass(column, frozenKeys, lastFrozenKey)} style={frozenStyle(column.key)}>{renderCell(row, column.key, startIndex + index + 1, onEditNote, onOpenResourcePanel, { tags, getRowTagIds, onOpenTagPickerForRow }, idMasked)}</td>)}
          </tr>))}
          {tx(pagedRows.length === 0 && <tr><td colSpan={BM_COLUMNS.length + 1} className="ads-pro-table-empty-row"><SearchX size={24} /><span>{t("ui.1a567dab5f")}</span></td></tr>)}
        </tbody>
      </table>
    </div>

    <footer className="ads-pro-table-footer is-tkqc-full">
      {/* Summary Above Pagination — this whole block is now a fixed
          overlay pinned to the bottom of the shell (see the CSS's own
          header comment), Summary FIRST then Pagination, so both stay
          visible during vertical scroll and touch with zero gap. */}
      <AdsProTableSummaryRow
        assetLabel="BM"
        orderedColumns={orderedColumns}
        checkboxWidth={CHECKBOX_COLUMN_WIDTH}
        viewportWidth={viewportWidth}
        footerTrackRef={footerTrackRef}
        cellClassName={(column) => columnCellClass(column, frozenKeys, lastFrozenKey)}
        cellStyle={(column) => frozenStyle(column.key)}
        renderTotal={(column) => column.aggregatable ? aggregateColumn(column.key) : '-'}
      />
      <div className="ads-tkqc-footer-overlay">
        <label>{t("ui.2a48ea973e")}{" "}<select aria-label={t("ui.4afe43c7e8")} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option>25</option><option>50</option><option>100</option></select></label>
        <span><button type="button" aria-label={t("ui.d676ae2541")} disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14} /></button>{page}/{totalPages}<button type="button" aria-label={t("ui.c4e3d2b807")} disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={14} /></button></span>
        <strong>{t("ui.40b56a1698")}{" "}{selectedIds.length} / {totalCount} {" "}{t("ui.6a577a7743")}</strong>
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
