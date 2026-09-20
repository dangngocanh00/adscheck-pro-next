import { useAppLanguage } from '@/i18n'
import railNavIcon from '../../../assets/nav-icon.png'

// ONE shared nav-icon element — reused verbatim by every module's own
// sidebar rail (Ads Check Pro/Ads Save via ads-save-page.tsx, and every
// AdsCheckProductShell-wrapped module) so the asset, alt text, class name
// (and therefore size/animation/shadow, all defined once in ads-save.css)
// can never drift between modules.
export function AdsCheckNavIcon() {
  useAppLanguage();
  return <img src={railNavIcon} alt="" className="ads-rail-nav-icon" />
}
