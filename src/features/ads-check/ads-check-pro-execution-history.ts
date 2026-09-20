import { m } from '@/i18n'
import { useState } from 'react'
import type { AdsAssetKey } from './ads-check-pro-workspace-data'

// TKQC Round 1 Parts 11/12 — shared execution/history model. Deliberately
// SEPARATE from the pre-existing `progressPercent` ramp in the workspace
// (a transient 0→100→null visual-only ramp used by BM/Page/Pixel's own
// simple progress bar, untouched by this round) — this is the richer,
// PERSISTENT structure behind TKQC's new "completed/total" Progress cell,
// "Nhật ký chạy" modal, and the global "Lịch sử hành động" modal. Both are
// driven by the exact same "Bắt đầu quy trình" trigger and the exact same
// selected rows/steps, so #11 and #12 share this one model rather than
// inventing unrelated mock histories.
//
// Result (success/error) is a deterministic clone-side simulation (same
// spirit as the pre-existing progress ramp's own "clearly a clone-demo
// visualization, never a fake Meta success" rule) — never a real Meta
// API call. In-memory only for this round (no localStorage persistence
// was asked for).
export type ExecutionResultStatus = 'success' | 'error'

export type ExecutionLogEntry = {
  id: string
  runId: string
  asset: AdsAssetKey
  rowId: string
  accountName: string
  accountId: string
  action: string
  timestamp: number
  status: ExecutionResultStatus
  detail: string
}

export type ExecutionRun = {
  id: string
  asset: AdsAssetKey
  startedAt: number
  rowIds: string[]
  totalSteps: number
}

let runCounter = 0
let entryCounter = 0

function pad(n: number) { return String(n).padStart(2, '0') }
export function formatRunTimestamp(ms: number): string {
  const date = new Date(ms)
  return `${pad(date.getHours())}:${pad(date.getMinutes())} - ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

// Deterministic per (run,row,step) — same reasoning as the tkqc-data.ts
// fixture generator: reproducible demo output, never Math.random().
function deterministicSucceeds(seedText: string): boolean {
  let hash = 0
  for (let i = 0; i < seedText.length; i++) hash = (hash * 31 + seedText.charCodeAt(i)) & 0x7fffffff
  return hash % 5 !== 0 // ~80% success rate
}

export function useExecutionHistory() {
  const [runs, setRuns] = useState<ExecutionRun[]>([])
  const [entries, setEntries] = useState<ExecutionLogEntry[]>([])

  const startRun = (asset: AdsAssetKey, rowIds: string[], totalSteps: number): string => {
    runCounter += 1
    const id = `run-${runCounter}`
    setRuns((current) => [{ id, asset, startedAt: Date.now(), rowIds, totalSteps }, ...current])
    return id
  }

  const logStep = (runId: string, asset: AdsAssetKey, row: { id: string; name: string; accountId: string }, action: string) => {
    entryCounter += 1
    const succeeds = deterministicSucceeds(`${runId}:${row.id}:${action}`)
    const entry: ExecutionLogEntry = {
      id: `${runId}-entry-${entryCounter}`,
      runId,
      asset,
      rowId: row.id,
      accountName: row.name,
      accountId: row.accountId,
      action,
      timestamp: Date.now(),
      status: succeeds ? 'success' : 'error',
      detail: succeeds ? m("ui.a145671973", { 0: action }) : m("ui.ba228e174d", { 0: action }),
    }
    setEntries((current) => [...current, entry])
  }

  const progressFor = (asset: AdsAssetKey, rowId: string): { completed: number; total: number; runId: string } | null => {
    const run = runs.find((candidate) => candidate.asset === asset && candidate.rowIds.includes(rowId))
    if (!run) return null
    const completed = entries.filter((entry) => entry.runId === run.id && entry.rowId === rowId).length
    return { completed, total: run.totalSteps, runId: run.id }
  }

  const entriesForRun = (runId: string) => entries.filter((entry) => entry.runId === runId)
  const entriesForRow = (asset: AdsAssetKey, rowId: string) => entries.filter((entry) => entry.asset === asset && entry.rowId === rowId)
  const failedEntriesForRun = (runId: string) => entries.filter((entry) => entry.runId === runId && entry.status === 'error')

  // "Chạy lại các bước lỗi" (#11/#12 footer) — re-runs just the currently
  // failed entries in place (same run/row/action, fresh timestamp), using
  // a new seed component so a retry can genuinely flip outcome instead of
  // deterministically failing forever.
  const retryEntries = (entryIds: string[]) => {
    setEntries((current) => current.map((entry) => {
      if (!entryIds.includes(entry.id) || entry.status !== 'error') return entry
      entryCounter += 1
      const succeeds = deterministicSucceeds(`retry-${entryCounter}:${entry.runId}:${entry.rowId}:${entry.action}`)
      return {
        ...entry,
        status: succeeds ? 'success' : 'error',
        timestamp: Date.now(),
        detail: succeeds ? m("ui.b890c48f7e", { 0: entry.action }) : m("ui.4768887f57", { 0: entry.action }),
      }
    }))
  }

  return { runs, entries, startRun, logStep, progressFor, entriesForRun, entriesForRow, failedEntriesForRun, retryEntries }
}
