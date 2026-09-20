import { m, t } from '@/i18n'
export type AdsAssetKey = 'via' | 'ad-account' | 'business' | 'page' | 'pixel'

// Workflow Mode — production's global (not per-asset) single/workflow
// switch. Exact storage key + default + invalid-value fallback traced from
// references/remotes/adaccounts/436.e5c83aa9.js's `dO()`/`dL()` composable.
export type WorkflowMode = 'single' | 'workflow'
export const WORKFLOW_MODE_STORAGE_KEY = 'adaccounts.workflow-mode.v1'

export function loadWorkflowMode(): WorkflowMode {
  try {
    const stored = localStorage.getItem(WORKFLOW_MODE_STORAGE_KEY)
    return stored === 'single' || stored === 'workflow' ? stored : 'workflow'
  } catch {
    return 'workflow'
  }
}

// Workflow step config fields — Round 5. Traced from references/remotes/
// adaccounts/97.fdaad52b.js's per-function field i18n namespaces (exact
// label/placeholder/hint text, not invented). This is a DELIBERATELY
// PARTIAL schema: the production bundle has no literal "fields[]" array
// with type/required/sensitive metadata anywhere in the fetched chunks —
// only per-function i18n copy. Two representative functions are modeled
// here (a single required text field, and a select + required textarea)
// to exercise the generic renderer; the other 77 catalog entries render
// with zero config fields (their production forms, where they exist, are
// not traceable from static assets alone — see Round 5 report).
export type StepFieldType = 'text' | 'textarea' | 'select'
export type StepFieldOption = { value: string; label: string }
export type StepFieldDefinition = {
  key: string
  type: StepFieldType
  label: string
  placeholder?: string
  hint?: string
  // `required` is a REASONABLE INFERENCE from each field's semantic
  // purpose (e.g. a rename operation needs a non-empty name) — no literal
  // "required" boolean was found anywhere in the static bundle.
  required?: boolean
  options?: StepFieldOption[]
}

export const stepConfigFieldsByFunctionId: Record<string, StepFieldDefinition[]> = {
  // "Đổi tên TKQC" — adaccounts.tkqc.rename.fields.newName
  rename: [
    { key: 'newName', type: 'text', label: m("ui.4bf802da89"), placeholder: m("ui.1106df21c1"), required: true },
  ],
  // "Quản lý nhóm tài sản" — adaccounts.assetGroup.fields.* — production's
  // real form has ~9 fields with mode-dependent visibility (assetIds only
  // for BM add-modes, shareBagIds/partnerBmIds only for share mode, confirm
  // checkboxes only for delete mode, etc.). Modeled here as a SIMPLIFIED,
  // always-visible subset (mode + groupName) — a representative "select +
  // required textarea" example, not a full replica of this one function's
  // conditional form.
  'manage-asset-group': [
    {
      key: 'mode', type: 'select', label: m("ui.fed024b82c"), required: true,
      options: [
        { value: 'create', label: m("ui.33228e70ee") },
        { value: 'addAdAccount', label: m("ui.cff6ae8206") },
        { value: 'addPage', label: m("ui.95eff9afc4") },
        { value: 'removeAdAccount', label: m("ui.6745b45f5c") },
        { value: 'removePage', label: m("ui.7a82e551ae") },
        { value: 'share', label: m("ui.33a5900e19") },
        { value: 'delete', label: m("ui.427696887f") },
        { value: 'list', label: m("ui.c3cc29eace") },
      ],
    },
    {
      key: 'groupName', type: 'textarea', label: m("ui.9d32cf7322"), required: true,
      placeholder: m("ui.cae28477ac"),
      hint: m("ui.141761a512"),
    },
  ],
}

export function getStepConfigFields(functionId: string): StepFieldDefinition[] {
  return stepConfigFieldsByFunctionId[functionId] ?? []
}

export function isStepConfigValid(functionId: string, values: Record<string, string>): boolean {
  return getStepConfigFields(functionId).every((field) => !field.required || (values[field.key]?.trim().length ?? 0) > 0)
}

// WorkflowRunnerControls ("Luồng"/"Delay(ms)") — traced from references/
// remotes/adaccounts/436.e5c83aa9.js's exact clamp functions:
// threads: Math.min(20, Math.max(1, Math.round(v) || 1))
// delayMs: Math.max(0, Math.round(v) || 0)
// Both are GLOBAL (module-level `ij.L()`, not per-asset) — confirmed by
// every asset's own composable destructuring the SAME `{threads, delayMs}`
// pair, unlike pin/order which are genuinely per-asset-keyed.
export const RUNNER_THREADS_MIN = 1
export const RUNNER_THREADS_MAX = 20
export const RUNNER_THREADS_DEFAULT = 1
export const RUNNER_DELAY_MS_DEFAULT = 0
export function clampRunnerThreads(value: number): number {
  return Math.min(RUNNER_THREADS_MAX, Math.max(RUNNER_THREADS_MIN, Math.round(value) || RUNNER_THREADS_DEFAULT))
}
export function clampRunnerDelayMs(value: number): number {
  return Math.max(0, Math.round(value) || RUNNER_DELAY_MS_DEFAULT)
}

export type AdsAssetTab = {
  key: AdsAssetKey
  label: string
  count: number
  loadLabel: string
}

export type ViaConnection = {
  id: string
  order: number
  name: string
  sourceId: string
  status: 'connected' | 'offline'
  browserNumber: number | null
  lastConnectedAgeKey: string
  folder: string
  // Tag is no longer stored on the row — Batch Update Part B replaces the
  // old free-text stub with the real Tag system (ads-check-pro-tag-system.ts),
  // an association keyed by `${asset}:${id}` in its own store.
  note?: string
}

// Canonical, cross-asset group order (production's own commercialTaxonomy
// group order — verified against the real Ads Check Pro bundle). Each asset
// only ever renders the subset of these it actually has non-hidden functions
// for, but always in this relative order — never a per-asset custom order.
export type AdsFunctionGroupId =
  | 'ads-check-pro' | 'super-share' | 'remove-hidden-admin' | 'change-account-info'
  | 'share-pixel' | 'payment-billing' | 'ads-management' | 'account-appeal-support' | 'unclassified'

export const FUNCTION_GROUP_ORDER: AdsFunctionGroupId[] = [
  'ads-check-pro', 'super-share', 'remove-hidden-admin', 'change-account-info',
  'share-pixel', 'payment-billing', 'ads-management', 'account-appeal-support', 'unclassified',
]

// Production's own group display labels (commercialTaxonomy.groups.*) — do
// not invent alternate wording per asset, production uses the same label
// for a given group id across every asset that has it.
export const functionGroupLabels: Record<AdsFunctionGroupId, string> = {
  'ads-check-pro': 'Asset Management',
  'super-share': 'Super Share',
  'remove-hidden-admin': m("ui.d1a8659e0c"),
  'change-account-info': m("ui.4d0b571804"),
  'share-pixel': 'Share Pixel',
  'payment-billing': 'Payment & Billing',
  'ads-management': m("ui.e39b455d0f"),
  'account-appeal-support': m("ui.fad4676ce1"),
  unclassified: m("ui.e91bd87d0d"),
}

// One entry per PRODUCTION function. `functionId` is the canonical stable
// identity — never derive identity from display label or array position.
// `icon` is a lucide-react kebab-case icon name; for the 2 functions whose
// production icon has no lucide equivalent ("restart", "invoice-01") the
// closest semantic lucide substitute is used instead (noted inline) — every
// other icon here is the exact production icon name.
export type AdsFunctionDefinition = {
  ownerTab: Exclude<AdsAssetKey, 'via'>
  groupId: AdsFunctionGroupId
  functionId: string
  name: string
  icon: string
  // Production Guide-video URL — absent only for the 5 hidden entries and
  // "check-hold" (confirmed absent in production too, not an extraction gap).
  videoUrl?: string
  hidden?: true
}

// functionId alone is not globally unique across assets (4 production ids
// are reused under 2-3 different ownerTabs — e.g. "manage-asset-group" on
// ad-account/business/page). Use this composite key for React list keys,
// selection lookups, and workflow-step identity instead of raw functionId —
// functionId itself stays untouched as pure production metadata.
export function functionKey(fn: { ownerTab: string; functionId: string }): string {
  return `${fn.ownerTab}:${fn.functionId}`
}

