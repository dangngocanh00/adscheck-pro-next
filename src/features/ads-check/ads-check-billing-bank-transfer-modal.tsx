import { useAppLanguage, t } from '@/i18n'
import { useRef, type FC } from 'react'
import { createPortal } from 'react-dom'
import { TriangleAlert } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type BankTransferWarningModalProps = {
  onClose: () => void
  onConfirm: () => void
}

// Second, separate confirmation — belongs only to the Step 2 → Step 3
// transition (domestic-bank-transfer acknowledgement), distinct from the
// Step 1 → Step 2 feature-purchase consent modal. Category B (no
// backdrop-dismiss), same as the other Mua gói confirmation dialogs.
// data-autofocus sits on "Đóng" (not the confirm button) so an accidental
// Enter right after opening can't commit the domestic-transfer action.
export const AdsCheckBankTransferWarningModal: FC<BankTransferWarningModalProps> = ({ onClose, onConfirm }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-purchase-bank-warning-modal" role="dialog" aria-modal="true" aria-labelledby="ads-purchase-bank-warning-title">
        <header className="ads-purchase-bank-warning-header">
          <TriangleAlert size={18} className="ads-purchase-bank-warning-icon" aria-hidden="true" />
          <h2 id="ads-purchase-bank-warning-title">{t("ui.7a62ab00d8")}</h2>
        </header>
        <ol className="ads-purchase-bank-warning-list">
          <li><span className="ads-purchase-bank-warning-index" aria-hidden="true">1</span><p>{t("ui.3b7f9bc599")}</p></li>
          <li><span className="ads-purchase-bank-warning-index" aria-hidden="true">2</span><p>{t("ui.75db5ca6ab")}</p></li>
        </ol>
        <button type="button" className="ads-purchase-bank-warning-confirm" onClick={onConfirm}>{t("ui.eab147c4db")}</button>
        <button type="button" className="ads-purchase-bank-warning-close" data-autofocus onClick={onClose}>{t("ui.d2b73ab2ad")}</button>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckBankTransferWarningModal
