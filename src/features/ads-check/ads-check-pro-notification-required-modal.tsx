import { useAppLanguage, t } from '@/i18n'
import { useRef, type FC } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Check, MousePointerClick, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type Props = { onClose: () => void }

// Auto-opens once per genuine Ads Check Pro module entry (see the mount-only
// useEffect in AdsCheckAdAccountsWorkspace — empty deps, so switching
// VIA/TKQC/BM/Page/Pixel — a state change inside that SAME mounted
// component — never re-triggers it). Category B treatment (no
// backdrop-dismiss), same AdsProModalBackdrop/useOverlayFocus infra as
// every other modal in this app — no parallel overlay system.
//
// This does NOT call Notification.requestPermission() — it is purely an
// instructional panel; the 2 "steps" below are lightweight CSS/icon
// diagrams (explicitly not a real Chrome screenshot, since none exists in
// this project) so nothing here pretends to be a captured screenshot.
export const AdsCheckProNotificationRequiredModal: FC<Props> = ({ onClose }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-notif-required-modal" role="dialog" aria-modal="true" aria-labelledby="ads-notif-required-title">
        <button type="button" className="ads-notif-required-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose} data-autofocus><X size={16} /></button>
        <span className="ads-notif-required-badge"><Bell size={13} />{t("ui.018bc9db79")}</span>
        <h2 id="ads-notif-required-title">{t("ui.7dcd72fabe")}</h2>
        <p className="ads-notif-required-lead">{t("ui.b3f0ef4d2b")}</p>
        <div className="ads-notif-required-steps">
          <article className="ads-notif-required-step">
            <span className="ads-notif-required-step-number">1</span>
            <div className="ads-notif-required-step-art" aria-hidden="true">
              <div className="ads-notif-required-browser-chrome">
                <i /><i /><i />
                <span className="ads-notif-required-address-bar"><MousePointerClick size={13} /></span>
              </div>
            </div>
            <p>{t("ui.3be3ac2320")}</p>
          </article>
          <article className="ads-notif-required-step">
            <span className="ads-notif-required-step-number">2</span>
            <div className="ads-notif-required-step-art" aria-hidden="true">
              <div className="ads-notif-required-toggle-row"><span>{t("ui.5d6af377c2")}</span><i className="ads-notif-required-toggle is-on"><em /></i></div>
            </div>
            <p>{t("ui.a421691cba")}</p>
          </article>
        </div>
        <small className="ads-notif-required-note">{t("ui.3658d945ab")}</small>
        <button type="button" className="ads-notif-required-done" onClick={onClose}><Check size={15} />{t("ui.f46981ba81")}</button>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckProNotificationRequiredModal
