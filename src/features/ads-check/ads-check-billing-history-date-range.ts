import { m } from '@/i18n'
// Lịch sử giao dịch's own date-range state + preset math — mirrors the
// SAME proven algorithm as ads-check-pro-tkqc-date-range.ts (calendar-day
// boundaries, inclusive today, Monday-first weeks) rather than importing
// that TKQC-scoped module directly (different domain/feature; that file's
// own header explicitly ties it to TKQC "Tổng tiêu" semantics). Adds an
// explicit 'custom' preset row ("Tùy chọn") to the visible preset list,
// matching the reference screenshot's 8th preset.

export type BillingDateRangePresetKey =
  | 'all-time' | 'today' | 'yesterday' | 'last-7-days' | 'last-30-days' | 'this-month' | 'last-month' | 'custom'

export type BillingDateRange = {
  presetKey: BillingDateRangePresetKey
  // ISO 'YYYY-MM-DD', inclusive on both ends; null start/end means "Toàn
  // thời gian" (no bound).
  start: string | null
  end: string | null
}

export const BILLING_DATE_RANGE_PRESETS: { key: BillingDateRangePresetKey; label: string }[] = [
  { key: 'all-time', label: m("ui.71f6cb94e3") },
  { key: 'today', label: m("ui.0048b6a408") },
  { key: 'yesterday', label: m("ui.47bd3511b2") },
  { key: 'last-7-days', label: m("ui.5e9205c253") },
  { key: 'last-30-days', label: m("ui.0a87e7ca65") },
  { key: 'this-month', label: m("ui.b58c3ed389") },
  { key: 'last-month', label: m("ui.0cfd503bec") },
  { key: 'custom', label: m("ui.e301efac85") },
]

export const DEFAULT_BILLING_DATE_RANGE: BillingDateRange = { presetKey: 'all-time', start: null, end: null }

function pad(n: number) { return String(n).padStart(2, '0') }
function toIso(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` }
function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
function addDays(date: Date, days: number) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days) }

// Same boundary semantics as the TKQC original: local calendar-day
// boundaries, never a rolling 24h window; last-7/30-days are inclusive of
// today; this-month = month-start..today; last-month = full previous
// calendar month.
export function computeBillingPresetRange(key: BillingDateRangePresetKey, now: Date = new Date()): BillingDateRange {
  const today = startOfDay(now)
  switch (key) {
    case 'all-time': return { presetKey: key, start: null, end: null }
    case 'today': return { presetKey: key, start: toIso(today), end: toIso(today) }
    case 'yesterday': { const y = addDays(today, -1); return { presetKey: key, start: toIso(y), end: toIso(y) } }
    case 'last-7-days': return { presetKey: key, start: toIso(addDays(today, -6)), end: toIso(today) }
    case 'last-30-days': return { presetKey: key, start: toIso(addDays(today, -29)), end: toIso(today) }
    case 'this-month': { const first = new Date(today.getFullYear(), today.getMonth(), 1); return { presetKey: key, start: toIso(first), end: toIso(today) } }
    case 'last-month': {
      const firstOfThis = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastOfPrev = addDays(firstOfThis, -1)
      const firstOfPrev = new Date(lastOfPrev.getFullYear(), lastOfPrev.getMonth(), 1)
      return { presetKey: key, start: toIso(firstOfPrev), end: toIso(lastOfPrev) }
    }
    case 'custom': return { presetKey: key, start: null, end: null }
  }
}

export function formatBillingRangeDisplay(range: BillingDateRange): string {
  if (!range.start || !range.end) return BILLING_DATE_RANGE_PRESETS.find((preset) => preset.key === range.presetKey)?.label ?? m("ui.71f6cb94e3")
  const [sy, sm, sd] = range.start.split('-')
  const [ey, em, ed] = range.end.split('-')
  return `${sd}/${sm}/${sy} - ${ed}/${em}/${ey}`
}
