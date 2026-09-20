import { useAppLanguage, t, tx, m } from '@/i18n'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { formatRunTimestamp, type ExecutionLogEntry } from './ads-check-pro-execution-history'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type RunLogModalProps = {
  accountName: string
  entries: ExecutionLogEntry[]
  onRetryFailed: () => void
  onClose: () => void
}

// Round 1 Part 11 — "Nhật ký chạy" per-account modal, opened from the
// Progress cell's Eye button. Rows are the SAME ExecutionLogEntry records
// the global "Lịch sử hành động" modal reads (Part 12) — one shared model,
// filtered to this one account here.
export function AdsProTkqcRunLogModal({ accountName, entries, onRetryFailed, onClose }: RunLogModalProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const hasFailed = entries.some((entry) => entry.status === 'error')

  return createPortal(
    // CATEGORY B important modal (same family as "Lịch sử hành động") —
    // backdrop click must NOT dismiss (Shared Resource/Modal UX
    // correction); dismissOnBackdrop intentionally omitted.
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-tkqc-run-log-modal" role="dialog" aria-modal="true" aria-labelledby="ads-tkqc-run-log-title">
        <header>
          <h2 id="ads-tkqc-run-log-title">{t("ui.169bfab956")}{accountName}{t("ui.e2bbf209ae")}</h2>
          <button type="button" className="ads-advanced-filter-close" aria-label={t("ui.2debb435ab")} onClick={onClose} data-autofocus><X size={16} /></button>
        </header>
        <div className="ads-tkqc-run-log-table-scroll">
          <table className="ads-tkqc-run-log-table">
            <thead><tr><th>{t("ui.8e9fdd281d")}</th><th>{t("ui.83cf094454")}</th><th>{t("ui.c9f95514d6")}</th><th>{t("ui.969bbb1f71")}</th><th>{t("ui.d72a6317ec")}</th></tr></thead>
            <tbody>
              {tx(entries.map((entry) => <tr key={entry.id}>
                <td>{entry.action}</td>
                <td>{tx(formatRunTimestamp(entry.timestamp))}</td>
                <td><span className={`ads-tkqc-run-log-result is-${entry.status}`}>{tx(entry.status === 'success' ? m("ui.9a7d703709") : m("ui.d290780737"))}</span></td>
                <td>{tx(entry.detail.includes('"') ? entry.action : entry.action)}</td>
                <td>{tx(entry.detail)}</td>
              </tr>))}
              {tx(entries.length === 0 && <tr><td colSpan={5} className="ads-tkqc-run-log-empty">{t("ui.c9a18a3251")}</td></tr>)}
            </tbody>
          </table>
        </div>
        <footer>
          <button type="button" className="is-secondary" onClick={onClose}>{t("ui.d2b73ab2ad")}</button>
          <button type="button" className="is-primary" disabled={!hasFailed} onClick={onRetryFailed}>{t("ui.bf147aea3f")}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}