export const assetTabs: AdsAssetTab[] = [
  { key: 'via', label: 'VIA', count: 97, loadLabel: m("ui.ea7c994430") },
  { key: 'ad-account', label: m("ui.108854e9fd"), count: 60, loadLabel: m("ui.3fb3538c23") },
  { key: 'business', label: 'BM', count: 40, loadLabel: m("ui.8c0be81908") },
  { key: 'page', label: 'Page', count: 45, loadLabel: m("ui.fe88199b66") },
  { key: 'pixel', label: 'Pixel', count: 30, loadLabel: m("ui.c4cb767382") },
]

const connectionAgeKeys = [
  'ui.c137da16c1', 'ui.ba6c9c3ecd', 'ui.acc384a865', 'ui.71f10b9e8a',
  'ui.034861838a', 'ui.6aca20273a', 'ui.6aca20273a', 'ui.1e4b5bedc9',
  'ui.1e4b5bedc9', 'ui.1e4b5bedc9', 'ui.7b619fc695', 'ui.366464fce2',
  'ui.366464fce2', 'ui.c137da16c1', 'ui.c137da16c1', 'ui.1948d41bff',
]

export const initialViaConnections: ViaConnection[] = Array.from({ length: 97 }, (_, index) => ({
  id: `via-demo-${String(index + 1).padStart(2, '0')}`,
  order: index + 1,
  name: `VIA Demo ${String(index + 1).padStart(2, '0')}`,
  sourceId: `1000000000${String(101 + index).padStart(3, '0')}`,
  status: index === 0 ? 'connected' : 'offline',
  browserNumber: index === 0 ? null : (index % 5) + 2,
  lastConnectedAgeKey: connectionAgeKeys[index % connectionAgeKeys.length],
  folder: m("ui.f7a578dcbd"),
}))

export function formatViaBrowser(row: ViaConnection) {
  return row.browserNumber === null ? t("ui.00fb4274c6") : t("ui.7c8066c158", { 0: String(row.browserNumber).padStart(2, '0') })
}

export function formatViaLastConnected(row: ViaConnection) {
  return t("ui.a543ac3891", { 0: t(row.lastConnectedAgeKey) })
}

// TKQC's own row fixtures/schema now live in ads-check-pro-tkqc-data.ts
// (Batch Update Part D) — the 31-column production schema outgrew this
// file's simple per-asset fixture pattern.

// The exact production function catalog — 79 entries total (page 18,
// businesses 28, adaccounts 27, pixel 6), extracted from the real Ads Check
// Pro bundle (references/, see Function Store research notes). Hidden
// entries (`hidden: true`) exist in production but are never shown in the
// real Kho chức năng UI — kept here (not deleted) so the data stays a
// faithful mirror of the source, filtered out at render time instead.
export const functionCatalog: AdsFunctionDefinition[] = [
  // --- adaccounts / TKQC (27 total, 23 visible) ---
  { ownerTab: 'ad-account', groupId: 'change-account-info', functionId: 'rename', name: m("ui.8aebdf00f7"), icon: 'pencil', videoUrl: 'https://www.youtube.com/watch?v=Ma0CiuXZyKE' },
  { ownerTab: 'ad-account', groupId: 'remove-hidden-admin', functionId: 'remove-hidden-user', name: m("ui.0adb7b53e4"), icon: 'unlink', videoUrl: 'https://www.youtube.com/watch?v=CZ8QFXuwgZA' },
  { ownerTab: 'ad-account', groupId: 'remove-hidden-admin', functionId: 'remove-user', name: m("ui.4dbf2ccfd5"), icon: 'unlink', videoUrl: 'https://www.youtube.com/watch?v=DwHqCZD05eg' },
  { ownerTab: 'ad-account', groupId: 'remove-hidden-admin', functionId: 'remove-bm-user-access', name: m("ui.ff75c2bc06"), icon: 'unlink', videoUrl: 'https://www.youtube.com/watch?v=3QK79FoTkYU' },
  { ownerTab: 'ad-account', groupId: 'super-share', functionId: 'share-partner', name: m("ui.167d744a94"), icon: 'share-2', videoUrl: 'https://www.youtube.com/watch?v=_h6xI0ou3ew' },
  { ownerTab: 'ad-account', groupId: 'super-share', functionId: 'remove-partner', name: m("ui.5e76821627"), icon: 'circle-x', videoUrl: 'https://www.youtube.com/watch?v=DmeSw3VQt9U' },
  { ownerTab: 'ad-account', groupId: 'ads-check-pro', functionId: 'open-close-account', name: m("ui.c1da914e3c"), icon: 'refresh-cw', videoUrl: 'https://www.youtube.com/watch?v=lxb7rFeA7Ro' },
  { ownerTab: 'ad-account', groupId: 'ads-check-pro', functionId: 'spend-limit', name: m("ui.d01f008352"), icon: 'bar-chart-2', videoUrl: 'https://www.youtube.com/watch?v=jd6wxR42a0E' },
  { ownerTab: 'ad-account', groupId: 'change-account-info', functionId: 'change-info', name: m("ui.237068ef46"), icon: 'edit', videoUrl: 'https://www.youtube.com/watch?v=nQp6StbQNFM' },
  { ownerTab: 'ad-account', groupId: 'payment-billing', functionId: 'activate-prepay', name: m("ui.1f32cc0aef"), icon: 'bolt', videoUrl: 'https://www.youtube.com/watch?v=mL0frC8gnms' },
  { ownerTab: 'ad-account', groupId: 'super-share', functionId: 'add-user', name: m("ui.f2c11f154d"), icon: 'user', videoUrl: 'https://www.youtube.com/watch?v=XihrA_ekHIY' },
  { ownerTab: 'ad-account', groupId: 'super-share', functionId: 'assign-permission', name: m("ui.b5416006da"), icon: 'shield-check', videoUrl: 'https://www.youtube.com/watch?v=C8XF2hnkWKE' },
  { ownerTab: 'ad-account', groupId: 'super-share', functionId: 'manage-asset-group', name: m("ui.2684a3c7e4"), icon: 'folder', videoUrl: 'https://www.youtube.com/watch?v=ALuy_2HIcYA' },
  { ownerTab: 'ad-account', groupId: 'super-share', functionId: 'add-bm-line2', name: m("ui.ca53415b82"), icon: 'send', videoUrl: 'https://www.youtube.com/watch?v=xcdCIUA7KiA' },
  { ownerTab: 'ad-account', groupId: 'payment-billing', functionId: 'add-card', name: m("ui.f5313bda98"), icon: 'plus', hidden: true },
  { ownerTab: 'ad-account', groupId: 'payment-billing', functionId: 'delete-card', name: m("ui.b9d01abb25"), icon: 'trash-2', videoUrl: 'https://www.youtube.com/watch?v=Qh7iTbNqkG4' },
  { ownerTab: 'ad-account', groupId: 'payment-billing', functionId: 'set-default-card', name: m("ui.7e4372148c"), icon: 'credit-card', videoUrl: 'https://www.youtube.com/watch?v=8IAr6lMFFgQ' },
  { ownerTab: 'ad-account', groupId: 'payment-billing', functionId: 'pay-debt', name: m("ui.cdcca133b8"), icon: 'credit-card', videoUrl: 'https://www.youtube.com/watch?v=jr52SQj-Vtw' },
  { ownerTab: 'ad-account', groupId: 'payment-billing', functionId: 'download-invoices', name: m("ui.814dea766a"), icon: 'receipt', videoUrl: 'https://www.youtube.com/watch?v=_puoueCQcfI' }, // production icon "invoice-01" has no lucide equivalent
  { ownerTab: 'ad-account', groupId: 'payment-billing', functionId: 'check-hold', name: 'Check Hold', icon: 'eye' },
  { ownerTab: 'ad-account', groupId: 'ads-management', functionId: 'campaign-manager', name: m("ui.a1505c7ee0"), icon: 'settings', hidden: true },
  { ownerTab: 'ad-account', groupId: 'ads-management', functionId: 'import-campaign-xlsx', name: m("ui.f2c338a38c"), icon: 'upload', videoUrl: 'https://www.youtube.com/watch?v=yviqzFncEBY' },
  { ownerTab: 'ad-account', groupId: 'ads-management', functionId: 'seed-camp', name: m("ui.28409c1b4a"), icon: 'megaphone', hidden: true },
  { ownerTab: 'ad-account', groupId: 'account-appeal-support', functionId: 'appeal-account', name: m("ui.5c7a722e1a"), icon: 'star', videoUrl: 'https://www.youtube.com/watch?v=mIsYVxsIEV8' },
  { ownerTab: 'ad-account', groupId: 'account-appeal-support', functionId: 'get-tkbm-link', name: m("ui.fb65d6b3de"), icon: 'link', videoUrl: 'https://www.youtube.com/watch?v=Yk2aQa3gvZs' },
  { ownerTab: 'ad-account', groupId: 'account-appeal-support', functionId: 'get-xmdt-link', name: m("ui.ae4ee0fc4b"), icon: 'link', videoUrl: 'https://www.youtube.com/watch?v=YIDGEdUqQkA' },
  { ownerTab: 'ad-account', groupId: 'account-appeal-support', functionId: 'schedule-meta-call', name: m("ui.f27661549e"), icon: 'phone', hidden: true },

  // --- businesses / BM (28 total, 28 visible) ---
  { ownerTab: 'business', groupId: 'super-share', functionId: 'share-bm-users', name: m("ui.706818d1d2"), icon: 'share-2', videoUrl: 'https://www.youtube.com/watch?v=0VESujG4XIw' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'manage-bm-admins', name: m("ui.05dc3ddb07"), icon: 'users', videoUrl: 'https://www.youtube.com/watch?v=VWZA30SnjuM' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'remove-partner', name: m("ui.9c7d823316"), icon: 'trash', videoUrl: 'https://www.youtube.com/watch?v=nDtLZsFW8nY' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'create-bm', name: m("ui.5737f1312e"), icon: 'building-2', videoUrl: 'https://www.youtube.com/watch?v=Y1pWQ0x8NSc' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'leave-bm', name: m("ui.7aa687ee01"), icon: 'log-out', videoUrl: 'https://www.youtube.com/watch?v=lx4DnJxhu74' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'delete-bm', name: m("ui.63d6b51cfb"), icon: 'trash-2', videoUrl: 'https://www.youtube.com/watch?v=dtU8HCyRHcs' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'create-adaccount', name: m("ui.beb7cb84ca"), icon: 'credit-card', videoUrl: 'https://www.youtube.com/watch?v=DC1MJqXehVo' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'create-waba', name: m("ui.22003a919c"), icon: 'message-circle', videoUrl: 'https://www.youtube.com/watch?v=rUHe1RMN0IM' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'remove-waba', name: m("ui.7f41fd83e8"), icon: 'trash', videoUrl: 'https://www.youtube.com/watch?v=qRolqXQMpEA' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'claim-adaccount', name: m("ui.818050fd46"), icon: 'log-in', videoUrl: 'https://www.youtube.com/watch?v=WPuV3_CHNHU' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'show-readonly-adaccount', name: m("ui.41ef6e203e"), icon: 'eye', videoUrl: 'https://www.youtube.com/watch?v=kZtS-Swb7hM' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'remove-shared-adaccount', name: m("ui.af34fb6783"), icon: 'minus', videoUrl: 'https://www.youtube.com/watch?v=pfjCcAVecls' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'request-adaccount-access', name: m("ui.1669426b74"), icon: 'megaphone', videoUrl: 'https://www.youtube.com/watch?v=iS4EdFhUWuE' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'create-page-bm', name: m("ui.058604d991"), icon: 'file-text', videoUrl: 'https://www.youtube.com/watch?v=4stTBW3Mf-o' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'claim-page', name: m("ui.93679ebc91"), icon: 'log-in', videoUrl: 'https://www.youtube.com/watch?v=G75qElAc3SM' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'quan-ly-page', name: m("ui.08a0727d1d"), icon: 'rotate-ccw', videoUrl: 'https://www.youtube.com/watch?v=47MgwnOz8XY' }, // production icon "restart" has no lucide equivalent
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'kich-hoat-huy-dang', name: m("ui.acf5a22562"), icon: 'rotate-cw', videoUrl: 'https://www.youtube.com/watch?v=0MuDFdoIELg' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'remove-page', name: m("ui.a30914b65b"), icon: 'trash', videoUrl: 'https://www.youtube.com/watch?v=M_qmdNi9IVU' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'remove-ig-account', name: m("ui.cb3915f02c"), icon: 'trash', videoUrl: 'https://www.youtube.com/watch?v=DlGBb24_G60' },
  { ownerTab: 'business', groupId: 'change-account-info', functionId: 'rename-bm', name: m("ui.ab025c3533"), icon: 'pencil', videoUrl: 'https://www.youtube.com/watch?v=f55KmzYwEkM' },
  { ownerTab: 'business', groupId: 'change-account-info', functionId: 'update-bm-legal', name: m("ui.9193d20aa4"), icon: 'file-text', videoUrl: 'https://www.youtube.com/watch?v=7siNdRVJO-Y' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'manage-asset-group', name: m("ui.2684a3c7e4"), icon: 'folder', videoUrl: 'https://www.youtube.com/watch?v=zBoek316yNE' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'cancel-pending-invites', name: m("ui.78247d84c1"), icon: 'circle-x', videoUrl: 'https://www.youtube.com/watch?v=YxMKbrN0lgY' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'backup-bm', name: m("ui.e1f8de1304"), icon: 'share-2', videoUrl: 'https://www.youtube.com/watch?v=qbw6QhKzyxA' },
  { ownerTab: 'business', groupId: 'super-share', functionId: 'accept-bm-invite', name: m("ui.ad4e6f20af"), icon: 'share-2', videoUrl: 'https://www.youtube.com/watch?v=IDDq8bXqhlg' },
  { ownerTab: 'business', groupId: 'account-appeal-support', functionId: 'get-appeal-link', name: m("ui.6c36e94c67"), icon: 'link', videoUrl: 'https://www.youtube.com/watch?v=XkFeLrqBZws' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'add-bm-domain', name: m("ui.ae43ceca7e"), icon: 'globe', videoUrl: 'https://www.youtube.com/watch?v=-Wjc4PFbnyY' },
  { ownerTab: 'business', groupId: 'ads-check-pro', functionId: 'optout-bm-console', name: m("ui.ddef665b09"), icon: 'eye', videoUrl: 'https://www.youtube.com/watch?v=MUP5Rv_AyYY' },

  // --- page (18 total, 17 visible) ---
  { ownerTab: 'page', groupId: 'super-share', functionId: 'them-admin-qtv', name: m("ui.cd9be632e9"), icon: 'users', videoUrl: 'https://www.youtube.com/watch?v=WkFO8mQbdys' },
  { ownerTab: 'page', groupId: 'remove-hidden-admin', functionId: 'xoa-qtv', name: m("ui.5a85173b7b"), icon: 'shield', videoUrl: 'https://www.youtube.com/watch?v=vttwkRHPV9U' },
  { ownerTab: 'page', groupId: 'super-share', functionId: 'chi-dinh-quyen', name: m("ui.c8829d965c"), icon: 'shield-check', videoUrl: 'https://www.youtube.com/watch?v=rVA6Dfm4KYs' },
  { ownerTab: 'page', groupId: 'super-share', functionId: 'chap-nhan-loi-moi', name: m("ui.feb048dc1c"), icon: 'mail', videoUrl: 'https://www.youtube.com/watch?v=JNnISI-v9q4' },
  { ownerTab: 'page', groupId: 'ads-check-pro', functionId: 'tao-page', name: m("ui.22586f625c"), icon: 'plus', videoUrl: 'https://www.youtube.com/watch?v=QW8Odt0EHs4' },
  { ownerTab: 'page', groupId: 'change-account-info', functionId: 'doi-ten', name: m("ui.e1dfd564ed"), icon: 'pencil', videoUrl: 'https://www.youtube.com/watch?v=D5H7zpu2UTE' },
  { ownerTab: 'page', groupId: 'change-account-info', functionId: 'doi-anh', name: m("ui.2b328e58f5"), icon: 'image', videoUrl: 'https://www.youtube.com/watch?v=h1KzR4TxCro' },
  { ownerTab: 'page', groupId: 'super-share', functionId: 'nhet-vao-bm', name: m("ui.48300ed928"), icon: 'building-2', videoUrl: 'https://www.youtube.com/watch?v=SOjeQ_Zm_94' },
  { ownerTab: 'page', groupId: 'super-share', functionId: 'go-khoi-bm', name: m("ui.576c38cf5e"), icon: 'x-circle', videoUrl: 'https://www.youtube.com/watch?v=SJiDUivgX0M' },
  { ownerTab: 'page', groupId: 'super-share', functionId: 'quan-ly-doi-tac', name: m("ui.8157e11e53"), icon: 'share-2', videoUrl: 'https://www.youtube.com/watch?v=IrAtQ4hemDo' },
  { ownerTab: 'page', groupId: 'ads-check-pro', functionId: 'xoa-bai-viet', name: m("ui.8f54b5fac4"), icon: 'trash-2', videoUrl: 'https://www.youtube.com/watch?v=k8EEeBwpXfQ' },
  { ownerTab: 'page', groupId: 'change-account-info', functionId: 'bat-tat-nhan-tin', name: m("ui.fd0ec32376"), icon: 'message-circle', videoUrl: 'https://www.youtube.com/watch?v=6qaWT9Z0H-I' },
  { ownerTab: 'page', groupId: 'ads-check-pro', functionId: 'kich-hoat-huy-dang', name: m("ui.acf5a22562"), icon: 'rotate-cw', videoUrl: 'https://www.youtube.com/watch?v=WCfMhTD2gUw' },
  { ownerTab: 'page', groupId: 'ads-check-pro', functionId: 'quan-ly-page-vi-tri', name: m("ui.7e16d8fc42"), icon: 'map-pin', hidden: true },
  { ownerTab: 'page', groupId: 'super-share', functionId: 'huy-lien-ket-ig', name: m("ui.2913024719"), icon: 'unlink', videoUrl: 'https://www.youtube.com/watch?v=BAAhhDyqtD4' },
  { ownerTab: 'page', groupId: 'super-share', functionId: 'manage-asset-group', name: m("ui.2684a3c7e4"), icon: 'folder', videoUrl: 'https://www.youtube.com/watch?v=M1gZjdhje-k' },
  { ownerTab: 'page', groupId: 'change-account-info', functionId: 'doi-thong-tin', name: m("ui.3c7248f3a3"), icon: 'file-text', videoUrl: 'https://www.youtube.com/watch?v=yn9V4oTnZ2c' },
  { ownerTab: 'page', groupId: 'ads-check-pro', functionId: 'quan-ly-page', name: m("ui.08a0727d1d"), icon: 'rotate-ccw', videoUrl: 'https://www.youtube.com/watch?v=oG4Eo6WSXtI' }, // production icon "restart" has no lucide equivalent

  // --- pixel (6 total, 6 visible) ---
  { ownerTab: 'pixel', groupId: 'share-pixel', functionId: 'assign-people', name: m("ui.4a1c3504a9"), icon: 'user', videoUrl: 'https://www.youtube.com/watch?v=PwRZ6zSCpik' },
  { ownerTab: 'pixel', groupId: 'share-pixel', functionId: 'remove-by-people', name: m("ui.6b079a8d51"), icon: 'users', videoUrl: 'https://www.youtube.com/watch?v=iUPtQW7WHLU' },
  { ownerTab: 'pixel', groupId: 'share-pixel', functionId: 'assign-partner', name: m("ui.9e69da5619"), icon: 'plus', videoUrl: 'https://www.youtube.com/watch?v=ul-qKw6Juog' },
  { ownerTab: 'pixel', groupId: 'share-pixel', functionId: 'remove-by-partner', name: m("ui.3eb5ddb42d"), icon: 'building-2', videoUrl: 'https://www.youtube.com/watch?v=y3iOTsJ_GT4' },
  { ownerTab: 'pixel', groupId: 'share-pixel', functionId: 'share-to-ad-account', name: m("ui.3ffe329c9d"), icon: 'share-2', videoUrl: 'https://www.youtube.com/watch?v=VMWXf8EHS9o' },
  { ownerTab: 'pixel', groupId: 'share-pixel', functionId: 'remove-by-ad-account', name: m("ui.84efb1b0f8"), icon: 'x-circle', videoUrl: 'https://www.youtube.com/watch?v=04X4-1FlBeI' },
]

export type FunctionGroup = {
  id: AdsFunctionGroupId
  label: string
  functions: AdsFunctionDefinition[]
}

// Builds the exact group list a given asset renders: canonical group order,
// filtered to only groups this asset actually has visible functions in —
// "pixel" is the one asset restricted to the "share-pixel" group (every
// other asset excludes it), matching production's own per-tab filter.
// VIA has no function catalog at all in production — always [].
export function resolveFunctionGroups(asset: AdsAssetKey): FunctionGroup[] {
  if (asset === 'via') return []
  const visible = functionCatalog.filter((fn) => fn.ownerTab === asset && !fn.hidden)
  return FUNCTION_GROUP_ORDER
    .filter((groupId) => asset === 'pixel' ? groupId === 'share-pixel' : groupId !== 'share-pixel')
    .map((groupId) => ({ id: groupId, label: functionGroupLabels[groupId], functions: visible.filter((fn) => fn.groupId === groupId) }))
    .filter((group) => group.functions.length > 0)
}

export const assetLabels: Record<AdsAssetKey, string> = {
  via: 'VIA',
  'ad-account': m("ui.108854e9fd"),
  business: 'BM',
  page: 'Page',
  pixel: 'Pixel',
}

// Exact production per-tab pin storage keys (references/remotes/adaccounts/
// 436.e5c83aa9.js — 4 call sites of the pinned-functions composable). Note
// these use the short tab slugs ("tkqc"/"bm"), NOT the ownerTab strings
// ("adaccounts"/"businesses") used elsewhere in this file — verified from
// the literal key strings, not guessed from the {tab} pattern.
export const pinStorageKeyByAsset: Record<Exclude<AdsAssetKey, 'via'>, string> = {
  'ad-account': 'adaccounts.tkqc-tool-pinned.v1',
  business: 'adaccounts.bm-tool-pinned.v1',
  page: 'adaccounts.page-tool-pinned.v1',
  pixel: 'adaccounts.pixel-tool-pinned.v1',
}

