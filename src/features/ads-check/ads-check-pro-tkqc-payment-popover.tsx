import { useAppLanguage, tx, m, t } from '@/i18n'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, Trash2, X } from 'lucide-react'
import type { PaymentMethodDemo } from './ads-check-pro-tkqc-data'
import { buildBillingHubUrl } from './ads-check-pro-tkqc-format'
import { AdsProConfirmDialog } from './ads-check-pro-confirm-dialog'

type PaymentPopoverProps = {
  anchorRect: DOMRect
  accountName: string
  accountId: string
  businessId?: string | null
  current: PaymentMethodDemo[]
  history: PaymentMethodDemo[]
  onRemoveCard: (cardId: string) => void
  onRemoveAll: () => void
  onClose: () => void
}

const PANEL_WIDTH = 300

// TKQC Round 1 Part 3 — payment-method popover. CRITICAL per the batch's
// own data-safety rule: removing a card only moves it from `current` into
// `history` in this clone's local row state (see onRemoveCard/onRemoveAll
// in the workspace) — there is no real payment backend to call, so this
// is explicitly clone-local, never presented as a real Meta API call.
// Sizes to content (Part 3's own "one history item => compact popover, do
// not reserve empty delete sections" rule): each section only renders
// when it has items, and history rows never render a delete control.
//
// SHARED RULE D — neither trash click nor "Xóa toàn bộ thẻ" mutates
// anything directly; both only open the shared AdsProConfirmDialog with
// dynamic copy (real last4/account name), and the actual onRemoveCard/
// onRemoveAll callback only fires from the dialog's own destructive
// button.
export function AdsProTkqcPaymentPopover({ anchorRect, accountName, accountId, businessId, current, history, onRemoveCard, onRemoveAll, onClose }: PaymentPopoverProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null)
  const [pendingDelete, setPendingDelete] = useState<{ type: 'card'; cardId: string; last4: string } | { type: 'all' } | null>(null)
  // Traced production: the payment popover's external-link icon opens the
  // exact same Billing Hub URL as the Số dư/Limit cells (same billing_hub
  // account-details deep link, businessId included when present).
  const paymentUrl = buildBillingHubUrl(accountId, businessId)

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (pendingDelete) return // the confirm dialog is a separate portal; don't close the popover underneath it
      if (!panelRef.current?.contains(event.target as Node)) onClose()
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !pendingDelete) onClose() }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, pendingDelete])

  const pos = (() => {
    const left = Math.min(anchorRect.left, window.innerWidth - PANEL_WIDTH - 8)
    return { top: anchorRect.bottom + 6, left: Math.max(8, left) }
  })()

  return <>
    {tx(createPortal(
      <div ref={panelRef} className="ads-tkqc-payment-popover" role="dialog" aria-label={tx(m("ui.77ac7164ea", { 0: accountName }))} style={{ top: pos.top, left: pos.left }}>
        <header>
          <h2>{t("ui.c216d32fea")}</h2>
          <button type="button" className="ads-tkqc-payment-popover-close" aria-label={t("ui.93860fdc69")} onClick={onClose}><X size={14} /></button>
        </header>
        {tx(current.length === 0 && history.length === 0 && <p className="ads-tkqc-payment-popover-empty">{t("ui.58719656ce")}</p>)}
        {tx(current.length > 0 && <ul className="ads-tkqc-payment-popover-list">
          {current.map((card) => <li key={card.id}>
            <span className={`ads-tkqc-payment-badge is-${card.brand.toLowerCase()}`}>{card.brand}</span>
            <span>•{card.last4}</span>
            {tx(paymentUrl && <a href={paymentUrl} target="_blank" rel="noreferrer" aria-label={tx(m("ui.a43eafef50", { 0: card.brand, 1: card.last4 }))}><ExternalLink size={13} /></a>)}
            <button type="button" aria-label={tx(m("ui.a846edc07a", { 0: card.brand, 1: card.last4 }))} onClick={() => setPendingDelete({ type: 'card', cardId: card.id, last4: card.last4 })}><Trash2 size={13} /></button>
          </li>)}
        </ul>)}
        {tx(history.length > 0 && <>
          <div className="ads-tkqc-payment-popover-section">{t("ui.b8a7a320d0")}</div>
          <ul className="ads-tkqc-payment-popover-list is-history">
            {history.map((card) => <li key={card.id}>
              <span className={`ads-tkqc-payment-badge is-${card.brand.toLowerCase()}`}>{card.brand}</span>
              <span>•{card.last4}</span>
              {tx(paymentUrl && <a href={paymentUrl} target="_blank" rel="noreferrer" aria-label={tx(m("ui.a43eafef50", { 0: card.brand, 1: card.last4 }))}><ExternalLink size={13} /></a>)}
            </li>)}
          </ul>
        </>)}
        {current.length > 0 && <footer><button type="button" className="ads-tkqc-payment-popover-remove-all" onClick={() => setPendingDelete({ type: 'all' })}>{t("ui.c4af9bb684")}</button></footer>}
      </div>,
      document.body,
    ))}
    {tx(pendingDelete?.type === 'card' && <AdsProConfirmDialog
      title={t("ui.91e5599067")}
      description={tx(m("ui.e5f8fd408f", { 0: pendingDelete.last4, 1: accountName }))}
      confirmLabel={t("ui.aa1d94fc16")}
      onConfirm={() => onRemoveCard(pendingDelete.cardId)}
      onClose={() => setPendingDelete(null)}
    />)}
    {tx(pendingDelete?.type === 'all' && <AdsProConfirmDialog
      title={t("ui.a02f420ce0")}
      description={tx(m("ui.fdf0d73e04", { 0: accountName }))}
      confirmLabel={t("ui.aa1d94fc16")}
      onConfirm={onRemoveAll}
      onClose={() => setPendingDelete(null)}
    />)}
  </>
}
