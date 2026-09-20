import { useAppLanguage, m, tx } from '@/i18n'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { TriangleAlert } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
}

// SHARED RULE D — a single reusable destructive-confirmation dialog, used
// by the payment popover (single-card delete + "Xóa toàn bộ thẻ") and
// meant to be the one place any future destructive TKQC/BM/Page/Pixel
// action reaches for, instead of a payment-only bespoke component. No
// mutation happens until the user picks the destructive button here —
// the caller only wires up `onConfirm`, never runs the mutation eagerly.
// Illustration reuses the app's own existing icon-in-circle convention
// (already used by, e.g., the unauthorized-section help badge) rather
// than inventing or downloading an external image just to fill space.
export function AdsProConfirmDialog({ title, description, confirmLabel, cancelLabel = m("ui.34ca764caf"), onConfirm, onClose }: ConfirmDialogProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  return createPortal(
    // CATEGORY B important modal — destructive confirmation must never be
    // dismissed by an accidental backdrop click (that would let a user
    // bypass the decision context without an explicit Hủy/confirm); no
    // mutation happens except from the destructive button itself.
    // dismissOnBackdrop intentionally omitted (Shared Resource/Modal UX
    // correction).
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-pro-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ads-pro-confirm-title" aria-describedby="ads-pro-confirm-description">
        <div className="ads-pro-confirm-illustration" aria-hidden="true"><TriangleAlert size={26} /></div>
        <h2 id="ads-pro-confirm-title">{tx(title)}</h2>
        <p id="ads-pro-confirm-description">{tx(description)}</p>
        <footer>
          <button type="button" className="is-secondary" data-autofocus onClick={onClose}>{tx(cancelLabel)}</button>
          <button type="button" className="is-danger" onClick={() => { onConfirm(); onClose() }}>{tx(confirmLabel)}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}
