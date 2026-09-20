import { useAppLanguage, m, t, tx } from '@/i18n'
import { useEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type Props = { onClose: () => void; onContinue: () => void }

const COUNTDOWN_START = 5

// "Cài đặt Control Hub" (VIA tab's own loadButton slot) opens THIS charter
// modal — distinct from the sidebar nav-icon's Control Hub benefits/
// onboarding modal (ControlHubModal in ads-save-modals.tsx). Two different
// entry points, two different components, never merged.
//
// Countdown is plain derived render state (no text-parsing): `countdown`
// starts at COUNTDOWN_START on every fresh mount (this component is only
// ever rendered while its parent's `open` flag is true — see
// ads-check-adaccounts-workspace.tsx — so close+reopen unmounts/remounts it
// and the state naturally resets to 5, no manual reset effect needed) and
// ticks down once per second via a self-rescheduling setTimeout, which also
// means cleanup (unmount/close) is handled by the same effect's return —
// never more than one timer alive at once.
export const AdsCheckProControlHubCharterModal: FC<Props> = ({ onClose, onContinue }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const [countdown, setCountdown] = useState(COUNTDOWN_START)

  useEffect(() => {
    if (countdown <= 0) return
    const id = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(id)
  }, [countdown])

  const ctaLabel = countdown > 0 ? m("ui.5e6de9c833", { 0: countdown }) : m("ui.b789527df8")

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-charter-modal" role="dialog" aria-modal="true" aria-labelledby="ads-charter-title">
        <button type="button" className="ads-charter-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose} data-autofocus><X size={16} /></button>
        <h2 id="ads-charter-title" className="ads-charter-title">{t("ui.91cd267163")}</h2>
        <div className="ads-charter-body">
          <p className="ads-charter-lead">{t("ui.b26a1f298d")}</p>
          <p>{t("ui.92d8a44f11")}</p>
          <p>{t("ui.1ab7eddb7e")}{" "}<span className="ads-charter-highlight">{t("ui.05011b7c0d")}</span> {" "}{t("ui.9ee5aae717")}</p>
          <ul className="ads-charter-list">
            <li>{t("ui.e200f1e467")}{" "}<span className="ads-charter-highlight">{t("ui.6c408faf46")}</span>.</li>
            <li>{t("ui.1392bf0074")}{" "}<span className="ads-charter-highlight">{t("ui.1d5eab3cd1")}</span> {" "}{t("ui.ec91e9e9e5")}</li>
            <li>{t("ui.4ea21bbe89")}{" "}<span className="ads-charter-highlight">{t("ui.1341411411")}</span> {" "}{t("ui.a32a307864")}</li>
          </ul>
          <p>{t("ui.0ecfca46ca")}{" "}<span className="ads-charter-highlight">{t("ui.410d313d52")}</span>.</p>
          <p className="ads-charter-lead">{t("ui.1c0ba8f530")}</p>
          <div className="ads-charter-callout">
            <p>{t("ui.c88e0ecdeb")}</p>
            <p>{t("ui.ad52b7b757")}</p>
            <p>{t("ui.159a5bf24c")}</p>
          </div>
          <p>{t("ui.1f1f64fc54")}{" "}<span className="ads-charter-highlight">{t("ui.8f7549b273")}</span>.</p>
          <p className="ads-charter-closing">{t("ui.3d67383598")}</p>
        </div>
        <footer className="ads-charter-footer">
          <button type="button" className="ads-charter-cta" disabled={countdown > 0} onClick={onContinue}>{tx(ctaLabel)}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckProControlHubCharterModal
