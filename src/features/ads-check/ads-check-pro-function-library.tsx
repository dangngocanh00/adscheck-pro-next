import { useAppLanguage, tx, t, m } from '@/i18n'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Check, ChevronUp, Circle, GripVertical, HelpCircle, Pin, Plus, Search, Settings, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { functionIcons, groupIcons } from './ads-check-pro-function-icons'
import { useAdsProDrawerFocus, useAdsProDrawerViewport } from './ads-check-pro-responsive-drawer'
import {
  functionKey, loadGroupOrder, orderStorageKeyByAsset, pinStorageKeyByAsset, resolveGroupOrder,
  type AdsAssetKey, type AdsFunctionDefinition, type FunctionGroup, type WorkflowMode,
} from './ads-check-pro-workspace-data'

const normalizeSearch = (value: string) => value.toLocaleLowerCase('vi')

function loadPinnedIds(storageKey: string): Set<string> {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return new Set()
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is string => typeof value === 'string'))
  } catch {
    return new Set()
  }
}

type FunctionLibraryProps = {
  asset: Exclude<AdsAssetKey, 'via'>
  assetLabel: string
  query: string
  onQueryChange: (value: string) => void
  groups: FunctionGroup[]
  selectedStepIds: string[]
  open: boolean
  workflowMode: WorkflowMode
  collapsedGroups: Set<string>
  onToggleGroup: (groupId: string) => void
  onClose: () => void
  onAdd: (fn: AdsFunctionDefinition, group: FunctionGroup) => void
  onRemove: (fn: AdsFunctionDefinition) => void
  onOpenWorkflowMode: () => void
  onAnnounce: (message: string, tone?: 'success' | 'info') => void
}

type FunctionRowViewProps = {
  fn: AdsFunctionDefinition
  selected: boolean
  pinned: boolean
  onAdd: () => void
  onRemove: () => void
  onTogglePin: () => void
  onOpenGuide: () => void
  rowRef?: (node: HTMLLIElement | null) => void
  rowStyle?: CSSProperties
  isDragging?: boolean
  handleProps?: Record<string, unknown>
}

// Pure row renderer, reused for both the draggable (SortableFunctionRow) and
// plain (search/pin-filter active — production disables drag there, see
// PlainFunctionRow) paths, so the two never drift apart.
function FunctionRowView({ fn, selected, pinned, onAdd, onRemove, onTogglePin, onOpenGuide, rowRef, rowStyle, isDragging, handleProps }: FunctionRowViewProps) {
  useAppLanguage();
  const ItemIcon = functionIcons[fn.icon] ?? Circle
  return <li
    ref={rowRef}
    style={rowStyle}
    className={`ads-function-row${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}`}
    role="button"
    tabIndex={0}
    aria-pressed={selected}
    aria-label={tx(fn.name)}
    onClick={onAdd}
    onKeyDown={(event) => {
      // Native keydown bubbles from a focused nested button (Guide, Pin,
      // the drag handle, the remove control) up to this row regardless of
      // that button's own click handler/stopPropagation — guard by target
      // so only the row's OWN focus can add via keyboard.
      if (event.target !== event.currentTarget) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      onAdd()
    }}
  >
    {/* Production's own tooltip for this handle ("Kéo để sắp xếp") shows
        regardless of whether dragging is actually enabled right now — kept
        exactly as traced, rather than swapping in an explanatory message
        when search/pin-filter disables it. */}
    <button
      type="button"
      className="ads-function-row-handle"
      title={t("ui.b0126b0d14")}
      aria-label={tx(m("ui.53599770d3", { 0: fn.name }))}
      onClick={(event) => event.stopPropagation()}
      {...handleProps}
    >
      <GripVertical size={13} />
    </button>
    <ItemIcon className="ads-function-item-icon" size={14} aria-hidden="true" />
    <span className="ads-function-row-label">{fn.name}</span>
    <button type="button" className="ads-function-guide-button" aria-label={t("ui.b788f1dfca")} onClick={(event) => { event.stopPropagation(); onOpenGuide() }}>
      <HelpCircle size={13} aria-hidden="true" />
    </button>
    <button
      type="button"
      className={`ads-function-row-pin${pinned ? ' is-pinned' : ''}`}
      title={tx(pinned ? m("ui.90e18e9ce6") : m("ui.cfef128ebe"))}
      aria-label={tx(pinned ? m("ui.7f7b444b20", { 0: fn.name }) : `Ghim ${fn.name}`)}
      aria-pressed={pinned}
      onClick={(event) => { event.stopPropagation(); onTogglePin() }}
    >
      <Pin size={13} aria-hidden="true" />
    </button>
    {tx(selected
      ? <button
          type="button"
          className="ads-function-row-trailing"
          aria-label={tx(m("ui.31eb7ee222", { 0: fn.name }))}
          onClick={(event) => { event.stopPropagation(); onRemove() }}
        >
          <Check size={14} className="ads-function-row-check" aria-hidden="true" />
          <X size={14} className="ads-function-row-remove" aria-hidden="true" />
        </button>
      : <Plus size={14} className="ads-function-row-add" aria-hidden="true" />)}
  </li>
}