// Exact production per-tab function-ORDER storage keys (references/remotes/
// adaccounts/436.e5c83aa9.js — 4 separate "ToolGroupList"-equivalent
// components in the same bundle, one per tab). Irregular by design, verified
// literal-by-literal, NOT guessed from a {tab} pattern: TKQC alone keeps the
// bare un-prefixed legacy name at v2 (no "tkqc-" prefix); the other 3 were
// added later with a proper prefix and are still at v1.
export const orderStorageKeyByAsset: Record<Exclude<AdsAssetKey, 'via'>, string> = {
  'ad-account': 'adaccounts.tool-ui-group-order.v2',
  business: 'adaccounts.bm-tool-ui-group-order.v1',
  page: 'adaccounts.page-tool-ui-group-order.v1',
  pixel: 'adaccounts.pixel-tool-ui-group-order.v1',
}

// Group-collapsed state is a SINGLE GLOBAL key in production — NOT per
// asset (verified: only one "tool-group-collapsed" literal exists, declared
// once at module scope, not inside any per-tab component). Collapsing a
// group on one asset tab also collapses any other asset's group sharing
// that same groupId — this is the real, traced behavior, not an oversight.
export const GROUP_COLLAPSED_STORAGE_KEY = 'adaccounts.tool-group-collapsed.v1'

