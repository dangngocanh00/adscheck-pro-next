import { m } from '@/i18n'
// TKQC Round 1 Part 6 — "Tổng tiêu" date-range state + preset math, kept
// separate from the picker's own rendering (ads-check-pro-tkqc-date-range-
// picker.tsx). This range is NOT a row filter — it controls the window
// used to compute each row's own "Tổng tiêu" (Part 6 semantics) — but see
// that same header comment: this clone's TkqcRow only ever generates ONE
// static totalSpend number (ads-check-pro-tkqc-data.ts), with no
// spend-by-day history to recompute from, so selecting a range here
// intentionally does NOT change the displayed Tổng tiêu values (no
// invented daily spend) — the state/interface is real and complete, ready
// for a backend that can supply real per-day figures, and this gap is
// explicitly called out in the batch report rather than faked.

export type TkqcDateRangePresetKey =
  | 'all-time' | 'today' | 'yesterday' | 'last-7-days' | 'last-30-days' | 'this-month' | 'last-month' | 'custom'

export type TkqcDateRange = {
  presetKey: TkqcDateRangePresetKey
  // ISO 'YYYY-MM-DD', inclusive on both ends; null start/end means
  // "Toàn thời gian" (no bound).
  start: string | null
  end: string | null
}

export const TKQC_DATE_RANGE_PRESETS: { key: TkqcDateRangePresetKey; label: string }[] = [
  { key: 'all-time', label: m("ui.71f6cb94e3") },
  { key: 'today', label: m("ui.0048b6a408") },
  { key: 'yesterday', label: m("ui.47bd3511b2") },
  { key: 'last-7-days', label: m("ui.5e9205c253") },
  { key: 'last-30-days', label: m("ui.0a87e7ca65") },
  { key: 'this-month', label: m("ui.b58c3ed389") },
  { key: 'last-month', label: m("ui.0cfd503bec") },
]

export const DEFAULT_TKQC_DATE_RANGE: TkqcDateRange = { presetKey: 'all-time', start: null, end: null }

function pad(n: number) { return String(n).padStart(2, '0') }
function toIso(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` }
function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
function addDays(date: Date, days: number) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days) }

// Boundary semantics CONFIRMED via production trace (references/remotes/
// adaccounts/558.02b0004f.js module 84989, consumed by 569.cc18f3e7.js's
// spend-date-range feature): local calendar-day boundaries (JS Date
// y/m/d, browser-local timezone, never a rolling 24h window); "7 ngày
// trước"/"30 ngày trước" are inclusive of today (today-6..today,
// today-29..today); "Tháng này" = month-start..today; "Tháng trước" =
// full previous calendar month.
export function computePresetRange(key: TkqcDateRangePresetKey, now: Date = new Date()): TkqcDateRange {
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

export function formatRangeDisplay(range: TkqcDateRange): string {
  if (!range.start || !range.end) return TKQC_DATE_RANGE_PRESETS.find((preset) => preset.key === range.presetKey)?.label ?? m("ui.71f6cb94e3")
  const [sy, sm, sd] = range.start.split('-')
  const [ey, em, ed] = range.end.split('-')
  return `${sd}/${sm}/${sy} - ${ed}/${em}/${ey}`
}
