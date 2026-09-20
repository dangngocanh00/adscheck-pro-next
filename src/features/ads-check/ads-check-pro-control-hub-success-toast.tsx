import { useAppLanguage, t } from '@/i18n'
import type { FC } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, X } from 'lucide-react'

type Props = { onClose: () => void }

// Shown alongside AdsCheckProControlHubSuccessModal once the (demo) 2FA
// verify succeeds. Same non-modal, no-backdrop, bottom-right toast pattern
// as AdsCheckProControlHubDeferredWarning — but SUCCESS semantic (green),
// deliberately kept green rather than AdsMeta blue since this is a real
// success/status signal, not a brand-controlled surface. Independent of
// the success modal — closing one does not close the other.
export const AdsCheckProControlHubSuccessToast: FC<Props> = ({ onClose }) => {
  useAppLanguage();
  return createPortal(
    <div className="ads-security-success-toast" role="status">
      <CircleCheck size={18} className="ads-security-success-toast-icon" aria-hidden="true" />
      <div className="ads-security-success-toast-copy">
        <strong>{t("ui.c2e17b07f2")}</strong>
      </div>
      <button type="button" aria-label={t("ui.d2b73ab2ad")} onClick={onClose}><X size={13} /></button>
    </div>,
    document.body,
  )
}

export default AdsCheckProControlHubSuccessToast
