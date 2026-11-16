import { m, useAppLanguage, t, tx, type AppLanguage } from '@/i18n'
import { useEffect, useRef, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, GripVertical, Home, Layers3, Minimize2, PencilLine, RefreshCw, Settings, Share2 } from 'lucide-react'
import {
  extendedPaymentFields,
  extendedPaymentDemoAmount,
  effectiveExtendedPaymentRate,
  sanitizeSignatureHtml,
  type ExtendedPaymentCurrencyMode,
  type ExtendedPaymentSurface,
} from './ads-check-extended-payment-data'
import { buildAccountQualityUrl, buildAdsManagerCampaignsUrl, buildBillingHubUrl } from './ads-check-pro-tkqc-format'
import { AdsCheckBrandMark, ToolmetaWordmark } from './ads-check-brand-mark'

// Extended Payment Round 2 Part #8/#12 — ONE shared Bubble implementation
// consumed by both the Extended Payment configuration preview
// (`interactive=false`) and, eventually, the real Meta asset-management
// Bubble (`interactive=true`) — not two visually-independent copies. This
// project has no actual browser-extension/Meta-page-injection host today
// (see the batch report), so `interactive` is only ever exercised as
// `false` right now; the prop/asset boundary is wired correctly for when
// a real host exists, rather than inventing one.
export type ExtendedPaymentBubbleAsset = { id: string; businessId?: string | null }

type ExtendedPaymentBubbleProps = {
  bubbleEnabled: boolean
  surface: ExtendedPaymentSurface
  language: string
  currencyMode: ExtendedPaymentCurrencyMode
  displayCurrency: string
  customRates: Record<string, string>
  selectedFields: string[]
  signature: string
  // False in the Extended Payment settings preview: header controls stay
  // fully visible for visual configuration, but never navigate/collapse —
  // clicking anything here must never carry the user out of this page.
  interactive: boolean
  // The specific Meta ad account this Bubble's Share menu targets. Not
  // available at all from the Extended Payment page (a global config
  // surface, not scoped to one account) — only meaningful once a real
  // interactive host supplies one.
  asset?: ExtendedPaymentBubbleAsset
  onCollapse?: () => void
}

const monetaryFieldIds = new Set(['spend-limit', 'current-threshold', 'balance', 'total-spend'])

// Extended Payment Round 1 Part #7 — the numeric amount itself is
// recomputed (not just the currency suffix): the demo baseline is
// VND-denominated, so a USD target divides it by the effective "1 USD ~
// X VND" rate (auto default or the user's own saved custom override,
// whichever `currencyMode` selects) — never a label-only substitution.
function localizeFieldValue(fieldId: string, fallback: string, language: AppLanguage, currencyMode: ExtendedPaymentCurrencyMode, displayCurrency: string, customRates: Record<string, string>): string {
  if (fieldId === 'account-status' || fieldId === 'hidden-limit') return tx(fallback, language)
  if (!monetaryFieldIds.has(fieldId)) return fallback

  const currency = displayCurrency === 'auto' ? 'VND' : displayCurrency
  if (currency === 'VND') return fallback
  const rate = effectiveExtendedPaymentRate('VND', currencyMode, customRates)
  if (rate == null) return `— ${currency}`
  const locale = { vi: 'vi-VN', en: 'en-US', ru: 'ru-RU', th: 'th-TH', zh: 'zh-CN' }[language]
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(extendedPaymentDemoAmount / rate)} ${currency}`
}

const SHARE_DESTINATIONS = [
  { key: 'billing', label: m("ui.9b2f6f8d6b") },
  { key: 'ads-manager', label: m("ui.e39b455d0f") },
  { key: 'overview', label: m("ui.e1def6c348") },
] as const

export const ExtendedPaymentBubble: FC<ExtendedPaymentBubbleProps> = ({
  bubbleEnabled,
  surface,
  language,
  currencyMode,
  displayCurrency,
  customRates,
  selectedFields,
  signature,
  interactive,
  asset,
  onCollapse,
}) => {
  const appLanguage = useAppLanguage()
  const previewLanguage: AppLanguage = language === 'auto' ? appLanguage : (['vi', 'en', 'ru', 'th', 'zh'].includes(language) ? language as AppLanguage : appLanguage)
  const navigate = useNavigate()
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shareOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!shareRef.current?.contains(event.target as Node)) setShareOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [shareOpen])

  const visibleFields = extendedPaymentFields.filter((field) => selectedFields.includes(field.id))
  // Extended Payment Round 1 Part #3 — sanitized (allowlist-only) HTML so
  // rich-text formatting (bold/italic/underline/strike/color/links)
  // renders as real markup, never raw tag text, and never unsafe markup.
  const signatureHtml = signature ? sanitizeSignatureHtml(signature) : ''

  // Round 2 Part #8.3/#8.4 — reuse the existing Adscheck app routes (no second
  // "home"/settings destination invented); Round 2 Part #8.6 — inert
  // whenever this Bubble is not the real interactive one.
  const handleHome = () => { if (interactive) navigate('/app/home') }
  const handleSettings = () => { if (interactive) navigate('/app/extended-payment') }
  const handleCollapse = () => { if (interactive) onCollapse?.() }
  const handleShareSelect = (destination: typeof SHARE_DESTINATIONS[number]['key']) => {
    setShareOpen(false)
    if (!interactive || !asset) return
    const url = destination === 'billing' ? buildBillingHubUrl(asset.id, asset.businessId)
      : destination === 'ads-manager' ? buildAdsManagerCampaignsUrl(asset.id)
      : buildAccountQualityUrl(asset.id)
    if (url) window.open(url, '_blank', 'noreferrer')
  }

  return (
    <div className={`ads-extended-preview-shell is-${surface}${bubbleEnabled ? '' : ' is-disabled'}`}>
      <div className="ads-extended-preview-brand">
        <ToolmetaWordmark />
        {tx(surface === 'action-bar' && bubbleEnabled && <div className="ads-extended-brand-controls">
          <div className="ads-extended-share-menu" ref={shareRef}>
            <button type="button" className="ads-extended-brand-button ads-extended-share-trigger" aria-haspopup="menu" aria-expanded={shareOpen} onClick={() => setShareOpen((current) => !current)}><Share2 size={15} /><ChevronDown size={9} /></button>
            {tx(shareOpen && <ul className="ads-extended-share-dropdown" role="menu" aria-label={t("ui.1cb9508032")}>
              {tx(SHARE_DESTINATIONS.map((destination) => (
                <li key={destination.key}><button type="button" role="menuitem" onClick={() => handleShareSelect(destination.key)}>{tx(destination.label)}</button></li>
              )))}
            </ul>)}
          </div>
          <button type="button" className="ads-extended-brand-button" aria-label={t("ui.738a4cd148")} onClick={handleHome}><Home size={14} /></button>
          <button type="button" className="ads-extended-brand-button" aria-label={t("ui.01f3f39ff2")} onClick={handleSettings}><Settings size={14} /></button>
          <button type="button" className="ads-extended-brand-button" aria-label={t("ui.a2b1f3c584")} onClick={handleCollapse}><Minimize2 size={14} /></button>
        </div>)}
      </div>

      {/* Extended Payment Round 1 Part #4 — Thanh Action mode ADDS this
          bar directly below the header, above the data list; it never
          replaces/removes account info, agency block, or signature.
          Round 2 Part #8/#11 — no real business action exists yet for
          either quick action, so both stay visual-only regardless of
          `interactive` (not a fake action invented for this round). */}
      {tx(surface === 'action-bar' && bubbleEnabled && <div className="ads-extended-action-bar" role="group" aria-label={t("ui.a9b8c7d606")}>
        <button type="button"><span className="ads-extended-action-bar-icon"><RefreshCw size={15} /></span>{t("ui.55175812bc")}</button>
        <button type="button"><span className="ads-extended-action-bar-icon"><PencilLine size={15} /></span>{t("ui.5615fda80c")}</button>
      </div>)}

      <div className="ads-extended-preview-list">
        <dl className="ads-extended-preview-data" aria-label={t("ui.4805766e2f")}>
          {visibleFields.map((field) => {
            const Icon = field.icon
            const localizedLabel = tx(field.label, previewLanguage)
            const localizedValue = localizeFieldValue(field.id, field.previewValue, previewLanguage, currencyMode, displayCurrency, customRates)
            return (
              <div key={field.id} data-testid={`extended-preview-${field.id}`}>
                <GripVertical size={13} aria-hidden="true" />
                <Icon size={17} aria-hidden="true" />
                <dt>{localizedLabel}</dt>
                <dd className={field.id === 'account-status' ? 'is-success' : ''}>{localizedValue}</dd>
              </div>
            )
          })}
        </dl>
        {tx(visibleFields.length === 0 && <p className="ads-extended-preview-empty">{t("ui.91d5ca5fa4")}</p>)}
      </div>

      <div className="ads-extended-agency-card">
        <AdsCheckBrandMark className="ads-extended-agency-logo" />
        <div><strong>{t("ui.2dbc9a4c0b")}{" "}<b>{t("ui.0eab59428c")}</b></strong><small>{t("ui.a6bc93050d")}</small></div>
      </div>
      {/* Extended Payment Round 1 Part #3 — this footer IS the signature
          preview location: falls back to the original demo copy only
          while no signature has been authored yet. */}
      <footer>
        {signatureHtml
          ? <span className="ads-extended-signature-preview" dangerouslySetInnerHTML={{ __html: signatureHtml }} />
          : <span>{t("ui.f05e699200")}</span>}
        <AdsCheckBrandMark className="ads-extended-footer-logo" />
      </footer>
      {!bubbleEnabled && <div className="ads-extended-preview-disabled"><Layers3 size={25} /><strong>{t("ui.490da8fbdd")}</strong><span>{t("ui.3544a71616")}</span></div>}
    </div>
  )
}

export default ExtendedPaymentBubble
