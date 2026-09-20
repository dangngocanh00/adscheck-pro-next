import { useAppLanguage, t } from '@/i18n'
import { useRef, type FC } from 'react'
import { createPortal } from 'react-dom'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'
import { AdsPurchaseWarningIllustration } from './ads-check-billing-purchase-illustration'

type PaymentNoticeModalProps = {
  onClose: () => void
  onUnderstood: () => void
}

// Third, separate checkout gate — reached only after Modal 2's domestic-
// transfer confirmation, right before the existing Step 3 transition.
// Reuses the same numbered-list/circle/CTA styling already built for
// Modal 2 (.ads-purchase-bank-warning-*) instead of re-declaring it.
// Category B (no backdrop-dismiss) like the other two checkout modals —
// only "Đã hiểu" advances to Step 3.
export const AdsCheckPaymentNoticeModal: FC<PaymentNoticeModalProps> = ({ onClose, onUnderstood }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-purchase-payment-notice-modal" role="dialog" aria-modal="true" aria-labelledby="ads-purchase-payment-notice-title">
        <AdsPurchaseWarningIllustration />
        <h2 id="ads-purchase-payment-notice-title">{t("ui.02cc6a1941")}</h2>
        <ol className="ads-purchase-bank-warning-list">
          <li><span className="ads-purchase-bank-warning-index" aria-hidden="true">1</span><p>{t("ui.cfd9e6c987")}{" "}<b>{t("ui.79e4bac618")}</b></p></li>
          <li><span className="ads-purchase-bank-warning-index" aria-hidden="true">2</span><p>{t("ui.38ae2d2e12")}</p></li>
          <li><span className="ads-purchase-bank-warning-index" aria-hidden="true">3</span><p>{t("ui.32ba56d56a")}{" "}<b>{t("ui.c7ff66eb6e")}</b> {" "}{t("ui.962881f4e0")}</p></li>
          <li><span className="ads-purchase-bank-warning-index" aria-hidden="true">4</span><p>{t("ui.e0195c334a")}{" "}<b>{t("ui.d9c35c3aa7")}</b> {" "}{t("ui.0c9bd9d636")}</p></li>
        </ol>
        <button type="button" className="ads-purchase-bank-warning-confirm" data-autofocus onClick={onUnderstood}>{t("ui.f46981ba81")}</button>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckPaymentNoticeModal
