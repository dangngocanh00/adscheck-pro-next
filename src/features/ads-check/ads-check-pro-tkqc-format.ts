import { m } from '@/i18n'
// TKQC Round 1 — small pure formatting/URL helpers shared by the table
// cells and toolbar controls. Kept separate from ads-check-pro-tkqc-data.ts
// (raw schema/fixtures) and ads-check-pro-tkqc-table.tsx (rendering).

// Part 4 — "Ngày đến hạn thanh toán" must show remaining days, not a raw
// date. The underlying `dueDate` field is untouched; only this derived
// presentation changes, so it naturally re-evaluates on every render
// (today's date, not a value frozen at generation time).
//
// FINAL CORRECTION B — not-yet-due (today or future) shows the BARE
// signed day count only ("3", "5", "10", "0"), no "ngày" suffix, no date
// — this actually now matches traced production exactly (references/
// remotes/adaccounts/235.f25ad1e0.js + 436.e5c83aa9.js: `daysToDue` is a
// plain integer rendered with no special copy at all). Overdue explicitly
// keeps this clone's OWN existing presentation ("Quá hạn N ngày") — the
// correction says not to redesign the overdue state, so that string is
// intentionally left exactly as the previous round shipped it.
export function formatDueDateDays(dueDate: string | null, now: Date = new Date()): string {
  if (!dueDate) return '-'
  const due = new Date(`${dueDate}T00:00:00`)
  if (Number.isNaN(due.getTime())) return '-'
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msPerDay = 24 * 60 * 60 * 1000
  const diffDays = Math.round((due.getTime() - startOfToday.getTime()) / msPerDay)
  if (diffDays >= 0) return String(diffDays)
  return m("ui.936e92acc8", { 0: Math.abs(diffDays) })
}

// Part 7 — ID mask. Traced production (references/remotes/adaccounts/
// 897.0e915523.js, shared Table component): a literal fixed constant
// `"***************"` (15 asterisks), NOT derived from the real id's
// length; the toggle is a plain component-local ref with no localStorage/
// sessionStorage read or write anywhere near it — confirmed NOT persisted,
// resets on reload/navigation.
export const MASKED_ID_LENGTH = 15
// `_accountId` kept for API symmetry (callers pass the row's real id) even
// though the mask itself is a fixed length, not derived from it.
export function maskAccountId(_accountId: string): string {
  return '*'.repeat(MASKED_ID_LENGTH)
}

// Parts 2/14 — Meta destinations. Traced production EXACTLY (references/
// remotes/adaccounts/436.e5c83aa9.js, module 4941) — confirmed DIFFERENT
// per field, not one generic URL for everything:
//   name / ID TKQC   -> Ads Manager campaigns
//   Trạng thái       -> Account Quality page
//   Số dư / Limit    -> Billing Hub account details
//   Ngưỡng           -> Ads Manager account setup
function metaAccountId(accountId: string): string | null {
  const trimmed = accountId.trim()
  return trimmed ? trimmed.replace(/^act_/, '') : null
}

export function buildAdsManagerCampaignsUrl(accountId: string): string | null {
  const id = metaAccountId(accountId)
  return id ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(id)}` : null
}

export function buildAccountQualityUrl(accountId: string): string | null {
  const id = metaAccountId(accountId)
  return id ? `https://www.facebook.com/accountquality/${encodeURIComponent(id)}` : null
}

export function buildAdAccountSetupUrl(accountId: string): string | null {
  const id = metaAccountId(accountId)
  return id ? `https://adsmanager.facebook.com/adsmanager/manage/ad_account_settings/ad_account_setup?act=${encodeURIComponent(id)}` : null
}

// Part 3 — Billing Hub (Số dư/Limit cells AND the payment popover's
// external-link icon all open this exact same URL per production).
export function buildBillingHubUrl(accountId: string, businessId?: string | null): string | null {
  const id = metaAccountId(accountId)
  if (!id) return null
  const params = new URLSearchParams({
    payment_account_id: id,
    nav_ref: 'bizweb_billing_hub_payment_settings_page',
    asset_id: id,
    placement: 'campaign_manager',
  })
  if (businessId) params.set('business_id', businessId)
  return `https://business.facebook.com/latest/billing_hub/accounts/details/?${params.toString()}`
}