export function loadCollapsedGroups(): Set<string> {
  try {
    const stored = localStorage.getItem(GROUP_COLLAPSED_STORAGE_KEY)
    if (!stored) return new Set()
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is string => typeof value === 'string'))
  } catch {
    return new Set()
  }
}

// Schema: { [groupId]: functionId[] } — verified from production's own
// persist function (serializes each group's CURRENT function id order into
// an object keyed by groupId). Malformed/non-object storage falls back to
// {} (equivalent to "no custom order for any group").
export function loadGroupOrder(storageKey: string): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return {}
    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const result: Record<string, string[]> = {}
    for (const [groupId, ids] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(ids)) result[groupId] = ids.filter((id): id is string => typeof id === 'string')
    }
    return result
  } catch {
    return {}
  }
}

// The exact production merge algorithm (references/remotes/adaccounts/
// 436.e5c83aa9.js's `eZ`): walk the stored id order, keep only ids that
// still exist in the canonical function set (unknown/removed/hidden ids
// are silently dropped — never a blank slot), then append any canonical
// function NOT mentioned in storage (a function added to the catalog since
// the user's order was saved) at the end, in its original relative order.
export function resolveGroupOrder(functions: AdsFunctionDefinition[], storedIds: string[] | undefined): AdsFunctionDefinition[] {
  if (!storedIds || storedIds.length === 0) return functions
  const byId = new Map(functions.map((fn) => [fn.functionId, fn]))
  const result: AdsFunctionDefinition[] = []
  for (const id of storedIds) {
    const fn = byId.get(id)
    if (fn) {
      result.push(fn)
      byId.delete(id)
    }
  }
  result.push(...byId.values())
  return result
}
