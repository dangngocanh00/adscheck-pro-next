import { useAppLanguage, tx, m } from '@/i18n'
import { useEffect, useState, type FC } from 'react'

type PaymentCountdownProps = {
  expiresAt: number
}

function splitRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  return {
    hours: String(Math.floor(totalSeconds / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
    seconds: String(totalSeconds % 60).padStart(2, '0'),
  }
}

// Countdown is always derived from expiresAt - Date.now() on every tick
// (never by decrementing a displayed string), so it stays correct across
// re-renders and unaffected color-version switches — expiresAt itself
// lives in the parent's payment-session state, created once per Step 3
// entry (2h from that moment), not regenerated here.
export const PaymentCountdown: FC<PaymentCountdownProps> = ({ expiresAt }) => {
  useAppLanguage();
  const [remaining, setRemaining] = useState(() => expiresAt - Date.now())

  useEffect(() => {
    const tick = () => setRemaining(expiresAt - Date.now())
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [expiresAt])

  const { hours, minutes, seconds } = splitRemaining(remaining)

  return (
    <div className="ads-purchase-countdown" role="timer" aria-label={tx(m("ui.e4f65bacd5", { 0: hours, 1: minutes, 2: seconds }))}>
      <span className="ads-purchase-countdown-pill">{hours}</span>
      <span aria-hidden="true">:</span>
      <span className="ads-purchase-countdown-pill">{minutes}</span>
      <span aria-hidden="true">:</span>
      <span className="ads-purchase-countdown-pill">{seconds}</span>
    </div>
  )
}

export default PaymentCountdown
