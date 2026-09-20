// TKQC full column schema + demo fixtures (Batch Update Part D + I1).
// Kept in its own module (Part J) — column definitions, raw demo data, and
// the row type are separate from the table's rendering/interaction code in
// ads-check-pro-asset-table.tsx.

export type TkqcStatus = 'active' | 'restricted' | 'disabled' | 'pending'
export type TkqcCurrency = 'VND' | 'USD' | 'AUD'
export type PaymentMethodDemo = { id: string; brand: string; last4: string }
export type HoldNeedStatus = 'idle' | 'checking' | 'ok' | 'hold-error' | 'no-payment'
export type HoldNeedState = { status: HoldNeedStatus }
export type TkqcAdminRole = 'admin' | 'advertiser' | 'analyst'
export type TkqcAdmin = { id: string; name: string; uid: string; role: TkqcAdminRole; isYou?: boolean }

export type TkqcRow = {
  id: string
  order: number
  status: TkqcStatus
  name: string
  sourceName: string
  accountId: string
  balance: number
  currency: TkqcCurrency
  threshold: number | null
  limit: number | null
  // Correction Batch 2 Part G: idle by default (no execution has run) —
  // "-" empty state. Only ever set by an actual clone-demo Function/
  // Workflow execution (see useExecutionProgress in the workspace), never
  // random data generated on mount.
  progressPercent: number | null
  totalSpend: number
  permission: string
  // Correction Batch 2 Part E: the cell is spent/limit/percent, not a bare
  // editable number. spendLimit may be null (no limit set); spentAgainstLimit
  // is the raw spend counted against whatever limit is currently set.
  spendLimit: number | null
  spentAgainstLimit: number
  paymentMethods: PaymentMethodDemo[]
  // Round 1 Part 3 — previously-attached/removed cards, kept separate from
  // the currently-attached list so "Xóa toàn bộ thẻ" (detach current cards)
  // never erases this history (see the payment popover's own header
  // comment for the full remove-vs-erase reasoning).
  paymentMethodsHistory: PaymentMethodDemo[]
  createdAt: string
  accountType: string
  timezone: string
  businessId: string | null
  businessName: string | null
  country: string
  note: string | null
  thresholdRemaining: number | null
  invoiceDate: string | null
  dueDate: string | null
  lockReason: string | null
  hiddenLimit: number | null
  admins: TkqcAdmin[]
  partner: string | null
  originalId: string
  holdNeed: HoldNeedState
  folder: string
}

export type TkqcColumnDataType = 'number' | 'currency' | 'string' | 'date' | 'status' | 'enum' | 'other'
export type TkqcColumnKey = Exclude<keyof TkqcRow, 'id' | 'order' | 'folder' | 'sourceName' | 'spentAgainstLimit' | 'admins'> | 'tag' | 'adminCount' | 'stt'
export type TkqcColumnDef = { key: TkqcColumnKey; label: string; width: number; dataType: TkqcColumnDataType; aggregatable?: 'currency' | 'count'; minWidth?: number; maxWidth?: number; defaultFrozen?: boolean; lockOrder?: boolean }

