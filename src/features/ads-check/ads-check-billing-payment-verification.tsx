import { m, useAppLanguage, t, tx } from '@/i18n'
import type { FC } from 'react'
import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react'
import { formatUsd } from './ads-check-billing-data'

export type PaymentCheckReason = 'not-found' | 'expired' | 'request-error'

export type PaymentCheckResult =
  | { status: 'success'; transactionId: string; amount: number; bank: string; verifiedAt: number }
  | { status: 'failed'; reason: PaymentCheckReason }

export type PaymentCheckState = 'idle' | 'checking' | 'success' | 'failed'

type PaymentVerificationStatusProps = {
  state: PaymentCheckState
  result: PaymentCheckResult | null
  onPay: () => void
  onRetry: () => void
  onCancel: () => void
  onComplete: () => void
}

function formatVerifiedAt(timestamp: number) {
  return new Date(timestamp).toLocaleString('vi-VN')
}

const FAILURE_COPY: Record<PaymentCheckReason, { title: string; body: string; severity: 'warning' | 'error'; retryable: boolean }> = {
  'not-found': {
    title: m("ui.ca20dd5f5f"),
    body: m("ui.89d4f503c7"),
    severity: 'warning',
    retryable: true,
  },
  expired: {
    title: m("ui.81d0a5fba4"),
    body: m("ui.37f6910527"),
    severity: 'warning',
    retryable: false,
  },
  'request-error': {
    title: m("ui.071c443fcf"),
    body: m("ui.2f1d18ee9d"),
    severity: 'error',
    retryable: true,
  },
}

// Bottom-right checkout CTA area, state-driven (idle/checking/success/
// failed) so the whole verification flow stays anchored in Step 3 without
// opening another modal. No real payment-verification backend exists in
// this project yet — see verifyPaymentDemo() in the purchase panel, which
// always resolves to an honest "not-found" failure rather than faking a
// successful transaction. This component only renders whatever state/
// result it's given; it does not decide the outcome itself.
export const PaymentVerificationStatus: FC<PaymentVerificationStatusProps> = ({ state, result, onPay, onRetry, onCancel, onComplete }) => {
  useAppLanguage();
  if (state === 'idle') {
    return (
      <div className="ads-purchase-step3-actions">
        <button type="button" className="is-primary" onClick={onPay}>{t("ui.5a9797c108")}</button>
        <button type="button" className="is-secondary" onClick={onCancel}>{t("ui.c60c4c296d")}</button>
      </div>
    )
  }

  if (state === 'checking') {
    return (
      <div className="ads-purchase-step3-actions">
        <button type="button" className="is-primary" disabled aria-busy="true">
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />{t("ui.8654d966ee")}{" "}</button>
        <button type="button" className="is-secondary" onClick={onCancel}>{t("ui.c60c4c296d")}</button>
      </div>
    )
  }

  if (state === 'success' && result?.status === 'success') {
    return (
      <>
        <div className="ads-purchase-payment-result is-success">
          <CheckCircle2 size={22} className="ads-purchase-payment-result-icon" aria-hidden="true" />
          <strong>{t("ui.8fc2380cda")}</strong>
          <p>{t("ui.16505bbdfb")}</p>
          <dl className="ads-purchase-payment-result-detail">
            <div><dt>{t("ui.5e5204c507")}</dt><dd>{result.transactionId}</dd></div>
            <div><dt>{t("ui.d5261b2d21")}</dt><dd>{tx(formatUsd(result.amount))}</dd></div>
            <div><dt>{t("ui.69ba2e4467")}</dt><dd>{result.bank}</dd></div>
            <div><dt>{t("ui.83cf094454")}</dt><dd>{tx(formatVerifiedAt(result.verifiedAt))}</dd></div>
          </dl>
        </div>
        <button type="button" className="ads-purchase-step3-complete" onClick={onComplete}>{t("ui.c66efcf181")}</button>
      </>
    )
  }

  if (state === 'failed' && result?.status === 'failed') {
    const copy = FAILURE_COPY[result.reason]
    return (
      <>
        <div className={`ads-purchase-payment-result is-failed is-${copy.severity}`}>
          <TriangleAlert size={22} className="ads-purchase-payment-result-icon" aria-hidden="true" />
          <strong>{tx(copy.title)}</strong>
          <p>{tx(copy.body)}</p>
          {tx(copy.retryable && <small>{t("ui.7fce1bdf1b")}</small>)}
        </div>
        <div className="ads-purchase-step3-actions">
          {tx(copy.retryable
            ? <button type="button" className="is-primary" onClick={onRetry}>{t("ui.e65dbc7f10")}</button>
            : null)}
          <button type="button" className="is-secondary" onClick={onCancel}>{tx(copy.retryable ? m("ui.c60c4c296d") : m("ui.565d26cb66"))}</button>
        </div>
      </>
    )
  }

  return null
}

export default PaymentVerificationStatus
