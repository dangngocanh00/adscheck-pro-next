import { m } from '@/i18n'

// Column config (pre-existing, unchanged) + demo row generator for
// Page/Pixel (Batch Update Part I3) — this file only adds ROWS, never a new
// column, per the batch's explicit "không tự mở rộng Page/Pixel column
// schema" constraint.

export type GenericColumnDef = { key: string; label: string; width: number; minWidth?: number; maxWidth?: number; defaultFrozen?: boolean; lockOrder?: boolean; aggregatable?: 'count' }
export type GenericRow = { id: string; folder: string; values: Record<string, unknown> }

// Correction Batch 3 Part C: 'order' (STT) already went through the SAME
// shared column loop as every other Page/Pixel column (no special-case),
// now also carries the traced defaultFrozen:true (see TKQC/BM STT).
export const assetColumns: Record<'page' | 'pixel', GenericColumnDef[]> = {
  // Page Round 1 — field names/order traced EXACTLY from production's own
  // PageTable component (references/remotes/adaccounts/436.e5c83aa9.js:
  // stt/status/name/pageId/tag/isPublished/toolProgress/role/bm/bmName/
  // adminCount/createdDate/likes/follows/type/postCount/pageTick/currency/
  // promotionEligible/promotionIneligibleReason/pageLive/monetize/
  // profileId/note). `status` and `name` carry the traced `frozen:!0` from
  // that same column array — production ships them frozen by default,
  // alongside STT, not just STT alone.
  page: [
    { key: 'order', label: 'STT', width: 60, minWidth: 48, maxWidth: 120, defaultFrozen: true, lockOrder: true },
    { key: 'status', label: m("ui.e03c1401e3"), width: 120, defaultFrozen: true },
    { key: 'name', label: m("ui.e6f1a2b903"), width: 240, defaultFrozen: true },
    { key: 'id', label: 'Page ID', width: 160 },
    { key: 'tag', label: 'Tag', width: 220 },
    { key: 'unpublished', label: m("ui.b101c2d303"), width: 150 },
    { key: 'progress', label: m("ui.84e677511a"), width: 180 },
    // Page #3 — traced production column key is literally "role"; header
    // renamed from "Quyền / Cấp quyền" to the exact "Quyền".
    { key: 'permission', label: m("ui.26d8c4a5a4"), width: 150 },
    { key: 'business-id', label: 'ID BM', width: 160 },
    { key: 'business-name', label: m("ui.8c72326a11"), width: 180 },
    // Page #4 — traced production key is "adminCount"; renamed from "QTV"
    // to "SL Admin" (shared resource-count semantic, see renderCell).
    // Page Summary Correction — this IS a real numeric count field (not
    // just its pill presentation in the body cell), so it aggregates in
    // the footer same as BM's own admin count.
    { key: 'admin', label: 'SL Admin', width: 110, aggregatable: 'count' },
    { key: 'created-at', label: m("ui.8b2d9e8a26"), width: 120 },
    // Page Summary Correction — Lượt thích/Người theo dõi/Bài viết are
    // legitimate additive per-Page counts (schema semantics support sum);
    // Tiến trình (progress %) is deliberately excluded — summing percents
    // is meaningless.
    { key: 'likes', label: m("ui.b404c5d606"), width: 100, aggregatable: 'count' },
    { key: 'followers', label: m("ui.b707c8d909"), width: 110, aggregatable: 'count' },
    { key: 'type', label: m("ui.f4a2b3c104"), width: 120 },
    { key: 'posts', label: m("ui.ba10cb11dc"), width: 100, aggregatable: 'count' },
    { key: 'verified', label: m("ui.bd13ce14ef"), width: 120 },
    { key: 'currency', label: m("ui.42d00a8fe2"), width: 110 },
    { key: 'ad-eligible', label: m("ui.c016df1720"), width: 150 },
    // Page #6 — traced production key is "promotionIneligibleReason";
    // header renamed from "Lý do" to "Lý do bị ban QC". Underlying field
    // untouched.
    { key: 'reason', label: m("ui.c319e02123"), width: 220 },
    { key: 'live', label: m("ui.c622e32426"), width: 120 },
    { key: 'monetization', label: m("ui.c925e62729"), width: 180 },
    { key: 'profile-id', label: 'Profile ID', width: 160 },
    { key: 'note', label: m("ui.02f03f68e7"), width: 220 },
  ],
  pixel: [
    { key: 'order', label: 'STT', width: 60, minWidth: 48, maxWidth: 120, defaultFrozen: true, lockOrder: true },
    { key: 'status', label: m("ui.e03c1401e3"), width: 120 },
    { key: 'name', label: m("ui.a7b3c4d205"), width: 220 },
    { key: 'id', label: 'ID Pixel', width: 170 },
    { key: 'tag', label: 'Tag', width: 220 },
    { key: 'business-id', label: 'ID BM', width: 170 },
    { key: 'business-name', label: m("ui.8c72326a11"), width: 200 },
    { key: 'permission', label: m("ui.26d8c4a5a4"), width: 110 },
    // Pixel #3 — footer totals confirmed by production screenshot for
    // these 3 columns (aggregatable: sum across the current dataset).
    { key: 'users', label: 'Người dùng', width: 120, aggregatable: 'count' },
    { key: 'ad-accounts', label: 'TKQC', width: 120, aggregatable: 'count' },
    { key: 'partners', label: 'Đối tác', width: 120, aggregatable: 'count' },
    { key: 'progress', label: m("ui.84e677511a"), width: 180 },
    { key: 'note', label: m("ui.02f03f68e7"), width: 220 },
  ],
}

function pad(n: number, len = 2) { return String(n).padStart(len, '0') }
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

const CURRENCIES = ['VND', 'USD', 'AUD']
// Page #5 — traced production presentation only ever shows 2 values
// ("Cá nhân" hoặc "Doanh nghiệp"); the earlier 3-value demo set invented
// an extra "Cộng đồng"/"Thương hiệu" split with no evidence behind it.
const PAGE_TYPES = ['personal', 'business'] as const
const PERMISSIONS = ['admin', 'editor', 'analyst'] as const
// Page #1 — traced EXACTLY from production's own status filter catalog
// (PageTable's `value-filter-catalog`): {label:"Live"},{label:"Die"},
// {label: hiddenPageStatus}.
const PAGE_STATUSES = ['live', 'hidden', 'die'] as const
// Pixel #1 — production only ever shows 2 states, with the exact label
// "Dead" (not "Die" like Page's own separate status set).
const PIXEL_STATUSES = ['live', 'dead'] as const

function valueForKey(asset: 'page' | 'pixel', key: string, index: number, rand: () => number): unknown {
  const n = index + 1
  switch (key) {
    case 'order': return n
    case 'status': return asset === 'page' ? PAGE_STATUSES[index % PAGE_STATUSES.length] : (index % 5 === 0 ? PIXEL_STATUSES[1] : PIXEL_STATUSES[0])
    case 'name': return `${asset === 'page' ? 'Page' : 'Pixel'} Demo ${pad(n)}`
    case 'id': return `${asset === 'page' ? '1000000' : '2000000'}${pad(n, 5)}`
    case 'tag': return null
    case 'unpublished': return index % 4 === 0 ? 'unpublished' : 'published'
    // Correction Batch 2 Part G: idle by default (no execution has run) —
    // never random demo data. Same semantics as TKQC/BM's "Tiến trình".
    case 'progress': return null
    case 'permission': return PERMISSIONS[index % PERMISSIONS.length]
    case 'business-id': return `bm-demo-${pad((index % 6) + 1)}`
    case 'business-name': return `BM Demo ${pad((index % 6) + 1)}`
    case 'admin': return (index % 5) + 1
    case 'created-at': return `202${3 + (index % 3)}-${pad((index % 12) + 1)}-${pad((index % 28) + 1)}`
    case 'likes': return Math.round(rand() * 50_000)
    case 'followers': return Math.round(rand() * 80_000)
    case 'type': return PAGE_TYPES[index % PAGE_TYPES.length]
    case 'posts': return Math.round(rand() * 500)
    case 'verified': return index % 6 === 0
    case 'currency': return CURRENCIES[index % CURRENCIES.length]
    case 'ad-eligible': return index % 7 !== 0
    case 'reason': return index % 7 === 0 ? 'ads_policy_violation' : null
    case 'live': return index % 5 !== 0 ? 'live' : 'die'
    // Page #8 — same boolean-eligibility semantic as "Page live" (Page #7),
    // rendered through the SAME shared renderer (renderPageEligibility in
    // ads-check-pro-generic-table.tsx) rather than its own string enum.
    case 'monetization': return index % 3 !== 0
    case 'profile-id': return `pid-${pad(n, 6)}`
    case 'note': return index % 6 === 0 ? 'Theo dõi hiệu suất hàng tuần' : null
    case 'users': return (index % 6) + 1
    case 'ad-accounts': return index % 10
    case 'partners': return index % 4
    default: return '-'
  }
}

export function generateGenericRows(asset: 'page' | 'pixel', columns: GenericColumnDef[], count: number): GenericRow[] {
  return Array.from({ length: count }, (_, index) => {
    const rand = seeded(index * 733 + (asset === 'page' ? 11 : 29))
    const values: Record<string, unknown> = {}
    for (const column of columns) values[column.key] = valueForKey(asset, column.key, index, rand)
    return { id: `${asset}-demo-${pad(index + 1)}`, folder: 'Tất cả', values }
  })
}
