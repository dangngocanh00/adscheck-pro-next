import { useAppLanguage } from '@/i18n'
import railNavIcon from '../../../assets/Media Toolmeta/toolmeta-logo-icon-gradient.png.png'

// ONE shared nav-icon element — reused verbatim by every module's own
// sidebar rail (Ads Check Pro/Ads Save via ads-save-page.tsx, and every
// AdsCheckProductShell-wrapped module) so the asset, alt text, class name
// (and therefore size/animation/shadow, all defined once in ads-save.css)
// can never drift between modules.
export function AdsCheckNavIcon() {
  useAppLanguage();
  // Frame the supplied symbol tightly without editing the original PNG.
  return <svg className="ads-rail-nav-icon" viewBox="150 260 1010 810" aria-hidden="true" focusable="false">
    <image href={railNavIcon} width="1280" height="1280" />
  </svg>
}
