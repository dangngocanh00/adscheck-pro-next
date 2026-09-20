// BM column schema + demo fixtures (Batch Update Part H/I2, corrected by
// Correction Batch 2 Part L/W). Resource lists (partners/admins/ad accounts/
// pages/IG/WABA) are the single source of truth — their SL* column counts
// are DERIVED (array.length), never separately-maintained duplicate truth.

export type BmLifecycleStatus = 'live' | 'die'
// Part L3: verified is a pure visual state (✓ / ×) — no speculative
// "pending" text state (that was this clone's own invention, not traced).
export type BmVerifiedStatus = 'verified' | 'unverified'

export type BmPartner = { id: string; name: string }
export type BmAdminRole = 'admin' | 'employee'
export type BmAdmin = { id: string; name: string; uid: string; role: BmAdminRole; isYou?: boolean }
export type BmAdAccountRef = { id: string; name: string; ownership: 'owned' | 'share'; status: BmLifecycleStatus }
export type BmPageRef = { id: string; name: string }
export type BmInstagramRef = { id: string; name: string }
export type BmWabaRef = { id: string; name: string }

export type BmRow = {
  id: string
  order: number
  status: BmLifecycleStatus
  name: string
  bmId: string
  appealCount: number
  diedAt: string | null
  progressPercent: number | null
  permission: string
  createdAt: string
  verified: BmVerifiedStatus
  // Part L4: two DISTINCT, non-derived fields — never infer one from the
  // other or from unrelated fields (spend_cap/amount_spent/ad account
  // count). "Loại BM" = ad-account-creation-limit category (BM1/BM3/BM5).
  // "Level BM" = spending-limit market naming (BM50/BM250/BM350), only
  // populated when a fixture/source explicitly states it — otherwise '-'.
  loaiBm: string
  levelBm: string | null
  active: boolean
  note: string | null
  partners: BmPartner[]
  admins: BmAdmin[]
  adAccounts: BmAdAccountRef[]
  pages: BmPageRef[]
  instagramAccounts: BmInstagramRef[]
  wabaAccounts: BmWabaRef[]
  folder: string
}

export type BmColumnDataType = 'number' | 'currency' | 'string' | 'date' | 'status' | 'enum' | 'other'
export type BmColumnKey =
  | Exclude<keyof BmRow, 'id' | 'order' | 'folder' | 'partners' | 'admins' | 'adAccounts' | 'pages' | 'instagramAccounts' | 'wabaAccounts'>
  | 'tag' | 'partnerCount' | 'adminTotal' | 'adAccountTotal' | 'pageCount' | 'igCount' | 'wabaCount' | 'stt'
export type BmColumnDef = { key: BmColumnKey; label: string; width: number; dataType: BmColumnDataType; aggregatable?: 'count'; minWidth?: number; maxWidth?: number; defaultFrozen?: boolean; lockOrder?: boolean }

// Correction Batch 3 Part C: STT is the array's own first entry, same
// shared header/menu/resize/reorder/freeze machinery as every other column
// (traced: production ships it `frozen:true` by default).
export const BM_COLUMNS: BmColumnDef[] = [
  { key: 'stt', label: 'STT', width: 60, minWidth: 48, maxWidth: 120, dataType: 'string', defaultFrozen: true, lockOrder: true },
  { key: 'status', label: 'Trạng thái', width: 110, dataType: 'status' },
  { key: 'name', label: 'Tên BM', width: 200, dataType: 'string' },
  { key: 'bmId', label: 'ID BM', width: 160, dataType: 'string' },
  { key: 'tag', label: 'Tag', width: 160, dataType: 'other' },
  // Part 15 — plain-text status mirror of the BM's own Live/Die state (see
  // ads-check-pro-bm-table.tsx's renderCell for the exact reasoning/
  // uncertainty), not a numeric count despite the field name.
  { key: 'appealCount', label: 'Nút kháng', width: 110, dataType: 'status' },
  { key: 'diedAt', label: 'Ngày die', width: 130, dataType: 'date' },
  { key: 'progressPercent', label: 'Tiến trình', width: 150, dataType: 'number' },
  { key: 'permission', label: 'Quyền', width: 110, dataType: 'enum' },
  { key: 'createdAt', label: 'Ngày tạo', width: 120, dataType: 'date' },
  { key: 'verified', label: 'Verified', width: 90, dataType: 'status' },
  // BM Round 1 Part 22 — order corrected against the user's own production
  // Column Settings screenshot: Level BM precedes Loại BM (previously the
  // reverse, per a since-superseded Correction Batch 2 Part L4 assumption
  // with no direct screenshot evidence at the time).
  { key: 'levelBm', label: 'Level BM', width: 110, dataType: 'enum' },
  { key: 'loaiBm', label: 'Loại BM', width: 110, dataType: 'enum' },
  { key: 'active', label: 'Hoạt động', width: 130, dataType: 'status' },
  { key: 'partnerCount', label: 'SL đối tác', width: 110, dataType: 'number', aggregatable: 'count' },
  { key: 'note', label: 'Ghi chú', width: 190, dataType: 'string' },
  { key: 'adminTotal', label: 'SL Admin', width: 140, dataType: 'other' },
  { key: 'adAccountTotal', label: 'SL Ad Account', width: 190, dataType: 'other' },
  { key: 'pageCount', label: 'SL Page', width: 100, dataType: 'number', aggregatable: 'count' },
  { key: 'igCount', label: 'SL IG', width: 90, dataType: 'number', aggregatable: 'count' },
  { key: 'wabaCount', label: 'SL WABA', width: 100, dataType: 'number', aggregatable: 'count' },
]

