import { m, useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Clock3, Edit3, FolderInput,
  Lock, Plus, SearchX, Tag, Trash2, UserRoundCheck,
} from 'lucide-react'
import { formatViaBrowser, formatViaLastConnected, type AdsAssetKey, type ViaConnection } from './ads-check-pro-workspace-data'
import type { TagDefinition } from './ads-check-pro-tag-system'
import { AdsProColumnMenu, ColumnResizeHandle, evaluateAdvancedFilter, type ColumnDataType, type ColumnFilterValue, type ColumnMenuState } from './ads-check-pro-column-menu'
import { useColumnConfig } from './ads-check-pro-column-config'
import { AdsProColumnSettingsModal } from './ads-check-pro-column-settings-modal'
import { AdsCheckProTkqcTable } from './ads-check-pro-tkqc-table'
import type { TkqcRow } from './ads-check-pro-tkqc-data'
import { AdsCheckProBmTable } from './ads-check-pro-bm-table'
import type { BmRow } from './ads-check-pro-bm-data'
import type { BmResourceKind } from './ads-check-pro-bm-resource-panels'
import { AdsCheckProGenericTable } from './ads-check-pro-generic-table'
import { assetColumns, type GenericRow } from './ads-check-pro-generic-data'
import { uiSettingsDataAttrs, type UiSettings } from './ads-check-pro-ui-settings'

// Correction Batch 2 Part V — VIA now uses the SAME shared column-header
// menu (sort/filter/freeze)/Advanced Filter Builder/drag-reorder primitives
// as TKQC/BM/Page/Pixel (Part A), replacing the old cosmetic-only SortLabel.
// Checkbox/Hành động stay outside this reorderable set (reorder-locked, no
// production evidence either is a normal column). Correction Batch 3 Part
// C: STT is now INSIDE this set (traced: a plain column-def object, same
// shared header/menu/resize/reorder/freeze machinery, defaultFrozen:true).
type ViaColumnKey = 'stt' | 'status' | 'name' | 'sourceId' | 'browser' | 'lastConnected' | 'tag' | 'note'
type ViaColumnDef = { key: ViaColumnKey; label: string; width: number; dataType: ColumnDataType; minWidth?: number; maxWidth?: number; defaultFrozen?: boolean; lockOrder?: boolean }
type ViaSortState = { columnKey: ViaColumnKey; direction: 'asc' | 'desc' } | null

// Widths come from this <colgroup> definition, not the legacy nth-child
// rules (see .is-via-columns in ads-check-adaccounts-table.css) — a fixed
// nth-child scheme can't stay correct once columns are reorderable.
const VIA_COLUMNS: ViaColumnDef[] = [
  { key: 'stt', label: 'STT', width: 60, minWidth: 48, maxWidth: 120, dataType: 'string', defaultFrozen: true, lockOrder: true },
  { key: 'status', label: m("ui.e03c1401e3"), width: 130, dataType: 'status' },
  { key: 'name', label: m("ui.3183a086b0"), width: 220, dataType: 'string' },
  { key: 'sourceId', label: m("ui.2abe434bb4"), width: 160, dataType: 'string' },
  { key: 'browser', label: m("ui.f38bcd4f56"), width: 130, dataType: 'string' },
  // Relative-time display string ("55 phút trước"), not a real date — text
  // operators (Chứa/Bằng/…), not before/after date operators.
  { key: 'lastConnected', label: m("ui.3ad13b1a57"), width: 150, dataType: 'string' },
  { key: 'tag', label: 'Tag', width: 180, dataType: 'other' },
  { key: 'note', label: m("ui.02f03f68e7"), width: 190, dataType: 'string' },
]

// Correction Batch 3 Part C4/C9: STT's DISPLAY is a dynamic rendered
// position (see the `stt` case at each call site below), never a stored
// value — filtering/aggregation pragmatically use the row's own stable
// demo `order` field instead (same reasoning as TKQC/BM/Generic).
function viaCellValue(row: ViaConnection, key: ViaColumnKey): unknown {
  if (key === 'stt') return row.order
  if (key === 'tag') return null
  if (key === 'note') return row.note ?? null
  if (key === 'browser') return formatViaBrowser(row)
  if (key === 'lastConnected') return formatViaLastConnected(row)
  return row[key]
}
function viaCompareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1
  if (b === null || b === undefined) return 1
  return String(a).localeCompare(String(b), 'vi')
}
function viaMatchesFilter(row: ViaConnection, key: ViaColumnKey, filter: ColumnFilterValue, dataType: ColumnDataType): boolean {
  return evaluateAdvancedFilter(filter, viaCellValue(row, key), dataType)
}

type AssetTableProps = {
  asset: AdsAssetKey
  assetLabel: string
  totalCount: number
  rows: ViaConnection[]
  tkqcRows: TkqcRow[]
  tkqcRestrictedRows: TkqcRow[]
  bmRows: BmRow[]
  pageRows: GenericRow[]
  pixelRows: GenericRow[]
  selectedIds: string[]
  uiSettings: UiSettings
  tags: TagDefinition[]
  getRowTagIds: (rowId: string) => string[]
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
  onClearSelection: () => void
  onOpenTagPickerForSelection: (anchorEl: HTMLElement) => void
  onOpenTagPickerForRow: (rowId: string, anchorEl: HTMLElement) => void
  activeFolder: string
  onOpenMoveSelected: () => void
  onRemoveSelectedFromFolder: () => void
  onEditNote: (row: ViaConnection) => void
  onDelete: (row: ViaConnection) => void
  onOpenTkqcSpendLimitModal: (row: TkqcRow) => void
  onEditTkqcNote: (row: TkqcRow) => void
  onCheckTkqcHoldNeed: (rowId: string) => void
  onOpenTkqcAdminPanel: (row: TkqcRow) => void
  onEditBmNote: (row: BmRow) => void
  onOpenBmResourcePanel: (row: BmRow, kind: BmResourceKind) => void
  onEditGenericNote: (rowId: string, currentNote: string) => void
  columnSettingsOpen: boolean
  onCloseColumnSettings: () => void
  // TKQC Round 1 — see ads-check-pro-tkqc-table.tsx's own TkqcTableProps
  // for the full reasoning; passed straight through on the TKQC branch.
  tkqcIdMasked: boolean
  tkqcProgressFor: (rowId: string) => { completed: number; total: number } | null
  onOpenTkqcRunLog: (row: TkqcRow) => void
  onOpenTkqcPaymentPopover: (row: TkqcRow, anchorRect: DOMRect) => void
  // BM Round 1 Shared Rule #9 — Eye/ID-mask propagated to BM (masks ID BM
  // display only, same presentation-only semantics as TKQC's own mask).
  bmIdMasked: boolean
  // Page Round 1 — same shared Eye semantics, propagated to Page (masks
  // Page ID display only).
  pageIdMasked: boolean
  // Pixel #6 — same shared Eye semantics, targeting "ID Pixel" display
  // only; fully independent of the row-level lazy-reveal Eyes (Người
  // dùng/TKQC/Đối tác), which stay local state inside the generic table.
  pixelIdMasked: boolean
}

function TagCell({ tags, tagIds, onOpenPicker }: { tags: TagDefinition[]; tagIds: string[]; onOpenPicker: (anchorEl: HTMLElement) => void }) {
  useAppLanguage();
  const assigned = tagIds.map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is TagDefinition => Boolean(tag))
  return <div className="ads-pro-tag-cell">
    {assigned.map((tag) => <span key={tag.id} className="ads-pro-tag-chip"><i className="ads-pro-tag-chip-dot" style={{ background: tag.colorHex }} aria-hidden="true" /><span>{tag.name}</span></span>)}
    <button type="button" className="ads-pro-tag-add" aria-label={t("ui.97d8de2327")} onClick={(event) => onOpenPicker(event.currentTarget)}><Plus size={13} /></button>
  </div>
}


function SelectionCheckbox({ checked, mixed, label, onChange }: { checked: boolean; mixed?: boolean; label: string; onChange: () => void }) {
  useAppLanguage();
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = Boolean(mixed) }, [mixed])
  return <input ref={ref} type="checkbox" aria-label={tx(label)} aria-checked={mixed ? 'mixed' : checked} checked={checked} onChange={onChange} />
}

function Status({ status }: { status: 'connected' | 'offline' | 'active' | 'restricted' }) {
  useAppLanguage();
  const label = status === 'connected' ? m("ui.9d15385cab") : status === 'offline' ? m("ui.f5373d1e8e") : status === 'active' ? m("ui.ad939f0450") : m("ui.0fb7591169")
  return <span className={`ads-pro-status is-${status}`}><i />{tx(label)}</span>
}

export function AdsCheckProAssetTable({
  asset, assetLabel, totalCount, rows, tkqcRows, tkqcRestrictedRows, bmRows, pageRows, pixelRows, selectedIds, uiSettings, tags, getRowTagIds, onToggle, onToggleAll,
  onClearSelection, onOpenTagPickerForSelection, onOpenTagPickerForRow, activeFolder, onOpenMoveSelected, onRemoveSelectedFromFolder, onEditNote, onDelete,
  onOpenTkqcSpendLimitModal, onEditTkqcNote, onCheckTkqcHoldNeed, onOpenTkqcAdminPanel, onEditBmNote, onOpenBmResourcePanel, onEditGenericNote,
  columnSettingsOpen, onCloseColumnSettings,
  tkqcIdMasked, tkqcProgressFor, onOpenTkqcRunLog, onOpenTkqcPaymentPopover,
  bmIdMasked, pageIdMasked, pixelIdMasked,
}: AssetTableProps) {
  useAppLanguage();
  // Hooks first, unconditionally (asset can switch between 'ad-account' and
  // everything else on this SAME mounted instance — no `key` forces a
  // remount — so the early return for TKQC below must come after every
  // hook call, never before, or React sees a differing hook count across
  // re-renders.
  const [pageSize, setPageSize] = useState(asset === 'via' ? 50 : 25)
  const [page, setPage] = useState(1)
  const [viaColumnFilters, setViaColumnFilters] = useState<Partial<Record<ViaColumnKey, ColumnFilterValue>>>({})
  const [viaSort, setViaSort] = useState<ViaSortState>(null)
  // Correction Batch 2 Part D5/D6 — order + freeze come from the SAME
  // shared useColumnConfig hook TKQC/BM use (Part A), persisted via the
  // traced "config_column" key, with proper cumulative sticky offsets.
  const { orderedColumns: viaOrderedColumns, allOrderedColumns: viaAllOrderedColumns, frozenKeys: viaFrozenKeys, hiddenKeys: viaHiddenKeys, frozenOffsets: viaFrozenOffsets, lastFrozenKey: viaLastFrozenKey, toggleFreeze: toggleViaFreeze, reorder: reorderVia, resizeColumn: resizeViaColumn, resetColumn: resetViaColumn, minWidthFor: viaMinWidthFor, maxWidthFor: viaMaxWidthFor, applyColumnSettings: applyViaColumnSettings } = useColumnConfig('via', VIA_COLUMNS, 44)
  const viaFilteredRows = useMemo(() => rows.filter((row) => VIA_COLUMNS.every((column) => viaMatchesFilter(row, column.key, viaColumnFilters[column.key] ?? null, column.dataType))), [rows, viaColumnFilters])
  const viaSortedRows = useMemo(() => {
    if (!viaSort) return viaFilteredRows
    // Correction Batch 3 Part C4: STT is a derived display position, not a
    // comparable value — ascending is already-ascending by construction,
    // descending reverses the current list.
    if (viaSort.columnKey === 'stt') return viaSort.direction === 'desc' ? [...viaFilteredRows].reverse() : viaFilteredRows
    const factor = viaSort.direction === 'asc' ? 1 : -1
    return [...viaFilteredRows].sort((a, b) => factor * viaCompareValues(viaCellValue(a, viaSort.columnKey), viaCellValue(b, viaSort.columnKey)))
  }, [viaFilteredRows, viaSort])
  const getViaColumnState = (key: ViaColumnKey): ColumnMenuState => ({ sortDirection: viaSort?.columnKey === key ? viaSort.direction : null, filter: viaColumnFilters[key] ?? null, frozen: viaFrozenKeys.has(key) })
  const handleViaSort = (key: ViaColumnKey, direction: 'asc' | 'desc' | null) => {
    setViaSort(direction === null ? null : { columnKey: key, direction })
  }
  const handleViaFilter = (key: ViaColumnKey, value: ColumnFilterValue) => {
    setViaColumnFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }
  const viaFrozenStyle = (key: ViaColumnKey) => viaFrozenOffsets.has(key) ? { left: viaFrozenOffsets.get(key) } : undefined
  const viaFrozenClass = (key: ViaColumnKey) => [viaFrozenKeys.has(key) ? 'is-frozen' : '', key === viaLastFrozenKey ? 'is-frozen-boundary' : ''].filter(Boolean).join(' ')
  const totalItems = asset === 'via' ? viaSortedRows.length : 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (page - 1) * pageSize
  const pagedViaRows = viaSortedRows.slice(startIndex, startIndex + pageSize)
  const visibleIds = pagedViaRows.map((row) => row.id)
  const selectedVisible = visibleIds.filter((id) => selectedIds.includes(id))
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length
  const someSelected = selectedVisible.length > 0 && !allSelected
  const noSearchResults = asset === 'via' && totalItems === 0

  useEffect(() => {
    setPage(1)
    setPageSize(asset === 'via' ? 50 : 25)
  }, [asset])
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])

  // TKQC (Batch Update Part D) has its own full 31-column table — a fully
  // separate component (ads-check-pro-tkqc-table.tsx) with its own
  // pagination/sort/filter/footer, rather than folding 30 extra columns
  // into this shared VIA/empty-asset shell (Part J).
  if (asset === 'ad-account') {
    return <AdsCheckProTkqcTable
      rows={tkqcRows}
      restrictedRows={tkqcRestrictedRows}
      totalCount={totalCount}
      selectedIds={selectedIds}
      uiSettings={uiSettings}
      tags={tags}
      getRowTagIds={getRowTagIds}
      onToggle={onToggle}
      onToggleAll={onToggleAll}
      onOpenTagPickerForRow={onOpenTagPickerForRow}
      onOpenSpendLimitModal={onOpenTkqcSpendLimitModal}
      onEditNote={onEditTkqcNote}
      onCheckHoldNeed={onCheckTkqcHoldNeed}
      onOpenAdminPanel={onOpenTkqcAdminPanel}
      columnSettingsOpen={columnSettingsOpen}
      onCloseColumnSettings={onCloseColumnSettings}
      idMasked={tkqcIdMasked}
      progressFor={tkqcProgressFor}
      onOpenRunLog={onOpenTkqcRunLog}
      onOpenPaymentPopover={onOpenTkqcPaymentPopover}
    />
  }

  // BM (Batch Update Part H) similarly gets its own table component now
  // that it has real row data and an expanded column set.
  if (asset === 'business') {
    return <AdsCheckProBmTable
      rows={bmRows}
      totalCount={totalCount}
      selectedIds={selectedIds}
      uiSettings={uiSettings}
      tags={tags}
      getRowTagIds={getRowTagIds}
      onOpenTagPickerForRow={onOpenTagPickerForRow}
      onToggle={onToggle}
      onToggleAll={onToggleAll}
      onEditNote={onEditBmNote}
      onOpenResourcePanel={onOpenBmResourcePanel}
      idMasked={bmIdMasked}
      columnSettingsOpen={columnSettingsOpen}
      onCloseColumnSettings={onCloseColumnSettings}
    />
  }

  // Page/Pixel (Batch Update Part I3) — real demo rows over the existing
  // column schema (assetColumns below), via the same generic table +
  // shared column menu used by TKQC/BM. No schema change.
  if (asset === 'page' || asset === 'pixel') {
    // BM Round 1 Final Correction — Page/Pixel share this one component
    // instance; without a per-asset key, React reuses the same DOM scroll
    // container across the switch, so a horizontal scroll position left on
    // Page silently carries into Pixel's (narrower) table. `key={asset}`
    // forces a real remount on switch, matching "asset switching must not
    // leak state" (state-composition rule) for scroll position too.
    return <AdsCheckProGenericTable
      key={asset}
      asset={asset}
      assetLabel={assetLabel}
      columns={assetColumns[asset]}
      rows={asset === 'page' ? pageRows : pixelRows}
      totalCount={totalCount}
      selectedIds={selectedIds}
      uiSettings={uiSettings}
      onToggle={onToggle}
      onToggleAll={onToggleAll}
      tags={tags}
      getRowTagIds={getRowTagIds}
      onOpenTagPickerForRow={onOpenTagPickerForRow}
      onEditNote={onEditGenericNote}
      columnSettingsOpen={columnSettingsOpen}
      onCloseColumnSettings={onCloseColumnSettings}
      idMasked={asset === 'page' ? pageIdMasked : asset === 'pixel' ? pixelIdMasked : false}
    />
  }

  return <div className="ads-pro-table-shell" {...uiSettingsDataAttrs(uiSettings)}>
    <div className="ads-pro-table-scroll">
      {tx(asset === 'via' && <table className="ads-pro-table is-via is-via-columns">
        <colgroup><col style={{ width: 44 }} />{viaOrderedColumns.map((column) => <col key={column.key} style={{ width: column.width }} />)}<col style={{ width: 80 }} /></colgroup>
        <thead><tr>
        <th className="is-sticky-checkbox"><SelectionCheckbox label={t("ui.1242f22920")} checked={allSelected} mixed={someSelected} onChange={() => onToggleAll(visibleIds)} /></th>
        {viaOrderedColumns.map((column) => <th key={column.key} className={viaFrozenClass(column.key)} style={viaFrozenStyle(column.key)} draggable={column.key !== 'stt'} onDragStart={(event) => event.dataTransfer.setData('text/via-column', column.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromKey = event.dataTransfer.getData('text/via-column') as ViaColumnKey; if (fromKey) reorderVia(fromKey, column.key) }}>
          <span className="ads-sort-label">{tx(column.key === 'stt' ? <span className="ads-column-locked-handle" aria-hidden="true" title={t("ui.7af1ccc039")}><Lock size={11} /></span> : <span className="ads-column-drag-handle" aria-hidden="true">⠿</span>)}{tx(column.label)}<AdsProColumnMenu label={tx(column.label)} dataType={column.dataType} canFreeze={column.key !== 'tag' && column.key !== 'stt'} state={getViaColumnState(column.key)} onSort={(direction) => handleViaSort(column.key, direction)} onFilterChange={(value) => handleViaFilter(column.key, value)} onToggleFreeze={() => toggleViaFreeze(column.key)} /></span>
          <ColumnResizeHandle width={column.width} minWidth={viaMinWidthFor(column.key)} maxWidth={viaMaxWidthFor(column.key)} onResize={(width) => resizeViaColumn(column.key, width)} onResetWidth={() => resetViaColumn(column.key)} />
        </th>)}
        <th>{t("ui.8e9fdd281d")}</th>
      </tr></thead><tbody>{tx(pagedViaRows.map((row, rowIndex) => <tr key={row.id} className={selectedIds.includes(row.id) ? 'is-selected' : ''}>
        <td className="is-sticky-checkbox"><SelectionCheckbox label={tx(m("ui.84da3235c3", { 0: row.name }))} checked={selectedIds.includes(row.id)} onChange={() => onToggle(row.id)} /></td>
        {viaOrderedColumns.map((column) => <td key={column.key} className={`${viaFrozenClass(column.key)}${column.key === 'sourceId' ? ' is-tabular' : ''}`} style={viaFrozenStyle(column.key)}>
          {column.key === 'stt' ? startIndex + rowIndex + 1
            : column.key === 'status' ? <Status status={row.status} />
            : column.key === 'name' ? <span className="ads-pro-person"><i aria-hidden="true">{row.order}</i>{row.name}</span>
            : column.key === 'sourceId' ? row.sourceId
            : column.key === 'browser' ? formatViaBrowser(row)
            : column.key === 'lastConnected' ? <span className="ads-pro-history">{formatViaLastConnected(row)}<Clock3 size={12} /></span>
            : column.key === 'tag' ? <TagCell tags={tags} tagIds={getRowTagIds(row.id)} onOpenPicker={(anchorEl) => onOpenTagPickerForRow(row.id, anchorEl)} />
            : <button className="ads-pro-cell-action is-note" type="button" aria-label={tx(m("ui.b98f065173", { 0: row.name }))} onClick={() => onEditNote(row)}>{row.note ? <span>{row.note}</span> : <Edit3 size={15} />}</button>}
        </td>)}
        <td><button className="ads-pro-cell-action is-delete" type="button" aria-label={tx(m("ui.19655eb202", { 0: row.name }))} onClick={() => onDelete(row)}><Trash2 size={16} /></button></td>
      </tr>))}</tbody></table>)}

    </div>

    <ul className="ads-pro-mobile-cards" aria-label={tx(m("ui.755907bfad", { 0: assetLabel }))}>
      {tx(asset === 'via' && pagedViaRows.map((row) => <li key={row.id}><header><SelectionCheckbox label={tx(m("ui.84da3235c3", { 0: row.name }))} checked={selectedIds.includes(row.id)} onChange={() => onToggle(row.id)} /><strong>{row.name}</strong><Status status={row.status} /></header><dl><div><dt>{t("ui.2abe434bb4")}</dt><dd>{row.sourceId}</dd></div><div><dt>{t("ui.f38bcd4f56")}</dt><dd>{formatViaBrowser(row)}</dd></div><div><dt>{t("ui.62b5a5f252")}</dt><dd>{formatViaLastConnected(row)}</dd></div></dl><footer><button type="button" aria-label={tx(m("ui.c4e2a9ee32", { 0: row.name }))} onClick={() => onEditNote(row)}><Edit3 size={15} />{t("ui.02f03f68e7")}</button><button type="button" aria-label={tx(m("ui.19655eb202", { 0: row.name }))} onClick={() => onDelete(row)}><Trash2 size={15} />{t("ui.aa1d94fc16")}</button></footer></li>))}
    </ul>

    {tx(noSearchResults && <div className="ads-pro-search-empty" role="status"><SearchX size={28} /><strong>{t("ui.921f3be69c")}</strong><span>{t("ui.6c78cc6442")}</span></div>)}

    <footer className="ads-pro-table-footer"><label>{t("ui.2a48ea973e")}{" "}<select aria-label={t("ui.4afe43c7e8")} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option>25</option><option>50</option><option>100</option></select></label><span><button type="button" aria-label={t("ui.d676ae2541")} disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={14} /></button>{page}/{totalPages}<button type="button" aria-label={t("ui.c4e3d2b807")} disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={14} /></button></span><strong>{t("ui.40b56a1698")}{" "}{selectedIds.length} / {totalCount} {tx(assetLabel)}</strong></footer>

    {tx(asset === 'via' && selectedIds.length > 0 && <div className="ads-pro-selection-bar" role="toolbar" aria-label={t("ui.8c90add6c0")}>
      <button type="button" className="ads-pro-selection-summary" aria-label={t("ui.c1aecfa1f9")} onClick={onClearSelection}><UserRoundCheck size={16} /><span>{t("ui.40b56a1698")}{" "}<strong>{selectedIds.length}</strong><i>/{totalCount}</i></span></button>
      <span className="ads-pro-selection-divider" aria-hidden="true" />
      <button type="button" onClick={onOpenMoveSelected}><FolderInput size={15} />{t("ui.8abb217829")}</button>
      {tx(activeFolder !== m("ui.f7a578dcbd") && <><span className="ads-pro-selection-divider" aria-hidden="true" /><button type="button" onClick={onRemoveSelectedFromFolder}><Trash2 size={15} />{t("ui.98546e09a7")}</button></>)}
      <span className="ads-pro-selection-divider" aria-hidden="true" />
      <button type="button" onClick={(event) => onOpenTagPickerForSelection(event.currentTarget)}><Tag size={15} />{t("ui.97d8de2327")}</button>
    </div>)}
    {tx(columnSettingsOpen && <AdsProColumnSettingsModal
      columns={viaAllOrderedColumns.map((column) => ({ key: column.key, label: column.label, locked: column.key === 'stt' }))}
      frozenKeys={viaFrozenKeys}
      hiddenKeys={viaHiddenKeys}
      onSave={applyViaColumnSettings}
      onClose={onCloseColumnSettings}
      trailingLockedColumn={{ label: m("ui.8e9fdd281d") }}
    />)}
  </div>
}
