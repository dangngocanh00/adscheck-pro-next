// Ads Save "Tạo cấu hình mới" — Step 1 (Cài đặt cấu hình) state model.
// No config-creation model existed anywhere in the project before this
// round, so this is a fresh, minimal representation — shaped so Step 2
// (Chọn tài sản) and a future save action can extend it later without a
// second, duplicate source of truth for the same form.

export type AdsSaveDataRange = 'lifetime' | 'today'
export type AdsSaveDownloadTarget = 'campaign' | 'ad-set'
export type AdsSaveMetricType = 'performance' | 'engagement' | 'traffic' | 'message-engagement' | 'video'
export type AdsSaveScheduleMode = 'fixed' | 'recurring'
export type AdsSaveTimeSlot = { id: string; hour: number; minute: number }

export type AdsSaveStep1Config = {
  configurationName: string
  accountDataRange: AdsSaveDataRange
  // Correction — "Mục tiêu tải xuống" is checkbox/multi-select in
  // production (both Chiến dịch and Nhóm quảng cáo can be selected at
  // once), not a single radio value — an array of the checked targets,
  // never a single `downloadTarget` union value.
  downloadTargets: AdsSaveDownloadTarget[]
  metricType: AdsSaveMetricType
  scheduleMode: AdsSaveScheduleMode
  timeSlots: AdsSaveTimeSlot[]
  // "Lặp lại" mode's own repeat interval, in minutes. Kept as raw text (not
  // a number) so the input can hold transient invalid states (empty, "-")
  // while typing without fighting a controlled numeric value; validated
  // separately in `isStep1ConfigValid`. Kept as a SEPARATE field from
  // `timeSlots` (never overwritten/cleared by it) so switching between
  // Cố định/Lặp lại never corrupts the other mode's own values.
  repeatIntervalMinutes: string
}

let slotSequence = 0
export function createTimeSlot(hour = 12, minute = 30): AdsSaveTimeSlot {
  slotSequence += 1
  return { id: `ads-save-slot-${Date.now()}-${slotSequence}`, hour, minute }
}

// A factory (not a shared constant object) so every modal open starts from
// its own fresh, independent state — never a mutated leftover from a prior
// open sharing the same array/object reference.
export function createDefaultStep1Config(): AdsSaveStep1Config {
  return {
    configurationName: '',
    accountDataRange: 'lifetime',
    downloadTargets: ['campaign'],
    metricType: 'performance',
    scheduleMode: 'fixed',
    timeSlots: [createTimeSlot(12, 30)],
    repeatIntervalMinutes: '60',
  }
}

export function isRepeatIntervalValid(value: string): boolean {
  if (value.trim() === '') return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0
}

export function isStep1ConfigValid(config: AdsSaveStep1Config): boolean {
  if (config.configurationName.trim() === '') return false
  if (config.downloadTargets.length === 0) return false
  if (config.scheduleMode === 'fixed' && config.timeSlots.length === 0) return false
  if (config.scheduleMode === 'recurring' && !isRepeatIntervalValid(config.repeatIntervalMinutes)) return false
  return true
}

export const HOURS = Array.from({ length: 24 }, (_, index) => index)
// No existing scheduling model defines an increment — 5-minute steps are
// the standard granularity for this kind of fixed-time picker and keep the
// dropdown a sane length (12 options) rather than listing all 60 minutes.
export const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5)

// Step 2 (Chọn tài sản).
export type AdsSaveAssetLoadMode = 'all' | 'by-id'
export type AdsSaveStep2Config = {
  assetLoadMode: AdsSaveAssetLoadMode
  selectedAccountIds: string[]
  // "Tải theo ID TKQC" mode's own fields — kept SEPARATE from
  // `selectedAccountIds` (shared by both modes) so switching
  // Tải tất cả ⇄ Tải theo ID never destroys the other mode's own
  // entered text / resolved results / selection.
  byIdInput: string
  // The accounts the last "Tải danh sách" click resolved — real TKQC
  // fixtures when one happens to match, otherwise a LOCAL DEMO row (see
  // `buildDemoTkqcAccount` below). Stored as full objects, not just ids:
  // demo rows are synthesized on the fly and don't exist in any static
  // fixture array to re-derive them from later.
  resolvedByIdAccounts: AdsSaveResolvedAccount[]
}

export function createDefaultStep2Config(): AdsSaveStep2Config {
  return { assetLoadMode: 'all', selectedAccountIds: [], byIdInput: '', resolvedByIdAccounts: [] }
}

// Parses the "one TKQC ID per line" textarea: trims whitespace, drops
// empty lines, de-dupes (first occurrence wins) — no comma/semicolon
// splitting invented, since production only shows newline-separated IDs.
export function parseTkqcIdLines(input: string): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const rawLine of input.split('\n')) {
    const id = rawLine.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

// A valid TKQC ID: digits only (Meta ad-account IDs are numeric), a
// plausible length. Arbitrary text never becomes an account row.
export function isValidTkqcIdLine(id: string): boolean {
  return /^\d{5,20}$/.test(id)
}

// The minimal shape the shared Step-2 result-row rendering needs — real
// `TkqcRow` fixtures and locally-synthesized demo rows both satisfy it.
export type AdsSaveResolvedAccount = { id: string; name: string; accountId: string; status: string }

// LOCAL DEMO FALLBACK — this clone has no real Meta account-lookup API.
// When an entered ID doesn't match anything in the existing TKQC fixture
// data, this builds a clearly-labeled placeholder row instead of leaving
// "Tải theo ID TKQC" permanently empty. Never presented as a real Meta
// API response; isolated here so it is trivial to delete once a real
// lookup exists — the entered ID itself stays the row's identity
// (`id`/`accountId`), nothing is hardcoded.
export const DEMO_TKQC_STATUS = 'demo'
export function buildDemoTkqcAccount(id: string, index: number): AdsSaveResolvedAccount {
  return { id, name: `TKQC Demo ${index + 1}`, accountId: id, status: DEMO_TKQC_STATUS }
}

export function isStep2ConfigValid(config: AdsSaveStep2Config): boolean {
  // Entered/parsed IDs alone are never sufficient in either mode — only a
  // real resolved + checked selection counts, so both modes share this
  // one rule.
  return config.selectedAccountIds.length > 0
}

// The final combined shape Step 1 + Step 2 produce together — what a real
// save/backend action would eventually receive. No duplicate copy of this
// shape lives anywhere else; the modal composes it from its own Step 1 +
// Step 2 state right before calling `onCreate`.
export type AdsSaveConfiguration = AdsSaveStep1Config & AdsSaveStep2Config