// Part L2: exact Vietnamese labels the user confirmed from production.
const PERMISSIONS = ['QTV', 'Nhân viên']
// Part L4: BM1/3/5 = ad-account creation limit tier (Loại BM).
const LOAI_BM = ['BM1', 'BM3', 'BM5']
// Level BM (spend-limit tier) — explicitly populated on only SOME demo
// rows, matching "unknown unless source says so"; the rest show '-'.
const LEVEL_BM = ['BM50', 'BM250', 'BM350']

function pad(n: number, len = 2) { return String(n).padStart(len, '0') }

function buildPartners(index: number, count: number): BmPartner[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${index}-partner-${i}`, name: `Đối tác ${String.fromCharCode(65 + ((index + i) % 26))}` }))
}
function buildAdmins(index: number, count: number): BmAdmin[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${index}-admin-${i}`,
    name: `Admin Demo ${pad(index + i + 1)}`,
    uid: `100000${pad(index * 3 + i, 6)}`,
    role: i === 0 ? 'admin' : 'employee',
    isYou: index === 0 && i === 0,
  }))
}
function buildAdAccounts(index: number, count: number): BmAdAccountRef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${index}-tkqc-${i}`,
    name: `TKQC Demo ${pad(((index + i) % 60) + 1)}`,
    ownership: i % 3 === 0 ? 'share' : 'owned',
    status: i % 7 === 0 ? 'die' : 'live',
  }))
}
function buildPages(index: number, count: number): BmPageRef[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${index}-page-${i}`, name: `Page Demo ${pad(((index + i) % 45) + 1)}` }))
}
function buildInstagram(index: number, count: number): BmInstagramRef[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${index}-ig-${i}`, name: `ig.demo.${pad(index + i + 1)}` }))
}
function buildWaba(index: number, count: number): BmWabaRef[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${index}-waba-${i}`, name: `WABA Demo ${pad(index + i + 1)}` }))
}

function buildBmRow(index: number): BmRow {
  const n = index + 1
  const isDie = index % 6 === 5
  const isLongName = index % 15 === 0
  return {
    id: `bm-demo-${pad(n)}`,
    order: n,
    status: isDie ? 'die' : 'live',
    name: isLongName ? `BM Demo ${pad(n)} - Trung tâm quảng cáo thương hiệu toàn quốc` : `BM Demo ${pad(n)}`,
    bmId: `bm-demo-${pad(n)}`,
    appealCount: index % 4,
    diedAt: isDie ? `2024-${pad((index % 12) + 1)}-${pad((index % 28) + 1)}` : null,
    // Correction Batch 2 Part G: idle by default — never random demo data,
    // only ever set by an actual clone-demo Function/Workflow execution.
    progressPercent: null,
    permission: PERMISSIONS[index % PERMISSIONS.length],
    createdAt: `202${2 + (index % 4)}-${pad((index % 12) + 1)}-${pad((index % 28) + 1)}`,
    verified: index % 5 === 0 ? 'unverified' : 'verified',
    loaiBm: LOAI_BM[index % LOAI_BM.length],
    levelBm: index % 3 === 0 ? LEVEL_BM[index % LEVEL_BM.length] : null,
    active: !isDie && index % 8 !== 7,
    note: index % 5 === 0 ? 'Kiểm tra định kỳ mỗi tuần' : null,
    partners: buildPartners(index, index % 6),
    admins: buildAdmins(index, (index % 8) + 1),
    adAccounts: buildAdAccounts(index, (index % 15) + 1),
    pages: buildPages(index, index % 5),
    instagramAccounts: buildInstagram(index, index % 3),
    wabaAccounts: buildWaba(index, index % 2),
    folder: 'Tất cả',
  }
}

// 40 rows — enough for scroll/pagination/search/sort/filter/column-menu
// testing (Part I2) without needing an equally large unauthorized section
// (BM has none in this batch's scope).
export const bmRowFixtures: BmRow[] = Array.from({ length: 40 }, (_, index) => buildBmRow(index))
