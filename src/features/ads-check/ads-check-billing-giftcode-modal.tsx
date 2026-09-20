import { useAppLanguage, m, t, tx } from '@/i18n'
import { useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { Gift, Ticket, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type GiftcodeModalTab = 'input' | 'history'

type BillingGiftcodeModalProps = {
  onClose: () => void
}

// Same Category B treatment as AdsCheckBillingConsentModal (no backdrop-
// dismiss, only closable via the explicit close button or Escape). The 2
// internal tabs are local component state, not routes — a fresh open of
// this modal always starts back on "Nhập Giftcode" since no real Giftcode
// backend/history exists yet to justify remembering a prior tab.
export const AdsCheckBillingGiftcodeModal: FC<BillingGiftcodeModalProps> = ({ onClose }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const [tab, setTab] = useState<GiftcodeModalTab>('input')
  const [code, setCode] = useState('')
  const [checkMessage, setCheckMessage] = useState('')

  // No real Giftcode redemption API exists anywhere in this project — this
  // stays UI/state only. It never fakes a reward/success outcome, only
  // surfaces an explicitly-labeled demo acknowledgement.
  const checkCode = () => {
    const trimmed = code.trim()
    if (!trimmed) return
    setCheckMessage(m("ui.7d14306335", { 0: trimmed }))
  }

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-giftcode-modal" role="dialog" aria-modal="true" aria-labelledby="ads-giftcode-title">
        <header className="ads-giftcode-header">
          <span className="ads-giftcode-header-icon"><Gift size={16} /></span>
          <h2 id="ads-giftcode-title">{t("ui.51676257d0")}</h2>
          <button type="button" className="ads-giftcode-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose} data-autofocus><X size={16} /></button>
        </header>
        <div className="ads-giftcode-tabs" role="tablist" aria-label="Giftcode">
          <button type="button" role="tab" aria-selected={tab === 'input'} className={tab === 'input' ? 'is-active' : ''} onClick={() => setTab('input')}>{t("ui.51676257d0")}</button>
          <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'is-active' : ''} onClick={() => setTab('history')}>{t("ui.21a19fb055")}</button>
        </div>
        {tab === 'input' ? (
          <div className="ads-giftcode-panel">
            <ul className="ads-giftcode-instructions">
              <li>{t("ui.bb6461c8ad")}</li>
              <li>{t("ui.76d3b8fa60")}</li>
            </ul>
            <div className="ads-giftcode-input-row">
              <label className="ads-giftcode-input">
                <input type="text" placeholder={t("ui.ddaa482728")} value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') checkCode() }} />
                <Ticket size={15} />
              </label>
              <button type="button" className="ads-giftcode-check" disabled={!code.trim()} onClick={checkCode}>{t("ui.92fed438fe")}</button>
            </div>
            {tx(checkMessage && <p className="ads-giftcode-status" role="status" aria-live="polite">{tx(checkMessage)}</p>)}
          </div>
        ) : (
          <div className="ads-giftcode-history">
            <p>{t("ui.8e79e7f8cd")}</p>
          </div>
        )}
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckBillingGiftcodeModal
