import { tx, useAppLanguage, t, m } from '@/i18n'
import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Layers3, Link2, Smartphone, SquareCheckBig, UserRound, X, Zap } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { ToolmetaWordmark } from '@/features/ads-check/ads-check-brand-mark'

type ModalBaseProps = { open: boolean; onClose: () => void; onAction: (message: string) => void }

type ControlHubModalProps = ModalBaseProps & { onRequestUpgrade: () => void }

const titleAccents = {
  vi: ['điện thoại', 'trên một trình duyệt'],
  en: ['mobile', 'in one browser'],
  ru: ['телефона', 'в одном браузере'],
  th: ['มือถือ', 'ในเบราว์เซอร์เดียว'],
  zh: ['手机', '在一个浏览器'],
} as const

function PhoneIllustration() {
  return (
    <div className="ads-control-visual" aria-hidden="true">
      <div className="ads-control-phone">
        <ToolmetaWordmark />
        <span className="ads-control-phone-app"><Layers3 /></span>
        <div className="ads-control-phone-rows">
          {[1, 2, 3].map(row => <span key={row}><Check size={12} /><i /></span>)}
        </div>
      </div>
      <span className="ads-control-phone-badge"><Smartphone /></span>
    </div>
  )
}

function AccountBrowserIllustration() {
  return (
    <div className="ads-control-visual ads-control-account-art" aria-hidden="true">
      <div className="ads-control-browser">
        <div className="ads-control-browser-toolbar"><i /><i /><i /></div>
        <div className="ads-control-browser-rows">
          {[1, 2, 3].map(row => (
            <div className="ads-control-browser-row" key={row}>
              <span className="ads-control-browser-avatar"><UserRound /></span>
              <i className="ads-control-browser-label" />
              <i className="ads-control-browser-status" />
            </div>
          ))}
        </div>
        <span className="ads-control-browser-link"><Link2 /></span>
      </div>
    </div>
  )
}

export function ControlHubModal({ open, onClose, onAction, onRequestUpgrade }: ControlHubModalProps) {
  const language = useAppLanguage()
  const modalRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  useOverlayFocus(open, modalRef, onClose)
  if (!open) return null

  const next = () => {
    setSlide((current) => current === 0 ? 1 : 0)
    if (stageRef.current) stageRef.current.scrollTop = 0
    onAction(slide === 0 ? m("ui.fef548e8ee") : m("ui.cb18222345"))
  }

  // Same CTA for both slides — closes onboarding, then hands off to the
  // caller's own existing "Mua gói" navigation (never a duplicate/fake one).
  const requestUpgrade = () => {
    onClose()
    onRequestUpgrade()
  }

  const mobileBenefit = slide === 0
  const title = t(mobileBenefit ? 'ui.e52224cc6c' : 'ui.9c4cfb347b')
  const accent = titleAccents[language][slide]
  const accentIndex = title.indexOf(accent)
  const benefits = mobileBenefit
    ? [{ label: 'ui.ecb1d7f63e', icon: SquareCheckBig }, { label: 'ui.32778f4844', icon: SquareCheckBig }, { label: 'ui.efece3ab51', icon: SquareCheckBig }]
    : [{ label: 'ui.b5411a89fe', icon: Layers3 }, { label: 'ui.9943899918', icon: Zap }]

  return <div className="ads-modal-layer ads-control-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={modalRef} className={`ads-control-modal${mobileBenefit ? '' : ' is-accounts'}`} role="dialog" aria-modal="true" aria-labelledby="ads-control-title">
      <button className="ads-control-close" type="button" aria-label={t("ui.d2b73ab2ad")} data-autofocus onClick={onClose}><X size={17} aria-hidden="true" /></button>
      <header className="ads-control-header">
        <h2 id="ads-control-title">{t("ui.09f8094c30")}<br />{t("ui.9b3c14b3a9")}{" "}<em>{t("ui.4ab78d8542")}</em></h2>
        <button className="ads-control-upgrade" type="button" onClick={requestUpgrade}>{t("ui.a2b9fd73e4")} <ArrowUpRight size={16} aria-hidden="true" /></button>
      </header>
      <div ref={stageRef} className="ads-control-stage">
        <div className="ads-control-main" key={slide}>
          {mobileBenefit ? <PhoneIllustration /> : <AccountBrowserIllustration />}
          <div className="ads-control-copy">
            <div className="ads-control-step">
              <span><strong>{mobileBenefit ? '01' : '02'}</strong> / 02</span>
              <div aria-hidden="true"><i className={mobileBenefit ? 'is-active' : ''} /><i className={mobileBenefit ? '' : 'is-active'} /></div>
            </div>
            <h3 className={`ads-control-feature-title${mobileBenefit ? '' : ' is-multiline'}`}>
              {mobileBenefit && <Smartphone aria-hidden="true" />}
              <span>{accentIndex < 0 ? title : <>{title.slice(0, accentIndex)}<em>{accent}</em>{title.slice(accentIndex + accent.length)}</>}</span>
            </h3>
            <ul>{benefits.map(({ label, icon: Icon }) => <li key={label}><span className="ads-control-benefit-icon"><Icon size={22} aria-hidden="true" /></span>{t(label)}</li>)}</ul>
          </div>
        </div>
      </div>
      <footer className="ads-control-footer">
        <div className="ads-control-dots" aria-hidden="true"><i className={mobileBenefit ? 'is-active' : ''} /><i className={mobileBenefit ? '' : 'is-active'} /></div>
        <button type="button" onClick={next}>
          {!mobileBenefit && <ArrowLeft size={19} aria-hidden="true" />}
          {tx(mobileBenefit ? m("ui.5d92d0921f") : m("ui.8a09e03d20"))}
          {mobileBenefit && <ArrowRight size={19} aria-hidden="true" />}
        </button>
      </footer>
    </section>
  </div>
}
