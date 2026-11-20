import { useAppLanguage, t } from '@/i18n'
import type { FC } from 'react'
import { Eye } from 'lucide-react'
import type { ExtendedPaymentCurrencyMode, ExtendedPaymentSurface } from './ads-check-extended-payment-data'
import { ExtendedPaymentBubble } from './ads-check-extended-payment-bubble'

type ExtendedPaymentPreviewProps = {
  showDemoValues?: boolean
  bubbleEnabled: boolean
  surface: ExtendedPaymentSurface
  language: string
  currencyMode: ExtendedPaymentCurrencyMode
  displayCurrency: string
  customRates: Record<string, string>
  selectedFields: string[]
  signature: string
}

// Extended Payment Round 2 Part #8.6/#12 — thin wrapper around the ONE
// shared Bubble implementation (ads-check-extended-payment-bubble.tsx),
// rendered here with `interactive={false}`: same visual configuration a
// real Meta-page Bubble would use, just inert (Share/Home/Settings/
// Collapse never navigate or close anything from this settings page).
export const ExtendedPaymentPreview: FC<ExtendedPaymentPreviewProps> = (props) => { useAppLanguage(); return (
  <aside className="ads-extended-preview-panel" aria-labelledby="extended-preview-title">
    <header className="ads-extended-preview-heading">
      <span><Eye size={17} /></span>
      <h2 id="extended-preview-title">{t("ui.7ddb287fe0")}</h2>
    </header>
    <ExtendedPaymentBubble {...props} interactive={false} />
  </aside>
) }

export default ExtendedPaymentPreview
