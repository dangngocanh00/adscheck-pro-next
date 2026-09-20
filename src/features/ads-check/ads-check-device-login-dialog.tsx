import { useAppLanguage, t } from '@/i18n'
import { useRef } from 'react'
import { Crown, MonitorSmartphone, UserRound, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'

export type AdsCheckLoginSession = 'pro' | 'regular'

type AdsCheckDeviceLoginDialogProps = {
  open: boolean
  onClose: () => void
  onChoose: (session: AdsCheckLoginSession) => void
}

export function AdsCheckDeviceLoginDialog({ open, onClose, onChoose }: AdsCheckDeviceLoginDialogProps) {
  useAppLanguage();
  const dialogRef = useRef<HTMLElement>(null)
  useOverlayFocus(open, dialogRef, onClose)

  if (!open) return null

  return <div className="ads-device-login-layer" role="presentation">
    <section
      ref={dialogRef}
      className="ads-device-login-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ads-device-login-title"
      aria-describedby="ads-device-login-description"
    >
      <button className="ads-device-login-close" type="button" aria-label={t("ui.d2b73ab2ad")} onClick={onClose}>
        <X size={18} />
      </button>
      <span className="ads-device-login-icon" aria-hidden="true"><MonitorSmartphone size={27} /></span>
      <header>
        <span>{t("ui.c5df3c9fc7")}</span>
        <h2 id="ads-device-login-title">{t("ui.8999d1e076")}</h2>
        <p id="ads-device-login-description">{t("ui.6b7a2db4e0")}</p>
      </header>
      <div className="ads-device-login-balance">
        <Crown size={17} aria-hidden="true" />
        <span>{t("ui.f22622c6e6")}{" "}<strong>{t("ui.ba831d1797")}</strong></span>
      </div>
      <div className="ads-device-login-actions">
        <button type="button" data-autofocus onClick={() => onChoose('pro')}>
          <Crown size={18} aria-hidden="true" />
          <span><strong>{t("ui.1a97c5cde6")}</strong><small>{t("ui.d10c26801c")}</small></span>
        </button>
        <button type="button" onClick={() => onChoose('regular')}>
          <UserRound size={18} aria-hidden="true" />
          <span><strong>{t("ui.91920b58d9")}</strong><small>{t("ui.d8e0017d04")}</small></span>
        </button>
      </div>
    </section>
  </div>
}
