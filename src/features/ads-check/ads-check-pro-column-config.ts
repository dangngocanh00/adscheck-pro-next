import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react'

// Correction Batch 2 Part D5/D6 — traced production persistence
// (references/remotes/adaccounts/897.0e915523.js): a single "config_column"
// localStorage key holds one entry per table (`config_${table_info.name}`
// → {field,width,frozen}[]) — the SAME array both restores column ORDER and
// FREEZE state on reload. Shared here so VIA/TKQC/BM/Page/Pixel all persist
// column order + freeze identically (Part A), instead of five separate
// re-implementations.
//
// Correction Batch 3 Part B/E: the same `width` field now also carries a
// user-driven RESIZE override (previously always just the fixed default).
// Migration safety: old entries have no meaningful width override intent —
// they were only ever written as an echo of the default — so on load we
// only treat a stored width as an override when it differs from that
// column's OWN default by more than a px of float noise; otherwise the
// column falls back to its live default, so a schema/default-width change
// shipped in a later round still takes effect for users with old storage.
//
// VIA Audit Batch 1 Part C13: `hidden` is a NEW 4th field added to this
// same persisted entry (production's own visibility field name was not
// recoverable from the bundle — see the Column Settings modal's header
// comment for the research trail). Migration: an entry from before this
// field existed simply has `hidden` absent, which reads as `false`
// (default-visible) below — never a corrupt/hidden-by-default column.
export type PersistedColumnEntry = { field: string; width: number; frozen: boolean; hidden?: boolean }
// Shared Summary Geometry Correction — the checkbox column's width was
// previously a "44" literal duplicated independently across every table's
// own colgroup/CSS/summary-span markup (and the `leadingWidth` argument
// passed into this hook). One of those copies (BM's own `th:first-child`
// CSS rule, since removed) had silently drifted to 56 — a real, concrete
// leading-offset mismatch between header and body/summary for that one
// table. Exporting ONE constant and using it everywhere a checkbox width
// is needed (colgroup, useColumnConfig's leadingWidth, the summary's own
// checkbox span) removes the duplication that let that drift happen.
export const CHECKBOX_COLUMN_WIDTH = 44
// Summary Above Pagination — both rows share this one already-approved
// control height (matches the pagination row's own existing height), so
// Summary's sticky `bottom` offset and the scroll container's reserved
// bottom padding both derive from the SAME two constants instead of a
// separately guessed number.
export const PAGINATION_ROW_HEIGHT = 38
export const SUMMARY_ROW_HEIGHT = 38
const STORAGE_KEY = 'config_column'
const DEFAULT_MIN_WIDTH = 60
// Traced production: no upper bound exists for a non-frozen column's
// resize. This clone still applies a generous practical ceiling (rather
// than truly unbounded) purely to stop a stray drag from producing a
// broken multi-thousand-pixel column — not a production-confirmed number.
const DEFAULT_MAX_WIDTH = 900

function readConfig(): Record<string, PersistedColumnEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch { return {} }
}
function writeConfig(tableName: string, entries: PersistedColumnEntry[]) {
  try {
    const current = readConfig()
    current[`config_${tableName}`] = entries
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch { /* storage unavailable */ }
}
function readTableEntries(tableName: string): PersistedColumnEntry[] | null {
  const entries = readConfig()[`config_${tableName}`]
  return Array.isArray(entries) ? entries : null
}

// TKQC Round 1, Shared Rule #1 (all 5 assets) — freezing a column moves it
// into the contiguous frozen group at the START of the table: immediately
// after the last already-frozen column (position 0 if none are frozen
// yet). Exported so both the live header dropdown (useColumnConfig below)
// and the Column Settings modal's own draft-freeze toggle apply the exact
// same rule instead of two reimplementations drifting apart. Unfreezing
// deliberately does NOT reorder anything (see toggleFreeze below for why).
export function moveIntoFrozenPrefix<K extends string>(order: K[], frozenKeys: ReadonlySet<K>, key: K): K[] {
  const withoutKey = order.filter((candidate) => candidate !== key)
  let insertAt = 0
  while (insertAt < withoutKey.length && frozenKeys.has(withoutKey[insertAt])) insertAt++
  const next = withoutKey.slice()
  next.splice(insertAt, 0, key)
  return next
}

type ColumnDefWithBounds = { minWidth?: number; maxWidth?: number; defaultFrozen?: boolean; lockVisible?: boolean; lockOrder?: boolean }

// BM Round 1 / Shared Rule #2-3 (all 5 tabs) — STT is not merely
// "defaultFrozen", it is a HARD, permanent invariant: always right after
// the checkbox, always frozen, never hideable, never reorderable, and no
// other column may ever land before it. `lockOrder` marks that ONE column
// (STT) per schema; the hook below enforces it at every mutation point
// (init-from-storage, reorder, toggleFreeze, applyColumnSettings) so a
// corrupted/pre-this-rule persisted config is normalized back into a valid
// state rather than trusted as-is.
function moveLockedFirst<K extends string>(order: K[], lockedKey: K | undefined): K[] {
  if (!lockedKey || !order.includes(lockedKey)) return order
  return [lockedKey, ...order.filter((key) => key !== lockedKey)]
}

export function useColumnConfig<K extends string, C extends { key: K; width: number } & ColumnDefWithBounds>(tableName: string, defaultColumns: C[], leadingWidth: number) {
  const lockedOrderKey = defaultColumns.find((column) => column.lockOrder)?.key
  const [columnOrder, setColumnOrder] = useState<K[]>(() => {
    const stored = readTableEntries(tableName)
    const defaultKeys = defaultColumns.map((column) => column.key)
    if (!stored) return moveLockedFirst(defaultKeys, lockedOrderKey)
    // Malformed/unknown/hidden fields fall back safely (Round 4 precedent):
    // keep only fields that still exist, then append any real column the
    // stored config doesn't know about yet (a newly added column) at the end.
    const validKeys = new Set(defaultKeys)
    const storedKeys = stored.map((entry) => entry.field as K).filter((key) => validKeys.has(key))
    const missing = defaultKeys.filter((key) => !storedKeys.includes(key))
    return moveLockedFirst([...storedKeys, ...missing], lockedOrderKey)
  })
  const [frozenKeys, setFrozenKeys] = useState<Set<K>>(() => {
    const stored = readTableEntries(tableName)
    // No stored config yet — seed from each column's own traced default
    // freeze state (Correction Batch 3 Part C5: production's STT column
    // definition ships with `frozen:true` out of the box).
    const initial = !stored
      ? new Set(defaultColumns.filter((column) => column.defaultFrozen).map((column) => column.key))
      : new Set(stored.filter((entry) => entry.frozen && defaultColumns.some((column) => column.key === entry.field)).map((entry) => entry.field as K))
    if (lockedOrderKey) initial.add(lockedOrderKey)
    return initial
  })
  // VIA Audit Batch 1 Part C6/C13 — column VISIBILITY, the 4th persisted
  // field. Columns flagged `lockVisible` OR `lockOrder` (checkbox/STT/Hành
  // động — never part of `defaultColumns` in the first place, so this only
  // matters for genuine data columns a future table might lock) can never
  // enter this set even from malformed/tampered storage.
  const [hiddenKeys, setHiddenKeys] = useState<Set<K>>(() => {
    const stored = readTableEntries(tableName)
    const lockedKeys = new Set(defaultColumns.filter((column) => column.lockVisible || column.lockOrder).map((column) => column.key))
    if (!stored) return new Set()
    const validKeys = new Set(defaultColumns.map((column) => column.key))
    return new Set(stored.filter((entry) => entry.hidden && validKeys.has(entry.field as K) && !lockedKeys.has(entry.field as K)).map((entry) => entry.field as K))
  })
  // Part E: only an actual width DIFFERENCE from the column's own current
  // default is treated as a real user override — a stored width that just
  // echoes the default (every entry written before Part B's resize existed)
  // is discarded here, so a later default-width change always takes effect
  // for pre-Part-B storage instead of freezing users onto a stale number.
  const [widthOverrides, setWidthOverrides] = useState<Partial<Record<K, number>>>(() => {
    const stored = readTableEntries(tableName)
    if (!stored) return {}
    const defaultByKey = new Map(defaultColumns.map((column) => [column.key, column.width]))
    const overrides: Partial<Record<K, number>> = {}
    for (const entry of stored) {
      const key = entry.field as K
      const defaultWidth = defaultByKey.get(key)
      if (defaultWidth === undefined) continue
      if (typeof entry.width !== 'number' || !Number.isFinite(entry.width) || entry.width <= 0) continue
      if (Math.abs(entry.width - defaultWidth) < 1) continue
      overrides[key] = entry.width
    }
    return overrides
  })

  const boundsByKey = useMemo(() => new Map(defaultColumns.map((column) => [column.key, { min: column.minWidth ?? DEFAULT_MIN_WIDTH, max: column.maxWidth ?? DEFAULT_MAX_WIDTH }])), [defaultColumns])
  const clampWidth = useCallback((key: K, width: number): number => {
    const bounds = boundsByKey.get(key) ?? { min: DEFAULT_MIN_WIDTH, max: DEFAULT_MAX_WIDTH }
    return Math.min(bounds.max, Math.max(bounds.min, Math.round(width)))
  }, [boundsByKey])
  // Resolved width per column: the clamped override if the user has
  // resized it, else the column's own live default — never a stale copy.
  // `allOrderedColumns` keeps EVERY column (incl. hidden) for the Column
  // Settings modal; `orderedColumns` (visible only) is what the real
  // table's header/body/footer/colgroup render.
  const allOrderedColumns = useMemo(() => columnOrder.map((key) => {
    const column = defaultColumns.find((candidate) => candidate.key === key)
    if (!column) return undefined
    const override = widthOverrides[key]
    return override === undefined ? column : { ...column, width: clampWidth(key, override) }
  }).filter((column): column is C => Boolean(column)), [columnOrder, defaultColumns, widthOverrides, clampWidth])
  const orderedColumns = useMemo(() => allOrderedColumns.filter((column) => !hiddenKeys.has(column.key)), [allOrderedColumns, hiddenKeys])

  useEffect(() => {
    const entries: PersistedColumnEntry[] = allOrderedColumns.map((column) => ({ field: column.key, width: column.width, frozen: frozenKeys.has(column.key), hidden: hiddenKeys.has(column.key) }))
    writeConfig(tableName, entries)
  }, [tableName, allOrderedColumns, frozenKeys, hiddenKeys])

  // BM Round 1 Shared Rule #2/3 — the locked column (STT) can never be
  // dragged, and nothing can ever be dropped ON it either (that would push
  // it out of first place), so both sides of a reorder are guarded.
  const reorder = (fromKey: K, toKey: K) => {
    if (lockedOrderKey && (fromKey === lockedOrderKey || toKey === lockedOrderKey)) return
    setColumnOrder((current) => {
      const next = current.slice()
      const fromIndex = next.indexOf(fromKey)
      const toIndex = next.indexOf(toKey)
      if (fromIndex === -1 || toIndex === -1) return current
      next.splice(fromIndex, 1)
      next.splice(toIndex, 0, fromKey)
      return next
    })
  }
  // TKQC Round 1, Shared Rule #1: freezing moves the column into the
  // contiguous frozen prefix (see moveIntoFrozenPrefix above). Unfreezing
  // leaves the column order untouched — no production evidence was found
  // for whether unfreeze restores an earlier position or keeps the
  // current one, so the safer, non-invented choice (preserve current
  // position) is implemented; flagged explicitly in the batch report.
  //
  // BM Round 1 Shared Rule #3 — the locked column (STT) can never be
  // unfrozen; this is a no-op for it (the UI also hides its freeze menu
  // item entirely, this is the data-layer backstop for that).
  const toggleFreeze = (key: K) => {
    if (key === lockedOrderKey) return
    const willFreeze = !frozenKeys.has(key)
    setFrozenKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    if (willFreeze) setColumnOrder((current) => moveIntoFrozenPrefix(current, frozenKeys, key))
  }
  const toggleHidden = (key: K) => setHiddenKeys((current) => {
    const column = defaultColumns.find((candidate) => candidate.key === key)
    if (column?.lockVisible || column?.lockOrder) return current
    const next = new Set(current)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
  // Correction Batch 3 Part B — width lives in the SAME persisted entry as
  // order/freeze (Part B11), so a resize immediately recalculates
  // frozenOffsets below (Part B9) with no separate recompute step needed.
  const resizeColumn = (key: K, width: number) => setWidthOverrides((current) => ({ ...current, [key]: clampWidth(key, width) }))
  // Traced production: double-click on a column's own resize handle resets
  // JUST that column back to its default width (Part B12) — distinct from
  // "Sắp xếp mặc định", which only resets sort.
  const resetColumn = (key: K) => setWidthOverrides((current) => {
    if (!(key in current)) return current
    const next = { ...current }
    delete next[key]
    return next
  })
  const minWidthFor = (key: K) => boundsByKey.get(key)?.min ?? DEFAULT_MIN_WIDTH
  const maxWidthFor = (key: K) => boundsByKey.get(key)?.max ?? DEFAULT_MAX_WIDTH

  // VIA Audit Batch 1 Part C5/C12 — a single bulk commit used by the
  // Column Settings modal's "Lưu tùy chỉnh": the modal edits its own
  // PENDING draft (order/frozen/hidden) locally and only calls this once,
  // on Save, to apply all three at once. Direct header interactions
  // (drag-reorder, the column menu's freeze toggle, resize) stay
  // immediate/live as before — this is purely the modal's own transaction
  // boundary, not a second source of truth.
  const applyColumnSettings = (order: K[], frozen: Set<K>, hidden: Set<K>) => {
    setColumnOrder(moveLockedFirst(order, lockedOrderKey))
    if (lockedOrderKey) {
      const normalizedFrozen = new Set(frozen)
      normalizedFrozen.add(lockedOrderKey)
      setFrozenKeys(normalizedFrozen)
      const normalizedHidden = new Set(hidden)
      normalizedHidden.delete(lockedOrderKey)
      setHiddenKeys(normalizedHidden)
    } else {
      setFrozenKeys(frozen)
      setHiddenKeys(hidden)
    }
  }

  // Proper multi-column freeze (Part D5) — cumulative sticky `left` offsets
  // computed in COLUMN ORDER (not toggle order) using each column's
  // RESOLVED (post-resize) width, matching production's own frozen-column
  // iteration. Replaces the old single fixed-offset CSS rule. Iterating
  // `orderedColumns` (visible only) means a hidden-but-frozen column simply
  // never contributes an offset — no blank sticky gap (Part C11).
  const frozenOffsets = useMemo(() => {
    const offsets = new Map<K, number>()
    let running = leadingWidth
    for (const column of orderedColumns) {
      if (!frozenKeys.has(column.key)) continue
      offsets.set(column.key, running)
      running += column.width
    }
    return offsets
  }, [orderedColumns, frozenKeys, leadingWidth])
  // BM Round 1 Shared Rule #6 — the frozen/scrollable boundary shadow goes
  // on whichever frozen column is CLOSEST to the scrollable region (i.e.
  // the last one in column order, not the last one frozen chronologically).
  // `frozenOffsets` is built by iterating `orderedColumns` in order, so a
  // Map's own insertion order already gives us this for free.
  const lastFrozenKey = useMemo(() => {
    let last: K | null = null
    for (const key of frozenOffsets.keys()) last = key
    return last
  }, [frozenOffsets])

  // Shared Summary Alignment — the ONE resolved total width every table
  // using this hook must pin its own `<table>` element to (see each
  // table's own header comment for why). Computed once here, from the
  // SAME `orderedColumns`/`leadingWidth` basis as `frozenOffsets` above,
  // so there is a single source of truth for column geometry instead of
  // each table (TKQC/BM/Page/Pixel) re-deriving its own sum independently.
  // Without this, the shared `.ads-pro-table { width: 100% }` CSS rule
  // combined with `table-layout: fixed` lets the browser proportionally
  // stretch every <col> past its declared px width whenever the viewport
  // is wider than the table's own natural content width — while a
  // separate flex-based footer summary row never stretches past each
  // column's literal resolved width, drifting the two apart.
  const totalWidth = useMemo(() => leadingWidth + orderedColumns.reduce((sum, column) => sum + column.width, 0), [orderedColumns, leadingWidth])

  return {
    orderedColumns, allOrderedColumns, frozenKeys, hiddenKeys, frozenOffsets, lastFrozenKey, lockedOrderKey, totalWidth,
    toggleFreeze, toggleHidden, reorder, resizeColumn, resetColumn, minWidthFor, maxWidthFor, applyColumnSettings,
  }
}

// Shared Table Scroll Sync — TKQC is the confirmed-correct reference
// implementation (visually verified: column alignment, scroll movement,
// and frozen-column stability all match the table). BM/Page/Pixel
// previously re-implemented this same mechanism as separate copies in
// their own files — identical in every line I could find on inspection,
// yet still reported as visually wrong. Rather than trust three parallel
// copies to stay byte-identical forever (a real risk: BM's own
// `is-empty th:first-child` checkbox-width rule DID silently drift out of
// sync with everything else in an earlier round), this hook is now the
// ONE place the mechanism lives — TKQC/BM/Page/Pixel all call this exact
// function instead of redeclaring their own refs/state/effect/handler.
// `scrollRef` goes on the table's own `.ads-pro-table-scroll` container;
// `footerTrackRef` goes on the summary row; `viewportWidth` (measured via
// ResizeObserver off the scroll container's REAL clientWidth — which
// `overflow:auto` narrows by its vertical scrollbar gutter) is applied as
// that summary row's own `width`, so both containers share the exact same
// max valid scrollLeft; `handleTableScroll` is the one thing that ever
// moves the summary — a real `scrollLeft` write, never a transform.
export function useTableScrollSync() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const footerTrackRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setViewportWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const handleTableScroll = (event: UIEvent<HTMLDivElement>) => {
    if (footerTrackRef.current) footerTrackRef.current.scrollLeft = event.currentTarget.scrollLeft
  }
  return { scrollRef, footerTrackRef, viewportWidth, handleTableScroll }
}