// Exact user-confirmed column order (Batch Update Part D), positions 3-31 —
// checkbox is rendered separately, outside this array (Part B6: not part of
// the shared column config at all — no per-column exclusion needed).
// Correction Batch 3 Part C: STT is now the array's own first entry
// (traced production: a plain column-def object, `frozen:true` by default,
// no `isNumber` flag — same shared header/menu/resize/reorder/freeze
// machinery as every other column, not a hardcoded bare header).
export const TKQC_COLUMNS: TkqcColumnDef[] = [
  { key: 'stt', label: 'STT', width: 60, minWidth: 48, maxWidth: 120, dataType: 'string', defaultFrozen: true, lockOrder: true },
  { key: 'status', label: 'Trạng thái', width: 130, dataType: 'status' },
  { key: 'name', label: 'Tài khoản', width: 220, dataType: 'string' },
  { key: 'accountId', label: 'ID TKQC', width: 170, dataType: 'string' },
  { key: 'balance', label: 'Số dư', width: 140, dataType: 'currency', aggregatable: 'currency' },
  { key: 'threshold', label: 'Ngưỡng', width: 130, dataType: 'currency', aggregatable: 'currency' },
  { key: 'limit', label: 'Limit', width: 130, dataType: 'currency', aggregatable: 'currency' },
  { key: 'progressPercent', label: 'Tiến trình', width: 150, dataType: 'number' },
  { key: 'totalSpend', label: 'Tổng tiêu', width: 140, dataType: 'currency', aggregatable: 'currency' },
  { key: 'currency', label: 'Tiền tệ', width: 100, dataType: 'enum' },
  { key: 'permission', label: 'Quyền', width: 120, dataType: 'enum' },
  { key: 'spendLimit', label: 'Giới hạn chi tiêu', width: 170, dataType: 'currency', aggregatable: 'currency' },
  { key: 'paymentMethods', label: 'Phương thức thanh toán', width: 190, dataType: 'other' },
  { key: 'createdAt', label: 'Ngày tạo', width: 130, dataType: 'date' },
  { key: 'accountType', label: 'Loại TK', width: 130, dataType: 'enum' },
  { key: 'timezone', label: 'Múi giờ', width: 110, dataType: 'enum' },
  { key: 'businessId', label: 'ID BM', width: 160, dataType: 'string' },
  { key: 'businessName', label: 'Tên BM', width: 180, dataType: 'string' },
  { key: 'country', label: 'Quốc gia', width: 130, dataType: 'enum' },
  { key: 'note', label: 'Ghi chú', width: 200, dataType: 'string' },
  { key: 'thresholdRemaining', label: 'Ngưỡng còn lại', width: 150, dataType: 'currency', aggregatable: 'currency' },
  { key: 'invoiceDate', label: 'Ngày lập hóa đơn', width: 155, dataType: 'date' },
  // Correction Batch 2 Part I: renamed from "Ngày đến hạn" — single source
  // (this label), propagates to header/filter title/column menu/tests.
  { key: 'dueDate', label: 'Ngày đến hạn TT', width: 150, dataType: 'date' },
  { key: 'lockReason', label: 'Lý do khóa', width: 180, dataType: 'string' },
  { key: 'hiddenLimit', label: 'Limit ẩn', width: 130, dataType: 'currency', aggregatable: 'currency' },
  { key: 'adminCount', label: 'SL Admin', width: 130, dataType: 'number', aggregatable: 'count' },
  { key: 'partner', label: 'Đối tác', width: 150, dataType: 'string' },
  { key: 'originalId', label: 'ID gốc', width: 170, dataType: 'string' },
  { key: 'holdNeed', label: 'HOLD/NEED', width: 130, dataType: 'other' },
  { key: 'tag', label: 'Tag', width: 200, dataType: 'other' },
]

const CURRENCIES: TkqcCurrency[] = ['VND', 'USD', 'AUD']
const COUNTRIES = ['Việt Nam', 'Singapore', 'Úc', 'Hoa Kỳ', 'Thái Lan']
const TIMEZONES = ['GMT+7', 'GMT+8', 'GMT+10', 'GMT-5', 'GMT+0']
const ACCOUNT_TYPES = ['Cá nhân', 'Doanh nghiệp']
const PERMISSIONS = ['Admin', 'Advertiser', 'Analyst']
const CARD_BRANDS = ['Visa', 'Mastercard', 'JCB']
const LOCK_REASONS = ['Vi phạm chính sách quảng cáo', 'Nghi ngờ gian lận thanh toán', 'Yêu cầu xác minh danh tính']
const PARTNERS = ['Đối tác A', 'Đối tác B', null]
const TKQC_ADMIN_ROLES: TkqcAdminRole[] = ['admin', 'advertiser', 'analyst']

function pad(n: number, len = 2) { return String(n).padStart(len, '0') }

function buildTkqcAdmins(index: number, count: number): TkqcAdmin[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${index}-tkqc-admin-${i}`,
    name: `Admin Demo ${pad(index + i + 1)}`,
    uid: `200000${pad(index * 3 + i, 6)}`,
    role: i === 0 ? 'admin' : TKQC_ADMIN_ROLES[(index + i) % TKQC_ADMIN_ROLES.length],
    isYou: index === 0 && i === 0,
  }))
}

// Deterministic pseudo-random generator (Part I1: "prefer deterministic
// fixtures, không random runtime") — a fixed-seed LCG so every reload
// produces byte-identical demo data.
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

function buildRow(index: number, authorized: boolean): TkqcRow {
  const rand = seeded(index * 7919 + (authorized ? 1 : 97))
  const currency = CURRENCIES[index % CURRENCIES.length]
  const statusCycle: TkqcStatus[] = ['active', 'active', 'restricted', 'disabled', 'pending']
  const status = authorized ? statusCycle[index % statusCycle.length] : 'restricted'
  const isZeroRow = index % 11 === 0
  const isNullRow = index % 13 === 0
  const isLongName = index % 17 === 0
  const paymentMethodCount = isNullRow ? 0 : index % 4 === 0 ? 2 : index % 5 === 0 ? 0 : 1
  const holdCycle: HoldNeedStatus[] = ['idle', 'idle', 'idle', 'idle']
  const businessIndex = index % 6
  const hasBusiness = !isNullRow
  const n = index + 1

  return {
    id: `${authorized ? 'ad-account' : 'ad-account-restricted'}-demo-${pad(n)}`,
    order: n,
    status,
    name: isLongName
      ? `TKQC Demo ${pad(n)} - Chiến dịch thương hiệu mùa hè kéo dài toàn quốc năm nay`
      : `TKQC Demo ${pad(n)}`,
    sourceName: `VIA Demo ${pad((index % 97) + 1)}`,
    accountId: `8900000000${pad(n, 5)}`,
    balance: isZeroRow ? 0 : Math.round(rand() * 50_000_000),
    currency,
    threshold: isNullRow ? null : Math.round(rand() * 20_000_000),
    limit: isZeroRow ? 0 : isNullRow ? null : Math.round(rand() * 100_000_000),
    // Idle by default — only set by an actual clone-demo execution (Part G).
    progressPercent: null,
    totalSpend: isZeroRow ? 0 : Math.round(rand() * 80_000_000),
    permission: PERMISSIONS[index % PERMISSIONS.length],
    spendLimit: isNullRow ? null : Math.round(rand() * 30_000_000),
    spentAgainstLimit: isNullRow ? 0 : Math.round(rand() * 25_000_000),
    paymentMethods: Array.from({ length: paymentMethodCount }, (_, cardIndex) => ({
      id: `${n}-card-${cardIndex}`,
      brand: CARD_BRANDS[(index + cardIndex) % CARD_BRANDS.length],
      last4: pad((index * 37 + cardIndex * 91) % 10000, 4),
    })),
    // Deterministic demo history — every 4th row has one previously-removed
    // card, independent of how many cards are currently attached.
    paymentMethodsHistory: index % 4 === 0 ? [{
      id: `${n}-card-history-0`,
      brand: CARD_BRANDS[(index + 2) % CARD_BRANDS.length],
      last4: pad((index * 53 + 17) % 10000, 4),
    }] : [],
    createdAt: `202${3 + (index % 3)}-${pad((index % 12) + 1)}-${pad((index % 28) + 1)}`,
    accountType: ACCOUNT_TYPES[index % ACCOUNT_TYPES.length],
    timezone: TIMEZONES[index % TIMEZONES.length],
    businessId: hasBusiness ? `bm-demo-${pad(businessIndex + 1)}` : null,
    businessName: hasBusiness ? `BM Demo ${pad(businessIndex + 1)}` : null,
    country: COUNTRIES[index % COUNTRIES.length],
    note: index % 6 === 0 ? 'Theo dõi chi tiêu hàng tuần' : null,
    thresholdRemaining: isNullRow ? null : Math.round(rand() * 10_000_000),
    invoiceDate: isNullRow ? null : `202${3 + (index % 3)}-${pad((index % 12) + 1)}-01`,
    dueDate: isNullRow ? null : `202${3 + (index % 3)}-${pad(((index + 1) % 12) + 1)}-05`,
    lockReason: status === 'restricted' || status === 'disabled' ? LOCK_REASONS[index % LOCK_REASONS.length] : null,
    hiddenLimit: isZeroRow ? 0 : isNullRow ? null : Math.round(rand() * 15_000_000),
    admins: buildTkqcAdmins(index, isZeroRow ? 0 : (index % 5) + 1),
    partner: PARTNERS[index % PARTNERS.length],
    originalId: `100000000${pad(101 + index, 4)}`,
    holdNeed: { status: holdCycle[index % holdCycle.length] },
    folder: authorized ? (index % 3 === 0 ? 'Nhóm mẫu A' : index % 3 === 1 ? 'Nhóm mẫu B' : 'Tất cả') : 'Tất cả',
  }
}

// 60 authorized rows — enough for vertical scroll + multi-page pagination
// (25/page → 3 pages) while covering every scenario Part I1 lists (multi-
// currency, zero, null, long names, multiple BM/country/timezone, payment
// methods, notes, locked statuses).
export const tkqcRowFixtures: TkqcRow[] = Array.from({ length: 60 }, (_, index) => buildRow(index, true))

// 8 unauthorized rows (Part F) — same generator, same column shape, so the
// unauthorized section can reuse the exact TKQC column definitions/grid.
export const tkqcRestrictedRowFixtures: TkqcRow[] = Array.from({ length: 8 }, (_, index) => buildRow(60 + index, false))

export function formatCurrency(amount: number, currency: TkqcCurrency): string {
  if (currency === 'VND') return `${amount.toLocaleString('vi-VN')}₫`
  return `${amount.toLocaleString('en-US')} ${currency}`
}
