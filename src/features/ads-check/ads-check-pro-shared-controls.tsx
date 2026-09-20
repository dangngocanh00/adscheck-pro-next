import { m, useAppLanguage, tx, t } from '@/i18n'
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ALargeSmall, ChevronDown, Columns3, Download, Eye, EyeOff, FolderOpen,
  History, Loader2, MoreHorizontal, PanelRightOpen, Pencil, RefreshCw, Search, Settings, SlidersHorizontal, Trash2,
} from 'lucide-react'
import { useAdsProDrawerFocus, useAdsProDrawerViewport } from './ads-check-pro-responsive-drawer'
import type { AdsAssetKey, AdsAssetTab } from './ads-check-pro-workspace-data'
import { AdsProCurrencyFilterButton, type TkqcCurrencyFilterValue } from './ads-check-pro-tkqc-currency-filter'
import { AdsProTkqcDateRangeTrigger } from './ads-check-pro-tkqc-date-range-picker'
import { DEFAULT_TKQC_DATE_RANGE, type TkqcDateRange } from './ads-check-pro-tkqc-date-range'

// Shared #19 — "Tải {asset} ({relative time})" for TKQC/BM/Page/Pixel.
// Computed from the actual stored per-asset lastLoadedAt (never a
// hardcoded "1 ngày trước"/"6 ngày trước" string); re-evaluated on the
// existing 60s tick below so it stays live without a page reload.
function formatRelativeLoadTime(lastLoadedAt: number): string {
  const diffMs = Date.now() - lastLoadedAt
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diffMs < minute) return m("ui.332d45e4eb")
  if (diffMs < hour) return m("ui.2f2620d60c", { 0: Math.floor(diffMs / minute) })
  if (diffMs < day) return m("ui.4cc52a9e75", { 0: Math.floor(diffMs / hour) })
  return m("ui.a6a27b2673", { 0: Math.floor(diffMs / day) })
}

// Shared Toolbar Eye Correction — ONE component renders the toolbar's ID-
// visibility Eye for every asset that has one (TKQC/BM/Page/Pixel); Pixel
// is the visual reference (same Eye/EyeOff icon, size, alignment,
// active-state treatment). The only per-asset difference is WHICH id
// field it targets and its own masked/onToggle state — never separate
// markup. This was previously duplicated by a second, unrelated
// "availability" toggle button that also happened to use an eye-shaped
// icon (EyeClosed) sitting right next to it; that button has been removed
// from the toolbar entirely (see the `secondaryActions` array below) so
// each of these 4 tabs renders exactly one Eye control.
function AdsProIdMaskButton({ assetLabel, masked, onToggle }: { assetLabel: string; masked: boolean; onToggle: () => void }) {
  useAppLanguage();
  return <button className={`ads-pro-icon-button${masked ? ' is-active' : ''}`} type="button" aria-label={tx(masked ? m("ui.18e0c56b99", { 0: assetLabel }) : m("ui.7dbaea8ab5", { 0: assetLabel }))} aria-pressed={masked} onClick={onToggle}>
    {masked ? <EyeOff size={17} /> : <Eye size={17} />}
  </button>
}

type FolderPanelProps = {
  asset: AdsAssetKey
  folders: string[]
  counts: Record<string, number>
  selected: string
  open: boolean
  onSelect: (folder: string) => void
  onAdd: () => void
  onRename: (folder: string, nextName: string) => void
  onDelete: (folder: string) => void
  onClose: () => void
  onOpen: () => void
}

export function AdsCheckProFolderPanel({ asset, folders, counts, selected, open, onSelect, onAdd, onRename, onDelete, onClose, onOpen }: FolderPanelProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [menuFolder, setMenuFolder] = useState<string | null>(null)
  const [renamePanelFolder, setRenamePanelFolder] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const isDrawer = useAdsProDrawerViewport()
  useAdsProDrawerFocus(open && isDrawer, panelRef, onClose)
  const assetLabel = asset === 'ad-account' ? t("ui.108854e9fd") : asset === 'business' ? 'BM' : asset === 'via' ? 'VIA' : asset[0].toUpperCase() + asset.slice(1)
  const allFolder = m("ui.f7a578dcbd")

  useEffect(() => {
    if (!renamePanelFolder) return
    renameInputRef.current?.focus()
    renameInputRef.current?.select()
  }, [renamePanelFolder])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setMenuFolder(null)
        setRenamePanelFolder(null)
        setRenameError(null)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (renamePanelFolder) {
        setRenamePanelFolder(null)
        setRenameValue('')
        setRenameError(null)
      }
      setMenuFolder(null)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [renamePanelFolder])

  const finishRename = () => {
    if (!renamePanelFolder) return
    const nextName = renameValue.trim()
    if (!nextName) { setRenameError(t("ui.f1a0d9e504")); return }
    if (folders.some((folder) => folder !== renamePanelFolder && folder.toLocaleLowerCase('vi') === nextName.toLocaleLowerCase('vi'))) { setRenameError(t("ui.9c202d245f")); return }
    if (nextName !== renamePanelFolder) onRename(renamePanelFolder, nextName)
    setRenamePanelFolder(null)
    setRenameValue('')
    setRenameError(null)
  }

  // Collapsed = a persistent mini rail (production's own
  // .folder-panel--collapsed, exact width 84px), never fully hidden — only
  // the desktop/grid layout uses this; the mobile drawer overlay (isDrawer)
  // still hides entirely via CSS when closed, unaffected by this branch.
  // Batch Update Part C: production renders the FULL folder list here (not
  // just the active one) — each row compact (icon + truncated label),
  // active folder highlighted, clicking any row switches it without
  // re-expanding the rail.
  if (!open) {
    return <aside ref={panelRef} id="ads-pro-folders" className="ads-pro-folders is-collapsed" aria-label={tx(m("ui.ac35ad267e", { 0: assetLabel }))}>
      <header>
        <FolderOpen size={14} aria-hidden="true" />
        <button type="button" aria-label={t("ui.44099ac803")} onClick={onOpen}>»</button>
      </header>
      <nav className="ads-pro-folders-mini-list" aria-label={t("ui.f46b336ffa")}>
        {folders.map((folder) => <button key={folder} type="button" className={`ads-pro-folders-mini-row${selected === folder ? ' ads-pro-folders-mini-active' : ''}`} aria-pressed={selected === folder} title={tx(folder)} onClick={() => onSelect(folder)}>
          <FolderOpen size={14} aria-hidden="true" /><span>{tx(folder)}</span>
        </button>)}
      </nav>
      <button className="ads-folder-add ads-folder-add-mini" type="button" aria-label={t("ui.b8b6c4a493")} onClick={onAdd}>+</button>
    </aside>
  }

  return <aside ref={panelRef} id="ads-pro-folders" className="ads-pro-folders is-open" role={isDrawer ? 'dialog' : undefined} aria-labelledby="ads-pro-folders-title">
    <header>
      <h2 id="ads-pro-folders-title" aria-label={tx(m("ui.d81a268fd7", { 0: assetLabel }))}>{t("ui.65eb1d74c0")}</h2>
      <button type="button" aria-label={t("ui.30df2ce4cd")} data-autofocus={isDrawer ? true : undefined} onClick={onClose}>«</button>
    </header>
    <nav aria-label={t("ui.e2ff5e2c92")}>
      {folders.map((folder) => {
        const isSelected = selected === folder
        const isSystemFolder = folder === allFolder
        return <div key={folder} className="ads-pro-folder-row">
          <button type="button" className={`ads-pro-folder-select${isSelected ? ' is-active' : ''}`} aria-pressed={isSelected} onClick={() => onSelect(folder)}>
            <FolderOpen size={14} /><span>{tx(folder)}</span>{!isSystemFolder && <small>{counts[folder] ?? 0}</small>}
          </button>
          {isSelected && !isSystemFolder && <div className="ads-pro-folder-actions">
            <button type="button" className="ads-pro-folder-more" aria-label={t("ui.c5f0e8a201")} aria-expanded={menuFolder === folder} onClick={(event) => { event.stopPropagation(); setMenuFolder(menuFolder === folder ? null : folder) }}><MoreHorizontal size={17} /></button>
            {menuFolder === folder && <div className="ads-pro-folder-action-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenuFolder(null); setRenamePanelFolder(folder); setRenameValue(folder); setRenameError(null) }}><Pencil size={15} />{t("ui.c5f0e8a201")}</button>
              <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenuFolder(null); onDelete(folder) }}><Trash2 size={15} />{t("ui.aa1d94fc16")}</button>
            </div>}
          </div>}
        </div>
      })}
    </nav>
    {renamePanelFolder && <section className="ads-pro-folder-rename-panel" role="dialog" aria-modal="false" aria-labelledby="ads-pro-folder-rename-title">
      <h3 id="ads-pro-folder-rename-title">{t("ui.b2c1e0f605")}</h3>
      <input ref={renameInputRef} aria-label={t("ui.1856045c20")} value={renameValue} onChange={(event) => { setRenameValue(event.target.value); setRenameError(null) }} onKeyDown={(event) => {
        if (event.key === 'Enter') { event.preventDefault(); finishRename() }
      }} />
      {renameError && <p className="ads-pro-folder-rename-error" role="alert">{renameError}</p>}
      <footer><button type="button" onClick={() => { setRenamePanelFolder(null); setRenameValue(''); setRenameError(null) }}>{t("ui.34ca764caf")}</button><button type="button" className="is-primary" onClick={finishRename}>{t("ui.c3d2f1a706")}</button></footer>
    </section>}
    <button ref={addButtonRef} className="ads-folder-add" type="button" onClick={onAdd}>{t("ui.788b94a884")}</button>
  </aside>
}

