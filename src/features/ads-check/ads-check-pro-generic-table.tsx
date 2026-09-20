import { useAppLanguage, tx, m, t } from '@/i18n'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Eye, Loader2, Lock, Pencil, SearchX } from 'lucide-react'
import { AdsProColumnMenu, ColumnResizeHandle, evaluateAdvancedFilter, type ColumnDataType, type ColumnFilterValue, type ColumnMenuState } from './ads-check-pro-column-menu'
import { CHECKBOX_COLUMN_WIDTH, PAGINATION_ROW_HEIGHT, SUMMARY_ROW_HEIGHT, useColumnConfig, useTableScrollSync } from './ads-check-pro-column-config'
import { AdsProColumnSettingsModal } from './ads-check-pro-column-settings-modal'
import { AdsProTableSummaryRow } from './ads-check-pro-table-summary-row'
import type { GenericColumnDef, GenericRow } from './ads-check-pro-generic-data'
import type { TagDefinition } from './ads-check-pro-tag-system'
import { uiSettingsDataAttrs, type UiSettings } from './ads-check-pro-ui-settings'
import { buildFanpageUrl } from './ads-check-pro-page-format'
import { maskAccountId } from './ads-check-pro-tkqc-format'
import { ResourceCountPill } from './ads-check-pro-resource-count-pill'

type GenericTableProps = {
  asset: 'page' | 'pixel'
  assetLabel: string
  columns: GenericColumnDef[]
  rows: GenericRow[]
  totalCount: number
  selectedIds: string[]
  uiSettings: UiSettings
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
  // Correction Batch 2 Part U/B: Page/Pixel's Tag/Ghi chú columns wire into
  // the SAME shared primitives VIA/TKQC use — no separate implementation.
  tags: TagDefinition[]
  getRowTagIds: (rowId: string) => string[]
  onOpenTagPickerForRow: (rowId: string, anchorEl: HTMLElement) => void
  onEditNote: (rowId: string, currentNote: string) => void
  columnSettingsOpen: boolean
  onCloseColumnSettings: () => void
  // Page Round 1 / Pixel #6 — presentation-only ID mask (same semantics
  // as TKQC/BM's own Eye): masks the Page ID / ID Pixel cell's DISPLAY
  // text only; links/search/filter/sort/export/row identity all still use
  // the real id. Independent of Pixel's own row-level lazy-reveal Eyes.
  idMasked: boolean
}

function SelectionCheckbox({ checked, mixed, label, onChange }: { checked: boolean; mixed?: boolean; label: string; onChange: () => void }) {
  useAppLanguage();
  const ref = useRef<HTMLInputElement>(null)
  useMemo(() => { if (ref.current) ref.current.indeterminate = Boolean(mixed) }, [mixed])
  return <input ref={ref} type="checkbox" aria-label={tx(label)} aria-checked={mixed ? 'mixed' : checked} checked={checked} onChange={onChange} />
}

// Correction Batch 3 Part C7: STT ('order') traced with no isNumber flag in
// production — defaults to text operators like every other unclassified
// column, not numeric (excluded from the numeric list below).
function columnDataType(key: string): ColumnDataType {
  if (['admin', 'likes', 'followers', 'posts', 'users', 'ad-accounts', 'partners', 'progress'].includes(key)) return 'number'
  if (key === 'status') return 'status'
  if (key === 'created-at') return 'date'
  if (['type', 'currency', 'permission'].includes(key)) return 'enum'
  return 'string'
}

// Page Round 1 Part #2 — same shared pattern as TKQC/BM's own MetaLink: a
// real <a> (new tab, stopPropagation so it never toggles row selection)
// when a destination URL is traceable, or the plain children otherwise.
function MetaLink({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  useAppLanguage();
  if (!href) return <>{tx(children)}</>
  return <a className="ads-tkqc-meta-link" href={href} target="_blank" rel="noreferrer" aria-label={tx(label)} onClick={(event) => event.stopPropagation()}>{tx(children)}</a>
}

// Page Round 1 Part #1 — dot + text ONLY (no pill/badge/background),
// explicitly distinct from the shared `.ads-pro-status` badge convention
// used elsewhere in this app. Traced production status set: Live/Die/a
// hidden-page state (see ads-check-pro-generic-data.ts's own trace note).
function PageStatusCell({ status }: { status: unknown }) {
  useAppLanguage();
  const label = status === 'live' ? 'Live' : status === 'die' ? 'Die' : m("ui.fe5847cbc8")
  const modifier = status === 'live' ? 'is-live' : status === 'die' ? 'is-die' : 'is-hidden'
  return <span className={`ads-page-status ${modifier}`}><i aria-hidden="true" />{tx(label)}</span>
}

// Page Round 1 Part #7/#8 — "Page live" and "Kiếm tiền" share the exact
// same boolean-eligibility presentation (Có/true → "Đạt", Không/false →
// "Chưa đạt"), so both cases route through this ONE helper instead of
// duplicating the mapping.
function normalizePageLiveStatus(value: unknown): 'live' | 'die' | 'dead' {
  if (value === 'live' || value === 'Live' || value === 'Đang hoạt động') return 'live'
  if (value === 'dead' || value === 'Dead' || value === 'Đã chết') return 'dead'
  return 'die'
}

function formatPageLive(value: unknown): string {
  const status = normalizePageLiveStatus(value)
  if (status === 'live') return t("ui.157f2a4c01")
  if (status === 'dead') return t("ui.6b3d4e5f02")
  return t("ui.a430b14135")
}

// Page Correction — "Page hủy đăng" is its own distinct publish-state
// semantic (production example value: "Đang xuất bản"), NOT the Page
// live/Kiếm tiền Đạt/Chưa đạt eligibility wording — kept as a separate
// helper rather than reusing renderPageEligibility.
function normalizePagePublishState(value: unknown): 'published' | 'unpublished' | 'not_published' | 'restricted' {
  if (value === 'published' || value === 'Đang xuất bản') return 'published'
  if (value === 'unpublished' || value === 'Đã hủy đăng') return 'unpublished'
  if (value === 'not_published' || value === 'Chưa xuất bản') return 'not_published'
  return 'restricted'
}

function renderPagePublishState(value: unknown): string {
  const state = normalizePagePublishState(value)
  if (state === 'published') return t("ui.ed1c2b3a4f")
  if (state === 'unpublished') return t("ui.ed2c3b4a5f")
  if (state === 'not_published') return t("ui.7f5c4d3e2b")
  return t("ui.4de5503a9e")
}

// Pixel #1 — dot + plain text ONLY (same shell as Page's own status cell,
// see ads-page-status above), exact production label "Dead" (NOT "Die" —
// that's Page's own separate status set).
function PixelStatusCell({ status }: { status: unknown }) {
  useAppLanguage();
  const label = status === 'live' ? m("ui.157f2a4c01") : m("ui.6b3d4e5f02")
  const modifier = status === 'live' ? 'is-live' : 'is-dead'
  return <span className={`ads-page-status ${modifier}`}><i aria-hidden="true" />{tx(label)}</span>
}

function normalizePageType(value: unknown): 'personal' | 'business' {
  return value === 'personal' || value === 'Cá nhân' ? 'personal' : 'business'
}

function formatPageType(value: unknown): string {
  return normalizePageType(value) === 'personal' ? t("ui.b8a7951b65") : t("ui.ed3c4b5a6f")
}

function normalizePagePermission(value: unknown): 'admin' | 'editor' | 'analyst' | 'employee' {
  if (value === 'admin' || value === 'QTV') return 'admin'
  if (value === 'editor' || value === 'Biên tập viên') return 'editor'
  if (value === 'analyst' || value === 'Chuyên viên phân tích') return 'analyst'
  return 'employee'
}

function formatPagePermissionRole(value: unknown): string {
  const role = normalizePagePermission(value)
  if (role === 'admin') return t("ui.4e7afebcfb")
  if (role === 'editor') return t("ui.0c1d2e3f04")
  if (role === 'analyst') return t("ui.5a6b7c8d05")
  return t("ui.2d9f8c7b61")
}

function formatGenericEnum(key: string, value: unknown): string {
  if (key === 'type') return formatPageType(value)
  if (key === 'permission') return formatPagePermissionRole(value)
  return renderValue(key, value)
}

function formatPagePermission(value: unknown): string {
  const roles = Array.isArray(value) ? value : [value]
  return roles.map(formatPagePermissionRole).join(', ')
}

function formatPageCellValue(key: string, value: unknown): string | null {
  if (key === 'unpublished') return renderPagePublishState(value)
  if (key === 'permission') return formatPagePermission(value)
  if (key === 'live') return formatPageLive(value)
  if (key === 'type') return formatPageType(value)
  return null
}

function formatPageSemantic(key: string, value: unknown): string {
  if (key === 'reason') return value === 'ads_policy_violation' ? t("ui.d328f93032") : String(value ?? '-')
  if (key === 'monetization') return value ? t("ui.e429fa4133") : t("ui.f52a0b5234")
  if (key === 'ad-eligible') return value ? t("ui.c409ec429a") : t("ui.4de5503a9e")
  if (key === 'verified') return value ? t("ui.05828b8a56") : t("ui.3b4a527f1d")
  return renderValue(key, value)
}

// Pixel #2 — Người dùng/TKQC/Đối tác are NOT masked (unlike TKQC/BM/Page's
// Eye), they're a per-ROW lazy-detail-load reveal: clicking the Eye in ANY
// one of the 3 cells reveals all 3 for that row; other rows stay Eye-only.
// This is deliberately local UI state, not the global idMask channel.
function PixelLazyCell({ value, revealed, loading, onReveal, label }: { value: string; revealed: boolean; loading: boolean; onReveal: () => void; label: string }) {
  useAppLanguage();
  if (revealed) return <span>{value}</span>
  return <button type="button" className="ads-pixel-lazy-reveal" aria-label={tx(label)} aria-busy={loading} disabled={loading} onClick={onReveal}>
    {loading ? <Loader2 size={14} className="is-spinning" /> : <Eye size={14} />}
  </button>
}

function TagCell({ tags, tagIds, onOpenPicker }: { tags: TagDefinition[]; tagIds: string[]; onOpenPicker: (anchorEl: HTMLElement) => void }) {
  useAppLanguage();
  const assigned = tagIds.map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is TagDefinition => Boolean(tag))
  return <div className="ads-pro-tag-cell">
    {assigned.map((tag) => <span key={tag.id} className="ads-pro-tag-chip"><i className="ads-pro-tag-chip-dot" style={{ background: tag.colorHex }} aria-hidden="true" /><span>{tag.name}</span></span>)}
    <button type="button" className="ads-pro-tag-add" aria-label={t("ui.97d8de2327")} onClick={(event) => onOpenPicker(event.currentTarget)}>+</button>
  </div>
}

