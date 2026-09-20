import { useAppLanguage } from '@/i18n'
import type { FC } from 'react'
import { ShoppingCart, TriangleAlert } from 'lucide-react'

// Shared cart+warning illustration for the checkout confirmation modals
// (Modal 1 and Modal 3) — pure lucide icons on themed CSS, no raster
// asset, so no image ever needs generating/duplicating for new modals.
export const AdsPurchaseWarningIllustration: FC = () => { useAppLanguage(); return (
  <div className="ads-purchase-consent-illustration" aria-hidden="true">
    <ShoppingCart size={26} />
    <span className="ads-purchase-consent-illustration-badge"><TriangleAlert size={12} /></span>
  </div>
) }

export default AdsPurchaseWarningIllustration