type ToolbarProps = {
  tab: AdsAssetTab
  query: string
  refreshing: boolean
  availableOnly: boolean
  onQuery: (value: string) => void
  onRefresh: () => void
  // A captured DOMRect, not a live element reference — these buttons can
  // live inside the compact/narrow "Hành động" dropdown (Part F), which
  // closes (unmounting itself) on the SAME click that opens the panel;
  // reading the rect synchronously here avoids ever touching a
  // by-then-detached node.
  onDownload: (anchorRect: DOMRect) => void
  onOpenColumnSettings: () => void
  onOpenUiSettings: (anchorRect: DOMRect) => void
  onToggleAvailability: () => void
  onOpenFolders: () => void
  onOpenFunctions: () => void
  onOpenWorkflow: () => void
  foldersOpen: boolean
  functionsOpen: boolean
  workflowOpen: boolean
  onAnnounce: (message: string) => void
  // TKQC Round 1 — optional so every other tab's ToolbarProps usage is
  // unaffected. `onOpenTkqcLoadConfig`/`tkqcLoadState`/`tkqcLastLoadedAt`/
  // `tkqcIdMasked`/`onToggleTkqcIdMask` are now SHARED (BM Round 1 Shared
  // Rules #9/#18): the workspace feeds whichever asset is active into this
  // same prop channel (TKQC or BM); `tkqcDateRange`/`onOpenTkqcDateRange`/
  // `tkqcCurrency`/`onOpenTkqcCurrencyFilter` stay genuinely TKQC-only
  // (Calendar Total Spend / MIX currency have no BM/Page/Pixel equivalent).
  onOpenTkqcLoadConfig?: () => void
  tkqcLoadState?: 'idle' | 'loading'
  tkqcLastLoadedAt?: number | null
  tkqcDateRange?: TkqcDateRange
  onOpenTkqcDateRange?: (anchorRect: DOMRect) => void
  tkqcIdMasked?: boolean
  onToggleTkqcIdMask?: () => void
  tkqcCurrency?: TkqcCurrencyFilterValue
  onOpenTkqcCurrencyFilter?: (anchorRect: DOMRect) => void
  // Part 12 — global (every hasFunctions tab), replaces the old
  // announce-only placeholder.
  onOpenHistory?: () => void
  // Control Hub — VIA-only ("Cài đặt Control Hub" is this tab's own
  // loadButton label/slot, see loadLabel below). Opens the "Tôn chỉ của
  // Adscheck" charter modal instead of the old announce-only placeholder.
  // Distinct from the sidebar nav-icon's Control Hub benefits/onboarding
  // modal — two separate entry points/components by design.
  onOpenControlHubSetup?: () => void
}

// Search is allowed to shrink (flexbox, bounded by these) before the
// toolbar changes tier — see ads-pro-search's flex-basis/min/max-width in
// ads-check-adaccounts-workspace.css, which must stay in sync with these.
const TOOLBAR_SEARCH_MIN_WIDTH_PX = 120
// Narrow tier's floor — still a usable search box (not icon-only-collapsed:
// production's own narrowest tier budgets search down to a bare 32px icon,
// but that stops being a usable *input*, which the Final Update spec
// explicitly rules out — "shrink to production-like usable", not hidden).
const TOOLBAR_SEARCH_NARROW_MIN_WIDTH_PX = 90
const TOOLBAR_SEARCH_MAX_WIDTH_PX = 220
const TOOLBAR_GAP_PX = 5
const TOOLBAR_SAFETY_PX = 6
const TOOLBAR_HYSTERESIS_PX = 12
// Narrow tier's primary group is two fixed 32px icon-only buttons + 1 gap —
// deterministic (not measured) because narrow's own rendered primary IS the
// icon-only variant already, so there is nothing else to derive it from;
// must stay in sync with .ads-pro-load-button.is-icon-only / .ads-pro-icon-button.
const NARROW_PRIMARY_WIDTH_PX = 32 + TOOLBAR_GAP_PX + 32

export type ToolbarTier = 'full' | 'compact' | 'narrow'

// Self-contained width-based overflow detection — no dependency on
// workflowOpen/functionOpen/viewport breakpoints. The toolbar's own root is
// `flex:1 1 auto` inside .ads-pro-header-row (the only other child, the tabs
// nav, is `flex:0 0 auto`), so the root's OWN measured width already equals
// "available width for the toolbar" — Curve B shrinking (Function/Workflow
// opening) changes that width for free, no cross-component refs needed.
// Primary/secondary/trigger widths are all read from a permanently-mounted,
// visually-hidden FULL-tier clone (never toggles content) so measuring never
// observes this hook's own already-narrowed output — that would risk a
// resize feedback loop, and would also make the upward (narrow→compact→full)
// transition impossible to evaluate once primary's live width had already
// shrunk to its icon-only form.
function useToolbarOverflow(secondaryCount: number) {
  const rootRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [tier, setTier] = useState<ToolbarTier>('full')

  useLayoutEffect(() => {
    const root = rootRef.current
    const measure = measureRef.current
    if (!root || !measure) return
    const primaryEl = measure.querySelector<HTMLElement>('[data-measure="primary"]')
    const secondaryEl = measure.querySelector<HTMLElement>('[data-measure="secondary"]')
    const triggerEl = measure.querySelector<HTMLElement>('[data-measure="trigger"]')
    const recompute = () => {
      const available = root.getBoundingClientRect().width
      const primaryWidth = primaryEl?.getBoundingClientRect().width ?? 0
      const secondaryWidth = secondaryEl?.getBoundingClientRect().width ?? 0
      const triggerWidth = triggerEl?.getBoundingClientRect().width ?? 0
      if (available === 0) return
      const gaps = TOOLBAR_GAP_PX * 3
      const fullRequired = primaryWidth + TOOLBAR_SEARCH_MIN_WIDTH_PX + secondaryWidth + gaps + TOOLBAR_SAFETY_PX
      const compactRequired = primaryWidth + TOOLBAR_SEARCH_MIN_WIDTH_PX + triggerWidth + gaps + TOOLBAR_SAFETY_PX
      const narrowRequired = NARROW_PRIMARY_WIDTH_PX + TOOLBAR_SEARCH_NARROW_MIN_WIDTH_PX + triggerWidth + gaps + TOOLBAR_SAFETY_PX
      setTier((current) => {
        if (secondaryCount === 0) return available < fullRequired ? 'narrow' : 'full'
        if (current === 'full') {
          if (available >= fullRequired) return 'full'
          return available >= compactRequired ? 'compact' : 'narrow'
        }
        if (current === 'compact') {
          if (available < compactRequired) return 'narrow'
          if (available >= fullRequired + TOOLBAR_HYSTERESIS_PX) return 'full'
          return 'compact'
        }
        // current === 'narrow'
        if (available < narrowRequired) return 'narrow'
        if (available >= fullRequired + TOOLBAR_HYSTERESIS_PX) return 'full'
        if (available >= compactRequired + TOOLBAR_HYSTERESIS_PX) return 'compact'
        return 'narrow'
      })
    }
    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(root)
    return () => observer.disconnect()
  }, [secondaryCount])

  return { rootRef, measureRef, tier }
}

type ActionsMenuProps = { actions: { key: string; node: ReactNode }[] }

// Portaled to document.body (position:fixed, coordinates computed from the
// trigger's own rect) instead of position:absolute inside the toolbar — the
// toolbar itself is now `overflow:hidden` (Final Update P0 fix, see
// .ads-pro-toolbar) to contain rare narrow-width overflow, which would
// otherwise clip this dropdown's body entirely since it renders taller than
// the toolbar row it used to be nested in.
function AdsProActionsMenu({ actions }: ActionsMenuProps) {
  useAppLanguage();
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return
    const trigger = wrapperRef.current
    if (!trigger) return
    const recompute = () => {
      const rect = trigger.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [open])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (wrapperRef.current?.contains(target) || menuRef.current?.contains(target)) return
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
  return <div className="ads-pro-actions-menu-wrapper" ref={wrapperRef}>
    <button type="button" className="ads-pro-actions-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      {t("ui.8e9fdd281d")}<ChevronDown size={14} />
    </button>
    {tx(open && createPortal(
      <div ref={menuRef} className="ads-pro-actions-menu" role="menu" aria-label={t("ui.8e9fdd281d")} style={{ top: menuPos.top, right: menuPos.right }}>
        {actions.map(({ key, node }) => <div key={key} role="menuitem" className="ads-pro-actions-menu-item" onClick={() => setOpen(false)}>{node}</div>)}
      </div>,
      document.body,
    ))}
  </div>
}

export function AdsCheckProToolbar({
  tab, query, refreshing, onQuery, onRefresh, onDownload,
  onOpenColumnSettings, onOpenUiSettings, onOpenFolders, onOpenFunctions, onOpenWorkflow,
  foldersOpen, functionsOpen, workflowOpen, onAnnounce,
  onOpenTkqcLoadConfig, tkqcLoadState = 'idle', tkqcLastLoadedAt = null,
  tkqcDateRange = DEFAULT_TKQC_DATE_RANGE, onOpenTkqcDateRange,
  tkqcIdMasked = false, onToggleTkqcIdMask,
  tkqcCurrency = 'mix', onOpenTkqcCurrencyFilter,
  onOpenHistory, onOpenControlHubSetup,
}: ToolbarProps) {
  useAppLanguage();
  const hasFunctions = tab.key !== 'via'
  const isTkqc = tab.key === 'ad-account'
  const isBm = tab.key === 'business'
  const isPage = tab.key === 'page'
  const isPixel = tab.key === 'pixel'
  // BM Round 1 Shared Rule #9/#18, extended to Page and Pixel (Pixel #4) —
  // the "Tải …" load-state machine is a SHARED control (not TKQC-only):
  // TKQC/BM/Page/Pixel all feed the exact same props below, just gated by
  // whichever asset is active.
  const hasLoadConfig = isTkqc || isBm || isPage || isPixel
  // Pixel #6 — the toolbar Eye is ITS OWN independent system from Pixel's
  // row-level lazy-reveal Eyes (Người dùng/TKQC/Đối tác, Pixel #2): this
  // one targets "ID Pixel" presentation only, same shared id-mask channel
  // as TKQC/BM/Page. Toggling this must never reveal the row-level cells,
  // and the row-level Eyes must never affect ID Pixel's display.
  const hasIdMask = isTkqc || isBm || isPage || isPixel
  // Part 5 — "(Vừa xong)" recomputed from elapsed time vs a ticking clock
  // (traced production: no fixed reset timeout — the label flips back
  // once >=1 minute has elapsed since the last load, re-evaluated on a
  // 60s tick, not a one-shot setTimeout). This local tick just forces a
  // re-render every 60s so that comparison stays live.
  const [, forceTick] = useState(0)
  useEffect(() => {
    if (!hasLoadConfig) return
    const id = window.setInterval(() => forceTick((value) => value + 1), 60_000)
    return () => window.clearInterval(id)
  }, [hasLoadConfig])
  const secondaryActions: { key: string; node: ReactNode }[] = [
    ...(isTkqc && onOpenTkqcDateRange ? [{ key: 'date-range', node: <AdsProTkqcDateRangeTrigger key="date-range" range={tkqcDateRange} onClick={onOpenTkqcDateRange} /> }] : []),
    ...(hasIdMask && onToggleTkqcIdMask ? [{ key: 'id-mask', node: <AdsProIdMaskButton key="id-mask" assetLabel={tab.label} masked={tkqcIdMasked} onToggle={onToggleTkqcIdMask} /> }] : []),
    // Shared Toolbar Eye Correction — the old "availability" toggle
    // (EyeClosed icon) rendered right next to the id-mask Eye on every
    // hasFunctions tab (TKQC/BM/Page/Pixel), reading as two adjacent Eye
    // controls. Removed from the toolbar entirely (not per-asset) so each
    // of these 4 tabs has exactly one Eye control — the id-mask one above.
    // `availableOnly`/`onToggleAvailability` stay wired through as props
    // (workspace.tsx's own TKQC row-filter state is untouched) — only the
    // toolbar button that invoked it is gone.
    ...(isTkqc && onOpenTkqcCurrencyFilter ? [{ key: 'currency', node: <AdsProCurrencyFilterButton key="currency" value={tkqcCurrency} onClick={onOpenTkqcCurrencyFilter} /> }] : []),
    { key: 'download', node: <button key="download" className="ads-pro-icon-button" type="button" aria-label={tx(m("ui.ac848153da", { 0: tab.label }))} onClick={(event) => onDownload(event.currentTarget.getBoundingClientRect())}><Download size={17} /></button> },
    // VIA Audit Batch 1 Part C — "Tùy chỉnh cột" now lives on this same
    // icon slot (Columns3 fits a column-settings trigger better than its
    // old "Đổi mật độ bảng" purpose, which Part D's richer row-spacing
    // setting now subsumes).
    { key: 'column-settings', node: <button key="column-settings" className="ads-pro-icon-button" type="button" aria-label={t("ui.1c9dbf98c4")} onClick={onOpenColumnSettings}><Columns3 size={17} /></button> },
    // Part D — the "Aa" trigger now opens the full Cài đặt giao diện panel
    // instead of directly toggling a single largeType boolean.
    { key: 'ui-settings', node: <button key="ui-settings" className="ads-pro-icon-button" type="button" aria-label={t("ui.46d56c26ae")} onClick={(event) => onOpenUiSettings(event.currentTarget.getBoundingClientRect())}><ALargeSmall size={17} /></button> },
    // Round 1 Part 12 — global "Lịch sử hành động", replacing the old
    // announce-only placeholder now that a real execution-history model
    // exists.
    ...(hasFunctions ? [{ key: 'history', node: <button key="history" className="ads-pro-icon-button" type="button" aria-label={t("ui.46b3e6a19b")} onClick={onOpenHistory ?? (() => onAnnounce(m("ui.33fc428a85")))}><History size={17} /></button> }] : []),
  ]
  const { rootRef, measureRef, tier } = useToolbarOverflow(secondaryActions.length)
  const narrow = tier === 'narrow'
  const compact = tier !== 'full'
  // Part 5, propagated to BM (Shared Rule #18) — the 3-state label (idle/
  // loading/"Vừa xong") applies to any asset with a real load-config flow;
  // every other tab (VIA/Page/Pixel) keeps the pre-existing simple
  // announce-only behavior.
  // Shared #19 — relative time inline in the button label, computed from
  // the asset's own stored lastLoadedAt (each of TKQC/BM/Page/Pixel keeps
  // its own value — see the workspace's per-asset lastLoadedAt state — so
  // a successful load on one asset never touches another's timestamp).
  const loadLabelSuffix = hasLoadConfig && tkqcLoadState === 'loading' ? '' : hasLoadConfig && tkqcLastLoadedAt !== null ? ` (${formatRelativeLoadTime(tkqcLastLoadedAt)})` : ''
  const loadLabel = tab.key === 'via' ? m("ui.90ae2f89a4") : hasLoadConfig && tkqcLoadState === 'loading' ? m("ui.f774f2161e") : `${tab.loadLabel}${loadLabelSuffix}`
  const onLoadClick = () => {
    if (hasLoadConfig) {
      if (tkqcLoadState === 'loading') return // Part 5 — no duplicate concurrent starts
      onOpenTkqcLoadConfig?.()
      return
    }
    if (tab.key === 'via') { onOpenControlHubSetup?.(); return }
    onAnnounce(m("ui.749731eedb", { 0: tab.label }))
  }
  // Production's own narrow tier drops this button's text label entirely,
  // keeping only the icon + accessible name (traced: 436.e5c83aa9.js's load
  // button toggles a `v-if` text span off under its `isCompact` ref) —
  // reproduced here rather than rendering the label and letting it clip.
  const loadButton = (measure: boolean) => <button className={`ads-pro-load-button${tab.key === 'via' ? ' is-muted' : ''}${!measure && narrow ? ' is-icon-only' : ''}`} type="button" disabled={hasLoadConfig && tkqcLoadState === 'loading'} aria-busy={hasLoadConfig && tkqcLoadState === 'loading'} aria-label={tx(!measure && narrow ? loadLabel : undefined)} title={tx(!measure && narrow ? loadLabel : undefined)} onClick={onLoadClick}>{hasLoadConfig && tkqcLoadState === 'loading' ? <Loader2 className="is-spinning" size={16} /> : <Settings size={16} />}{tx((measure || !narrow) && loadLabel)}</button>

  return <div ref={rootRef} className="ads-pro-toolbar" role="toolbar" aria-label={tx(m("ui.60136f6810", { 0: tab.label }))}>
    <div className="ads-pro-mobile-panel-buttons">
      <button type="button" aria-label={t("ui.0e64b8fe0f")} aria-expanded={foldersOpen} aria-controls="ads-pro-folders" onClick={onOpenFolders}><FolderOpen size={17} /></button>
      {tx(hasFunctions && <button type="button" aria-label={t("ui.12116004b0")} aria-expanded={functionsOpen} aria-controls="ads-pro-function-library" onClick={onOpenFunctions}><SlidersHorizontal size={17} /></button>)}
      {tx(hasFunctions && <button type="button" aria-label={t("ui.02f3a0d663")} aria-expanded={workflowOpen} aria-controls="ads-pro-workflow" onClick={onOpenWorkflow}><PanelRightOpen size={17} /></button>)}
    </div>
    <div className="ads-pro-toolbar-primary">
      {loadButton(false)}
      <button className="ads-pro-icon-button" type="button" aria-label={tx(m("ui.a0a40da60d", { 0: tab.label }))} aria-busy={refreshing} onClick={onRefresh}><RefreshCw className={refreshing ? 'is-spinning' : ''} size={17} /></button>
    </div>
    <label className="ads-pro-search" style={{ minWidth: narrow ? TOOLBAR_SEARCH_NARROW_MIN_WIDTH_PX : TOOLBAR_SEARCH_MIN_WIDTH_PX, maxWidth: TOOLBAR_SEARCH_MAX_WIDTH_PX }}>
      <span className="sr-only">{t("ui.1045f7a4c7")}</span><Search size={17} />
      <input aria-label={t("ui.1045f7a4c7")} value={query} placeholder={t("ui.6671928637")} onChange={(event) => onQuery(event.target.value)} />
    </label>
    {!compact && secondaryActions.map(({ key, node }) => <Fragment key={key}>{node}</Fragment>)}
    {compact && <AdsProActionsMenu actions={secondaryActions} />}
    {/* Permanently-mounted, hidden FULL-tier measurement clone — see
        useToolbarOverflow. Never toggles with `tier`, so it can never feed a
        resize loop, and always gives the hook a stable "what would full
        primary/trigger cost" figure even while the live render is narrow. */}
    <div ref={measureRef} aria-hidden="true" className="ads-pro-toolbar-measure">
      <div data-measure="primary" className="ads-pro-toolbar-measure-row">{loadButton(true)}<button type="button" className="ads-pro-icon-button"><RefreshCw size={17} /></button></div>
      <div data-measure="secondary" className="ads-pro-toolbar-measure-row">{secondaryActions.map(({ key, node }) => <Fragment key={key}>{node}</Fragment>)}</div>
      <div data-measure="trigger" className="ads-pro-toolbar-measure-row"><button type="button" className="ads-pro-actions-trigger">{t("ui.8e9fdd281d")}<ChevronDown size={14} /></button></div>
    </div>
  </div>
}