function NoteCell({ rowId, note, onEditNote }: { rowId: string; note: string; onEditNote: (rowId: string, currentNote: string) => void }) {
  useAppLanguage();
  return <span className="ads-tkqc-hover-cell">
    <span>{note || '-'}</span>
    <button type="button" className="ads-tkqc-cell-edit" aria-label={t("ui.03d300a0c6")} onClick={() => onEditNote(rowId, note)}><Pencil size={12} /></button>
  </span>
}

// Exported so the shared Download panel's export-column builders can format
// values identically to what's rendered on screen (workspace.tsx).
export function renderValue(key: string, value: unknown): string {
  if (key === 'progress' && (value === null || value === undefined)) return '-'
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? m("ui.05828b8a56") : m("ui.3b4a527f1d")
  if (key === 'progress' && typeof value === 'number') return `${value}%`
  return String(value)
}

function matchesFilter(value: unknown, filter: ColumnFilterValue, dataType: ColumnDataType): boolean {
  return evaluateAdvancedFilter(filter, value, dataType)
}

function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1
  if (b === null || b === undefined) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'vi')
}

// Page/Pixel (Batch Update Part I3, Correction Batch 2 Part U) — real demo
// rows over the EXISTING column schema, reusing the exact same shared
// column-menu (sort/filter/freeze/drag-reorder) and Tag/Note primitives as
// TKQC/BM/VIA (Part A/E5). No aggregation footer here (Part G's dataset
// summary rule is scoped to TKQC only).
export function AdsCheckProGenericTable({ asset, assetLabel, columns, rows, totalCount, selectedIds, uiSettings, onToggle, onToggleAll, tags, getRowTagIds, onOpenTagPickerForRow, onEditNote, columnSettingsOpen, onCloseColumnSettings, idMasked }: GenericTableProps) {
  useAppLanguage()
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilterValue>>({})
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  // Pixel #2 — row-level lazy reveal state (Người dùng/TKQC/Đối tác share
  // ONE reveal per row, not per-cell/per-column/global). Local UI state:
  // the underlying values already exist on the row (no separate detail
  // fetch model in this clone), so "loading" is a brief simulated delay
  // before the same 3 cells switch from Eye to their real values.
  const [revealedRowIds, setRevealedRowIds] = useState<Set<string>>(new Set())
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null)
  const revealRow = (rowId: string) => {
    if (revealedRowIds.has(rowId) || loadingRowId === rowId) return
    setLoadingRowId(rowId)
    window.setTimeout(() => {
      setRevealedRowIds((current) => new Set(current).add(rowId))
      setLoadingRowId(null)
    }, 700)
  }
  const { orderedColumns, allOrderedColumns, frozenKeys, hiddenKeys, frozenOffsets, lastFrozenKey, totalWidth, toggleFreeze, reorder, resizeColumn, resetColumn, minWidthFor, maxWidthFor, applyColumnSettings } = useColumnConfig(asset, columns, CHECKBOX_COLUMN_WIDTH)
  // Shared Table Scroll Sync (ads-check-pro-column-config.ts) — extracted
  // from TKQC, the confirmed-correct reference implementation; Page/Pixel
  // now call the exact same function instead of their own parallel copy.
  const { scrollRef, footerTrackRef, viewportWidth, handleTableScroll } = useTableScrollSync()

  const getColumnState = (key: string): ColumnMenuState => ({ sortDirection: sort?.key === key ? sort.direction : null, filter: columnFilters[key] ?? null, frozen: frozenKeys.has(key) })

  const filteredRows = useMemo(() => rows.filter((row) => columns.every((column) => matchesFilter(row.values[column.key], columnFilters[column.key] ?? null, columnDataType(column.key)))), [rows, columns, columnFilters])
  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows
    // Correction Batch 3 Part C4: STT is a derived display position, not a
    // comparable stored value — ascending is already-ascending by
    // construction, descending reverses the current list.
    if (sort.key === 'order') return sort.direction === 'desc' ? [...filteredRows].reverse() : filteredRows
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...filteredRows].sort((a, b) => factor * compareValues(a.values[sort.key], b.values[sort.key]))
  }, [filteredRows, sort])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const pagedRows = sortedRows.slice(startIndex, startIndex + pageSize)
  const visibleIds = pagedRows.map((row) => row.id)
  const selectedVisible = visibleIds.filter((id) => selectedIds.includes(id))
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length
  const someSelected = selectedVisible.length > 0 && !allSelected

  const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
    setSort(direction === null ? null : { key, direction })
  }
  const handleFilter = (key: string, value: ColumnFilterValue) => {
    setColumnFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const frozenStyle = (key: string) => frozenOffsets.has(key) ? { left: frozenOffsets.get(key) } : undefined
  // Summary Cell Alignment Correction — `is-numeric` (shared, unscoped
  // right-align rule in ads-check-adaccounts-table.css) is now assigned
  // here from this table's own `columnDataType`, the SAME resolver
  // already used for the column-menu's sort/filter typing — so header,
  // body <td>, and the summary <span> (all three already consume this one
  // `frozenClass` function) share one real alignment source instead of
  // three independently-decided ones.
  // Pixel #2 — Người dùng/TKQC/Đối tác are count-only lazy-reveal stat
  // cells (Eye icon <-> plain number), never currency — they share the
  // `is-numeric` alignment marker with real currency columns elsewhere
  // (BM/TKQC), so centering can't be done by editing that shared rule
  // without also re-centering currency cells it never should touch. This
  // extra marker lets body <td>, footer <span> (same `frozenClass` passed
  // as both tables' `cellClassName`), AND the Eye button all resolve from
  // ONE column-level signal instead of three independent overrides — the
  // header <th> deliberately gets this class too (harmless no-op there;
  // its own flex `.ads-sort-label` layout already reads as balanced and
  // is left untouched, per spec).
  const frozenClass = (key: string) => [frozenKeys.has(key) ? 'is-frozen' : '', key === lastFrozenKey ? 'is-frozen-boundary' : '', columnDataType(key) === 'number' ? 'is-numeric' : '', asset === 'pixel' && (key === 'users' || key === 'ad-accounts' || key === 'partners') ? 'is-stat-centered' : ''].filter(Boolean).join(' ')
  // Page+Pixel #3 — footer totals over the full current result dataset
  // (filtered/sorted, all pages), same rule as TKQC/BM's own aggregation.
  // Only columns explicitly marked `aggregatable` in the schema show a real
  // sum; every other column shows the shared '-' placeholder (Page has no
  // production-confirmed aggregatable field — traced `column-totals:
  // {adminCount:"-"}` — so it renders '-' everywhere, never a fabricated
  // number).
  const aggregateColumn = (key: string): string => String(sortedRows.reduce((sum, row) => sum + (Number(row.values[key]) || 0), 0))

  return <div className="ads-pro-table-shell" {...uiSettingsDataAttrs(uiSettings)}>
    <div className="ads-pro-table-scroll" ref={scrollRef} onScroll={handleTableScroll} style={{ paddingBottom: SUMMARY_ROW_HEIGHT + PAGINATION_ROW_HEIGHT }}>
      {/* Shared Summary Alignment — pinned to `totalWidth` from
          useColumnConfig (the ONE resolved-geometry source shared with
          TKQC/BM's own tables and this footer's summary track below), not
          a locally re-derived sum — see that hook's own header comment for
          why the shared `.ads-pro-table { width:100% }` + table-layout:
          fixed combination needs this to avoid the browser proportionally
          stretching <col> widths past the footer's fixed-width spans. */}
      <table className={`ads-pro-table is-generic is-${asset}`} style={{ width: totalWidth, minWidth: totalWidth }}>
        <colgroup><col className="is-sticky-checkbox" style={{ width: CHECKBOX_COLUMN_WIDTH }} />{orderedColumns.map((column) => <col key={column.key} style={{ width: column.width }} />)}</colgroup>
        <thead><tr>
          <th className="is-sticky-checkbox"><SelectionCheckbox label={tx(m("ui.124bc98067", { 0: assetLabel }))} checked={allSelected} mixed={someSelected} onChange={() => onToggleAll(visibleIds)} /></th>
          {orderedColumns.map((column) => <th key={column.key} className={frozenClass(column.key)} style={frozenStyle(column.key)} draggable={column.key !== 'order'} onDragStart={(event) => event.dataTransfer.setData('text/generic-column', column.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromKey = event.dataTransfer.getData('text/generic-column'); if (fromKey) reorder(fromKey, column.key) }}>
            <span className="ads-sort-label">{tx(column.key === 'order' ? <span className="ads-column-locked-handle" aria-hidden="true" title={t("ui.7af1ccc039")}><Lock size={11} /></span> : <span className="ads-column-drag-handle" aria-hidden="true">⠿</span>)}{tx(column.label)}<AdsProColumnMenu label={tx(column.label)} dataType={columnDataType(column.key)} canFreeze={column.key !== 'tag' && column.key !== 'order'} state={getColumnState(column.key)} onSort={(direction) => handleSort(column.key, direction)} onFilterChange={(value) => handleFilter(column.key, value)} onToggleFreeze={() => toggleFreeze(column.key)} /></span>
            <ColumnResizeHandle width={column.width} minWidth={minWidthFor(column.key)} maxWidth={maxWidthFor(column.key)} onResize={(width) => resizeColumn(column.key, width)} onResetWidth={() => resetColumn(column.key)} />
          </th>)}
        </tr></thead>
        <tbody>
          {tx(pagedRows.map((row, index) => <tr key={row.id} className={selectedIds.includes(row.id) ? 'is-selected' : ''}>
            <td className="is-sticky-checkbox"><SelectionCheckbox label={tx(m("ui.84da3235c3", { 0: String(row.values.name ?? row.id) }))} checked={selectedIds.includes(row.id)} onChange={() => onToggle(row.id)} /></td>
            {tx(orderedColumns.map((column) => {
              const pageLink = asset === 'page' ? buildFanpageUrl(String(row.values.id ?? '')) : null
              const pageLinkLabel = m("ui.46cfd05912", { 0: String(row.values.name ?? row.id) })
              const pageCellOutput = asset === 'page' ? formatPageCellValue(column.key, row.values[column.key]) : null
              return <td key={column.key} className={frozenClass(column.key)} style={frozenStyle(column.key)}>
                {column.key === 'order'
                  ? startIndex + index + 1
                  : column.key === 'tag'
                    ? <TagCell tags={tags} tagIds={getRowTagIds(row.id)} onOpenPicker={(anchorEl) => onOpenTagPickerForRow(row.id, anchorEl)} />
                    : column.key === 'note'
                      ? <NoteCell rowId={row.id} note={String(row.values.note ?? '')} onEditNote={onEditNote} />
                      // Page Round 1 Part #1 — dot+text status, no pill.
                      : pageCellOutput !== null
                        ? (column.key === 'type' || column.key === 'unpublished' ? <span className="ads-page-type-cell">{pageCellOutput}</span> : pageCellOutput)
                      : asset === 'page' && column.key === 'status'
                        ? <PageStatusCell status={row.values.status} />
                        // Page Round 1 Part #2 — Tên Page/Page ID both open
                        // the real row-specific Fanpage; masking (Part D)
                        // only ever hides the ID cell's DISPLAY text.
                        : asset === 'page' && column.key === 'name'
                          ? <MetaLink href={pageLink} label={tx(pageLinkLabel)}>{String(row.values.name ?? '')}</MetaLink>
                          : asset === 'page' && column.key === 'id'
                            ? <MetaLink href={pageLink} label={tx(pageLinkLabel)}>{idMasked ? maskAccountId(String(row.values.id ?? '')) : String(row.values.id ?? '')}</MetaLink>
                            // Page Round 1 Part #4 — shared resource-count
                            // pill shell; no click target (see the pill
                            // component's own doc comment for why).
                            : asset === 'page' && column.key === 'admin'
                              ? <ResourceCountPill count={Number(row.values.admin) || 0}>{t("ui.52bc56da99")}{" "}{String(row.values.admin ?? 0)}</ResourceCountPill>
                              // Page Round 1 Part #5 — plain centered text.
                              : asset === 'page' && column.key === 'type'
                                ? <span className="ads-page-type-cell">{formatGenericEnum(column.key, row.values.type)}</span>
                                // Page Round 1 Part #7/#8 — shared eligibility renderer.
                                : asset === 'page' && column.key === 'live'
                                  ? formatPageLive(row.values[column.key])
                                  // Page Correction — "Page hủy đăng": plain
                                  // centered publish-state text (reuses the
                                  // same plain-centered-cell style as
                                  // "Loại"), distinct wording from
                                  // Đạt/Chưa đạt.
                                  : asset === 'page' && column.key === 'unpublished'
                                    ? <span className="ads-page-type-cell">{renderPagePublishState(row.values.unpublished)}</span>
                                    // Pixel #1 — dot+text status, "Dead" not "Die".
                                    : asset === 'pixel' && column.key === 'status'
                                      ? <PixelStatusCell status={row.values.status} />
                                      // Pixel #6 — toolbar Eye masks ID
                                      // Pixel's DISPLAY text only; totally
                                      // independent of the row-level lazy-
                                      // reveal Eyes below (never reveals
                                      // Người dùng/TKQC/Đối tác, and those
                                      // never mask/unmask this).
                                      : asset === 'pixel' && column.key === 'id'
                                        ? (idMasked ? maskAccountId(String(row.values.id ?? '')) : String(row.values.id ?? ''))
                                        // Pixel #2 — Người dùng/TKQC/Đối tác:
                                      // one shared per-row reveal state.
                                      : asset === 'pixel' && (column.key === 'users' || column.key === 'ad-accounts' || column.key === 'partners')
                                        ? <PixelLazyCell
                                            value={renderValue(column.key, row.values[column.key])}
                                            revealed={revealedRowIds.has(row.id)}
                                            loading={loadingRowId === row.id}
                                            onReveal={() => revealRow(row.id)}
                                            label={tx(m("ui.ad039cec7b", { 0: column.label, 1: String(row.values.name ?? row.id) }))}
                                          />
                                        : asset === 'page' && ['ad-eligible', 'reason', 'verified', 'monetization'].includes(column.key) ? formatPageSemantic(column.key, row.values[column.key]) : asset === 'page' && column.key === 'permission' ? formatPagePermission(row.values.permission) : ['permission'].includes(column.key) ? formatGenericEnum(column.key, row.values[column.key]) : renderValue(column.key, row.values[column.key])}
              </td>
            }))}
          </tr>))}
          {tx(pagedRows.length === 0 && <tr><td colSpan={orderedColumns.length + 1} className="ads-pro-table-empty-row"><SearchX size={24} /><span>{t("ui.1a567dab5f")}</span></td></tr>)}
        </tbody>
      </table>
    </div>
    <footer className="ads-pro-table-footer is-tkqc-full">
      {/* Summary Above Pagination — this whole block is now a fixed
          overlay pinned to the bottom of the shell (see the CSS's own
          header comment), Summary FIRST then Pagination, so both stay
          visible during vertical scroll and touch with zero gap. */}
      <AdsProTableSummaryRow
        assetLabel={assetLabel}
        orderedColumns={orderedColumns}
        checkboxWidth={CHECKBOX_COLUMN_WIDTH}
        viewportWidth={viewportWidth}
        footerTrackRef={footerTrackRef}
        cellClassName={(column) => frozenClass(column.key)}
        cellStyle={(column) => frozenStyle(column.key)}
        renderTotal={(column) => column.aggregatable ? aggregateColumn(column.key) : '-'}
      />
      <div className="ads-tkqc-footer-overlay">
        <label>{t("ui.2a48ea973e")}{" "}<select aria-label={t("ui.4afe43c7e8")} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option>25</option><option>50</option><option>100</option></select></label>
        <span><button type="button" aria-label={t("ui.d676ae2541")} disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14} /></button>{page}/{totalPages}<button type="button" aria-label={t("ui.c4e3d2b807")} disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={14} /></button></span>
        <strong>{t("ui.40b56a1698")}{" "}{selectedIds.length} / {totalCount} {tx(assetLabel)}</strong>
      </div>
    </footer>
    {tx(columnSettingsOpen && <AdsProColumnSettingsModal
      columns={allOrderedColumns.map((column) => ({ key: column.key, label: column.label, locked: column.key === 'order' }))}
      frozenKeys={frozenKeys}
      hiddenKeys={hiddenKeys}
      onSave={applyColumnSettings}
      onClose={onCloseColumnSettings}
    />)}
  </div>
}
