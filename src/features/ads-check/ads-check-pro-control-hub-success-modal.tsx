import { useAppLanguage, t } from '@/i18n'
import { useRef, type FC } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type Props = { onClose: () => void }

// Shown once the (demo) 2FA verify succeeds — ends the whole Control Hub
// security setup flow. The check illustration keeps semantic success green
// (a real success indicator, not a brand surface); the primary CTA is
// AdsMeta blue like every other brand-controlled control in this flow.
export const AdsCheckProControlHubSuccessModal: FC<Props> = ({ onClose }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-security-success-modal" role="dialog" aria-modal="true" aria-labelledby="ads-security-success-title">
        <span className="ads-security-success-icon" aria-hidden="true"><CircleCheck size={32} /></span>
        <h2 id="ads-security-success-title">{t("ui.d960bda373")}</h2>
        <p>{t("ui.203610986c")}</p>
        <button type="button" className="ads-security-success-cta" onClick={onClose} data-autofocus>{t("ui.cf47dba7bf")}</button>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckProControlHubSuccessModal
