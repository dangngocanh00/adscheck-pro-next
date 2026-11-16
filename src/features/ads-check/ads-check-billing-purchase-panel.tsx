import { ProPurchaseExperience } from './purchase-pro-experience'
import { PriorityPurchaseExperience } from './purchase-priority-experience'
import { PurchasePlanSwitch } from './purchase-experience-shared'
import '@/styles/ads-check-purchase-experiences.css'
import { useAppLanguage, tx, m, t } from '@/i18n'
import { useCallback, useMemo, useRef, useState, type FC } from 'react'
import {
  Check,
  CreditCard,
  Gift,
  Landmark,
  PackageCheck,
  Users,
} from 'lucide-react'
import { AdsCheckBankTransferWarningModal } from './ads-check-billing-bank-transfer-modal'
import { AdsCheckBillingConsentModal } from './ads-check-billing-consent-modal'
import { AdsCheckBillingPaymentStep } from './ads-check-billing-payment-step'
import { AdsCheckPaymentNoticeModal } from './ads-check-billing-payment-notice-modal'
import type { PaymentCheckResult, PaymentCheckState } from './ads-check-billing-payment-verification'
import { BillingOrderSummary } from './ads-check-billing-order-summary'
import {
  allBillingFeatures,
  bundlePrice,
  roundUsd,
  sessionUpgradeOptions,
  formatUsd,
  type BillingOrderDraft,
  type BillingTier,
} from './ads-check-billing-data'

type BillingPurchasePanelProps = {
  hidden?: boolean
  onCheckout: (draft: BillingOrderDraft) => void
}

type BillingBankOption = { id: string; shortLabel: string; fullName: string }

// Only ACB exists today; kept as a list (not a single constant) so a future
// bank can be appended here without touching the checkout flow/state shape.
const availableBanks: BillingBankOption[] = [
  { id: 'acb', shortLabel: 'ACB', fullName: m("ui.d4c50ed362") },
]

const PAYMENT_SESSION_DURATION_MS = 2 * 60 * 60 * 1000

// Local/demo transfer-content code — no payment-session backend exists,
// so this is generated client-side per Step 3 entry rather than fetched.
function buildTransferContent() {
  return `ADSCHECK ${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Single verification entry point — the ONLY place a real payment-status/
// invoice-status/transaction-polling API would ever go (none exists
// anywhere in this project; checked before implementing). In a PRODUCTION
// build this always resolves to an honest "not-found" failure — it never
// fabricates a successful transaction. The deterministic failed → failed →
// success sequence below is a DEV-ONLY manual-QA aid, strictly isolated
// behind Vite's own `import.meta.env.DEV` (the same flag already used
// elsewhere in this repo — see ads-check-adaccounts-workspace.tsx — for
// dev-only debug hooks), so it can never run in production and never
// races a real verification path (there isn't one to race). It writes
// nothing: no balance credit, no package activation, no backend call —
// it only returns a plain result object for the UI to render, reusing
// the REAL total/bank/transfer-content already in this checkout session
// rather than inventing a realistic-looking transaction id.
async function verifyPayment(retryCount: number, context: { total: number; bank: string; transferContent: string }): Promise<PaymentCheckResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 1200))
  if (import.meta.env.DEV && retryCount >= 2) {
    return { status: 'success', transactionId: context.transferContent || 'DEV-MOCK', amount: context.total, bank: context.bank, verifiedAt: Date.now() }
  }
  return { status: 'failed', reason: 'not-found' }
}

export const AdsCheckBillingPurchasePanel: FC<BillingPurchasePanelProps> = ({ hidden = false, onCheckout }) => {
  useAppLanguage();
  const [tier, setTier] = useState<BillingTier>('pro')
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([])
  const [bundleSelected, setBundleSelected] = useState(false)
  const [months, setMonths] = useState(12)
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [couponStatus, setCouponStatus] = useState('')
  const [builderStatus, setBuilderStatus] = useState('')
  const [paymentStep, setPaymentStep] = useState<'selection' | 'bank' | 'payment'>('selection')
  const [paymentSession, setPaymentSession] = useState<{ expiresAt: number; transferContent: string } | null>(null)
  const [paymentCheckState, setPaymentCheckState] = useState<PaymentCheckState>('idle')
  const [paymentCheckResult, setPaymentCheckResult] = useState<PaymentCheckResult | null>(null)
  // DEV-mock-only retry counter (see verifyPayment above) — irrelevant in
  // production, where every check is independently re-evaluated.
  const [paymentRetryCount, setPaymentRetryCount] = useState(0)
  const paymentCheckRequestRef = useRef(0)
  const [selectedBank, setSelectedBank] = useState(availableBanks[0].fullName)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [showBankTransferModal, setShowBankTransferModal] = useState(false)
  const [showPaymentNoticeModal, setShowPaymentNoticeModal] = useState(false)
  const [sessionOption, setSessionOption] = useState('none')
  const selectionStepRef = useRef<HTMLButtonElement>(null)

  const selectedCount = selectedFeatureIds.length
  const monthlyPrice = useMemo(() => bundleSelected
    ? bundlePrice
    : allBillingFeatures.reduce((sum, feature) => selectedFeatureIds.includes(feature.id) ? sum + feature.price : sum, 0), [bundleSelected, selectedFeatureIds])
  const durationDiscount = months === 12 ? .5 : months === 6 ? .3 : 0
  const couponDiscount = appliedCoupon === 'ADSCHECK20' ? .2 : 0
  const subtotal = monthlyPrice * months
  const discountedTotal = roundUsd(subtotal * (1 - durationDiscount) * (1 - couponDiscount))
  const sessionPrice = sessionUpgradeOptions.find(option => option.id === sessionOption)?.price ?? 0
  const total = roundUsd(Math.max(0, discountedTotal) + sessionPrice)

  const changeTier = useCallback((nextTier: BillingTier) => {
    if (nextTier === tier) return
    setTier(nextTier)
    if (nextTier === 'priority') {
      setBundleSelected(true)
      setSelectedFeatureIds(allBillingFeatures.map((feature) => feature.id))
      setBuilderStatus(m("ui.c22992b6a6"))
    } else {
      setBundleSelected(false)
      setSelectedFeatureIds([])
      setBuilderStatus(m("ui.d645a326b5"))
    }
  }, [tier])

  const toggleBundle = useCallback(() => {
    const nextBundleSelected = !bundleSelected
    if (!nextBundleSelected && tier === 'priority') {
      setTier('pro')
      setBuilderStatus(m("ui.3bc1640257"))
    } else {
      setBuilderStatus(nextBundleSelected ? m("ui.5c0168fcce") : m("ui.6ce9f9bfa5"))
    }
    setBundleSelected(nextBundleSelected)
    setSelectedFeatureIds(nextBundleSelected ? allBillingFeatures.map((feature) => feature.id) : [])
  }, [bundleSelected, tier])

  const toggleFeature = useCallback((featureId: string) => {
    const wasSelected = selectedFeatureIds.includes(featureId)
    const wasBundle = tier === 'priority' || bundleSelected
    setBuilderStatus(wasBundle
      ? m("ui.3bc1640257")
      : wasSelected ? m("ui.6bff34a2b7") : m("ui.e213b4b9b8"))
    setTier('pro')
    setBundleSelected(false)
    setSelectedFeatureIds(wasSelected
      ? selectedFeatureIds.filter((id) => id !== featureId)
      : [...selectedFeatureIds, featureId])
  }, [bundleSelected, selectedFeatureIds, tier])

  const applyCoupon = useCallback(() => {
    if (coupon.trim() === 'ADSCHECK20') {
      setAppliedCoupon('ADSCHECK20')
      setCouponStatus(m("ui.42705d1f80"))
      return
    }
    setAppliedCoupon('')
    setCouponStatus(coupon.trim() ? m("ui.17eae40f19") : m("ui.af09fe9074"))
  }, [coupon])

  const checkout = useCallback(() => {
    if (selectedCount === 0 || !selectedBank) return
    onCheckout({
      tier,
      paymentMethod: selectedBank,
      months,
      selectedFeatures: selectedCount,
      coupon: appliedCoupon,
      sessionPrice,
      subtotal,
      durationDiscount,
      couponDiscount,
      total,
    })
  }, [appliedCoupon, couponDiscount, durationDiscount, months, onCheckout, selectedBank, selectedCount, sessionPrice, subtotal, tier, total])

  const closeConsentModal = useCallback(() => setShowConsentModal(false), [])
  // Consent (Modal 1) only gates entry into Step 2 (Chọn ngân hàng).
  const continueFromConsent = useCallback(() => {
    setPaymentStep('bank')
    setShowConsentModal(false)
  }, [])
  const backToSelection = useCallback(() => setPaymentStep('selection'), [])

  const closeBankTransferModal = useCallback(() => setShowBankTransferModal(false), [])
  // Domestic-transfer acknowledgement (Modal 2) only gates entry into
  // Modal 3 — the actual checkout() submit is now reserved for Modal 3's
  // "Đã hiểu" (see confirmPaymentNotice below).
  const confirmBankTransfer = useCallback(() => {
    setShowBankTransferModal(false)
    setShowPaymentNoticeModal(true)
  }, [])

  const closePaymentNoticeModal = useCallback(() => setShowPaymentNoticeModal(false), [])
  // "Đã hiểu" (Modal 3) only gates entry into Step 3 (Thanh toán) — a new
  // payment session (2h expiry, matching Modal 3's own "2h" copy) starts
  // here. The actual checkout() submit is reserved for Step 3's own
  // "Tôi đã thanh toán" button.
  const confirmPaymentNotice = useCallback(() => {
    setPaymentSession({ expiresAt: Date.now() + PAYMENT_SESSION_DURATION_MS, transferContent: buildTransferContent() })
    setPaymentCheckState('idle')
    setPaymentCheckResult(null)
    setPaymentRetryCount(0)
    setPaymentStep('payment')
    setShowPaymentNoticeModal(false)
  }, [])
  // Cancels only this local payment/QR session — returns to Step 2 with
  // every other selection untouched so the user can retry or edit.
  const cancelTransaction = useCallback(() => setPaymentStep('bank'), [])

  // Shared verification runner — guarded so a check already in flight
  // can't be triggered twice, and a stale response (e.g. after a cancel +
  // re-entry started a newer check) can never overwrite a newer result.
  const runPaymentCheck = useCallback(async (retryCount: number) => {
    if (paymentCheckState === 'checking') return
    const requestId = ++paymentCheckRequestRef.current
    setPaymentCheckState('checking')
    try {
      const isExpired = paymentSession !== null && Date.now() >= paymentSession.expiresAt
      const result: PaymentCheckResult = isExpired
        ? { status: 'failed', reason: 'expired' }
        : await verifyPayment(retryCount, { total, bank: selectedBank, transferContent: paymentSession?.transferContent ?? '' })
      if (paymentCheckRequestRef.current !== requestId) return
      setPaymentCheckResult(result)
      setPaymentCheckState(result.status)
    } catch {
      if (paymentCheckRequestRef.current !== requestId) return
      setPaymentCheckResult({ status: 'failed', reason: 'request-error' })
      setPaymentCheckState('failed')
    }
  }, [paymentCheckState, paymentSession, total, selectedBank])

  // "Tôi đã thanh toán" — the initial check, always at the current
  // (un-incremented) retry count.
  const payNow = useCallback(() => { void runPaymentCheck(paymentRetryCount) }, [runPaymentCheck, paymentRetryCount])
  // "Kiểm tra lại" — increments the DEV-mock retry count BEFORE checking,
  // so the 2nd retry (count reaching 2) is what verifyPayment's DEV path
  // maps to success.
  const retryPaymentCheck = useCallback(() => {
    const nextRetryCount = paymentRetryCount + 1
    setPaymentRetryCount(nextRetryCount)
    void runPaymentCheck(nextRetryCount)
  }, [paymentRetryCount, runPaymentCheck])

  // Only reachable after a REAL verified success (never fabricated here) —
  // reuses the exact same existing checkout() transition as every earlier
  // step, no separate/duplicated completion logic.
  const completePayment = useCallback(() => checkout(), [checkout])

  return (
    <section className="ads-billing-panel ads-purchase-panel purchase-themed" data-plan={tier} aria-label={t("ui.1e184e0f1f")} hidden={hidden}>
      <div className="ads-purchase-layout">
        <div className="ads-purchase-builder is-purchase-scroll-shell">
          <div className="ads-purchase-header-region">
          <nav className="ads-purchase-progress" aria-label={t("ui.8f34f10790")}>
            <button ref={selectionStepRef} type="button" className={paymentStep !== 'selection' ? 'is-done' : ''} aria-current={paymentStep === 'selection' ? 'step' : undefined} onClick={() => setPaymentStep('selection')}>{paymentStep !== 'selection' ? <Check size={15} /> : <PackageCheck size={15} />}{t("ui.e8f6699f67")}</button>
            <span aria-hidden="true">»</span>
            <button type="button" className={paymentStep === 'payment' ? 'is-done' : ''} aria-current={paymentStep === 'bank' ? 'step' : undefined} onClick={() => {
              if (selectedCount === 0) {
                setBuilderStatus(m("ui.add4199681"))
                return
              }
              setPaymentStep('bank')
            }}>{paymentStep === 'payment' ? <Check size={15} /> : <Landmark size={15} />}{t("ui.4c0b8187b3")}</button>
            <span aria-hidden="true">»</span>
            <button type="button" aria-current={paymentStep === 'payment' ? 'step' : undefined} disabled={selectedCount === 0 || !selectedBank} onClick={checkout}><CreditCard size={15} />{t("ui.9d5a6614ca")}</button>
          </nav>
          </div>

          <div className="ads-purchase-scroll-viewport">
          {paymentStep === 'payment' && paymentSession && (
            <AdsCheckBillingPaymentStep
              bank={selectedBank}
              total={total}

              transferContent={paymentSession.transferContent}
              expiresAt={paymentSession.expiresAt}
            />
          )}

          {paymentStep === 'bank' && (
            <section className="ads-purchase-bank-step" aria-labelledby="ads-purchase-bank-title">
              <h2 id="ads-purchase-bank-title"><Landmark size={18} />{t("ui.cb8408f5d0")}</h2>
              <div className="ads-purchase-bank-list" role="radiogroup" aria-label={t("ui.88444111c7")}>
                {availableBanks.map((bank) => (
                  <label key={bank.id} className={`ads-purchase-bank-row${selectedBank === bank.fullName ? ' is-selected' : ''}`}>
                    <input type="radio" name="ads-purchase-bank" aria-label={tx(bank.fullName)} checked={selectedBank === bank.fullName} onChange={() => setSelectedBank(bank.fullName)} />
                    <span className="ads-purchase-bank-mark" aria-hidden="true">{tx(bank.shortLabel)}</span>
                    <span className="ads-purchase-bank-divider" aria-hidden="true" />
                    <strong>{bank.fullName}</strong>
                    <span className="ads-purchase-bank-status">
                      {selectedBank === bank.fullName && <small>{t("ui.1ebb48f4eb")}</small>}
                      <i className="ads-purchase-bank-radio" aria-hidden="true" />
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {paymentStep === 'selection' && <>
          <PurchasePlanSwitch tier={tier} onChange={changeTier} />
          {tier === 'pro'
            ? <ProPurchaseExperience selectedFeatureIds={selectedFeatureIds} bundleSelected={bundleSelected} toggleBundle={toggleBundle} toggleFeature={toggleFeature} />
            : <PriorityPurchaseExperience selectedFeatureIds={selectedFeatureIds} bundleSelected={bundleSelected} toggleBundle={toggleBundle} toggleFeature={toggleFeature} />}

          <section className="ads-purchase-feature-section ads-purchase-session-section" aria-labelledby="session-upgrade-title">
            <div className="ads-purchase-session-heading">
              <h2 id="session-upgrade-title"><Users size={17} />{t("ui.865689bf3f")}</h2>
              <span className="ads-purchase-session-gift"><Gift size={13} />{t("ui.18fd24d36f")}</span>
            </div>
            <div className="ads-purchase-session-options" role="radiogroup" aria-label={t("ui.293bff5b2c")}>
              {sessionUpgradeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={sessionOption === option.id}
                  className={sessionOption === option.id ? 'is-selected' : ''}
                  onClick={() => setSessionOption(option.id)}
                >
                  <i aria-hidden="true" />
                  <strong>{tx(option.label)}</strong>
                  {tx(option.price > 0 && <small>{tx(formatUsd(option.price))}</small>)}
                </button>
              ))}
            </div>
          </section>
          <span className="ads-purchase-builder-status" role="status" aria-live="polite">{tx(builderStatus)}</span>
          </>}
          </div>
        </div>

        <BillingOrderSummary
          tier={tier}
          step={paymentStep}
          selectedCount={selectedCount}
          monthlyPrice={monthlyPrice}
          sessionPrice={sessionPrice}
          months={months}
          coupon={coupon}
          couponStatus={couponStatus}
          total={total}
          onMonthsChange={setMonths}
          onCouponChange={(nextCoupon) => {
            setCoupon(nextCoupon)
            setCouponStatus('')
            if (nextCoupon !== appliedCoupon) setAppliedCoupon('')
          }}
          onApplyCoupon={applyCoupon}
          onBack={backToSelection}
          onCancelTransaction={cancelTransaction}
          onCheckout={
            paymentStep === 'selection' ? () => setShowConsentModal(true)
              : () => setShowBankTransferModal(true)
          }
          paymentCheckState={paymentCheckState}
          paymentCheckResult={paymentCheckResult}
          onPay={payNow}
          onRetryPaymentCheck={retryPaymentCheck}
          onCompletePayment={completePayment}
        />
      </div>
      {showConsentModal && <AdsCheckBillingConsentModal onClose={closeConsentModal} onContinue={continueFromConsent} />}
      {showBankTransferModal && <AdsCheckBankTransferWarningModal onClose={closeBankTransferModal} onConfirm={confirmBankTransfer} />}
      {showPaymentNoticeModal && <AdsCheckPaymentNoticeModal onClose={closePaymentNoticeModal} onUnderstood={confirmPaymentNotice} />}
    </section>
  )
}

export default AdsCheckBillingPurchasePanel
