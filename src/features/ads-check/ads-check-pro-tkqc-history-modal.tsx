import { useAppLanguage, t, tx, m } from '@/i18n'
import { Fragment, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronRight, RotateCw, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { formatRunTimestamp, type ExecutionLogEntry, type ExecutionRun } from './ads-check-pro-execution-history'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type HistoryModalProps = {
  runs: ExecutionRun[]
  entries: ExecutionLogEntry[]
  onRetryFailed: (entryIds: string[]) => void
  onClose: () => void
}

// Round 1 Part 12 — "Lịch sử hành động", a GLOBAL modal (every asset's
// runs, not just the active tab) reading the exact same ExecutionLogEntry
// records the per-account "Nhật ký chạy" modal uses (Part 11) — one
// shared model, not an unrelated mock history. Traced production
// (references/remotes/adaccounts/436.e5c83aa9.js historyDialog) confirms
// a real 3-level run -> step -> target hierarchy with its own per-row
// retry/copy actions; this clone implements the simpler 2-level run ->
// entry grouping the batch spec's own footer (bulk "Chạy lại các bước
// lỗi", not per-row) calls for, since this clone's demo functions don't
// model individual downstream targets per step — a deliberate, flagged
// scope simplification, not a missed requirement.
export function AdsProTkqcHistoryModal({ runs, entries, onRetryFailed, onClose }: HistoryModalProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const [collapsedRuns, setCollapsedRuns] = useState<Set<string>>(new Set())
  const hasFailed = entries.some((entry) => entry.status === 'error')

  const toggleRun = (runId: string) => setCollapsedRuns((current) => {
    const next = new Set(current)
    if (next.has(runId)) next.delete(runId); else next.add(runId)
    return next
  })

  return createPortal(
    // CATEGORY B important modal — backdrop click must NOT dismiss (Shared
    // Resource/Modal UX correction); dismissOnBackdrop intentionally
    // omitted (defaults false). Closing is only via the X / "Đóng" button.
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-tkqc-history-modal" role="dialog" aria-modal="true" aria-labelledby="ads-tkqc-history-title">
        <header>
          <h2 id="ads-tkqc-history-title">{t("ui.8edc7a008e")}</h2>
          <button type="button" className="ads-advanced-filter-close" aria-label={t("ui.ca89f5dd16")} onClick={onClose} data-autofocus><X size={16} /></button>
        </header>
        <div className="ads-tkqc-history-table-scroll">
          <table className="ads-tkqc-history-table">
            <thead><tr><th /><th>{t("ui.6ed064d441")}</th><th>{t("ui.4a60abe525")}</th><th>{t("ui.8e9fdd281d")}</th><th>{t("ui.e03c1401e3")}</th><th>{t("ui.c9f95514d6")}</th><th>{t("ui.969bbb1f71")}</th><th>{t("ui.d72a6317ec")}</th></tr></thead>
            <tbody>
              {tx(runs.map((run) => {
                const runEntries = entries.filter((entry) => entry.runId === run.id)
                const collapsed = collapsedRuns.has(run.id)
                return <Fragment key={run.id}>
                  <tr className="ads-tkqc-history-run-row">
                    <td><button type="button" aria-label={tx(collapsed ? m("ui.a02f418ecd") : m("ui.3addc79930"))} onClick={() => toggleRun(run.id)}>{collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button></td>
                    <td colSpan={7}><strong>{tx(formatRunTimestamp(run.startedAt))}</strong> <small>({runEntries.length} {" "}{t("ui.2e2c40f31c")}</small></td>
                  </tr>
                  {!collapsed && runEntries.map((entry) => <tr key={entry.id}>
                    <td />
                    <td />
                    <td className="ads-tkqc-history-account"><strong>{entry.accountName}</strong><small>{entry.accountId}</small></td>
                    <td className="ads-tkqc-history-action"><RotateCw size={13} aria-hidden="true" />{entry.action}</td>
                    <td><span className="ads-tkqc-history-status">{t("ui.c66efcf181")}</span></td>
                    <td>{tx(entry.status === 'success'
                      ? <Check size={16} className="ads-tkqc-run-log-result is-success" aria-label={t("ui.9a7d703709")} />
                      : <X size={16} className="ads-tkqc-run-log-result is-error" aria-label={t("ui.d290780737")} />)}
                    </td>
                    <td>-</td>
                    <td>{tx(entry.detail)}</td>
                  </tr>)}
                </Fragment>
              }))}
              {tx(runs.length === 0 && <tr><td colSpan={8} className="ads-tkqc-history-empty">{t("ui.3af213f341")}</td></tr>)}
            </tbody>
          </table>
        </div>
        <footer>
          <button type="button" className="is-secondary" onClick={onClose}>{t("ui.d2b73ab2ad")}</button>
          <button type="button" className="is-primary" disabled={!hasFailed} onClick={() => onRetryFailed(entries.filter((entry) => entry.status === 'error').map((entry) => entry.id))}>{t("ui.bf147aea3f")}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}
