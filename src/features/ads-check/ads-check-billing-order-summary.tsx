import { m, useAppLanguage, t, tx } from '@/i18n'
import type { FC } from 'react'
import { PackageOpen, ReceiptText, ShoppingCart, TicketPercent } from 'lucide-react'
import { formatUsd, type BillingTier } from './ads-check-billing-data'
import { PaymentVerificationStatus, type PaymentCheckResult, type PaymentCheckState } from './ads-check-billing-payment-verification'

type BillingOrderSummaryProps = {
  tier: BillingTier
  step: 'selection' | 'bank' | 'payment'
  selectedCount: number
  monthlyPrice: number
  months: number
  coupon: string
  couponStatus: string
  total: number
  sessionPrice: number
  paymentCheckState: PaymentCheckState
  paymentCheckResult: PaymentCheckResult | null
  onMonthsChange: (months: number) => void
  onCouponChange: (coupon: string) => void
  onApplyCoupon: () => void
  onBack: () => void
  onCancelTransaction: () => void
  onCheckout: () => void
  onPay: () => void
  onRetryPaymentCheck: () => void
  onCompletePayment: () => void
}

const durationOptions = [
  { months: 1, label: m("ui.d468d58326") },
  { months: 6, label: m("ui.30c47f03ad") },
  { months: 12, label: m("ui.bed0dd8834") },
]

export const BillingOrderSummary: FC<BillingOrderSummaryProps> = ({
  tier,
  step,
  selectedCount,
  monthlyPrice,
  months,
  coupon,
  couponStatus,
  total,
  sessionPrice,
  paymentCheckState,
  paymentCheckResult,
  onMonthsChange,
  onCouponChange,
  onApplyCoupon,
  onBack,
  onCancelTransaction,
  onCheckout,
  onPay,
  onRetryPaymentCheck,
  onCompletePayment,
}) => { useAppLanguage(); return (
  <aside className="ads-purchase-summary" aria-labelledby="billing-summary-title">
    <header><ReceiptText size={18} /><h2 id="billing-summary-title">{t("ui.2b0e4e4634")}</h2></header>

    <section className="ads-purchase-summary-card">
      <span className="purchase-summary-badge">{t('purchase.' + tier + '.name')}</span>
      <div className="ads-purchase-summary-count">
        <span><strong>{selectedCount} {" "}{t("ui.c8afce04f5")}</strong><small>{t("ui.c34c242453")}</small></span>
        <span><strong>{tx(formatUsd(monthlyPrice))} <i>{t("ui.03be1e7c75")}</i></strong><small>{months} {" "}{t("ui.4a0c7ac7c8")}</small></span>
      </div>
      <div className="ads-purchase-summary-product">
        <ShoppingCart size={21} />
        <span><strong>{tier === 'priority' ? t('purchase.included') : tx(selectedCount > 0 ? m("ui.1f16d9a109", { 0: selectedCount }) : m("ui.9f3f3cb184"))}</strong><small>{tx(selectedCount > 0 ? m("ui.8e7d195ec0") : m("ui.0ab1acd527"))}</small></span>
      </div>
    </section>

    <section className="ads-purchase-summary-section">
      <p className="purchase-savings-note">{t('purchase.savings')}</p>
      <div className="ads-purchase-duration" role="group" aria-label={t("ui.10c7a0ca3e")}>
        {tx(durationOptions.map((option) => (
          <button key={option.months} type="button" className={months === option.months ? 'is-selected' : ''} aria-label={tx(option.label)} aria-pressed={months === option.months} onClick={() => onMonthsChange(option.months)}>{tx(option.label)}</button>
        )))}
      </div>
      {tx(months === 1 && monthlyPrice > 0 && (
        <p className="ads-purchase-daily-cost">{t("ui.3fc2601a12")}{" "}<b>{tx(formatUsd(monthlyPrice / 30))}</b> {" "}{t("ui.fea165c84d")}</p>
      ))}
    </section>

    <section className="ads-purchase-summary-section ads-purchase-coupon-section">
      <label className="ads-purchase-coupon">
        <TicketPercent size={17} />
        <span className="ads-visually-hidden">{t("ui.5683b737bf")}</span>
        <input value={coupon} placeholder={t("ui.7474094667")} onChange={(event) => onCouponChange(event.target.value.toUpperCase())} />
      </label>
      <button type="button" aria-label={t("ui.8cf63e8ee5")} onClick={onApplyCoupon}>{t("ui.1e948c5913")}</button>
      <span className="ads-purchase-coupon-status" role="status" aria-live="polite">{tx(couponStatus)}</span>
    </section>

    <section className="ads-purchase-total-card">
      <div><span>{t("ui.0b909791e2")}</span><strong>{tx(formatUsd(monthlyPrice * months))}</strong></div>
      {sessionPrice > 0 && <div><span>{t("billing.extraSessions")}</span><strong>{formatUsd(sessionPrice)}</strong></div>}
      <div className="ads-purchase-payable"><span>{t("ui.492d472112")}</span><strong>{tx(formatUsd(total))}</strong></div>
      <span className="ads-visually-hidden ads-purchase-order-live" role="status" aria-live="polite" aria-atomic="true">{t("ui.40b56a1698")}{" "}{selectedCount} {" "}{t("ui.d260015534")}{" "}{tx(formatUsd(total))}.</span>
      {tx(step === 'selection' && (
        <button type="button" aria-label={t("ui.8e83981795")} disabled={selectedCount === 0} onClick={onCheckout}><PackageOpen size={17} />{t("ui.e825a19e5f")}</button>
      ))}
      {tx(step === 'bank' && (
        <div className="ads-purchase-step2-actions">
          <button type="button" className="is-secondary" onClick={onBack}>{t("ui.8a09e03d20")}</button>
          <button type="button" className="is-primary" aria-label={t("ui.8e83981795")} disabled={selectedCount === 0} onClick={onCheckout}><PackageOpen size={17} />{t("ui.e825a19e5f")}</button>
        </div>
      ))}
      {tx(step === 'payment' && (
        <PaymentVerificationStatus
          state={paymentCheckState}
          result={paymentCheckResult}
          onPay={onPay}
          onRetry={onRetryPaymentCheck}
          onCancel={onCancelTransaction}
          onComplete={onCompletePayment}
        />
      ))}
    </section>
  </aside>
) }

export default BillingOrderSummary
