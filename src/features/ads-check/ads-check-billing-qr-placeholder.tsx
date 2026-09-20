import { useAppLanguage, t } from '@/i18n'
import type { FC } from 'react'

// Deterministic decorative module pattern — explicitly NOT a real
// scannable QR code (no payment-session/QR-generation backend exists in
// this project). Labeled "Minh hoạ" so it can never be mistaken for a
// real payment QR, matching the app's convention of icon/CSS-only demo
// visuals rather than fabricated functional assets.
const MODULE_PATTERN = [
  1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1,
  1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1,
  1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1,
  1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1,
  1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1,
  0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0,
  1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1,
  1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0,
  1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1,
  1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0,
  1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1,
  1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1,
]

export const AdsPurchaseQrPlaceholder: FC = () => { useAppLanguage(); return (
  <div className="ads-purchase-qr" role="img" aria-label={t("ui.be8ffd8c0f")}>
    <div className="ads-purchase-qr-grid" aria-hidden="true">
      {MODULE_PATTERN.map((on, index) => <span key={index} data-on={on ? 'true' : undefined} />)}
    </div>
    <span className="ads-purchase-qr-badge">{t("ui.30e551116f")}</span>
  </div>
) }

export default AdsPurchaseQrPlaceholder
