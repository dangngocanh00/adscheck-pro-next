import { m, useAppLanguage, tx, t } from '@/i18n'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, Filter, Lock, Plus, RotateCcw, Trash2, Unlock, X } from 'lucide-react'

export type ColumnDataType = 'number' | 'currency' | 'string' | 'date' | 'status' | 'enum' | 'other'

export type FilterCondition = { operator: string; value: string; value2?: string }
// Correction Batch 2 Part C: a real multi-condition filter builder (traced
// production: a match-mode selector — ANY/ALL — plus a list of
// {operator, value} rows), replacing the earlier text/min-max-only filter.
export type ColumnFilterValue = { match: 'any' | 'all'; conditions: FilterCondition[] } | null

export type ColumnMenuState = {
  sortDirection: 'asc' | 'desc' | null
  filter: ColumnFilterValue
  frozen: boolean
}

type ColumnMenuProps = {
  label: string
  dataType: ColumnDataType
  canFreeze: boolean
  state: ColumnMenuState
  onSort: (direction: 'asc' | 'desc' | null) => void
  onFilterChange: (value: ColumnFilterValue) => void
  onToggleFreeze: () => void
}

// Operator sets per data type — traced from references/remotes/adaccounts/
// 897.0e915523.js's operator id arrays (`eU` for number, `eJ` for string):
// number = gt/gte/lt/lte/eq/neq/between; string = contains/not_contains/eq/
// starts/ends. Only the operator IDS/count are confirmed — the bundle has
// no Vietnamese label strings for this i18n namespace, so the labels below
// are this clone's own translation of those exact confirmed keys, not
// invented extra operators. No separate date operator set exists in the
// source (dates fall back to the string set there); this clone keeps a
// small Before/After/Equals set for dates instead purely for usability —
// flagged as the one unconfirmed set.
const TEXT_OPERATORS = [m("ui.f0e55c1255"), m("ui.968ed4be99"), m("ui.e0c298c256"), m("ui.a52f8cdd29"), m("ui.b75f71207f")]
const NUMERIC_OPERATORS = [m("ui.3b640d635b"), m("ui.485dfc8c1d"), m("ui.b0e3e65cad"), m("ui.bff7719fdd"), m("ui.e0c298c256"), m("ui.5b8a28abf8"), m("ui.829e026917")]
const DATE_OPERATORS = [m("ui.e0c298c256"), m("ui.0747372e0d"), m("ui.e3abaf0c92")]
const ENUM_OPERATORS = [m("ui.e0c298c256"), m("ui.5b8a28abf8")]

function operatorsFor(dataType: ColumnDataType): string[] {
  if (dataType === 'number' || dataType === 'currency') return NUMERIC_OPERATORS
  if (dataType === 'date') return DATE_OPERATORS
  if (dataType === 'enum' || dataType === 'status') return ENUM_OPERATORS
  return TEXT_OPERATORS
}

function hasActiveFilter(filter: ColumnFilterValue): boolean {
  if (!filter) return false
  return filter.conditions.some((condition) => condition.value.trim().length > 0)
}

function evaluateCondition(condition: FilterCondition, rawValue: unknown, dataType: ColumnDataType): boolean {
  const { operator } = condition
  const target = condition.value.trim()
  if (operator !== m("ui.829e026917") && !target) return true
  if (dataType === 'number' || dataType === 'currency') {
    const numeric = typeof rawValue === 'number' ? rawValue : null
    if (numeric === null) return true
    if (operator === m("ui.829e026917")) {
      const min = target ? Number(target) : null
      const max = condition.value2?.trim() ? Number(condition.value2) : null
      if (min !== null && numeric < min) return false
      if (max !== null && numeric > max) return false
      return true
    }
    const targetNumber = Number(target)
    if (Number.isNaN(targetNumber)) return true
    if (operator === m("ui.3b640d635b")) return numeric > targetNumber
    if (operator === m("ui.485dfc8c1d")) return numeric >= targetNumber
    if (operator === m("ui.b0e3e65cad")) return numeric < targetNumber
    if (operator === m("ui.bff7719fdd")) return numeric <= targetNumber
    if (operator === m("ui.5b8a28abf8")) return numeric !== targetNumber
    return numeric === targetNumber
  }
  if (dataType === 'date') {
    const rawDate = typeof rawValue === 'string' ? rawValue : null
    if (rawDate === null) return true
    if (operator === m("ui.0747372e0d")) return rawDate < target
    if (operator === m("ui.e3abaf0c92")) return rawDate > target
    return rawDate === target
  }
  const text = String(rawValue ?? '').toLocaleLowerCase('vi')
  const needle = target.toLocaleLowerCase('vi')
  if (dataType === 'enum' || dataType === 'status') {
    return operator === m("ui.5b8a28abf8") ? text !== needle : text === needle
  }
  if (operator === m("ui.968ed4be99")) return !text.includes(needle)
  if (operator === m("ui.e0c298c256")) return text === needle
  if (operator === m("ui.a52f8cdd29")) return text.startsWith(needle)
  if (operator === m("ui.b75f71207f")) return text.endsWith(needle)
  return text.includes(needle)
}

// Shared filter evaluator — every table's matchesFilter() calls this
// instead of re-implementing condition logic, so ANY/ALL semantics and
// operator behavior stay identical across VIA/TKQC/BM/Page/Pixel.
export function evaluateAdvancedFilter(filter: ColumnFilterValue, rawValue: unknown, dataType: ColumnDataType = 'string'): boolean {
  if (!filter || filter.conditions.length === 0) return true
  const results = filter.conditions.map((condition) => evaluateCondition(condition, rawValue, dataType))
  return filter.match === 'all' ? results.every(Boolean) : results.some(Boolean)
}

function AdvancedFilterModal({ label, dataType, initial, onApply, onClose }: { label: string; dataType: ColumnDataType; initial: ColumnFilterValue; onApply: (value: ColumnFilterValue) => void; onClose: () => void }) {
  useAppLanguage();
  const operators = operatorsFor(dataType)
  const [match, setMatch] = useState<'any' | 'all'>(initial?.match ?? 'any')
  const [conditions, setConditions] = useState<FilterCondition[]>(initial?.conditions.length ? initial.conditions : [{ operator: operators[0], value: '' }])

  const updateCondition = (index: number, patch: Partial<FilterCondition>) => setConditions((current) => current.map((condition, i) => i === index ? { ...condition, ...patch } : condition))
  const addCondition = () => setConditions((current) => [...current, { operator: operators[0], value: '' }])
  const removeCondition = (index: number) => setConditions((current) => current.filter((_, i) => i !== index))

  const apply = () => {
    const cleaned = conditions.filter((condition) => condition.value.trim().length > 0)
    onApply(cleaned.length ? { match, conditions: cleaned } : null)
    onClose()
  }

  return createPortal(
    <div className="ads-advanced-filter-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="ads-advanced-filter-modal" role="dialog" aria-modal="true" aria-labelledby="ads-advanced-filter-title">
        <header>
          <Filter size={16} className="ads-advanced-filter-icon" aria-hidden="true" />
          <h2 id="ads-advanced-filter-title">{tx(label)}</h2>
          <button type="button" className="ads-advanced-filter-close" aria-label={t("ui.4823c4c66d")} onClick={onClose}><X size={16} /></button>
        </header>
        <label className="ads-advanced-filter-match">
          <span className="sr-only">{t("ui.0881e30dcb")}</span>
          <select aria-label={t("ui.0881e30dcb")} value={match} onChange={(event) => setMatch(event.target.value as 'any' | 'all')}>
            <option value="any">{t("ui.a7e48b7e6b")}</option>
            <option value="all">{t("ui.b1aefcf212")}</option>
          </select>
        </label>
        <div className="ads-advanced-filter-conditions">
          {tx(conditions.map((condition, index) => <div key={index} className={`ads-advanced-filter-condition${condition.operator === m("ui.829e026917") ? ' has-range' : ''}`}>
            <select aria-label={t("ui.8e2a68ee78")} value={condition.operator} onChange={(event) => updateCondition(index, { operator: event.target.value })}>
              {operators.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
            </select>
            <input aria-label={tx(condition.operator === m("ui.829e026917") ? m("ui.a95da1c38f") : m("ui.758f35415e"))} type={dataType === 'date' ? 'date' : dataType === 'number' || dataType === 'currency' ? 'number' : 'text'} value={condition.value} onChange={(event) => updateCondition(index, { value: event.target.value })} />
            {tx(condition.operator === m("ui.829e026917") && <input aria-label={t("ui.57564daa42")} type="number" value={condition.value2 ?? ''} onChange={(event) => updateCondition(index, { value2: event.target.value })} />)}
            <button type="button" aria-label={t("ui.56a8d49438")} disabled={conditions.length === 1} onClick={() => removeCondition(index)}><Trash2 size={14} /></button>
          </div>))}
        </div>
        <button type="button" className="ads-advanced-filter-add" onClick={addCondition}><Plus size={14} />{t("ui.90fedcff54")}</button>
        <footer>
          <button type="button" className="is-secondary" onClick={onClose}>{t("ui.34ca764caf")}</button>
          <button type="button" className="is-primary" onClick={apply}>{t("ui.1e948c5913")}</button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}

// Shared column-header dropdown (Batch Update Part E, filter builder
// upgraded in Correction Batch 2 Part C) — one component reused by every
// asset table (VIA/TKQC/BM/Page/Pixel), traced exact item order
// (references/remotes/adaccounts/897.0e915523.js): Lọc nâng cao → Bỏ lọc →
// (Đóng băng cột / Bỏ đóng băng cột) → Thấp đến cao → Cao đến thấp →
// Sắp xếp mặc định. Portaled + position:fixed, same pattern as the
// Actions/Tag popovers so it is never clipped by the table's own scroll
// container.
export function AdsProColumnMenu({ label, dataType, canFreeze, state, onSort, onFilterChange, onToggleFreeze }: ColumnMenuProps) {
  useAppLanguage();
  const [open, setOpen] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const recompute = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      // Clamp so the (fixed-width, 200px) menu never extends past the
      // right edge on narrow viewports.
      const left = Math.min(rect.left, window.innerWidth - 200 - 8)
      setPos({ top: rect.bottom + 4, left: Math.max(8, left) })
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [open])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const activeFilter = hasActiveFilter(state.filter)
  const activeSort = state.sortDirection !== null

  return <>
    <button ref={triggerRef} type="button" className="ads-column-menu-trigger" aria-label={tx(m("ui.fba6d36cb0", { 0: label }))} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <ChevronDown size={12} aria-hidden="true" />
    </button>
    {tx(open && createPortal(
      <div ref={menuRef} className="ads-column-menu" role="menu" aria-label={tx(m("ui.fba6d36cb0", { 0: label }))} style={{ top: pos.top, left: pos.left }}>
        <button type="button" role="menuitem" onClick={() => { setShowFilterModal(true); setOpen(false) }}><Filter size={14} />{t("ui.afa56ed43d")}</button>
        <button type="button" role="menuitem" disabled={!activeFilter} onClick={() => { onFilterChange(null); setOpen(false) }}><X size={14} />{t("ui.d89e6c532f")}</button>
        {tx(canFreeze && <button type="button" role="menuitem" onClick={() => { onToggleFreeze(); setOpen(false) }}>{state.frozen ? <Unlock size={14} /> : <Lock size={14} />}{tx(state.frozen ? m("ui.e1eb9d532a") : m("ui.5ce593ed5b"))}</button>)}
        <button type="button" role="menuitem" className={state.sortDirection === 'asc' ? 'is-active' : ''} onClick={() => { onSort('asc'); setOpen(false) }}><ArrowUpNarrowWide size={14} />{t("ui.38dfad6191")}</button>
        <button type="button" role="menuitem" className={state.sortDirection === 'desc' ? 'is-active' : ''} onClick={() => { onSort('desc'); setOpen(false) }}><ArrowDownWideNarrow size={14} />{t("ui.be5e610392")}</button>
        <button type="button" role="menuitem" disabled={!activeSort} onClick={() => { onSort(null); setOpen(false) }}><RotateCcw size={14} />{t("ui.add60f15be")}</button>
      </div>,
      document.body,
    ))}
    {tx(showFilterModal && <AdvancedFilterModal label={tx(label)} dataType={dataType} initial={state.filter} onApply={onFilterChange} onClose={() => setShowFilterModal(false)} />)}
  </>
}

// Correction Batch 3 Part B — shared column-resize handle, one component
// reused by every table (Part B: "KHÔNG viết 5 resize systems"). Lives at
// the header cell's right edge, deliberately a SEPARATE control from the
// reorder drag handle (Part B1/D2/D3): draggable={false} plus its own
// pointerdown stopPropagation/preventDefault keep it from ever starting the
// header's native HTML5 reorder drag or the browser's text-selection drag.
// Traced production (references/remotes/adaccounts/897.0e915523.js): drag
// commits width via a `column-resize`/"resize" event that persists it into
// config_column; double-click on the SAME handle resets that one column's
// width back to its own default via a separate "reset" action — reproduced
// here as onDoubleClick, distinct from the header menu's "Sắp xếp mặc định"
// (which only resets sort, confirmed NOT a layout-reset action). Min width
// floors at 60px (traced); non-frozen columns have no traced max, so the
// upper bound here is this clone's own generous practical ceiling, not a
// production-confirmed number.
export function ColumnResizeHandle({ width, minWidth, maxWidth, onResize, onResetWidth }: { width: number; minWidth: number; maxWidth: number; onResize: (width: number) => void; onResetWidth: () => void }) {
  useAppLanguage();
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!active) return
    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      onResize(Math.min(maxWidth, Math.max(minWidth, drag.startWidth + (event.clientX - drag.startX))))
    }
    const handleUp = () => { dragRef.current = null; setActive(false) }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    document.body.classList.add('is-resizing-column')
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      document.body.classList.remove('is-resizing-column')
    }
  }, [active, minWidth, maxWidth, onResize])

  const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    event.stopPropagation()
    event.preventDefault()
    dragRef.current = { startX: event.clientX, startWidth: width }
    setActive(true)
  }
  // Part B4: dragging is not the only way — arrow keys move width in fixed
  // steps. No richer keyboard UX invented beyond this since production's
  // own keyboard behavior for resize is not recoverable from the bundle.
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); onResize(Math.max(minWidth, width - 10)) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); onResize(Math.min(maxWidth, width + 10)) }
  }

  return <span
    className={`ads-column-resize-handle${active ? ' is-active' : ''}`}
    draggable={false}
    role="separator"
    aria-orientation="vertical"
    aria-label={t("ui.478ae56e93")}
    aria-valuenow={width}
    aria-valuemin={minWidth}
    aria-valuemax={maxWidth}
    tabIndex={0}
    onPointerDown={handlePointerDown}
    onDragStart={(event) => event.preventDefault()}
    onClick={(event) => event.stopPropagation()}
    onDoubleClick={(event) => { event.stopPropagation(); onResetWidth() }}
    onKeyDown={handleKeyDown}
    title={t("ui.c0f526ea3c")}
  />
}
