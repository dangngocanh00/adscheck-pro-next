import { m, useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Layers3, Workflow } from 'lucide-react'
import { AdsCheckCurveNeon } from './ads-check-curve-neon'
import { AdsCheckV8LoadingScreen } from './ads-check-v8-loading-screen'
import { AdsProDownloadPanel } from './ads-check-pro-download-panel'
import type { ExportColumn } from './ads-check-pro-export'
import { AdsProUiSettingsPanel } from './ads-check-pro-ui-settings-panel'
import { useUiSettings } from './ads-check-pro-ui-settings'
import { AdsCheckProAssetTable } from './ads-check-pro-asset-table'
import { assetColumns, generateGenericRows, type GenericRow } from './ads-check-pro-generic-data'
import { renderValue } from './ads-check-pro-generic-table'
import { AdsCheckProFunctionLibrary } from './ads-check-pro-function-library'
import { AdsCheckProLocalDialog } from './ads-check-pro-local-dialogs'
import { isAdsProDrawerViewport, useAdsProDrawerViewport } from './ads-check-pro-responsive-drawer'
import { AdsCheckProFolderPanel, AdsCheckProToolbar } from './ads-check-pro-shared-controls'
import { buildWorkspaceSurfacePath, type WorkspaceSurfaceAnchor } from './ads-check-pro-workspace-surface'
import { AdsCheckProWorkflowModeDialog } from './ads-check-pro-workflow-mode-dialog'
import { AdsCheckProWorkflowPanel, type WorkflowStep } from './ads-check-pro-workflow-panel'
import { AdsProTagPicker } from './ads-check-pro-tag-picker'
import { AdsProMoveFolderDialog } from './ads-check-pro-move-folder-dialog'
import { AdsProConfirmDialog } from './ads-check-pro-confirm-dialog'
import { useTagSystem } from './ads-check-pro-tag-system'
import { useTemplateStore, type WorkflowTemplate } from './ads-check-pro-template-store'
import { formatCurrency, tkqcRowFixtures, tkqcRestrictedRowFixtures, type TkqcAdminRole, type TkqcRow } from './ads-check-pro-tkqc-data'
import { formatDueDateDays } from './ads-check-pro-tkqc-format'
import { AdsProTkqcSpendLimitModal } from './ads-check-pro-tkqc-spend-limit-modal'
import { AdsProTkqcAdminPanel } from './ads-check-pro-tkqc-admin-panel'
import { AdsProCurrencyFilterPanel, buildCurrencyOptions, type TkqcCurrencyFilterValue } from './ads-check-pro-tkqc-currency-filter'
import { AdsProTkqcDateRangePicker } from './ads-check-pro-tkqc-date-range-picker'
import { DEFAULT_TKQC_DATE_RANGE, type TkqcDateRange } from './ads-check-pro-tkqc-date-range'
import { AdsProBmLoadConfigModal, AdsProPageLoadConfigModal, AdsProPixelLoadConfigModal, AdsProTkqcLoadConfigModal, DEFAULT_BM_LOAD_CONFIG, DEFAULT_PAGE_LOAD_CONFIG, DEFAULT_PIXEL_LOAD_CONFIG, DEFAULT_TKQC_LOAD_CONFIG, type BmLoadConfig, type PageLoadConfig, type PixelLoadConfig, type TkqcLoadConfig } from './ads-check-pro-tkqc-load-config-modal'
import { AdsProTkqcPaymentPopover } from './ads-check-pro-tkqc-payment-popover'
import { useExecutionHistory } from './ads-check-pro-execution-history'
import { AdsProTkqcRunLogModal } from './ads-check-pro-tkqc-run-log-modal'
import { AdsProTkqcHistoryModal } from './ads-check-pro-tkqc-history-modal'
import { bmRowFixtures, type BmAdminRole, type BmRow } from './ads-check-pro-bm-data'
import { AdsProBmResourcePanel, type BmResourceKind } from './ads-check-pro-bm-resource-panels'
import { AdsCheckProControlHubCharterModal } from './ads-check-pro-control-hub-charter-modal'
import { AdsCheckProControlHubSecurityModal } from './ads-check-pro-control-hub-security-modal'
import { AdsCheckProControlHubPasswordModal } from './ads-check-pro-control-hub-password-modal'
import { AdsCheckProControlHubDeferredWarning } from './ads-check-pro-control-hub-deferred-warning'
import { AdsCheckProControlHubSuccessModal } from './ads-check-pro-control-hub-success-modal'
import { AdsCheckProControlHubSuccessToast } from './ads-check-pro-control-hub-success-toast'
import { AdsCheckProControlHubSettingsModal } from './ads-check-pro-control-hub-settings-modal'
import { AdsCheckProControlHubHelpModal } from './ads-check-pro-control-hub-help-modal'
import {
  assetLabels, assetTabs, formatViaBrowser, formatViaLastConnected, functionKey, GROUP_COLLAPSED_STORAGE_KEY, initialViaConnections,
  loadCollapsedGroups, loadWorkflowMode, resolveFunctionGroups,
  RUNNER_DELAY_MS_DEFAULT, RUNNER_THREADS_DEFAULT, WORKFLOW_MODE_STORAGE_KEY,
  type AdsAssetKey, type AdsFunctionDefinition, type FunctionGroup, type ViaConnection, type WorkflowMode,
} from './ads-check-pro-workspace-data'

const nonViaAssetKeys: Exclude<AdsAssetKey, 'via'>[] = ['ad-account', 'business', 'page', 'pixel']

// VIA Audit Batch 1 Part B10 — traced production export column SET for VIA
// (references/remotes/adaccounts/897.0e915523.js/436.e5c83aa9.js):
// stt, statusText, fbAccountName, originalId, browser, lastConnectedAt,
// tags, note, action — labels reused verbatim from the on-screen VIA table
// columns (the bundle's i18n VALUES for this export panel were not
// recoverable, only key paths, so the already-approved on-screen labels
// are the ground truth here). "action" carries no exportable data in
// production either — kept as an always-empty column so the header SET
// matches exactly, not invented content. `idOnlyKey` intentionally does
// NOT match any column here — production's own real export column set for
// VIA has no `field:"id"` entry either, so "Chỉ tải ID" has no visible
// effect for VIA in production, reproduced as a confirmed quirk, not a bug.
const VIA_EXPORT_ID_KEY = 'id'

// TKQC admin role hierarchy (Correction Batch 2 Part K, confirmed by
// research): admin > advertiser > analyst.
const TKQC_ROLE_RANK: Record<TkqcAdminRole, number> = { analyst: 0, advertiser: 1, admin: 2 }
const TKQC_ROLE_BY_RANK: TkqcAdminRole[] = ['analyst', 'advertiser', 'admin']
function tkqcRoleUp(role: TkqcAdminRole): TkqcAdminRole { return TKQC_ROLE_BY_RANK[Math.min(TKQC_ROLE_BY_RANK.length - 1, TKQC_ROLE_RANK[role] + 1)] }
function tkqcRoleDown(role: TkqcAdminRole): TkqcAdminRole { return TKQC_ROLE_BY_RANK[Math.max(0, TKQC_ROLE_RANK[role] - 1)] }

// Page/Pixel demo rows (Batch Update Part I3) — generated once at module
// load over each asset's EXISTING column schema (ads-check-pro-asset-
// table.tsx's assetColumns), no per-row mutation needed this batch.
const pageRowFixtures = generateGenericRows('page', assetColumns.page, 45)
const pixelRowFixtures = generateGenericRows('pixel', assetColumns.pixel, 30)

// Keep shell geometry independent of floating panel visibility.
type WorkspaceProps = {
  onAnnounce: (message: string, tone?: 'success' | 'info') => void
}
type LocalDialogState = { mode: 'note' | 'delete'; row: ViaConnection } | null

const defaultFolders: Record<AdsAssetKey, string[]> = {
  via: [m("ui.f7a578dcbd")],
  'ad-account': [m("ui.f7a578dcbd"), m("ui.3cb9c6797a"), m("ui.5a28ab5ab8")],
  business: [m("ui.f7a578dcbd")],
  page: [m("ui.f7a578dcbd")],
  pixel: [m("ui.f7a578dcbd")],
}
const defaultSelections: Record<AdsAssetKey, string[]> = { via: [], 'ad-account': [], business: [], page: [], pixel: [] }
// The right-side "Kho chức năng"/"Quy trình" panels belong to the whole Ads
// Check Pro workspace, not to any single asset tab — every asset (VIA
// included) gets an entry so switching tabs only ever swaps panel CONTENT,
// never the panel/rail's existence.
const defaultWorkflows: Record<AdsAssetKey, WorkflowStep[]> = { via: [], 'ad-account': [], business: [], page: [], pixel: [] }
// expandedStepIds/stepConfigValues are per-asset (mirrors production's own
// per-tab store instance) — NEITHER is persisted in production (traced:
// only the CATALOG order/enabled keys write to localStorage; the selected-
// functions store's own reorder/expand/config setters never do), so these
// stay plain in-memory state, same as `workflows` already was.
const defaultExpandedStepIds: Record<AdsAssetKey, Set<string>> = { via: new Set(), 'ad-account': new Set(), business: new Set(), page: new Set(), pixel: new Set() }
const defaultStepConfigValues: Record<AdsAssetKey, Record<string, Record<string, string>>> = { via: {}, 'ad-account': {}, business: {}, page: {}, pixel: {} }
// Correction Batch 3 Part A2 — mirrors production's `selectedTemplate` ref:
// which saved template (if any) the CURRENT workflow for this asset was
// last loaded from or saved as. Purely a provenance pointer for the
// Save-panel's update-vs-create-new default — never mutates the saved
// template just because the user keeps editing the current workflow.
const defaultLoadedTemplateIds: Record<AdsAssetKey, string | null> = { via: null, 'ad-account': null, business: null, page: null, pixel: null }

