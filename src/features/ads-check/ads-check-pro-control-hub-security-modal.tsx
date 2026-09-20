import { useAppLanguage, t } from '@/i18n'
import { useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type Props = { onDefer: () => void; onContinue: () => void }

// Control Hub setup — Step 2 ("Cơ chế bảo mật của Control Hub"), reached
// from Step 1's ("Tôn chỉ của Adscheck") CTA. Same step-machine as Step 1 (see
// controlHubSetupStep in ads-check-adaccounts-workspace.tsx) — mounted only
// while this is the active step, so a fresh mount always starts with the
// checkbox unchecked (no manual reset effect needed, same pattern as Step
// 1's countdown).
export const AdsCheckProControlHubSecurityModal: FC<Props> = ({ onDefer, onContinue }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onDefer)
  const [securityAcknowledged, setSecurityAcknowledged] = useState(false)

  return createPortal(
    <AdsProModalBackdrop onClose={onDefer}>
      <section ref={panelRef} className="ads-security-modal" role="dialog" aria-modal="true" aria-labelledby="ads-security-title">
        <h2 id="ads-security-title" className="ads-security-title">{t("ui.cf3e3bf60c")}</h2>
        <div className="ads-security-body">
          <p className="ads-security-lead">{t("ui.45e3896689")}</p>

          <article className="ads-security-card">
            <span className="ads-security-badge">1</span>
            <h3>{t("ui.90de019ebf")}</h3>
            <p><strong>{t("ui.3b14d1f632")}</strong> {" "}{t("ui.5528b6a382")}</p>
            <p><strong>{t("ui.4f278c5e81")}</strong> {" "}{t("ui.28b256f7aa")}</p>
            <p><strong>{t("ui.2a8647b61b")}</strong> {" "}{t("ui.3218c2372e")}</p>
          </article>

          <article className="ads-security-card">
            <span className="ads-security-badge">2</span>
            <h3>{t("ui.d0783d8d6e")}</h3>
            <p><strong>{t("ui.aad4aa3923")}</strong> {" "}{t("ui.db8875968c")}</p>
          </article>

          <article className="ads-security-warning" role="note">
            <h3>{t("ui.2d869b3933")}</h3>
            <p>{t("ui.ace7a4d0ba")}</p>
            <p>{t("ui.7ad1ed3061")}</p>
          </article>

          <label className="ads-security-ack">
            <input type="checkbox" checked={securityAcknowledged} onChange={(event) => setSecurityAcknowledged(event.target.checked)} />
            <span>{t("ui.bc0e3f619e")}</span>
          </label>
        </div>
        <footer className="ads-security-footer">
          <button type="button" className="ads-security-defer" onClick={onDefer}>{t("ui.0144396060")}</button>
          <button type="button" className="ads-security-cta" disabled={!securityAcknowledged} onClick={onContinue}>{t("ui.a7f534295d")}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckProControlHubSecurityModal
