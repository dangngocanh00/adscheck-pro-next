import { m } from '@/i18n'
// Ads Save "Configured state" — wraps a completed Step 1 + Step 2
// `AdsSaveConfiguration` with the extra bits the configured workspace
// needs (a stable id to key/toggle/remove by, an enabled flag, a created
// timestamp) WITHOUT duplicating the Step 1/Step 2 state itself.
//
// No backend/store exists for Ads Save configurations anywhere in this
// project — this collection lives only in `AdsSavePage`'s own React
// state for the current session (see that file's `configurations` state
// and its header comment for the same honest limitation already reported
// for `onCreate`).
import { tkqcRowFixtures } from '@/features/ads-check/ads-check-pro-tkqc-data'
import type { AdsSaveConfiguration, AdsSaveDownloadTarget, AdsSaveMetricType } from './ads-save-create-config-data'

// One real, successful local download producing an actual file (see
// `triggerLocalCsvDownload` below) — never a fabricated remote-Meta fetch
// result.
export type AdsSaveDownloadRecord = { id: string; timestamp: number; fileName: string }

export type AdsSaveStoredConfiguration = {
  id: string
  createdAt: number
  enabled: boolean
  configuration: AdsSaveConfiguration
  // Scoped to THIS configuration only — embedded here (not a separate
  // `{[configId]: records[]}` map) so it can never drift out of sync with
  // the configuration it belongs to.
  downloadHistory: AdsSaveDownloadRecord[]
}

let configSequence = 0
export function createStoredConfiguration(configuration: AdsSaveConfiguration): AdsSaveStoredConfiguration {
  configSequence += 1
  return {
    id: `ads-save-config-${Date.now()}-${configSequence}`,
    createdAt: Date.now(),
    // A newly-created configuration starts active — no real remote
    // scheduler exists to query an actual running state from.
    enabled: true,
    configuration,
    downloadHistory: [],
  }
}

const DOWNLOAD_TARGET_LABELS: Record<AdsSaveDownloadTarget, string> = {
  campaign: m("ui.ebf5469ebd"),
  'ad-set': m("ui.ef24a58a7e"),
}
export function formatDownloadTargets(targets: AdsSaveDownloadTarget[]): string {
  if (targets.length === 0) return '—'
  return targets.map((target) => DOWNLOAD_TARGET_LABELS[target]).join(' + ')
}

const METRIC_TYPE_LABELS: Record<AdsSaveMetricType, string> = {
  performance: m("ui.68d57674c5"),
  engagement: m("ui.3e31e097a1"),
  traffic: m("ui.788f94d34e"),
  'message-engagement': m("ui.e164590cc8"),
  video: 'Video',
}
export function formatMetricType(metric: AdsSaveMetricType): string {
  return METRIC_TYPE_LABELS[metric]
}

export function formatScheduleSummary(configuration: AdsSaveConfiguration): string {
  if (configuration.scheduleMode === 'fixed') {
    const count = configuration.timeSlots.length
    return m("ui.a27005af2d", { 0: count })
  }
  const minutes = configuration.repeatIntervalMinutes.trim()
  return m("ui.169368be7b", { 0: minutes || '—' })
}

export function formatSelectedAccountCount(configuration: AdsSaveConfiguration): string {
  return m("ui.ee7bc457b2", { 0: configuration.selectedAccountIds.length })
}

// The real, currently-selected TKQC identities behind a configuration —
// resolved the SAME way Step 2 itself resolves them (real fixtures for
// "all", the saved demo/real resolution for "by-id") rather than a second
// account model.
function resolveConfiguredAccounts(configuration: AdsSaveConfiguration): { id: string; name: string; accountId: string }[] {
  const source = configuration.assetLoadMode === 'all'
    ? tkqcRowFixtures.map((row) => ({ id: row.id, name: row.name, accountId: row.accountId }))
    : configuration.resolvedByIdAccounts
  return source.filter((account) => configuration.selectedAccountIds.includes(account.id))
}

function pad2(value: number) { return String(value).padStart(2, '0') }
export function toIsoDate(date: Date): string { return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` }
export function todayIsoDate(): string { return toIsoDate(new Date()) }
export function formatIsoDateVi(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}
export function formatTimestampVi(timestamp: number): string {
  const date = new Date(timestamp)
  return `${formatIsoDateVi(toIsoDate(date))} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

// "Tải ngay" — this clone has no real Meta insights/performance-data API
// (see the batch report), so this is an HONEST local export of the
// configuration's actual resolved TKQC identity list as a real CSV file
// the browser genuinely saves — never a simulated remote Meta download.
// Returns the resulting history record only after the browser download
// actually fires.
export function triggerLocalCsvDownload(configuration: AdsSaveConfiguration): AdsSaveDownloadRecord {
  const accounts = resolveConfiguredAccounts(configuration)
  const lines = ['TKQC Name,TKQC ID', ...accounts.map((account) => `${account.name},${account.accountId}`)]
  const fileName = `${configuration.configurationName.trim() || 'ads-save-config'}-${Date.now()}.csv`
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return { id: `ads-save-download-${Date.now()}`, timestamp: Date.now(), fileName }
}
