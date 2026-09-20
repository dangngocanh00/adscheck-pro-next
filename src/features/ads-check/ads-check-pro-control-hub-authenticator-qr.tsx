import { useAppLanguage, t } from '@/i18n'
import type { FC } from 'react'

// Deterministic decorative module pattern, seeded by the SAME secret string
// shown as text below it — explicitly NOT a real scannable QR code (no TOTP-
// issuing backend exists in this project; no QR-encoding library was added
// just for this mock, matching this repo's existing convention — see
// AdsPurchaseQrPlaceholder for the same pattern applied to Billing). Being
// seeded (not a hardcoded bitmap) means the visual always matches whatever
// secret is passed in, so a later swap to a real server-issued secret/QR
// payload only requires changing the `seed` prop, never this component.
function seededPattern(seed: string, cells: number): number[] {
  let state = 0
  for (let i = 0; i < seed.length; i += 1) state = (state * 31 + seed.charCodeAt(i)) >>> 0
  if (state === 0) state = 1
  const pattern: number[] = []
  for (let i = 0; i < cells; i += 1) {
    // xorshift32 — small, dependency-free deterministic PRNG.
    state ^= state << 13; state >>>= 0
    state ^= state >>> 17
    state ^= state << 5; state >>>= 0
    pattern.push(state & 1)
  }
  return pattern
}

const GRID_SIZE = 13

export const AdsControlHubAuthenticatorQr: FC<{ seed: string }> = ({ seed }) => {
  useAppLanguage();
  const cells = seededPattern(seed, GRID_SIZE * GRID_SIZE)
  return <div className="ads-cred-qr" role="img" aria-label={t("ui.574f4fca2a")}>
    <div className="ads-cred-qr-grid" aria-hidden="true">
      {cells.map((on, index) => <span key={index} data-on={on ? 'true' : undefined} />)}
    </div>
    <span className="ads-cred-qr-badge">{t("ui.30e551116f")}</span>
  </div>
}

export default AdsControlHubAuthenticatorQr