export function AdsCheckAdAccountsWorkspace({ onAnnounce }: WorkspaceProps) {
  const surfaceId = useId()
  useAppLanguage();
  const isDrawer = useAdsProDrawerViewport()
  const [activeAsset, setActiveAsset] = useState<AdsAssetKey>('via')
  const [queries, setQueries] = useState<Record<AdsAssetKey, string>>({ via: '', 'ad-account': '', business: '', page: '', pixel: '' })
  const [viaRows, setViaRows] = useState(initialViaConnections)
  const [tkqcRows, setTkqcRows] = useState(tkqcRowFixtures)
  const [tkqcNoteRow, setTkqcNoteRow] = useState<TkqcRow | null>(null)
  const [bmRows, setBmRows] = useState(bmRowFixtures)
  const [bmNoteRow, setBmNoteRow] = useState<BmRow | null>(null)
  const [pageRows, setPageRows] = useState(pageRowFixtures)
  const [pixelRows, setPixelRows] = useState(pixelRowFixtures)
  const [genericNoteTarget, setGenericNoteTarget] = useState<{ asset: 'page' | 'pixel'; rowId: string; name: string; note: string } | null>(null)
  const [bmResourcePanel, setBmResourcePanel] = useState<{ rowId: string; kind: BmResourceKind } | null>(null)
  const [tkqcSpendLimitRowId, setTkqcSpendLimitRowId] = useState<string | null>(null)
  const [tkqcAdminPanelRowId, setTkqcAdminPanelRowId] = useState<string | null>(null)
  const [selections, setSelections] = useState(defaultSelections)
  const [folders, setFolders] = useState(defaultFolders)
  const [selectedFolder, setSelectedFolder] = useState<string>(m("ui.f7a578dcbd"))
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<string | null>(null)
  const [workflows, setWorkflows] = useState(defaultWorkflows)
  const [expandedStepIds, setExpandedStepIds] = useState(defaultExpandedStepIds)
  const [stepConfigValues, setStepConfigValues] = useState(defaultStepConfigValues)
  const [loadedTemplateIds, setLoadedTemplateIds] = useState(defaultLoadedTemplateIds)
  // "Luồng"/"Delay(ms)" — traced as a GLOBAL pair (ij.L()), not per-asset,
  // and never persisted to localStorage anywhere in the traced source — see
  // Round 5 notes. Plain in-memory state, shared across every asset tab.
  const [threads, setThreads] = useState(RUNNER_THREADS_DEFAULT)
  const [delayMs, setDelayMs] = useState(RUNNER_DELAY_MS_DEFAULT)
  const [functionOpen, setFunctionOpen] = useState(false)
  const [workflowOpen, setWorkflowOpen] = useState(false)
  // Workflow Mode is global (not per-asset) — production's own dO()/dV are a
  // single module-level ref shared across every asset's tool list, not a
  // per-tab setting. Lifted here since this component already owns every
  // asset's `workflows` (needed to prune all 4 down to 1 step on switch to
  // single — see setWorkflowMode).
  const [workflowMode, setWorkflowModeState] = useState<WorkflowMode>(loadWorkflowMode)
  const [workflowModeDialogOpen, setWorkflowModeDialogOpen] = useState(false)
  // Group-collapsed state is likewise global in production (a single
  // "adaccounts.tool-group-collapsed.v1" key, not per-asset — see Round 4
  // notes) — lifted here so it survives the Function Store panel remounting
  // on every asset switch (its own key={`${activeAsset}-functions`}).
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(loadCollapsedGroups)
  useEffect(() => {
    try { localStorage.setItem(GROUP_COLLAPSED_STORAGE_KEY, JSON.stringify([...collapsedGroups])) } catch { /* storage unavailable */ }
  }, [collapsedGroups])
  const toggleGroupCollapsed = (groupId: string) => setCollapsedGroups((current) => {
    const next = new Set(current)
    if (next.has(groupId)) next.delete(groupId)
    else next.add(groupId)
    return next
  })
  const [functionQueries, setFunctionQueries] = useState<Record<AdsAssetKey, string>>({ via: '', 'ad-account': '', business: '', page: '', pixel: '' })
  const [foldersOpen, setFoldersOpen] = useState(() => !isAdsProDrawerViewport())
  // VIA Audit Batch 1 Part D — replaces the old dense/largeType booleans:
  // one shared settings object for every asset tab (Part D2/D12, traced:
  // a single module-level ref in production, not per-tab).
  const { settings: uiSettings, setSetting: setUiSetting } = useUiSettings()
  const [downloadPanel, setDownloadPanel] = useState<{ rect: DOMRect } | null>(null)
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false)
  const [moveFolderOpen, setMoveFolderOpen] = useState(false)
  const [removeFolderConfirmOpen, setRemoveFolderConfirmOpen] = useState(false)
  const [uiSettingsPanelRect, setUiSettingsPanelRect] = useState<DOMRect | null>(null)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dialog, setDialog] = useState<LocalDialogState>(null)
  const tagSystem = useTagSystem()
  // VIA Audit Batch 1 Part B10 — closes over the tag system so the "Tag"
  // export column reflects the SAME live tag associations shown on screen,
  // not a placeholder.
  const viaExportColumns: ExportColumn<ViaConnection>[] = useMemo(() => [
    { key: 'stt', label: 'STT', value: (_row, index) => String(index + 1) },
    { key: 'statusText', label: m("ui.e03c1401e3"), value: (row) => row.status === 'connected' ? m("ui.9d15385cab") : m("ui.f5373d1e8e") },
    { key: 'fbAccountName', label: m("ui.3183a086b0"), value: (row) => row.name },
    { key: 'originalId', label: m("ui.2abe434bb4"), value: (row) => row.sourceId },
    { key: 'browser', label: m("ui.f38bcd4f56"), value: (row) => formatViaBrowser(row) },
    { key: 'lastConnectedAt', label: m("ui.3ad13b1a57"), value: (row) => formatViaLastConnected(row) },
    { key: 'tags', label: 'Tag', value: (row) => tagSystem.getRowTagIds('via', row.id).map((tagId) => tagSystem.tags.find((tag) => tag.id === tagId)?.name).filter(Boolean).join(', ') },
    { key: 'note', label: m("ui.02f03f68e7"), value: (row) => row.note ?? '' },
    { key: 'action', label: m("ui.8e9fdd281d"), value: () => '' },
  ], [tagSystem])
  // Round 1 Part 9 — TKQC's OWN Download panel export set. Unlike VIA
  // (Part B8's traced no-op quirk), TKQC's `accountId` field IS a genuine
  // export column here, so "Chỉ tải ID" filters down to it and actually
  // does something — no inherited VIA quirk.
  const tkqcExportColumns: ExportColumn<TkqcRow>[] = useMemo(() => [
    { key: 'stt', label: 'STT', value: (_row, index) => String(index + 1) },
    { key: 'status', label: m("ui.e03c1401e3"), value: (row) => row.status === 'active' ? m("ui.ad939f0450") : row.status === 'restricted' ? m("ui.0fb7591169") : row.status === 'disabled' ? m("ui.eea204c5c9") : m("ui.39fc933455") },
    { key: 'name', label: m("ui.4a60abe525"), value: (row) => row.name },
    { key: 'accountId', label: 'ID TKQC', value: (row) => row.accountId },
    { key: 'balance', label: m("ui.b0c0338188"), value: (row) => formatCurrency(row.balance, row.currency) },
    { key: 'threshold', label: m("ui.682b1f60b4"), value: (row) => row.threshold === null ? '' : formatCurrency(row.threshold, row.currency) },
    { key: 'limit', label: 'Limit', value: (row) => row.limit === null ? '' : formatCurrency(row.limit, row.currency) },
    { key: 'totalSpend', label: m("ui.96fc0bc88b"), value: (row) => formatCurrency(row.totalSpend, row.currency) },
    { key: 'currency', label: m("ui.42d00a8fe2"), value: (row) => row.currency },
    { key: 'permission', label: m("ui.26d8c4a5a4"), value: (row) => row.permission },
    { key: 'createdAt', label: m("ui.8b2d9e8a26"), value: (row) => row.createdAt },
    { key: 'accountType', label: m("ui.51cab1454e"), value: (row) => row.accountType },
    { key: 'businessId', label: 'ID BM', value: (row) => row.businessId ?? '' },
    { key: 'businessName', label: m("ui.8c72326a11"), value: (row) => row.businessName ?? '' },
    { key: 'country', label: m("ui.99962bacb4"), value: (row) => row.country },
    { key: 'note', label: m("ui.02f03f68e7"), value: (row) => row.note ?? '' },
    { key: 'dueDate', label: m("ui.50115fb861"), value: (row) => formatDueDateDays(row.dueDate) },
    { key: 'originalId', label: m("ui.2abe434bb4"), value: (row) => row.originalId },
    { key: 'tag', label: 'Tag', value: (row) => tagSystem.getRowTagIds('ad-account', row.id).map((tagId) => tagSystem.tags.find((tag) => tag.id === tagId)?.name).filter(Boolean).join(', ') },
  ], [tagSystem])
  // Shared Download shell propagated to BM — same panel/architecture as
  // VIA/TKQC, but the column set and ID field are BM's own real schema
  // (bmId), not a copy of VIA/TKQC's ID quirks. "Tag" is now wired to the
  // same shared tag system BM's own table uses (propagated below), so it
  // reflects real live tag associations same as VIA/TKQC's export column.
  const bmExportColumns: ExportColumn<BmRow>[] = useMemo(() => [
    { key: 'stt', label: 'STT', value: (_row, index) => String(index + 1) },
    { key: 'status', label: m("ui.e03c1401e3"), value: (row) => row.status === 'live' ? 'Live' : 'Die' },
    { key: 'name', label: m("ui.8c72326a11"), value: (row) => row.name },
    { key: 'bmId', label: 'ID BM', value: (row) => row.bmId },
    { key: 'tag', label: 'Tag', value: (row) => tagSystem.getRowTagIds('business', row.id).map((tagId) => tagSystem.tags.find((tag) => tag.id === tagId)?.name).filter(Boolean).join(', ') },
    { key: 'appealCount', label: m("ui.728219fdb6"), value: (row) => row.status === 'die' ? 'Die' : 'Live' },
    { key: 'diedAt', label: m("ui.2cf9a7288c"), value: (row) => row.diedAt ?? '' },
    { key: 'progressPercent', label: m("ui.84e677511a"), value: (row) => row.progressPercent === null ? '' : `${row.progressPercent}%` },
    { key: 'permission', label: m("ui.26d8c4a5a4"), value: (row) => row.permission },
    { key: 'createdAt', label: m("ui.8b2d9e8a26"), value: (row) => row.createdAt },
    { key: 'verified', label: 'Verified', value: (row) => row.verified === 'verified' ? '✓' : m("ui.67fba2f357") },
    { key: 'levelBm', label: 'Level BM', value: (row) => row.levelBm ?? '' },
    { key: 'loaiBm', label: m("ui.f3b1f428ec"), value: (row) => row.loaiBm },
    { key: 'active', label: m("ui.ad939f0450"), value: (row) => row.active ? m("ui.ad939f0450") : m("ui.eea204c5c9") },
    { key: 'partnerCount', label: m("ui.d7d4468d45"), value: (row) => String(row.partners.length) },
    { key: 'note', label: m("ui.02f03f68e7"), value: (row) => row.note ?? '' },
    { key: 'adminTotal', label: 'SL Admin', value: (row) => String(row.admins.length) },
    { key: 'adAccountTotal', label: 'SL Ad Account', value: (row) => String(row.adAccounts.length) },
    { key: 'pageCount', label: 'SL Page', value: (row) => String(row.pages.length) },
    { key: 'igCount', label: 'SL IG', value: (row) => String(row.instagramAccounts.length) },
    { key: 'wabaCount', label: 'SL WABA', value: (row) => String(row.wabaAccounts.length) },
  ], [tagSystem])
  // Shared Download shell propagated to Page/Pixel — schema-driven from
  // each asset's own real column list (assetColumns), reusing the exact
  // same value formatting the table itself uses (renderValue) so exported
  // text matches what's on screen. "Tag"/"Ghi chú" ARE wired to real shared
  // state here (unlike BM), so they're included.
  const pageExportColumns = useMemo(() => assetColumns.page.map((column): ExportColumn<GenericRow> => ({
    key: column.key,
    label: column.label,
    value: (row, index) => {
      if (column.key === 'order') return String(index + 1)
      if (column.key === 'tag') return tagSystem.getRowTagIds('page', row.id).map((tagId) => tagSystem.tags.find((tag) => tag.id === tagId)?.name).filter(Boolean).join(', ')
      if (column.key === 'note') return String(row.values.note ?? '')
      // Page Round 1 — export text mirrors the on-screen presentation
      // (never the masked Eye display, since export always reads the raw
      // row value directly, same as TKQC/BM's own "Chỉ tải ID" semantics).
      if (column.key === 'status') { const status = row.values.status; return status === 'live' ? 'Live' : status === 'die' ? 'Die' : m("ui.fe5847cbc8") }
      if (column.key === 'live' || column.key === 'monetization') return row.values[column.key] ? m("ui.c409ec429a") : m("ui.4de5503a9e")
      return renderValue(column.key, row.values[column.key])
    },
  })), [tagSystem])
  const pixelExportColumns = useMemo(() => assetColumns.pixel.map((column): ExportColumn<GenericRow> => ({
    key: column.key,
    label: column.label,
    value: (row, index) => {
      if (column.key === 'order') return String(index + 1)
      if (column.key === 'tag') return tagSystem.getRowTagIds('pixel', row.id).map((tagId) => tagSystem.tags.find((tag) => tag.id === tagId)?.name).filter(Boolean).join(', ')
      if (column.key === 'note') return String(row.values.note ?? '')
      return renderValue(column.key, row.values[column.key])
    },
  })), [tagSystem])
  const templateStore = useTemplateStore()
  // Batch Update Part B8: reusable across VIA + TKQC — `rowIds` is normally
  // a single id, or every selected id for the bulk "Gắn Tag" toolbar button.
  const [tagPickerTarget, setTagPickerTarget] = useState<{ asset: AdsAssetKey; rowIds: string[]; anchorEl: HTMLElement; placement: 'top' | 'bottom' } | null>(null)
  const refreshTimer = useRef<number | null>(null)
  // Correction Batch 2 Part G: Tiến trình is idle by default (see the TKQC/
  // BM/Generic fixture generators) and only ever populated by an actual
  // clone-demo Workflow execution (Bắt đầu quy trình) — never random data
  // on mount. Cleanup functions collected here so a pending ramp/reset
  // never fires into an unmounted workspace.
  const executionCleanupsRef = useRef<Array<() => void>>([])
  useEffect(() => () => { for (const cleanup of executionCleanupsRef.current) cleanup(); executionCleanupsRef.current = [] }, [])
  const stepCounter = useRef(0)
  const assetPanelRef = useRef<HTMLElement>(null)
  // TKQC Round 1 — new toolbar/table state. All TKQC-scoped except
  // executionHistory (Parts 11/12, shared across every non-VIA asset —
  // see ads-check-pro-execution-history.ts's own header comment).
  const executionHistory = useExecutionHistory()
  const [tkqcIdMasked, setTkqcIdMasked] = useState(false)
  const [tkqcCurrency, setTkqcCurrency] = useState<TkqcCurrencyFilterValue>('mix')
  const [tkqcCurrencyPanelRect, setTkqcCurrencyPanelRect] = useState<DOMRect | null>(null)
  const [tkqcDateRange, setTkqcDateRange] = useState<TkqcDateRange>(DEFAULT_TKQC_DATE_RANGE)
  const [tkqcDateRangePanelRect, setTkqcDateRangePanelRect] = useState<DOMRect | null>(null)
  const [tkqcLoadConfigOpen, setTkqcLoadConfigOpen] = useState(false)
  const [tkqcLoadConfigDraft, setTkqcLoadConfigDraft] = useState<TkqcLoadConfig>(DEFAULT_TKQC_LOAD_CONFIG)
  const [tkqcLoadState, setTkqcLoadState] = useState<'idle' | 'loading'>('idle')
  // Shared #19 — each asset keeps its OWN last-successful-load timestamp
  // (never a single shared one). Seeded to a plausible "already loaded
  // before" demo value (production trace: TKQC/BM ~1 ngày trước, Page/
  // Pixel ~6 ngày trước) so the relative-time label has something real to
  // compute from on first mount, instead of showing no suffix until the
  // user manually loads once. The DISPLAY STRING itself is never
  // hardcoded — see formatRelativeLoadTime in ads-check-pro-shared-
  // controls.tsx, which recomputes it live from these timestamps.
  const [tkqcLastLoadedAt, setTkqcLastLoadedAt] = useState<number | null>(() => Date.now() - 1 * 24 * 60 * 60 * 1000)
  // BM Round 1 Shared Rules #9/#18 — BM's own Eye/ID-mask + "Tải BM" load
  // state, fed into the exact same shared toolbar props as TKQC's (see
  // the `loadState`/`idMasked` derivation near the toolbar render below).
  const [bmIdMasked, setBmIdMasked] = useState(false)
  const [bmLoadConfigOpen, setBmLoadConfigOpen] = useState(false)
  const [bmLoadConfigDraft, setBmLoadConfigDraft] = useState<BmLoadConfig>(DEFAULT_BM_LOAD_CONFIG)
  const [bmLoadState, setBmLoadState] = useState<'idle' | 'loading'>('idle')
  const [bmLastLoadedAt, setBmLastLoadedAt] = useState<number | null>(() => Date.now() - 1 * 24 * 60 * 60 * 1000)
  // Page Round 1 — same shared Eye/"Tải Page" load state as TKQC/BM.
  const [pageIdMasked, setPageIdMasked] = useState(false)
  const [pageLoadConfigOpen, setPageLoadConfigOpen] = useState(false)
  const [pageLoadConfigDraft, setPageLoadConfigDraft] = useState<PageLoadConfig>(DEFAULT_PAGE_LOAD_CONFIG)
  const [pageLoadState, setPageLoadState] = useState<'idle' | 'loading'>('idle')
  const [pageLastLoadedAt, setPageLastLoadedAt] = useState<number | null>(() => Date.now() - 6 * 24 * 60 * 60 * 1000)
  // Pixel #4 / Shared #19 — same shared "Tải Pixel" load state as TKQC/BM/
  // Page.
  // Pixel #6 — toolbar Eye toggles "ID Pixel" presentation only; fully
  // independent of the row-level lazy-reveal Eyes (Người dùng/TKQC/Đối
  // tác), which stay local state inside ads-check-pro-generic-table.tsx.
  const [pixelIdMasked, setPixelIdMasked] = useState(false)
  const [pixelLoadConfigOpen, setPixelLoadConfigOpen] = useState(false)
  const [pixelLoadConfigDraft, setPixelLoadConfigDraft] = useState<PixelLoadConfig>(DEFAULT_PIXEL_LOAD_CONFIG)
  const [pixelLoadState, setPixelLoadState] = useState<'idle' | 'loading'>('idle')
  const [pixelLastLoadedAt, setPixelLastLoadedAt] = useState<number | null>(() => Date.now() - 6 * 24 * 60 * 60 * 1000)
  const [tkqcRunLogRow, setTkqcRunLogRow] = useState<TkqcRow | null>(null)
  // Row ID only (not a snapshot of the row object) — removing a card
  // mutates `tkqcRows`, and the popover must reflect that live, not a
  // frozen copy captured at the moment it opened.
  const [tkqcPaymentPopover, setTkqcPaymentPopover] = useState<{ rowId: string; rect: DOMRect } | null>(null)
  const tkqcPaymentPopoverRow = tkqcPaymentPopover ? tkqcRows.find((row) => row.id === tkqcPaymentPopover.rowId) ?? null : null
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  // Control Hub setup — ONE step machine (not separate unrelated modals):
  // 'charter' (Step 1, "Tôn chỉ của Adscheck") -> 'security' (Step 2, "Cơ chế
  // bảo mật của Control Hub") -> null. Each step modal is only ever mounted
  // while it's the current step, so leaving a step (any way: its own
  // close/defer, or reopening later) always remounts fresh state (countdown
  // back to 5, checkbox back to unchecked) — never resumed mid-way.
  const [controlHubSetupStep, setControlHubSetupStep] = useState<'charter' | 'security' | 'password' | 'success' | null>(null)
  const [controlHubDeferredWarningOpen, setControlHubDeferredWarningOpen] = useState(false)
  const [controlHubSuccessToastOpen, setControlHubSuccessToastOpen] = useState(false)
  // DEMO/LOCAL UI state only — no backend marks Control Hub security as
  // configured server-side. Once true (set alongside the onboarding's own
  // success), "Cài đặt Control Hub" opens the post-setup settings modal
  // instead of restarting the onboarding flow, for the rest of this app
  // session (resets on reload, same as every other piece of session state
  // in this file).
  const [controlHubSecurityConfigured, setControlHubSecurityConfigured] = useState(false)
  const [controlHubSettingsOpen, setControlHubSettingsOpen] = useState(false)
  const [controlHubTwoFactorEnabled, setControlHubTwoFactorEnabled] = useState(false)
  const [controlHubPasskeyEnabled, setControlHubPasskeyEnabled] = useState(false)
  const [controlHubHelpOpen, setControlHubHelpOpen] = useState(false)
  // Hides the floating help entry point whenever any OTHER Control Hub
  // dialog is already active (onboarding/security/password/OTP/success/
  // post-setup settings) — avoids ever stacking the (dismissible,
  // non-critical) help modal on top of a blocking security flow.
  const controlHubDialogActive = controlHubSetupStep !== null || controlHubSettingsOpen
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const floatingPanelsRef = useRef<HTMLDivElement>(null)
  const functionLauncherRef = useRef<HTMLButtonElement>(null)
  const workflowRailButtonRef = useRef<HTMLButtonElement>(null)
  const workflowOpenedFromRail = useRef(false)
  const workspaceFrameRef = useRef<HTMLElement>(null)
  const tabsNavRef = useRef<HTMLElement>(null)
  const toolbarRegionRef = useRef<HTMLDivElement>(null)
  const curveBRegionRef = useRef<HTMLDivElement>(null)
  const [workspaceSurface, setWorkspaceSurface] = useState(() => ({
    viewBox: '0 0 1837 1205',
    path: 'M0 1205 V28 C0 0 10 0 41 0 H70.546875 C89.546875 2 88.546875 18 88.546875 28 C88.546875 38 96.546875 44 104.546875 44 H418.109375 C442.109375 44 434.909375 0 466.109375 0 H1837 V1205 Z',
  }))
  // VIA has no right-panel system at all (Kho chức năng/Quy trình/rail/right
  // shell) — production has no function catalog for it. This gates RENDERING
  // only; functionOpen/workflowOpen themselves are left untouched so the
  // prior state (10/01/11/00) restores exactly when switching back to a
  // supported asset.
  const supportsPanels = activeAsset !== 'via'
  // Closed launchers follow the existing Help control's responsive position.
  useLayoutEffect(() => {
    const help = helpButtonRef.current
    const floating = floatingPanelsRef.current
    if (!help || !floating) return
    const updateAnchor = () => {
      const rect = help.getBoundingClientRect()
      floating.style.setProperty('--help-center-x', String(rect.x + rect.width / 2) + 'px')
      floating.style.setProperty('--help-top', String(rect.y) + 'px')
    }
    updateAnchor()
    const observer = new ResizeObserver(updateAnchor)
    observer.observe(help)
    window.addEventListener('resize', updateAnchor)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateAnchor)
    }
  }, [controlHubDialogActive])
  const liveAssetTabs = assetTabs.map((tab) => tab.key === 'via' ? { ...tab, count: viaRows.length } : tab)
  const activeTab = liveAssetTabs.find((tab) => tab.key === activeAsset) ?? liveAssetTabs[0]
  const query = queries[activeAsset]
  const selectedIds = selections[activeAsset]
  const workflow = workflows[activeAsset]

  useEffect(() => () => {
    if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current)
  }, [])
  useEffect(() => {
    // State 11 (both open) is a valid, reachable state on every viewport —
    // no normalization here. This used to force-close Workflow whenever
    // both became true on mobile, which silently undid the "opening
    // Workflow also opens Function" transition the moment it happened.
    if (isDrawer) setFoldersOpen(false)
  }, [isDrawer])
  useEffect(() => {
    if (!workflowOpen || isDrawer || !workflowOpenedFromRail.current) return
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('#ads-pro-workflow .ads-workflow-close')?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isDrawer, workflowOpen])
  useLayoutEffect(() => {
    const frame = workspaceFrameRef.current
    const nav = tabsNavRef.current
    const toolbarRegion = toolbarRegionRef.current
    const curveBRegion = curveBRegionRef.current
    if (!frame || !nav || !toolbarRegion || !curveBRegion) return
    const toolbar = toolbarRegion.querySelector<HTMLElement>('.ads-pro-toolbar')
    if (!toolbar) return
    const recompute = () => {
      const frameRect = frame.getBoundingClientRect()
      const navRect = nav.getBoundingClientRect()
      const toolbarRect = toolbar.getBoundingClientRect()
      const curveBRect = curveBRegion.getBoundingClientRect()
      if (frameRect.width === 0 || frameRect.height === 0 || navRect.height === 0 || toolbarRect.width === 0 || curveBRect.width === 0) return
      const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      const activeIndex = buttons.findIndex((button) => button.id === `ads-asset-tab-${activeAsset}`)
      const activeButton = buttons[activeIndex]
      const lastButton = buttons[buttons.length - 1]
      if (!activeButton || !lastButton) return
      // Raw measurement only — button rect (curve placement is derived from
      // this alone, see resolveAnchor/PLACEMENT_RATIO in the surface module)
      // plus visible-content rect (label text ∪ count badge), kept purely for
      // debug reporting since content-width alone doesn't drive placement.
      const anchorOf = (button: HTMLButtonElement): WorkspaceSurfaceAnchor => {
        const rect = button.getBoundingClientRect()
        const buttonRect = { left: rect.left - frameRect.left, right: rect.right - frameRect.left }
        const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim())
        let contentRect = buttonRect
        if (textNode) {
          const range = document.createRange()
          range.selectNodeContents(textNode)
          const textRect = range.getBoundingClientRect()
          const badge = button.querySelector('.ads-asset-tab-count')
          const contentRightEdge = (badge ? badge.getBoundingClientRect().right : textRect.right) - frameRect.left
          contentRect = { left: textRect.left - frameRect.left, right: contentRightEdge }
        }
        return { buttonRect, contentRect }
      }
      // Curve B's own light surface must end at the Curve B region's right
      // edge (Folder+Table only) — never at the outer frame's full width,
      // which would run the surface in behind Function/Workflow/Curve C.
      // This is the ONLY thing curveBRect affects: the path's rightmost H
      // command (see buildWorkspaceSurfacePath's `frameWidth` usage) — all
      // left-side curvature/placement stays anchored to the outer frame.
      const curveBRightEdge = curveBRect.right - frameRect.left
      const toolbarClearance = Math.min(32, Math.max(12, toolbarRect.width * .06))
      const recoveryStart = toolbarRect.left - frameRect.left - toolbarClearance
      const { path, debug } = buildWorkspaceSurfacePath({
        frameWidth: curveBRightEdge,
        frameHeight: frameRect.height,
        tabRowHeight: navRect.height,
        recoveryStart,
        activeAnchor: anchorOf(activeButton),
        isFirstActive: activeIndex === 0,
        isLastActive: activeButton === lastButton,
      })
      if (import.meta.env.DEV) (window as unknown as { __curveBDebug?: unknown }).__curveBDebug = debug
      // Outer viewBox stays the FULL frame width — the dark notch-fill/
      // notch-highlight rects behind the path must keep covering the whole
      // header strip (including above Function/Workflow/Curve C) exactly as
      // before; only the light path shape itself is now width-constrained.
      setWorkspaceSurface({ viewBox: `0 0 ${frameRect.width} ${frameRect.height}`, path })

    }
    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(frame)
    observer.observe(nav)
    observer.observe(toolbar)
    observer.observe(curveBRegion)
    window.addEventListener('resize', recompute)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', recompute)
    }
  }, [activeAsset, isDrawer])

  const filteredViaRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    if (activeAsset !== 'via') return viaRows
    return viaRows.filter((row) => {
      const matchesFolder = selectedFolder === m("ui.f7a578dcbd") || row.folder === selectedFolder
      const matchesQuery = !normalized || `${row.name} ${row.sourceId} ${formatViaBrowser(row)}`.toLocaleLowerCase('vi').includes(normalized)
      return matchesFolder && matchesQuery
    })
  }, [activeAsset, query, selectedFolder, viaRows])
  // Round 1 Part 8 — currency filter composes as one more AND-term in the
  // same client-side filter chain as folder/search/availability (matches
  // traced production semantics: every toolbar filter narrows the SAME
  // already-filtered array, never replaces another).
  const filteredAdAccounts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    if (activeAsset !== 'ad-account') return tkqcRows
    return tkqcRows.filter((row) => {
      const matchesFolder = selectedFolder === m("ui.f7a578dcbd") || row.folder === selectedFolder
      const matchesQuery = !normalized || `${row.name} ${row.sourceName}`.toLocaleLowerCase('vi').includes(normalized)
      const matchesAvailability = !availableOnly || row.status === 'active'
      const matchesCurrency = tkqcCurrency === 'mix' || row.currency === tkqcCurrency
      return matchesFolder && matchesQuery && matchesAvailability && matchesCurrency
    })
  }, [activeAsset, availableOnly, query, selectedFolder, tkqcRows, tkqcCurrency])
  const filteredRestrictedAdAccounts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    if (activeAsset !== 'ad-account' || availableOnly) return []
    return tkqcRestrictedRowFixtures.filter((row) => {
      const matchesFolder = selectedFolder === m("ui.f7a578dcbd") || row.folder === selectedFolder
      const matchesQuery = !normalized || `${row.name} ${row.sourceName}`.toLocaleLowerCase('vi').includes(normalized)
      const matchesCurrency = tkqcCurrency === 'mix' || row.currency === tkqcCurrency
      return matchesFolder && matchesQuery && matchesCurrency
    })
  }, [activeAsset, availableOnly, query, selectedFolder, tkqcCurrency])
  // Options built from currencies actually present in the LOADED dataset
  // (all authorized + unauthorized rows), not an invented static ISO list
  // — matches traced production's own data-driven CurrencyMenu.
  const tkqcCurrencyOptions = useMemo(() => buildCurrencyOptions([...new Set([...tkqcRows, ...tkqcRestrictedRowFixtures].map((row) => row.currency))]), [tkqcRows])
  const filteredBmRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    if (activeAsset !== 'business') return bmRows
    if (!normalized) return bmRows
    return bmRows.filter((row) => `${row.name} ${row.bmId}`.toLocaleLowerCase('vi').includes(normalized))
  }, [activeAsset, query, bmRows])
  const filteredPageRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    if (activeAsset !== 'page' || !normalized) return pageRows
    return pageRows.filter((row) => `${row.values.name} ${row.values.id}`.toLocaleLowerCase('vi').includes(normalized))
  }, [activeAsset, query, pageRows])
  const filteredPixelRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    if (activeAsset !== 'pixel' || !normalized) return pixelRows
    return pixelRows.filter((row) => `${row.values.name} ${row.values.id}`.toLocaleLowerCase('vi').includes(normalized))
  }, [activeAsset, query, pixelRows])
  const folderCounts = useMemo(() => Object.fromEntries(folders[activeAsset].map((folder) => {
    if (activeAsset === 'via') return [folder, folder === m("ui.f7a578dcbd") ? viaRows.length : viaRows.filter((row) => row.folder === folder).length]
    if (activeAsset === 'ad-account') return [folder, folder === m("ui.f7a578dcbd") ? tkqcRows.length : tkqcRows.filter((row) => row.folder === folder).length]
    return [folder, 0]
  })), [activeAsset, folders, viaRows, tkqcRows])
  const groups = useMemo(() => resolveFunctionGroups(activeAsset), [activeAsset])
  const updateSelection = (transform: (current: string[]) => string[]) => setSelections((current) => ({
    ...current,
    [activeAsset]: transform(current[activeAsset]),
  }))
  const updateWorkflow = (transform: (current: WorkflowStep[]) => WorkflowStep[]) => {
    const asset = activeAsset
    setWorkflows((current) => ({ ...current, [asset]: transform(current[asset]) }))
  }
  // Templates are backend-API-driven in production (POST/GET/PUT/DELETE
  // /ads-check/templates, gated on useAuthStore().is_authenticated). This
  // clone has no real auth/backend, so Batch Update Part A implements a
  // CLONE DEMO PERSISTENCE local store (ads-check-pro-template-store.ts)
  // instead — not a simulation of the real API, just enough to exercise
  // save/list/load end-to-end. See that file's header comment.
  // Correction Batch 3 Part A3/A5 — traced production save-handler (see
  // ads-check-pro-template-store.ts header): `createNew` mirrors the
  // "Tạo template mới" checkbox that only appears once a template is
  // already loaded for this asset. Unchecked (the default whenever a
  // template IS loaded) updates that template in place; otherwise (no
  // template loaded, or checkbox checked) it creates a new one — which
  // then itself becomes "loaded", so the next save without reloading
  // anything continues to update THIS one, not silently fork a duplicate.
  const saveTemplateAs = (name: string, createNew: boolean) => {
    const asset = activeAsset
    const currentId = loadedTemplateIds[asset]
    if (currentId && !createNew) {
      templateStore.updateTemplate(currentId, name, asset, workflowMode, workflow, stepConfigValues[asset], threads, delayMs)
      onAnnounce(m("ui.b700cae9e9", { 0: name }), 'success')
      return
    }
    const created = templateStore.saveTemplate(name, asset, workflowMode, workflow, stepConfigValues[asset], threads, delayMs)
    setLoadedTemplateIds((current) => ({ ...current, [asset]: created.id }))
    onAnnounce(m("ui.d569f5f6cb", { 0: name }), 'success')
  }
  const renameTemplate = (id: string, name: string) => {
    templateStore.renameTemplate(id, name)
    onAnnounce(m("ui.ca247d12bb", { 0: name }), 'success')
  }
  const loadTemplate = (template: WorkflowTemplate) => {
    const asset = activeAsset
    const nextSteps: WorkflowStep[] = template.steps.map((step) => {
      stepCounter.current += 1
      return { instanceId: `${step.itemId}-${stepCounter.current}`, itemId: step.itemId, functionId: step.functionId, icon: step.icon, label: step.label, groupLabel: step.groupLabel }
    })
    // Cross-asset templates are scoped to the CURRENT asset on load (Part
    // A6) — not enough production evidence to justify switching the active
    // tab out from under the user or cross-populating another asset's
    // workflow, so this avoids the corruption risk the spec flags.
    setWorkflows((current) => ({ ...current, [asset]: nextSteps }))
    setStepConfigValues((current) => ({ ...current, [asset]: Object.fromEntries(template.steps.map((step) => [step.itemId, { ...step.config }])) }))
    setExpandedStepIds((current) => ({ ...current, [asset]: new Set() }))
    setThreads(template.threads)
    setDelayMs(template.delayMs)
    setWorkflowModeState(template.workflowMode)
    // Traced production `applyTemplate`: unconditional overwrite + a plain
    // success toast, no confirmation prompt even if a different template
    // was already loaded (Part A6/A9) — reproduced as-is.
    setLoadedTemplateIds((current) => ({ ...current, [asset]: template.id }))
    onAnnounce(m("ui.ab6b631615", { 0: template.name }), 'success')
  }
  const deleteTemplate = (id: string) => {
    templateStore.deleteTemplate(id)
    // Deleting the currently-loaded template clears its provenance pointer
    // (the current workflow's content is untouched — only the "this came
    // from template X" tracking is cleaned up so a later Save doesn't try
    // to update an id that no longer exists).
    setLoadedTemplateIds((current) => {
      const next = { ...current }
      for (const key of Object.keys(next) as AdsAssetKey[]) if (next[key] === id) next[key] = null
      return next
    })
  }

  // TKQC cell interactions (Batch Update Part D) — production has no real
  // backend for any of these in this clone, so each just updates the demo
  // row locally (never a fake "success" from a real API call).
  // Correction Batch 2 Part F: 3 distinct local demo actions replacing the
  // old bare inline editor — change (set a new limit), reset (zero out the
  // spent-against-limit counter, keeping the limit), delete (clear the
  // limit entirely, leaving total spend untouched).
  const changeTkqcSpendLimit = (rowId: string, value: number) => {
    setTkqcRows((current) => current.map((row) => row.id === rowId ? { ...row, spendLimit: value } : row))
    onAnnounce(m("ui.edbe816af6"), 'success')
  }
  const resetTkqcSpendLimit = (rowId: string) => {
    setTkqcRows((current) => current.map((row) => row.id === rowId ? { ...row, spentAgainstLimit: 0 } : row))
    onAnnounce(m("ui.bf7f7dc528"), 'success')
  }
  const deleteTkqcSpendLimit = (rowId: string) => {
    setTkqcRows((current) => current.map((row) => row.id === rowId ? { ...row, spendLimit: null } : row))
    onAnnounce(m("ui.455ce3bb8e"), 'success')
  }
  const saveTkqcNote = (rowId: string, note: string) => {
    setTkqcRows((current) => current.map((row) => row.id === rowId ? { ...row, note: note || null } : row))
    onAnnounce(m("ui.d758801225"), 'success')
  }
  // Deterministic demo check (Batch Update Part D5) — NOT a real Meta
  // request. Resolves after a short delay to "OK" for most rows, or one of
  // the traced non-OK states (hold-error/no-payment) for a couple of demo
  // rows so both branches are exercisable.
  const checkTkqcHoldNeed = (rowId: string) => {
    setTkqcRows((current) => current.map((row) => row.id === rowId ? { ...row, holdNeed: { status: 'checking' } } : row))
    window.setTimeout(() => {
      setTkqcRows((current) => current.map((row) => {
        if (row.id !== rowId) return row
        const outcome = row.order % 7 === 0 ? 'hold-error' : row.order % 11 === 0 ? 'no-payment' : 'ok'
        return { ...row, holdNeed: { status: outcome } }
      }))
    }, 600)
  }
  // Round 1 Part 3 — CLONE-LOCAL ONLY: there is no real payment backend to
  // call here (see the batch's own data-safety rule). "Removing" a card
  // moves it from `paymentMethods` (current) into `paymentMethodsHistory`
  // (previously attached) rather than deleting it outright — this is what
  // lets the popover's "Đã gỡ trước đây" section show something real
  // after a removal, instead of the removal just vanishing data.
  const removeTkqcPaymentMethod = (rowId: string, cardId: string) => {
    setTkqcRows((current) => current.map((row) => {
      if (row.id !== rowId) return row
      const removed = row.paymentMethods.find((card) => card.id === cardId)
      if (!removed) return row
      return { ...row, paymentMethods: row.paymentMethods.filter((card) => card.id !== cardId), paymentMethodsHistory: [...row.paymentMethodsHistory, removed] }
    }))
    onAnnounce(m("ui.89424cdf71"), 'success')
  }
  const removeAllTkqcPaymentMethods = (rowId: string) => {
    setTkqcRows((current) => current.map((row) => row.id === rowId ? { ...row, paymentMethods: [], paymentMethodsHistory: [...row.paymentMethodsHistory, ...row.paymentMethods] } : row))
    onAnnounce(m("ui.3bb592b012"), 'success')
  }
  const saveBmNote = (rowId: string, note: string) => {
    setBmRows((current) => current.map((row) => row.id === rowId ? { ...row, note: note || null } : row))
    onAnnounce(m("ui.d758801225"), 'success')
  }
  const saveGenericNote = (asset: 'page' | 'pixel', rowId: string, note: string) => {
    const setter = asset === 'page' ? setPageRows : setPixelRows
    setter((current) => current.map((row) => row.id === rowId ? { ...row, values: { ...row.values, note: note || null } } : row))
    onAnnounce(m("ui.d758801225"), 'success')
  }

  // Correction Batch 2 Part K: promote/demote walk the confirmed
  // admin > advertiser > analyst hierarchy one step at a time; remove drops
  // the admin from the row's array (adminCount is derived, updates itself).
  const promoteTkqcAdmin = (rowId: string, adminId: string) => {
    setTkqcRows((current) => current.map((row) => row.id !== rowId ? row : {
      ...row, admins: row.admins.map((admin) => admin.id === adminId ? { ...admin, role: tkqcRoleUp(admin.role) } : admin),
    }))
  }
  const demoteTkqcAdmin = (rowId: string, adminId: string) => {
    setTkqcRows((current) => current.map((row) => row.id !== rowId ? row : {
      ...row, admins: row.admins.map((admin) => admin.id === adminId ? { ...admin, role: tkqcRoleDown(admin.role) } : admin),
    }))
  }
  const removeTkqcAdmin = (rowId: string, adminId: string) => {
    setTkqcRows((current) => current.map((row) => row.id !== rowId ? row : { ...row, admins: row.admins.filter((admin) => admin.id !== adminId) }))
    onAnnounce(m("ui.9c47eb2890"), 'success')
  }

  // Correction Batch 2 Part M/W: one shared mutation path for all 6 BM
  // resource kinds — SL* counts are derived from these same arrays, so a
  // removal/role-change here updates the cell immediately with no separate
  // count field to keep in sync.
  const bmResourceItems = (row: BmRow, kind: BmResourceKind) => {
    switch (kind) {
      case 'partner': return row.partners
      case 'admin': return row.admins
      case 'adAccount': return row.adAccounts
      case 'page': return row.pages
      case 'instagram': return row.instagramAccounts
      case 'waba': return row.wabaAccounts
    }
  }
  const removeBmResourceItems = (rowId: string, kind: BmResourceKind, ids: string[]) => {
    setBmRows((current) => current.map((row) => {
      if (row.id !== rowId) return row
      switch (kind) {
        case 'partner': return { ...row, partners: row.partners.filter((item) => !ids.includes(item.id)) }
        case 'admin': return { ...row, admins: row.admins.filter((item) => !ids.includes(item.id)) }
        case 'adAccount': return { ...row, adAccounts: row.adAccounts.filter((item) => !ids.includes(item.id)) }
        case 'page': return { ...row, pages: row.pages.filter((item) => !ids.includes(item.id)) }
        case 'instagram': return { ...row, instagramAccounts: row.instagramAccounts.filter((item) => !ids.includes(item.id)) }
        case 'waba': return { ...row, wabaAccounts: row.wabaAccounts.filter((item) => !ids.includes(item.id)) }
      }
    }))
    onAnnounce(m("ui.b646173872"), 'success')
  }
  const changeBmAdminRole = (rowId: string, ids: string[], role: BmAdminRole) => {
    setBmRows((current) => current.map((row) => row.id === rowId ? { ...row, admins: row.admins.map((admin) => ids.includes(admin.id) ? { ...admin, role } : admin) } : row))
    onAnnounce(m("ui.08be88220f"), 'success')
  }

  // Correction Batch 2 Part G2-G5: the only place any row's Tiến trình cell
  // ever changes — driven by an actual Workflow "Bắt đầu quy trình" click
  // (see onStart below), for the rows selected in the CURRENT asset tab
  // only. Not a real execution: a local ramp 0→100 then back to idle ("-"),
  // clearly a clone-demo visualization, never a fake Meta success (Part X).
  const applyExecutionProgress = (asset: AdsAssetKey, ids: string[], value: number | null) => {
    if (asset === 'ad-account') setTkqcRows((current) => current.map((row) => ids.includes(row.id) ? { ...row, progressPercent: value } : row))
    else if (asset === 'business') setBmRows((current) => current.map((row) => ids.includes(row.id) ? { ...row, progressPercent: value } : row))
    else if (asset === 'page') setPageRows((current) => current.map((row) => ids.includes(row.id) ? { ...row, values: { ...row.values, progress: value } } : row))
    else if (asset === 'pixel') setPixelRows((current) => current.map((row) => ids.includes(row.id) ? { ...row, values: { ...row.values, progress: value } } : row))
  }
  // Round 1 Parts 11/12 — real name/id for the execution-history log
  // entries (see startWorkflowExecution below). Generic (page/pixel) rows
  // have no dedicated "account id" concept, so they fall back to their own
  // row id — fine since only TKQC's UI reads this model this round.
  const rowLabelFor = (asset: AdsAssetKey, rowId: string): { name: string; accountId: string } => {
    if (asset === 'ad-account') { const row = tkqcRows.find((candidate) => candidate.id === rowId); return { name: row?.name ?? rowId, accountId: row?.accountId ?? rowId } }
    if (asset === 'business') { const row = bmRows.find((candidate) => candidate.id === rowId); return { name: row?.name ?? rowId, accountId: row?.bmId ?? rowId } }
    if (asset === 'page' || asset === 'pixel') { const row = (asset === 'page' ? pageRows : pixelRows).find((candidate) => candidate.id === rowId); return { name: String(row?.values.name ?? rowId), accountId: rowId } }
    return { name: rowId, accountId: rowId }
  }

  const startWorkflowExecution = () => {
    const asset = activeAsset
    const ids = selectedIds
    if (ids.length === 0 || asset === 'via') return
    applyExecutionProgress(asset, ids, 0)
    // Round 1 Parts 11/12 — a SEPARATE, real step-based log runs alongside
    // the pre-existing visual ramp above (untouched, still drives BM/Page/
    // Pixel's own simple "-"-resetting progress bar exactly as before).
    // This is the shared execution/history model: one log entry per
    // (step, selected row), grouped under one runId.
    const steps = workflow
    const runId = executionHistory.startRun(asset, ids, steps.length)
    let loggedSteps = 0
    const logStepsUpTo = (stepCount: number) => {
      for (; loggedSteps < stepCount; loggedSteps++) {
        const step = steps[loggedSteps]
        for (const rowId of ids) {
          const info = rowLabelFor(asset, rowId)
          executionHistory.logStep(runId, asset, { id: rowId, name: info.name, accountId: info.accountId }, step.label)
        }
      }
    }
    let percent = 0
    const intervalId = window.setInterval(() => {
      percent = Math.min(100, percent + 20)
      applyExecutionProgress(asset, ids, percent)
      logStepsUpTo(Math.min(steps.length, Math.round((percent / 100) * steps.length)))
      if (percent >= 100) {
        logStepsUpTo(steps.length)
        window.clearInterval(intervalId)
        executionCleanupsRef.current = executionCleanupsRef.current.filter((cleanup) => cleanup !== clearRamp)
        const timeoutId = window.setTimeout(() => {
          applyExecutionProgress(asset, ids, null)
          executionCleanupsRef.current = executionCleanupsRef.current.filter((cleanup) => cleanup !== clearReset)
        }, 1500)
        const clearReset = () => window.clearTimeout(timeoutId)
        executionCleanupsRef.current.push(clearReset)
      }
    }, 450)
    const clearRamp = () => window.clearInterval(intervalId)
    executionCleanupsRef.current.push(clearRamp)
    onAnnounce(m("ui.c92153eb34", { 0: threads, 1: delayMs }), 'success')
  }

  const chooseAsset = (asset: AdsAssetKey) => {
    workflowOpenedFromRail.current = false
    setActiveAsset(asset)
    setSelectedFolder(m("ui.f7a578dcbd"))
    setFoldersOpen(!isDrawer)
    // functionOpen/workflowOpen are workspace-level (not per-asset) — switching
    // tabs must only swap panel CONTENT, never open/close the panels themselves.
  }
  const toggleSelected = (id: string) => updateSelection((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const toggleAll = (ids: string[]) => updateSelection((current) => ids.length > 0 && ids.every((id) => current.includes(id)) ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])])
  const addFolder = () => {
    const nextFolder = m("ui.d81a268fd7", { 0: folders[activeAsset].length })
    setFolders((current) => ({ ...current, [activeAsset]: [...current[activeAsset], nextFolder] }))
    setSelectedFolder(nextFolder)
    onAnnounce(m("ui.1808e9ca9e", { 0: nextFolder }), 'success')
  }
  const renameFolder = (folder: string, nextName: string) => {
    const name = nextName.trim()
    const allFolder = m("ui.f7a578dcbd")
    if (!name || folder === allFolder || folders[activeAsset].some((item) => item !== folder && item.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) return
    setFolders((current) => ({ ...current, [activeAsset]: current[activeAsset].map((item) => item === folder ? name : item) }))
    setSelectedFolder((current) => current === folder ? name : current)
    if (activeAsset === 'via') setViaRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: name } : row))
    else if (activeAsset === 'ad-account') setTkqcRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: name } : row))
    else if (activeAsset === 'business') setBmRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: name } : row))
    else if (activeAsset === 'page') setPageRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: name } : row))
    else setPixelRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: name } : row))
  }
  const deleteFolder = (folder: string) => {
    const allFolder = m("ui.f7a578dcbd")
    if (folder === allFolder) return
    setFolders((current) => ({ ...current, [activeAsset]: current[activeAsset].filter((item) => item !== folder) }))
    setSelectedFolder(allFolder)
    if (activeAsset === 'via') setViaRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: allFolder } : row))
    else if (activeAsset === 'ad-account') setTkqcRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: allFolder } : row))
    else if (activeAsset === 'business') setBmRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: allFolder } : row))
    else if (activeAsset === 'page') setPageRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: allFolder } : row))
    else setPixelRows((current) => current.map((row) => row.folder === folder ? { ...row, folder: allFolder } : row))
  }
  const createViaFolderForMove = (name: string): string | null => {
    const nextFolder = name.trim()
    if (!nextFolder) return null
    if (folders.via.some((folder) => folder.toLocaleLowerCase('vi') === nextFolder.toLocaleLowerCase('vi'))) {
      onAnnounce(m("ui.9c202d245f"))
      return null
    }
    setFolders((current) => ({ ...current, via: [...current.via, nextFolder] }))
    onAnnounce(m("ui.1808e9ca9e", { 0: nextFolder }), 'success')
    return nextFolder
  }
  // VIA Audit Batch 1 Part A6 — traced production guard is a soft re-entry
  // check (`t.loading||e("refresh")`), i.e. a second click while already
  // refreshing is simply IGNORED rather than restarting the timer.
  const refresh = () => {
    if (refreshing) return
    setRefreshing(true)
    refreshTimer.current = window.setTimeout(() => {
      refreshTimer.current = null
      setRefreshing(false)
      onAnnounce(m("ui.e698f06252", { 0: activeTab.label }), 'success')
    }, 420)
  }
  const openDownloadPanel = (rect: DOMRect) => setDownloadPanel({ rect })
  const openTagPickerForSelection = (anchorEl: HTMLElement) => {
    if (selectedIds.length === 0) { onAnnounce(m("ui.1bc3f4c83d")); return }
    setTagPickerTarget({ asset: activeAsset, rowIds: selectedIds, anchorEl, placement: 'top' })
  }
  const openTagPickerForRow = (rowId: string, anchorEl: HTMLElement) => {
    setTagPickerTarget({ asset: activeAsset, rowIds: [rowId], anchorEl, placement: 'bottom' })
  }
  const moveSelected = (destination: string) => {
    if (selectedIds.length === 0) return
    setViaRows((current) => current.map((row) => selectedIds.includes(row.id) ? { ...row, folder: destination } : row))
    updateSelection(() => [])
    setMoveFolderOpen(false)
    onAnnounce(m("ui.7952589770", { 0: destination }), 'success')
  }
  const removeSelectedFromFolder = () => {
    if (selectedFolder === m("ui.f7a578dcbd") || selectedIds.length === 0) return
    setViaRows((current) => current.map((row) => selectedIds.includes(row.id) && row.folder === selectedFolder ? { ...row, folder: m("ui.f7a578dcbd") } : row))
    updateSelection(() => [])
    setRemoveFolderConfirmOpen(false)
    onAnnounce(m("ui.df59b1e2c4", { 0: selectedFolder }), 'success')
  }
  const addFunction = (fn: AdsFunctionDefinition, group: FunctionGroup) => {
    const key = functionKey(fn)
    stepCounter.current += 1
    const nextStep = { instanceId: `${key}-${stepCounter.current}`, itemId: key, functionId: fn.functionId, icon: fn.icon, label: fn.name, groupLabel: group.label }
    if (workflowMode === 'single') {
      // Production's selectFunction in single mode always REPLACES the
      // whole selection with just the clicked function, even if something
      // else (or the same function) was already selected — never appends.
      updateWorkflow(() => [nextStep])
    } else {
      // Workflow mode: the row's click/Enter/Space always fires "select"
      // regardless of current selected state (no separate disabled-when-
      // selected branch) — so this must itself be idempotent rather than
      // relying on the caller to avoid re-invoking it.
      if (workflow.some((step) => step.itemId === key)) return
      updateWorkflow((current) => [...current, nextStep])
    }
    // Production's selectFunction always REPLACES expandedStepIds with a
    // Set containing just the new function (r.value = new Set([e])) — so
    // adding a step collapses every other previously-expanded step and
    // auto-expands only the new one, in both modes.
    const asset = activeAsset
    setExpandedStepIds((current) => ({ ...current, [asset]: new Set([key]) }))
    if (isDrawer) setFunctionOpen(false)
    setWorkflowOpen(true)
    onAnnounce(m("ui.d8e331bd08", { 0: fn.name }), 'success')
  }
  const removeStepState = (asset: AdsAssetKey, itemId: string) => {
    setExpandedStepIds((current) => {
      if (!current[asset].has(itemId)) return current
      const next = new Set(current[asset])
      next.delete(itemId)
      return { ...current, [asset]: next }
    })
    setStepConfigValues((current) => {
      if (!(itemId in current[asset])) return current
      const nextAssetValues = { ...current[asset] }
      delete nextAssetValues[itemId]
      return { ...current, [asset]: nextAssetValues }
    })
  }
  const removeFunction = (fn: AdsFunctionDefinition) => {
    const key = functionKey(fn)
    updateWorkflow((current) => current.filter((step) => step.itemId !== key))
    removeStepState(activeAsset, key)
    onAnnounce(m("ui.d292c5aff8", { 0: fn.name }), 'info')
  }
  const removeWorkflowStep = (instanceId: string, itemId: string) => {
    updateWorkflow((current) => current.filter((step) => step.instanceId !== instanceId))
    removeStepState(activeAsset, itemId)
  }
  const toggleStepExpanded = (itemId: string) => {
    // Unlike add (which replaces the whole Set), toggling an existing step
    // only flips ITS OWN membership — production's toggleStepExpanded does
    // the same (multiple steps can stay expanded at once via manual toggle).
    const asset = activeAsset
    setExpandedStepIds((current) => {
      const next = new Set(current[asset])
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return { ...current, [asset]: next }
    })
  }
  const handleStepConfigChange = (itemId: string, fieldKey: string, value: string) => {
    const asset = activeAsset
    setStepConfigValues((current) => ({
      ...current,
      [asset]: { ...current[asset], [itemId]: { ...current[asset][itemId], [fieldKey]: value } },
    }))
  }
  const reorderWorkflowStep = (fromIndex: number, toIndex: number) => updateWorkflow((current) => {
    if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= current.length) return current
    const next = [...current]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    return next
  })
  // setMode: no-op if unchanged (matches production's early return). Only
  // switching TO single prunes — every asset's workflow is truncated to its
  // FIRST step (production: replaceSelectedFunctions([ids[0]])), and the
  // total removed across all 4 assets is reported in one toast, exactly
  // mirroring the real registerModePruner/reduce behavior (a single global
  // mode switch prunes every asset's store, not just the active one).
  const setWorkflowMode = (mode: WorkflowMode) => {
    if (mode === workflowMode) return
    if (mode === 'single') {
      let removed = 0
      const next = { ...workflows }
      const nextExpanded = { ...expandedStepIds }
      const nextConfig = { ...stepConfigValues }
      for (const asset of nonViaAssetKeys) {
        const steps = next[asset]
        if (steps.length > 1) {
          removed += steps.length - 1
          const [first] = steps
          next[asset] = [first]
          // Pruned-away steps' expanded/config entries would otherwise be
          // orphaned — clean them up the same way production's own pruner
          // resets stepDelaySeconds/selectedTemplate on this exact transition.
          nextExpanded[asset] = new Set([first.itemId])
          nextConfig[asset] = first.itemId in stepConfigValues[asset] ? { [first.itemId]: stepConfigValues[asset][first.itemId] } : {}
        }
      }
      setWorkflows(next)
      setExpandedStepIds(nextExpanded)
      setStepConfigValues(nextConfig)
      if (removed > 0) onAnnounce(m("ui.ecb8a112f2", { 0: removed }), 'info')
    }
    setWorkflowModeState(mode)
    try { localStorage.setItem(WORKFLOW_MODE_STORAGE_KEY, mode) } catch { /* storage unavailable */ }
  }
  const openFolders = () => {
    if (isDrawer) { setFunctionOpen(false); setWorkflowOpen(false) }
    setFoldersOpen(true)
  }
  const closeFunctions = () => {
    setFunctionOpen(false)
    window.requestAnimationFrame(() => functionLauncherRef.current?.focus())
  }
  const openFunctions = () => {
    // Opening Function only ever opens Function — no prerequisite the other
    // way, and no side effect on workflowOpen (state 01 stays valid; this
    // can legally take 01 -> 11).
    if (isDrawer) setFoldersOpen(false)
    setFunctionOpen(true)
    window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#ads-pro-function-library input')?.focus())
  }
  const openWorkflow = () => {
    workflowOpenedFromRail.current = false
    if (isDrawer) setFoldersOpen(false)
    setWorkflowOpen(true)
  }
  const openWorkflowFromRail = () => {
    workflowOpenedFromRail.current = true
    setWorkflowOpen(true)
  }
  const closeWorkflow = () => {
    const shouldRestoreRailFocus = workflowOpenedFromRail.current && !isDrawer
    setWorkflowOpen(false)
    if (shouldRestoreRailFocus) {
      window.requestAnimationFrame(() => {
        workflowRailButtonRef.current?.focus()
        workflowOpenedFromRail.current = false
      })
    } else {
      workflowOpenedFromRail.current = false
    }
  }
  const toggleAvailability = () => {
    const next = !availableOnly
    setAvailableOnly(next)
    onAnnounce(next ? m("ui.c426a1ef28") : m("ui.650d70ffc8"))
  }
  const handleTabKeys = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    const currentIndex = tabs.indexOf(event.target as HTMLButtonElement)
    if (currentIndex < 0) return
    event.preventDefault()
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    tabs[nextIndex]?.click()
    tabs[nextIndex]?.focus()
  }

  // Derived from the LIVE row arrays (not a stale snapshot captured when the
  // panel opened) so any mutation while a panel is open is reflected
  // immediately, matching Part M/K's "updates immediately" requirement.
  const bmResourcePanelRow = bmResourcePanel ? bmRows.find((row) => row.id === bmResourcePanel.rowId) ?? null : null
  const tkqcSpendLimitRow = tkqcSpendLimitRowId ? tkqcRows.find((row) => row.id === tkqcSpendLimitRowId) ?? null : null
  const tkqcAdminPanelRow = tkqcAdminPanelRowId ? tkqcRows.find((row) => row.id === tkqcAdminPanelRowId) ?? null : null

  const showFunctionPanel = supportsPanels && functionOpen
  const showWorkflowPanel = supportsPanels && workflowOpen
  // BM Round 1 Shared Rules #9/#18, extended to Page and Pixel — the
  // toolbar's load-state/id-mask props are asset-generic; this feeds
  // whichever asset is active into that same channel (TKQC's/BM's/Page's/
  // Pixel's own state), instead of a per-asset toolbar branch.
  const isBmActive = activeAsset === 'business'
  const isPageActive = activeAsset === 'page'
  const isPixelActive = activeAsset === 'pixel'
  const activeLoadState = isBmActive ? bmLoadState : isPageActive ? pageLoadState : isPixelActive ? pixelLoadState : tkqcLoadState
  const activeLastLoadedAt = isBmActive ? bmLastLoadedAt : isPageActive ? pageLastLoadedAt : isPixelActive ? pixelLastLoadedAt : tkqcLastLoadedAt
  const activeIdMasked = isBmActive ? bmIdMasked : isPageActive ? pageIdMasked : isPixelActive ? pixelIdMasked : tkqcIdMasked
  const openActiveLoadConfig = () => { if (isBmActive) setBmLoadConfigOpen(true); else if (isPageActive) setPageLoadConfigOpen(true); else if (isPixelActive) setPixelLoadConfigOpen(true); else setTkqcLoadConfigOpen(true) }
  const toggleActiveIdMask = () => { if (isBmActive) setBmIdMasked((value) => !value); else if (isPageActive) setPageIdMasked((value) => !value); else if (isPixelActive) setPixelIdMasked((value) => !value); else setTkqcIdMasked((value) => !value) }
  const toolbar = <AdsCheckProToolbar tab={activeTab} query={query} refreshing={refreshing} availableOnly={availableOnly} foldersOpen={foldersOpen} functionsOpen={functionOpen} workflowOpen={workflowOpen} onQuery={(value) => setQueries((current) => ({ ...current, [activeAsset]: value }))} onRefresh={refresh} onDownload={openDownloadPanel} onOpenColumnSettings={() => setColumnSettingsOpen(true)} onOpenUiSettings={(rect) => setUiSettingsPanelRect(rect)} onToggleAvailability={toggleAvailability} onOpenFolders={openFolders} onOpenFunctions={openFunctions} onOpenWorkflow={openWorkflow} onAnnounce={onAnnounce}
    onOpenTkqcLoadConfig={openActiveLoadConfig} tkqcLoadState={activeLoadState} tkqcLastLoadedAt={activeLastLoadedAt}
    tkqcDateRange={tkqcDateRange} onOpenTkqcDateRange={(rect) => setTkqcDateRangePanelRect(rect)}
    tkqcIdMasked={activeIdMasked} onToggleTkqcIdMask={toggleActiveIdMask}
    tkqcCurrency={tkqcCurrency} onOpenTkqcCurrencyFilter={(rect) => setTkqcCurrencyPanelRect(rect)}
    onOpenHistory={() => setHistoryModalOpen(true)}
    onOpenControlHubSetup={() => {
      // Once security setup has (demo) succeeded, "Cài đặt Control Hub"
      // opens the post-setup settings modal instead of restarting the
      // onboarding/Tôn chỉ/Cơ chế bảo mật flow from scratch.
      if (controlHubSecurityConfigured) { setControlHubSettingsOpen(true); return }
      setControlHubSetupStep('charter')
    }}
  />
  return <section ref={workspaceFrameRef} className={`ads-pro-workspace is-${activeAsset}${foldersOpen ? ' has-folder-panel' : ''}${showFunctionPanel ? ' has-function-panel' : ''}${showWorkflowPanel ? ' has-workflow-panel' : ''}`} aria-labelledby="ads-pro-workspace-title">
    <svg className="ads-pro-workspace-surface" aria-hidden="true" focusable="false" viewBox={workspaceSurface.viewBox}>
      <defs>
        {/* Color-Version correction — this SVG paints its OWN separate dark
            notch-fill/highlight (behind the asset-tabs row) and light
            workspace "wash" tint, duplicating (not reusing) the outer
            shell's CSS background — previously missed by the CSS-only
            token pass, which is why inactive asset tabs still looked
            green under V2. `stop-color` is a real CSS property on SVG
            presentation attributes, so it resolves `var()` the same as
            any other color declaration; fallback = exact current literal. */}
        <linearGradient id={surfaceId + "-wash"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--cv-workspace-wash-strong, rgba(77, 255, 127, 0.06))" />
          <stop offset="0.519231" stopColor="var(--cv-workspace-wash-soft, rgba(77, 255, 127, 0.02))" />
          <stop offset="1" stopColor="var(--cv-workspace-wash-strong, rgba(77, 255, 127, 0.06))" />
        </linearGradient>
        <linearGradient id={surfaceId + "-notch-fill"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--cv-app-bg-dark, #001707)" />
          <stop offset="1" stopColor="var(--cv-app-bg-dark-2, #00250c)" />
        </linearGradient>
        <radialGradient id={surfaceId + "-notch-highlight"} cx="50%" cy="-20%" r="42%">
          <stop offset="0" stopColor="var(--cv-app-ambient, rgba(57, 178, 82, 0.24))" />
          <stop offset="1" stopColor="var(--cv-app-ambient-transparent, rgba(40, 113, 81, 0))" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${surfaceId}-notch-fill)`} />
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${surfaceId}-notch-highlight)`} />
      <path d={workspaceSurface.path} fill="rgba(255, 255, 255, 0.95)" />
      <path d={workspaceSurface.path} fill={`url(#${surfaceId}-wash)`} />
    </svg>
    {/* Reuse the runtime surface contour, excluding its closing side/bottom edges. */}
    <svg className="ads-pro-curve-b-neon" aria-hidden="true" focusable="false" viewBox={workspaceSurface.viewBox}>
      <AdsCheckCurveNeon path={workspaceSurface.path.replace(/^M0 [^ ]+ V([^ ]+) /, 'M0 $1 ').split(' V')[0]} curve="b" />
    </svg>
    <h1 className="sr-only" id="ads-pro-workspace-title">{t("ui.6949c5370b")}</h1>
    <div className="ads-pro-header-row">
      <nav ref={tabsNavRef} className="ads-asset-tabs" role="tablist" aria-label={t("ui.0b08185f7d")} onKeyDown={handleTabKeys}>
        {tx(liveAssetTabs.map((tab) => <button key={tab.key} id={`ads-asset-tab-${tab.key}`} role="tab" type="button" tabIndex={activeAsset === tab.key ? 0 : -1} aria-selected={activeAsset === tab.key} aria-controls="ads-asset-tabpanel" data-state={activeAsset === tab.key ? 'active' : 'inactive'} data-active={activeAsset === tab.key ? '' : undefined} onClick={() => chooseAsset(tab.key)}>{tx(tab.label)}<span className="ads-asset-tab-count">{tab.count}</span></button>))}
      </nav>
      {/* Desktop: toolbar shares this row with the tabs, inside Curve B's own
          column — see .ads-pro-header-row/.ads-pro-toolbar. Drawer/mobile
          viewports keep the toolbar in its pre-existing spot above the table
          (unchanged, out of this round's scope) since that layout already
          has its own wrapping/ordering rules at narrow widths. */}
      <div ref={toolbarRegionRef} className="ads-pro-toolbar-region">{!isDrawer && toolbar}</div>
    </div>
    <div id="ads-asset-tabpanel" className="ads-pro-workspace-body" role="tabpanel" aria-labelledby={`ads-asset-tab-${activeAsset}`}>
      <div ref={curveBRegionRef} className="ads-pro-main-region">
        <AdsCheckProFolderPanel asset={activeAsset} folders={folders[activeAsset]} counts={folderCounts} selected={selectedFolder} open={foldersOpen} onSelect={setSelectedFolder} onAdd={addFolder} onRename={renameFolder} onDelete={setFolderDeleteTarget} onClose={() => setFoldersOpen(false)} onOpen={openFolders} />
        <section ref={assetPanelRef} className="ads-pro-asset-panel" aria-label={tx(`${activeTab.label} workspace`)} tabIndex={-1}>
          {isDrawer && toolbar}
          <AdsCheckProAssetTable asset={activeAsset} assetLabel={assetLabels[activeAsset]} totalCount={activeTab.count} rows={filteredViaRows} tkqcRows={filteredAdAccounts} tkqcRestrictedRows={filteredRestrictedAdAccounts} bmRows={filteredBmRows} pageRows={filteredPageRows} pixelRows={filteredPixelRows} selectedIds={selectedIds} uiSettings={uiSettings} tags={tagSystem.tags} getRowTagIds={(rowId) => tagSystem.getRowTagIds(activeAsset, rowId)} onToggle={toggleSelected} onToggleAll={toggleAll} onClearSelection={() => updateSelection(() => [])} onOpenTagPickerForSelection={openTagPickerForSelection} onOpenTagPickerForRow={openTagPickerForRow} activeFolder={selectedFolder} onOpenMoveSelected={() => { setTagPickerTarget(null); setMoveFolderOpen(true) }} onRemoveSelectedFromFolder={() => setRemoveFolderConfirmOpen(true)} onEditNote={(row) => setDialog({ mode: 'note', row })} onDelete={(row) => setDialog({ mode: 'delete', row })} onOpenTkqcSpendLimitModal={(row) => setTkqcSpendLimitRowId(row.id)} onEditTkqcNote={setTkqcNoteRow} onCheckTkqcHoldNeed={checkTkqcHoldNeed} onOpenTkqcAdminPanel={(row) => setTkqcAdminPanelRowId(row.id)} onEditBmNote={setBmNoteRow} onOpenBmResourcePanel={(row, kind) => setBmResourcePanel({ rowId: row.id, kind })} onEditGenericNote={(rowId, note) => {
            const row = (activeAsset === 'page' ? pageRows : pixelRows).find((candidate) => candidate.id === rowId)
            setGenericNoteTarget({ asset: activeAsset as 'page' | 'pixel', rowId, name: String(row?.values.name ?? rowId), note })
          }} columnSettingsOpen={columnSettingsOpen} onCloseColumnSettings={() => setColumnSettingsOpen(false)}
            tkqcIdMasked={tkqcIdMasked}
            tkqcProgressFor={(rowId) => executionHistory.progressFor('ad-account', rowId)}
            onOpenTkqcRunLog={setTkqcRunLogRow}
            onOpenTkqcPaymentPopover={(row, rect) => setTkqcPaymentPopover({ rowId: row.id, rect })}
            bmIdMasked={bmIdMasked}
            pageIdMasked={pageIdMasked} pixelIdMasked={pixelIdMasked}
          />
        </section>
        {tagPickerTarget && <AdsProTagPicker
          tags={tagSystem.tags}
          assignedTagIds={tagSystem.tags.filter((tag) => tagPickerTarget.rowIds.every((rowId) => tagSystem.getRowTagIds(tagPickerTarget.asset, rowId).includes(tag.id))).map((tag) => tag.id)}
          anchorEl={tagPickerTarget.anchorEl}
          placement={tagPickerTarget.placement}
          onClose={() => setTagPickerTarget(null)}
          onToggleAssign={(tagId) => { const allAssigned = tagPickerTarget.rowIds.every((rowId) => tagSystem.getRowTagIds(tagPickerTarget.asset, rowId).includes(tagId)); tagSystem.setAssignMany(tagPickerTarget.asset, tagPickerTarget.rowIds, tagId, !allAssigned) }}
          onCreate={(name, colorHex) => tagSystem.createTag(name, colorHex)}
          onDeleteTag={(tagId) => tagSystem.deleteTag(tagId)}
          onReorder={(from, to) => tagSystem.reorderTags(from, to)}
        />}
      </div>
    </div>
    <div ref={floatingPanelsRef} className={`ads-pro-floating-panels${showFunctionPanel || showWorkflowPanel ? ' has-open-panel' : ''}`} onKeyDown={(event) => {
      if (event.key !== 'Escape' || !(event.target instanceof HTMLElement)) return
      if (event.target.closest('[aria-modal="true"]')) return
      if (event.target.closest('#ads-pro-function-library')) { event.stopPropagation(); closeFunctions() }
      if (event.target.closest('#ads-pro-workflow')) { event.stopPropagation(); closeWorkflow() }
    }}>
    {supportsPanels && <aside className="ads-pro-panel-launchers" aria-label={t("ui.f67492a781")}>
      <button ref={functionLauncherRef} type="button" className="ads-pro-panel-launcher is-library" title={t("ui.495881f617")} aria-label={tx(m("ui.653eaf83e1", { 0: assetLabels[activeAsset] }))} aria-controls="ads-pro-function-library" aria-expanded={functionOpen} onClick={() => functionOpen ? closeFunctions() : openFunctions()}><Layers3 size={22} aria-hidden="true" /></button>
      <button ref={workflowRailButtonRef} type="button" className="ads-pro-panel-launcher is-process" title={tx(m("ui.c8e42616d4", { 0: assetLabels[activeAsset] }))} aria-label={tx(m("ui.c8e42616d4", { 0: assetLabels[activeAsset] }))} aria-controls="ads-pro-workflow" aria-expanded={workflowOpen} onClick={() => workflowOpen ? closeWorkflow() : openWorkflowFromRail()}><Workflow size={22} aria-hidden="true" /></button>
    </aside>}
    {tx(supportsPanels && <AdsCheckProFunctionLibrary key={`${activeAsset}-functions`} asset={activeAsset as Exclude<AdsAssetKey, 'via'>} assetLabel={assetLabels[activeAsset]} query={functionQueries[activeAsset]} onQueryChange={(value) => setFunctionQueries((current) => ({ ...current, [activeAsset]: value }))} groups={groups} selectedStepIds={workflow.map((step) => step.itemId)} open={functionOpen} workflowMode={workflowMode} collapsedGroups={collapsedGroups} onToggleGroup={toggleGroupCollapsed} onClose={closeFunctions} onAdd={addFunction} onRemove={removeFunction} onOpenWorkflowMode={() => setWorkflowModeDialogOpen(true)} onAnnounce={onAnnounce} />)}
    {tx(supportsPanels && <AdsCheckProWorkflowPanel
      key={`${activeAsset}-workflow`}
      assetLabel={assetLabels[activeAsset]}
      steps={workflow}
      workflowMode={workflowMode}
      expandedStepIds={expandedStepIds[activeAsset]}
      stepConfigValues={stepConfigValues[activeAsset]}
      threads={threads}
      delayMs={delayMs}
      selectedAccountCount={selectedIds.length}
      open={workflowOpen}
      onClose={closeWorkflow}
      onToggleExpand={toggleStepExpanded}
      onRemove={removeWorkflowStep}
      onReorder={reorderWorkflowStep}
      onConfigChange={handleStepConfigChange}
      onThreadsChange={setThreads}
      onDelayMsChange={setDelayMs}
      templates={templateStore.templates.filter((template) => template.asset === activeAsset)}
      loadedTemplateId={loadedTemplateIds[activeAsset]}
      onSaveTemplate={saveTemplateAs}
      onRenameTemplate={renameTemplate}
      onLoadTemplate={loadTemplate}
      onDeleteTemplate={deleteTemplate}
      onStart={startWorkflowExecution}
    />)}
    </div>
    <AdsCheckProLocalDialog mode={dialog?.mode ?? null} row={dialog?.row ?? null} onClose={() => setDialog(null)} onSaveNote={(rowId, note) => { setViaRows((current) => current.map((row) => row.id === rowId ? { ...row, note } : row)); onAnnounce(m("ui.d758801225"), 'success') }} onDelete={(rowId) => { setViaRows((current) => current.filter((row) => row.id !== rowId)); updateSelection((current) => current.filter((id) => id !== rowId)); window.requestAnimationFrame(() => assetPanelRef.current?.focus()); onAnnounce(m("ui.5df2fdbac2"), 'success') }} />
    <AdsCheckProLocalDialog mode={tkqcNoteRow ? 'note' : null} row={tkqcNoteRow} onClose={() => setTkqcNoteRow(null)} onSaveNote={(rowId, note) => saveTkqcNote(rowId, note)} onDelete={() => {}} />
    <AdsCheckProLocalDialog mode={bmNoteRow ? 'note' : null} row={bmNoteRow} onClose={() => setBmNoteRow(null)} onSaveNote={(rowId, note) => saveBmNote(rowId, note)} onDelete={() => {}} />
    <AdsCheckProLocalDialog mode={genericNoteTarget ? 'note' : null} row={genericNoteTarget ? { id: genericNoteTarget.rowId, name: genericNoteTarget.name, note: genericNoteTarget.note } : null} onClose={() => setGenericNoteTarget(null)} onSaveNote={(rowId, note) => { if (genericNoteTarget) saveGenericNote(genericNoteTarget.asset, rowId, note) }} onDelete={() => {}} />
    {tkqcSpendLimitRow && <AdsProTkqcSpendLimitModal
      row={tkqcSpendLimitRow}
      onClose={() => setTkqcSpendLimitRowId(null)}
      onChangeLimit={changeTkqcSpendLimit}
      onResetLimit={resetTkqcSpendLimit}
      onDeleteLimit={deleteTkqcSpendLimit}
    />}
    {tkqcAdminPanelRow && <AdsProTkqcAdminPanel
      row={tkqcAdminPanelRow}
      onClose={() => setTkqcAdminPanelRowId(null)}
      onPromote={promoteTkqcAdmin}
      onDemote={demoteTkqcAdmin}
      onRemove={removeTkqcAdmin}
    />}
    {bmResourcePanel && bmResourcePanelRow && <AdsProBmResourcePanel
      kind={bmResourcePanel.kind}
      bmName={bmResourcePanelRow.name}
      bmId={bmResourcePanelRow.bmId}
      items={bmResourceItems(bmResourcePanelRow, bmResourcePanel.kind)}
      onClose={() => setBmResourcePanel(null)}
      onRemove={(ids) => removeBmResourceItems(bmResourcePanel.rowId, bmResourcePanel.kind, ids)}
      onRoleChange={bmResourcePanel.kind === 'admin' ? (ids, role) => changeBmAdminRole(bmResourcePanel.rowId, ids, role) : undefined}
    />}
    <AdsCheckProWorkflowModeDialog open={workflowModeDialogOpen} mode={workflowMode} onClose={() => setWorkflowModeDialogOpen(false)} onSave={(mode) => { setWorkflowMode(mode); setWorkflowModeDialogOpen(false) }} />
    {downloadPanel && activeAsset === 'via' && <AdsProDownloadPanel
      anchorRect={downloadPanel.rect}
      rows={filteredViaRows}
      selectedRows={filteredViaRows.filter((row) => selectedIds.includes(row.id))}
      columns={viaExportColumns}
      tableName="via-list-v2"
      idOnlyKey={VIA_EXPORT_ID_KEY}
      onClose={() => setDownloadPanel(null)}
    />}
    {downloadPanel && activeAsset === 'ad-account' && <AdsProDownloadPanel
      anchorRect={downloadPanel.rect}
      rows={filteredAdAccounts}
      selectedRows={filteredAdAccounts.filter((row) => selectedIds.includes(row.id))}
      columns={tkqcExportColumns}
      tableName="ad-accounts"
      idOnlyKey="accountId"
      onClose={() => setDownloadPanel(null)}
    />}
    {downloadPanel && activeAsset === 'business' && <AdsProDownloadPanel
      anchorRect={downloadPanel.rect}
      rows={filteredBmRows}
      selectedRows={filteredBmRows.filter((row) => selectedIds.includes(row.id))}
      columns={bmExportColumns}
      tableName="bm-data-loading-v5"
      idOnlyKey="bmId"
      onClose={() => setDownloadPanel(null)}
    />}
    {downloadPanel && activeAsset === 'page' && <AdsProDownloadPanel
      anchorRect={downloadPanel.rect}
      rows={filteredPageRows}
      selectedRows={filteredPageRows.filter((row) => selectedIds.includes(row.id))}
      columns={pageExportColumns}
      tableName="pages-v2"
      idOnlyKey="id"
      onClose={() => setDownloadPanel(null)}
    />}
    {downloadPanel && activeAsset === 'pixel' && <AdsProDownloadPanel
      anchorRect={downloadPanel.rect}
      rows={filteredPixelRows}
      selectedRows={filteredPixelRows.filter((row) => selectedIds.includes(row.id))}
      columns={pixelExportColumns}
      tableName="pixel"
      idOnlyKey="id"
      onClose={() => setDownloadPanel(null)}
    />}
    {uiSettingsPanelRect && <AdsProUiSettingsPanel anchorRect={uiSettingsPanelRect} settings={uiSettings} onChange={setUiSetting} onClose={() => setUiSettingsPanelRect(null)} />}
    {tkqcDateRangePanelRect && <AdsProTkqcDateRangePicker anchorRect={tkqcDateRangePanelRect} value={tkqcDateRange} onApply={setTkqcDateRange} onClose={() => setTkqcDateRangePanelRect(null)} />}
    {tkqcCurrencyPanelRect && <AdsProCurrencyFilterPanel anchorRect={tkqcCurrencyPanelRect} value={tkqcCurrency} options={tkqcCurrencyOptions} onChange={setTkqcCurrency} onClose={() => setTkqcCurrencyPanelRect(null)} />}
    {tx(tkqcLoadConfigOpen && <AdsProTkqcLoadConfigModal
      initial={tkqcLoadConfigDraft}
      onClose={() => setTkqcLoadConfigOpen(false)}
      onStart={(config) => {
        setTkqcLoadConfigDraft(config)
        setTkqcLoadConfigOpen(false)
        setTkqcLoadState('loading')
        window.setTimeout(() => {
          setTkqcLoadState('idle')
          setTkqcLastLoadedAt(Date.now())
          onAnnounce(m("ui.782b01814a"), 'success')
        }, 1200)
      }}
    />)}
    {tx(bmLoadConfigOpen && <AdsProBmLoadConfigModal
      initial={bmLoadConfigDraft}
      onClose={() => setBmLoadConfigOpen(false)}
      onStart={(config) => {
        setBmLoadConfigDraft(config)
        setBmLoadConfigOpen(false)
        setBmLoadState('loading')
        window.setTimeout(() => {
          setBmLoadState('idle')
          setBmLastLoadedAt(Date.now())
          onAnnounce(m("ui.84af8b2813"), 'success')
        }, 1200)
      }}
    />)}
    {tx(pageLoadConfigOpen && <AdsProPageLoadConfigModal
      initial={pageLoadConfigDraft}
      onClose={() => setPageLoadConfigOpen(false)}
      onStart={(config) => {
        setPageLoadConfigDraft(config)
        setPageLoadConfigOpen(false)
        setPageLoadState('loading')
        window.setTimeout(() => {
          setPageLoadState('idle')
          setPageLastLoadedAt(Date.now())
          onAnnounce(m("ui.077a8eec8b"), 'success')
        }, 1200)
      }}
    />)}
    {tx(pixelLoadConfigOpen && <AdsProPixelLoadConfigModal
      initial={pixelLoadConfigDraft}
      onClose={() => setPixelLoadConfigOpen(false)}
      onStart={(config) => {
        setPixelLoadConfigDraft(config)
        setPixelLoadConfigOpen(false)
        setPixelLoadState('loading')
        window.setTimeout(() => {
          setPixelLoadState('idle')
          setPixelLastLoadedAt(Date.now())
          onAnnounce(m("ui.46a6807367"), 'success')
        }, 1200)
      }}
    />)}
    {tkqcPaymentPopover && tkqcPaymentPopoverRow && <AdsProTkqcPaymentPopover
      anchorRect={tkqcPaymentPopover.rect}
      accountName={tkqcPaymentPopoverRow.name}
      accountId={tkqcPaymentPopoverRow.accountId}
      businessId={tkqcPaymentPopoverRow.businessId}
      current={tkqcPaymentPopoverRow.paymentMethods}
      history={tkqcPaymentPopoverRow.paymentMethodsHistory}
      onRemoveCard={(cardId) => removeTkqcPaymentMethod(tkqcPaymentPopoverRow.id, cardId)}
      onRemoveAll={() => removeAllTkqcPaymentMethods(tkqcPaymentPopoverRow.id)}
      onClose={() => setTkqcPaymentPopover(null)}
    />}
    {tkqcRunLogRow && <AdsProTkqcRunLogModal
      accountName={tkqcRunLogRow.name}
      entries={executionHistory.entriesForRow('ad-account', tkqcRunLogRow.id)}
      onRetryFailed={() => executionHistory.retryEntries(executionHistory.entriesForRow('ad-account', tkqcRunLogRow.id).filter((entry) => entry.status === 'error').map((entry) => entry.id))}
      onClose={() => setTkqcRunLogRow(null)}
    />}
    {historyModalOpen && <AdsProTkqcHistoryModal
      runs={executionHistory.runs}
      entries={executionHistory.entries}
      onRetryFailed={executionHistory.retryEntries}
      onClose={() => setHistoryModalOpen(false)}
    />}
    {moveFolderOpen && <AdsProMoveFolderDialog folders={folders.via} counts={folderCounts} selectedCount={selectedIds.length} onClose={() => setMoveFolderOpen(false)} onConfirm={moveSelected} onCreate={createViaFolderForMove} />}
    {folderDeleteTarget && <AdsProConfirmDialog title={t("ui.d7a8b7c302")} description={t("ui.e8b9c8d403", { 0: folderDeleteTarget })} confirmLabel={t("ui.aa1d94fc16")} onConfirm={() => deleteFolder(folderDeleteTarget)} onClose={() => setFolderDeleteTarget(null)} />}
    {removeFolderConfirmOpen && <div className="ads-move-folder-layer" role="presentation"><section className="ads-remove-folder-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ads-remove-folder-title"><h2 id="ads-remove-folder-title">{t("ui.98546e09a7")}</h2><p>{t("ui.a0d4114e39")}{" "}{selectedIds.length} {" "}{t("ui.293ac4c130")}{selectedFolder}”?</p><footer><button type="button" onClick={() => setRemoveFolderConfirmOpen(false)}>{t("ui.34ca764caf")}</button><button type="button" className="is-danger" onClick={removeSelectedFromFolder}>{t("ui.98546e09a7")}</button></footer></section></div>}
    {/* Control Hub setup — Step 1 ("Tôn chỉ của Adscheck"). Closing it (X) just
        exits the flow with no trace — the "deferred" warning is Step 2's
        own concern (its content only makes sense once the user has
        actually seen the security requirements), not Step 1's. */}
    {controlHubSetupStep === 'charter' && <AdsCheckProControlHubCharterModal
      onClose={() => setControlHubSetupStep(null)}
      onContinue={() => setControlHubSetupStep('security')}
    />}
    {/* Control Hub setup — Step 2 ("Cơ chế bảo mật của Control Hub"). "Thiết
        lập sau" (or ESC, wired to the same onDefer via useOverlayFocus)
        closes WITHOUT marking anything complete and surfaces the
        deferred-setup warning instead; ticking the checkbox + continuing
        advances to Step 3 ("Tạo mật khẩu mã hóa"). */}
    {controlHubSetupStep === 'security' && <AdsCheckProControlHubSecurityModal
      onDefer={() => { setControlHubSetupStep(null); setControlHubDeferredWarningOpen(true) }}
      onContinue={() => setControlHubSetupStep('password')}
    />}
    {/* Control Hub setup — Step 3 ("Tạo mật khẩu mã hóa Control Hub" ->
        "Thiết lập xác thực lệnh bằng 2FA" -> Authenticator Setup -> demo
        2FA verify). All internal steps of the ONE
        AdsCheckProControlHubPasswordModal (its own credentialsStep), not
        separately-mounted modals — so password/confirm survive navigating
        2FA -> "Quay lại" -> password within the same open flow. `onBack`
        is only used by the password sub-step's own "Quay lại" (returns to
        Step 2, Cơ chế bảo mật — its checkbox naturally starts unchecked
        again, fresh mount). `onContinue` stays the honest placeholder
        (close whole flow + demo toast) for the 'passkey' method, which has
        no designed flow at all yet. `onSecuritySetupComplete` fires only
        once the component's own isolated demo verify-attempt counter
        reaches success (2nd attempt) — see that component's own comments;
        it is never a real backend/TOTP confirmation. Plain close (X) exits
        the whole flow with no side effect and discards
        password/confirm/OTP/demo-attempt-count for good (component fully
        unmounts). */}
    {tx(controlHubSetupStep === 'password' && <AdsCheckProControlHubPasswordModal
      onClose={() => setControlHubSetupStep(null)}
      onBack={() => setControlHubSetupStep('security')}
      onContinue={() => { setControlHubSetupStep(null); onAnnounce(m("ui.e5a954ddbb"), 'success') }}
      onSecuritySetupComplete={() => { setControlHubSetupStep('success'); setControlHubSuccessToastOpen(true); setControlHubDeferredWarningOpen(false); setControlHubSecurityConfigured(true) }}
    />)}
    {/* Control Hub setup — final success screen (demo-only, see the
        password modal's own isolated verify-attempt counter). This marks
        completion only in local UI state — no server call claims the
        account is actually secured. */}
    {controlHubSetupStep === 'success' && <AdsCheckProControlHubSuccessModal onClose={() => setControlHubSetupStep(null)} />}
    {controlHubSuccessToastOpen && <AdsCheckProControlHubSuccessToast onClose={() => setControlHubSuccessToastOpen(false)} />}
    {/* Control Hub POST-SETUP settings — a separate modal from the
        onboarding step-machine above, only reachable once
        controlHubSecurityConfigured is true. "Hủy" discards any unsaved
        2FA/Passkey toggle drafts (the modal re-initializes its draft state
        from these committed values every time it opens); "Lưu tùy chỉnh"
        commits them here. Password change's own "Xác thực" has no
        email-verification screen yet, so it's a clean, honest placeholder
        toast rather than invented UI/fake success. */}
    {tx(controlHubSettingsOpen && <AdsCheckProControlHubSettingsModal
      onClose={() => setControlHubSettingsOpen(false)}
      twoFactorEnabled={controlHubTwoFactorEnabled}
      passkeyEnabled={controlHubPasskeyEnabled}
      onSave={({ twoFactorEnabled, passkeyEnabled }) => { setControlHubTwoFactorEnabled(twoFactorEnabled); setControlHubPasskeyEnabled(passkeyEnabled) }}
      onRequestPasswordChangeVerification={() => onAnnounce(m("ui.dfebd3bff0"), 'success')}
    />)}
    {controlHubDeferredWarningOpen && <AdsCheckProControlHubDeferredWarning onClose={() => setControlHubDeferredWarningOpen(false)} />}
    {/* Control Hub — floating help entry point. Mounted once at this
        shared workspace level (not per asset tab), so switching VIA/TKQC/
        BM/Page/Pixel never duplicates it. Hidden while any other Control
        Hub dialog is active (see controlHubDialogActive above) so it never
        stacks on top of a blocking security flow. */}
    {tx(!controlHubDialogActive && <button ref={helpButtonRef} type="button" className="ads-control-hub-help-fab" aria-label={t("ui.b6a25c9e0f")} onClick={() => setControlHubHelpOpen(true)}>?</button>)}
    {controlHubHelpOpen && <AdsCheckProControlHubHelpModal onClose={() => setControlHubHelpOpen(false)} />}
    {/* CORRECTION x2 — reuses the EXACT existing splash (AdsCheckV8LoadingScreen),
        not a new component, but scoped to the WHOLE Ads Check Pro workspace
        (.ads-pro-workspace — the common ancestor of the asset tabs, the
        toolbar/Aa row, the folder panel, the table AND pagination) instead
        of just the table panel — .ads-pro-workspace is already
        position:relative and its own ancestor (.ads-main-panel) already
        owns the outer rounded-corner clip (overflow:hidden;border-radius),
        so this overlay is clipped to the exact same Curve B shape for free.
        Same shared `refresh()` handler as every asset tab, so this single
        overlay still covers all 5 (VIA/TKQC/BM/Page/Pixel). */}
    {refreshing && <div className="ads-pro-refresh-overlay"><AdsCheckV8LoadingScreen variant="data" /></div>}
  </section>
}