type RowBehaviorProps = {
  fn: AdsFunctionDefinition
  selected: boolean
  pinned: boolean
  onAdd: () => void
  onRemove: () => void
  onTogglePin: () => void
  onOpenGuide: () => void
}

// Draggable row — handle-only drag initiator (production: SortableJS
// `handle: ".bm-tool-drag-handle"`, never the whole row), used only when
// dragging is actually enabled (not searching, pin filter off).
function SortableFunctionRow({ fn, ...rest }: RowBehaviorProps) {
  useAppLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: functionKey(fn) })
  return <FunctionRowView
    fn={fn}
    {...rest}
    rowRef={setNodeRef}
    rowStyle={{ transform: CSS.Transform.toString(transform), transition }}
    isDragging={isDragging}
    handleProps={{ ...attributes, ...listeners }}
  />
}

// Plain row — used while searching or while the pin filter is active.
// Production's own row template swaps to a non-draggable rendering in this
// exact case (confirmed: the `<draggable>` component is replaced by a plain
// button-row template whenever the search query is non-empty) — reordering
// a filtered subset would silently fail to persist a meaningful order, so
// the handle stays visible (with its usual tooltip) but inert.
function PlainFunctionRow({ fn, ...rest }: RowBehaviorProps) {
  useAppLanguage();
  return <FunctionRowView fn={fn} {...rest} />
}

