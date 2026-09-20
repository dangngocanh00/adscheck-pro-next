import { useAppLanguage, t } from '@/i18n'
import { useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'
import { AdsPurchaseWarningIllustration } from './ads-check-billing-purchase-illustration'

type BillingConsentModalProps = {
  onClose: () => void
  onContinue: () => void
}

// Important consent step before entering the next checkout step — same
// Category B treatment as AdsProConfirmDialog (no backdrop-dismiss), only
// closable via the explicit close button or Escape (useOverlayFocus).
export const AdsCheckBillingConsentModal: FC<BillingConsentModalProps> = ({ onClose, onContinue }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  const [agreed, setAgreed] = useState(false)
  useOverlayFocus(true, panelRef, onClose)

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-purchase-consent-modal" role="dialog" aria-modal="true" aria-labelledby="ads-purchase-consent-title">
        <button type="button" className="ads-purchase-consent-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose} data-autofocus><X size={16} /></button>
        <AdsPurchaseWarningIllustration />
        <h2 id="ads-purchase-consent-title">{t("ui.d87fd26f2d")}</h2>
        <div className="ads-purchase-consent-body">
          <p>{t("ui.5c09ecae67")}</p>
          <p>{t("ui.7a04568417")}</p>
        </div>
        <label className="ads-purchase-consent-agree">
          <input type="checkbox" aria-label={t("ui.a57e74c33a")} checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          <i className="ads-purchase-checkbox" aria-hidden="true"><Check size={12} /></i>
          <span>{t("ui.a57e74c33a")}</span>
        </label>
        <button type="button" className="ads-purchase-consent-continue" disabled={!agreed} onClick={onContinue}>{t("ui.5d92d0921f")}</button>
        <p className="ads-purchase-consent-terms">{t("ui.613141fd8c")}{" "}<span className="ads-purchase-consent-link">{t("ui.a4214b5d3c")}</span> {" "}{t("ui.484da8c0a7")}{" "}<span className="ads-purchase-consent-link">{t("ui.c960e744c5")}</span> {" "}{t("ui.671bea42f7")}</p>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckBillingConsentModal
