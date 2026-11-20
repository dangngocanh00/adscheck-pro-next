import { useAppLanguage, m, t, tx } from '@/i18n'
import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import { Check, Copy, Landmark, TriangleAlert } from 'lucide-react'
import { formatUsd } from './ads-check-billing-data'
import { AdsPurchaseQrPlaceholder } from './ads-check-billing-qr-placeholder'
import { PaymentCountdown } from './ads-check-billing-payment-countdown'

type BillingPaymentStepProps = {
  bank: string
  total: number
  transferContent: string
  expiresAt: number
}

// No real payment-session/bank-API exists in this project yet — these are
// explicitly local/demo recipient values (never presented as a real
// transaction; see the disclaimer rendered next to them), not fetched
// from or written to any backend.
const demoRecipient = { accountName: 'Toolmeta DEMO ACCOUNT', accountNumber: '0000000000' }

// Same clipboard pattern already used locally in ads-check-account-page.tsx
// (no shared clipboard hook exists in the project to import instead).
function copyWithLegacyFallback(value: string) {
  const input = document.createElement('textarea')
  input.value = value
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.focus()
  input.select()
  try { document.execCommand('copy') } finally { document.body.removeChild(input) }
}

export const AdsCheckBillingPaymentStep: FC<BillingPaymentStepProps> = ({ bank, total, transferContent, expiresAt }) => {
  useAppLanguage();
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const resetTimerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
  }, [])

  const copyValue = useCallback(async (field: string, value: string) => {
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
      else copyWithLegacyFallback(value)
      setCopiedField(field)
    } catch {
      setCopiedField(null)
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopiedField(null)
      resetTimerRef.current = null
    }, 1800)
  }, [])

  const rows: { field: string; label: string; value: string; emphasize?: boolean }[] = [
    { field: 'amount', label: m("ui.d5261b2d21"), value: formatUsd(total) },
    { field: 'bank', label: m("ui.69ba2e4467"), value: bank },
    { field: 'account-number', label: m("ui.dc0ca7a8d2"), value: demoRecipient.accountNumber },
    { field: 'account-name', label: m("ui.91bdaa5d18"), value: demoRecipient.accountName },
    { field: 'content', label: m("ui.78d2d8e86e"), value: transferContent, emphasize: true },
  ]

  return (
    <>
      <section className="ads-purchase-payment-section" aria-labelledby="ads-purchase-payment-title">
        <h2 id="ads-purchase-payment-title"><Landmark size={18} />{t("ui.256f7b1867")}</h2>
        <div className="ads-purchase-payment-grid">
          <div className="ads-purchase-payment-qr-col">
            <AdsPurchaseQrPlaceholder />
            <strong>{bank}</strong>
            <span>{demoRecipient.accountName}</span>
            <span>{demoRecipient.accountNumber}</span>
            <small className="ads-purchase-payment-demo-note">{t("ui.7f5b866edc")}</small>
          </div>
          <div className="ads-purchase-transfer-card">
            <h3>{t("ui.a08e80263d")}</h3>
            <dl>
              {tx(rows.map((row) => (
                <div key={row.field} className={row.emphasize ? 'is-emphasized' : ''}>
                  <dt>{tx(row.label)}</dt>
                  <dd>
                    <span>{row.value}</span>
                    <button type="button" aria-label={tx(m("ui.10a79ea30a", { 0: row.label }))} onClick={() => copyValue(row.field, row.value)}>
                      {copiedField === row.field ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </dd>
                </div>
              )))}
            </dl>
            <div className="ads-purchase-countdown-row">
              <span>{t("ui.976f3ec4be")}</span>
              <PaymentCountdown expiresAt={expiresAt} />
            </div>
          </div>
        </div>
        <p className="ads-purchase-payment-warning"><TriangleAlert size={14} />{t("ui.6f73c494e7")}</p>
      </section>

      <section className="ads-purchase-feature-section ads-purchase-payment-notes" aria-labelledby="ads-purchase-payment-notes-title">
        <h2 id="ads-purchase-payment-notes-title"><TriangleAlert size={17} />{t("ui.7a62ab00d8")}</h2>
        <div className="ads-purchase-payment-notice-row">{t("ui.06bdc62333")}</div>
        <div className="ads-purchase-payment-notice-row">{t("ui.6e9720f2f0")}</div>
      </section>
    </>
  )
}

export default AdsCheckBillingPaymentStep