export function AdsCheckProFunctionLibrary({ asset, assetLabel, query, onQueryChange: setQuery, groups, selectedStepIds, open, workflowMode, collapsedGroups, onToggleGroup, onClose, onAdd, onRemove, onOpenWorkflowMode, onAnnounce }: FunctionLibraryProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  const isDrawer = useAdsProDrawerViewport()
  useAdsProDrawerFocus(open && isDrawer, panelRef, onClose)
  const [guideFn, setGuideFn] = useState<AdsFunctionDefinition | null>(null)
  const guideDialogRef = useRef<HTMLElement>(null)
  useOverlayFocus(guideFn !== null, guideDialogRef, () => setGuideFn(null))

  // Per-function pin — production keys this PER ASSET TAB (see
  // pinStorageKeyByAsset), storing bare functionId (safe: each tab already
  // has its own key, so the 4 real cross-tab functionId collisions from
  // Round 2's audit can't leak in here). This component remounts on asset
  // switch (parent keys it by asset), so re-reading localStorage on mount
  // is sufficient to restore the right tab's pins — no extra effect needed.
  const pinStorageKey = pinStorageKeyByAsset[asset]
  const [pinnedIds, setPinnedIds] = useState(() => loadPinnedIds(pinStorageKey))
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  useEffect(() => {
    try { localStorage.setItem(pinStorageKey, JSON.stringify([...pinnedIds])) } catch { /* storage unavailable */ }
  }, [pinStorageKey, pinnedIds])

  // Function order — also per asset tab, but a DIFFERENT storage key/schema
  // than pin (see orderStorageKeyByAsset). Resolved once per mount (this
  // component remounts on asset switch already) by merging the canonical
  // catalog order with whatever custom order is stored, exactly like
  // production's own resolveGroupOrder ("eZ"). Kept as ONE piece of state
  // (not a separate "order ids" + "resolved list" pair) so reordering just
  // mutates this directly, mirroring production's single-source-of-truth
  // reactive list.
  const orderStorageKey = orderStorageKeyByAsset[asset]
  const [resolvedGroups, setResolvedGroups] = useState<Record<string, AdsFunctionDefinition[]>>(() => {
    const stored = loadGroupOrder(orderStorageKey)
    const result: Record<string, AdsFunctionDefinition[]> = {}
    for (const group of groups) result[group.id] = resolveGroupOrder(group.functions, stored[group.id])
    return result
  })
  // Persisted ONLY from an actual drag end (see handleDragEnd) — never from
  // a plain effect keyed on `resolvedGroups`, which would also fire once on
  // mount and write the canonical (unreordered) order the instant the panel
  // opens. Production itself only writes on its SortableJS `onEnd` event,
  // never merely on render/mount.
  const persistGroupOrder = (next: Record<string, AdsFunctionDefinition[]>) => {
    const map = Object.fromEntries(Object.entries(next).map(([groupId, fns]) => [groupId, fns.map((fn) => fn.functionId)]))
    try { localStorage.setItem(orderStorageKey, JSON.stringify(map)) } catch { /* storage unavailable */ }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const togglePinned = (fn: AdsFunctionDefinition) => {
    const id = fn.functionId
    const wasPinned = pinnedIds.has(id)
    const next = new Set(pinnedIds)
    if (wasPinned) next.delete(id)
    else next.add(id)
    // Every state update happens here, in the event handler itself — never
    // inside a setState updater callback (calling onAnnounce, which sets
    // state on a distant ancestor, from inside one triggers React's "Cannot
    // update a component while rendering a different component" warning).
    setPinnedIds(next)
    if (next.size === 0) setShowPinnedOnly(false)
    onAnnounce(wasPinned ? m("ui.90e18e9ce6") : m("ui.0a7a2536e0"), 'success')
  }
  const toggleShowPinnedOnly = () => {
    if (pinnedIds.size === 0) return
    setShowPinnedOnly((current) => !current)
  }

  const normalizedQuery = normalizeSearch(query.trim())
  const isSearching = normalizedQuery.length > 0
  // Dragging is disabled whenever the list is being filtered — confirmed
  // for search (production swaps to PlainFunctionRow's exact template when
  // its search query is non-empty); extended the same way to the pin
  // filter since reordering a filtered subset is equally ambiguous and the
  // static bundle doesn't disambiguate that specific combination — a
  // deliberate, documented conservative choice, not a guess dressed up as
  // a trace.
  const canDrag = !isSearching && !showPinnedOnly

  // Filter pipeline traced from production's own computed (references/
  // remotes/adaccounts/436.e5c83aa9.js): search AND pin-filter both narrow
  // functions within a group, then groups left with zero functions are
  // dropped entirely — a group with no pinned function disappears while
  // the filter is active, it isn't just visually thinned out.
  const visibleGroups = useMemo(() => groups.map((group) => {
    const orderedFunctions = resolvedGroups[group.id] ?? group.functions
    return {
      group,
      orderedFunctions,
      visibleFunctions: orderedFunctions.filter((fn) =>
        (!normalizedQuery || normalizeSearch(`${group.label} ${fn.name}`).includes(normalizedQuery)) &&
        (!showPinnedOnly || pinnedIds.has(fn.functionId))),
    }
  }).filter(({ visibleFunctions }) => visibleFunctions.length > 0), [groups, resolvedGroups, normalizedQuery, showPinnedOnly, pinnedIds])

  const handleDragEnd = (groupId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const list = resolvedGroups[groupId]
    if (!list) return
    const oldIndex = list.findIndex((fn) => functionKey(fn) === active.id)
    const newIndex = list.findIndex((fn) => functionKey(fn) === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const next = { ...resolvedGroups, [groupId]: arrayMove(list, oldIndex, newIndex) }
    setResolvedGroups(next)
    persistGroupOrder(next)
  }

  const workflowModeLabel = workflowMode === 'single' ? m("ui.00ffdf54f8") : m("ui.36ecfc9067")
  const pinnedCount = pinnedIds.size
  const pinFilterTooltip = pinnedCount === 0
    ? m("ui.9f4560dc61")
    : showPinnedOnly ? m("ui.7f3c15a877") : m("ui.9cd30c2451")

  // The Guide dialog renders as a SIBLING of <aside>, not nested inside it —
  // useAdsProDrawerFocus's Escape handler (drawer/mobile viewports only)
  // deliberately no-ops when a DIFFERENT modal is open and NOT contained in
  // the panel, so a Guide-dialog Escape only closes the Guide, not also the
  // whole Function Store panel underneath it.
  return <>
  <aside ref={panelRef} id="ads-pro-function-library" className={`ads-function-library${open ? ' is-open' : ''}`} role={isDrawer && open ? 'dialog' : undefined} aria-labelledby="ads-function-library-title">
    {/* Non-VIA production header is [WorkflowModeTrigger] … [collapse] — no
        <h2> title. */}
    <header className="ads-panel-heading">
      <span className="sr-only" id="ads-function-library-title">{t("ui.495881f617")}{" "}{tx(assetLabel)}</span>
      <button type="button" className="ads-function-workflow-mode-trigger" aria-label={tx(workflowModeLabel)} onClick={onOpenWorkflowMode}>{tx(workflowModeLabel)}<Settings size={14} /></button>
      <button type="button" aria-label={t("ui.c32fd13f6c")} data-autofocus={isDrawer ? true : undefined} onClick={onClose}><X size={18} /></button>
    </header>
    <div className="ads-function-search-row">
      <label className="ads-function-search">
        <Search size={17} />
        <input aria-label={t("ui.ecebbbc337")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("ui.6671928637")} />
        {query && <button type="button" className="ads-function-search-clear" aria-label={t("ui.d8f702c3e6")} onClick={() => setQuery('')}><X size={14} /></button>}
      </label>
      <button
        type="button"
        className={`ads-function-pin-filter${showPinnedOnly ? ' is-active' : ''}`}
        disabled={pinnedCount === 0}
        title={tx(pinFilterTooltip)}
        aria-label={tx(pinFilterTooltip)}
        aria-pressed={showPinnedOnly}
        onClick={toggleShowPinnedOnly}
      >
        <Pin size={14} aria-hidden="true" />
        {tx(pinnedCount > 0 && <span className="ads-function-pin-count-badge">{pinnedCount}</span>)}
      </button>
    </div>
    <div className="ads-function-groups">
      {visibleGroups.map(({ group, orderedFunctions, visibleFunctions }) => {
        const GroupIcon = groupIcons[group.id]
        // Production auto-opens every matching group while searching,
        // regardless of its own manually-collapsed state — the pin filter
        // does NOT auto-open groups (only search does; traced, not
        // assumed). Collapse itself is now the shared, persisted state
        // passed down from the workspace (see Round 4 notes) — search's
        // temporary override never touches it.
        const isCollapsed = !isSearching && collapsedGroups.has(group.id)
        const selectedCount = orderedFunctions.filter((fn) => selectedStepIds.includes(functionKey(fn))).length
        const ids = visibleFunctions.map((fn) => functionKey(fn))
        return <section key={group.id} className={`ads-function-group is-${group.id}`}>
          <button className="ads-function-group-heading" type="button" aria-expanded={!isCollapsed} aria-controls={`ads-functions-${group.id}`} onClick={() => onToggleGroup(group.id)}>
            <GroupIcon size={15} /><strong>{tx(group.label)}</strong><span>{selectedCount}/{orderedFunctions.length}</span><ChevronUp size={14} />
          </button>
          {!isCollapsed && (canDrag
            ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(group.id, event)}>
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  <ul id={`ads-functions-${group.id}`}>{visibleFunctions.map((fn) => {
                    const key = functionKey(fn)
                    return <SortableFunctionRow
                      key={key}
                      fn={fn}
                      selected={selectedStepIds.includes(key)}
                      pinned={pinnedIds.has(fn.functionId)}
                      onAdd={() => onAdd(fn, group)}
                      onRemove={() => onRemove(fn)}
                      onTogglePin={() => togglePinned(fn)}
                      onOpenGuide={() => setGuideFn(fn)}
                    />
                  })}</ul>
                </SortableContext>
              </DndContext>
            : <ul id={`ads-functions-${group.id}`}>{visibleFunctions.map((fn) => {
                const key = functionKey(fn)
                return <PlainFunctionRow
                  key={key}
                  fn={fn}
                  selected={selectedStepIds.includes(key)}
                  pinned={pinnedIds.has(fn.functionId)}
                  onAdd={() => onAdd(fn, group)}
                  onRemove={() => onRemove(fn)}
                  onTogglePin={() => togglePinned(fn)}
                  onOpenGuide={() => setGuideFn(fn)}
                />
              })}</ul>)}
        </section>
      })}
      {tx(visibleGroups.length === 0 && <p className="ads-function-empty">{t("ui.12df979860")}</p>)}
    </div>
  </aside>
  {guideFn && <div className="ads-pro-local-dialog-layer">
    <section ref={guideDialogRef} className="ads-pro-local-dialog" role="dialog" aria-modal="true" aria-labelledby="ads-function-guide-title">
      <button className="ads-pro-local-dialog-close" type="button" aria-label={t("ui.d2b73ab2ad")} onClick={() => setGuideFn(null)}><X size={18} /></button>
      <span aria-hidden="true"><HelpCircle size={23} /></span>
      <h2 id="ads-function-guide-title">{t("ui.6ee9b8bc82")}</h2>
      <p>{guideFn.name}</p>
      {guideFn.videoUrl
        ? <footer><a className="is-primary" href={guideFn.videoUrl} target="_blank" rel="noreferrer">{t("ui.4c8bc5bf66")}</a></footer>
        : <p>{t("ui.eec3ba5c04")}</p>}
    </section>
  </div>}
  </>
}
