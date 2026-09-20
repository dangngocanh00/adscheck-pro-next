import { tx, useAppLanguage, t, m } from '@/i18n'
import { useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUpRight, Check, Sparkles, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'

type ModalBaseProps = { open: boolean; onClose: () => void; onAction: (message: string) => void }

type ControlHubModalProps = ModalBaseProps & { onRequestUpgrade: () => void }

type VersionWelcomeModalProps = {
  open: boolean
  value: 'v6' | 'v8'
  remember: boolean
  onChange: (value: 'v6' | 'v8') => void
  onRemember: (value: boolean) => void
  onClose: () => void
  onConfirm: () => void
}

export function VersionWelcomeModal({
  open, value, remember, onChange, onRemember, onClose, onConfirm,
}: VersionWelcomeModalProps) {
  useAppLanguage();
  const modalRef = useRef<HTMLElement>(null)
  const v6Ref = useRef<HTMLButtonElement>(null)
  const v8Ref = useRef<HTMLButtonElement>(null)
  useOverlayFocus(open, modalRef, onClose)
  if (!open) return null

  const changeVersionFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const nextValue = value === 'v6' ? 'v8' : 'v6'
    onChange(nextValue)
    ;(nextValue === 'v6' ? v6Ref : v8Ref).current?.focus()
  }

  return <div className="ads-modal-layer ads-version-welcome-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={modalRef} className="ads-version-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="ads-version-welcome-title">
      <header>
        <h2 id="ads-version-welcome-title"><Sparkles size={19} />{t("ui.f71f4341e7")}</h2>
        <button type="button" aria-label={t("ui.d2b73ab2ad")} data-autofocus onClick={onClose}><X size={16} /></button>
      </header>
      <p className="sr-only">{t("ui.f71f4341e7")}</p>
      <div className="ads-version-choice-panel" role="radiogroup" aria-label={t("ui.ac9ce8b169")}>
        <button ref={v6Ref} type="button" role="radio" aria-checked={value === 'v6'} tabIndex={value === 'v6' ? 0 : -1} className={value === 'v6' ? 'is-selected' : ''} onKeyDown={changeVersionFromKeyboard} onClick={() => onChange('v6')}>
          <span className="ads-version-choice-badge is-old">{t("ui.7d7c450724")}</span><i />
          <strong>{t("ui.8090e78b86")}</strong><small>{t("ui.84d6f6b089")}</small>
        </button>
        <button ref={v8Ref} type="button" role="radio" aria-checked={value === 'v8'} tabIndex={value === 'v8' ? 0 : -1} className={value === 'v8' ? 'is-selected' : ''} onKeyDown={changeVersionFromKeyboard} onClick={() => onChange('v8')}>
          <span className="ads-version-choice-badge">{t("ui.6c713c2ec2")}</span><i />
          <strong>{t("ui.6c713c2ec2")}</strong><small>{t("ui.4f103f6c0c")}</small>
        </button>
      </div>
      <label className="ads-version-remember"><input type="checkbox" checked={remember} onChange={(event) => onRemember(event.target.checked)} /><span>{t("ui.c4c44df186")}</span></label>
      <button className="ads-version-confirm" type="button" onClick={onConfirm}>{t("ui.d53daf2f46")}</button>
    </section>
  </div>
}

export function ControlHubModal({ open, onClose, onAction, onRequestUpgrade }: ControlHubModalProps) {
  useAppLanguage();
  const modalRef = useRef<HTMLElement>(null)
  const [slide, setSlide] = useState(0)
  useOverlayFocus(open, modalRef, onClose)
  if (!open) return null

  const next = () => {
    setSlide((current) => current === 0 ? 1 : 0)
    onAction(slide === 0 ? m("ui.fef548e8ee") : m("ui.cb18222345"))
  }

  // Same CTA for both slides — closes onboarding, then hands off to the
  // caller's own existing "Mua gói" navigation (never a duplicate/fake one).
  const requestUpgrade = () => {
    onClose()
    onRequestUpgrade()
  }

  return <div className="ads-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={modalRef} className="ads-control-modal" role="dialog" aria-modal="true" aria-labelledby="ads-control-title">
      <button className="ads-modal-close" type="button" aria-label={t("ui.d2b73ab2ad")} data-autofocus onClick={onClose}><X size={16} /></button>
      <header><h2 id="ads-control-title">{t("ui.09f8094c30")}<br />{t("ui.9b3c14b3a9")}{" "}<em>{t("ui.4ab78d8542")}</em></h2><button type="button" onClick={requestUpgrade}>{t("ui.a2b9fd73e4")}{" "}<ArrowUpRight size={15} /></button></header>
      <div className="ads-control-stage">
        <div className="ads-control-main">
          <span className="ads-control-number">{slide + 1}</span>
          <div className="ads-control-copy"><h3>{tx(slide === 0 ? m("ui.e52224cc6c") : m("ui.9c4cfb347b"))}</h3><ul>{tx((slide === 0 ? [
            m("ui.ecb1d7f63e"),
            m("ui.32778f4844"),
            m("ui.efece3ab51"),
          ] : [
            m("ui.b5411a89fe"),
            m("ui.9943899918"),
          ]).map((item) => <li key={item}><Check size={18} />{tx(item)}</li>))}</ul></div>
        </div>
        <div className="ads-control-dots"><i className={slide === 0 ? 'is-active' : ''} /><i className={slide === 1 ? 'is-active' : ''} /></div>
      </div>
      <footer><button type="button" onClick={next}>{tx(slide === 0 ? m("ui.5d92d0921f") : m("ui.8a09e03d20"))}</button></footer>
    </section>
  </div>
}
