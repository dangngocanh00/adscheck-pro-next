import { useAppLanguage, t } from '@/i18n'
import { useRef, type FC } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, HelpCircle, Link2, Puzzle, RefreshCw, Settings, WalletCards, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'
import { AdsCheckBrandMark } from './ads-check-brand-mark'

type Props = { onClose: () => void }

// Pure HTML/CSS mini illustrations (plus the one real brand asset,
// AdsCheckBrandMark) — no new image assets, no raster screenshots (matching
// this repo's established convention for demo illustrations, e.g.
// AdsPurchaseQrPlaceholder). Purely decorative (aria-hidden), never
// interactive, never real user data.
function Step1Illustration() {
  useAppLanguage();
  return <div className="ads-help-mini-card" aria-hidden="true">
    <AdsCheckBrandMark className="ads-help-mini-logo" />
    <strong>{t("ui.7388465b17")}</strong>
    <small>{t("ui.32c5d73cf9")}</small>
  </div>
}

function Step2Illustration() {
  useAppLanguage();
  return <div className="ads-help-mini-store-list" aria-hidden="true">
    <div className="ads-help-mini-store">
      <span className="ads-help-mini-store-icon"><Puzzle size={16} /></span>
      <div><strong>{t("ui.0a099528df")}</strong><small>{t("ui.e5e10335ba")}</small></div>
    </div>
    <div className="ads-help-mini-store">
      <span className="ads-help-mini-store-icon"><Link2 size={16} /></span>
      <div><strong>{t("ui.f197526862")}</strong><small>{t("ui.2117220bbf")}</small></div>
    </div>
  </div>
}

function Step3Illustration() {
  useAppLanguage();
  return <div className="ads-help-mini-card ads-help-mini-account" aria-hidden="true">
    <strong>{t("ui.4f4d141887")}</strong>
    <small>{t("ui.8b6acd3f31")}</small>
    <small className="ads-help-mini-balance"><WalletCards size={12} /> {" "}{t("ui.1ccd86c16b")}</small>
    <span className="ads-help-mini-link">{t("ui.a719f74187")}{" "}<ArrowUpRight size={12} /></span>
  </div>
}

function Step4Illustration() {
  useAppLanguage();
  return <div className="ads-help-mini-toolbar" aria-hidden="true">
    <span className="ads-help-mini-toolbar-btn"><Settings size={13} />{t("ui.90ae2f89a4")}</span>
    <span className="ads-help-mini-toolbar-refresh"><RefreshCw size={15} /></span>
  </div>
}

// Control Hub — floating help entry point, reused across VIA/TKQC/BM/Page/
// Pixel (mounted once at the shared workspace level, see
// ads-check-adaccounts-workspace.tsx — never duplicated per asset tab).
// Purely informational: closing it never touches Control Hub
// configured/security/2FA state, current tab/folder/search/filter, or any
// VIA data.
export const AdsCheckProControlHubHelpModal: FC<Props> = ({ onClose }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  return createPortal(
    <AdsProModalBackdrop dismissOnBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-help-modal" role="dialog" aria-modal="true" aria-labelledby="ads-help-title">
        <header className="ads-help-header">
          <HelpCircle size={19} className="ads-help-header-icon" aria-hidden="true" />
          <h2 id="ads-help-title">{t("ui.d864e1893e")}</h2>
          <button type="button" className="ads-help-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose}><X size={16} /></button>
        </header>

        <div className="ads-help-body">
          <div className="ads-help-grid">
            <article className="ads-help-card">
              <span className="ads-help-badge">1</span>
              <p>{t("ui.dd981e3a0a")}</p>
              <Step1Illustration />
            </article>

            <article className="ads-help-card">
              <span className="ads-help-badge">2</span>
              <p>{t("ui.9895cf8fab")}{" "}<span className="ads-help-accent">{t("ui.d968326846")}</span> {" "}{t("ui.2a82f2762a")}{" "}<span className="ads-help-accent">{t("ui.dc1e4f7cf2")}</span> {" "}{t("ui.323400634b")}</p>
              <Step2Illustration />
            </article>

            <article className="ads-help-card">
              <span className="ads-help-badge">3</span>
              <p>{t("ui.9821600941")}</p>
              <Step3Illustration />
            </article>

            <article className="ads-help-card">
              <span className="ads-help-badge">4</span>
              <p>{t("ui.b6455512e2")}</p>
              <Step4Illustration />
            </article>
          </div>

          <div className="ads-help-warning" role="note">
            <p>{t("ui.b147c239df")}</p>
          </div>
        </div>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckProControlHubHelpModal
