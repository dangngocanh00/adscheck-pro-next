import { tx, useAppLanguage, t, m } from '@/i18n'
import { useRef, useState } from 'react'
import { ArrowUpRight, Check, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'

type ModalBaseProps = { open: boolean; onClose: () => void; onAction: (message: string) => void }

type ControlHubModalProps = ModalBaseProps & { onRequestUpgrade: () => void }

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
