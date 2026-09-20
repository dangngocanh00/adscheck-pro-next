import { useAppLanguage } from '@/i18n'
import adscheckBrandLogo from '../../../assets/log-removebg.png'

type Props = { className?: string }

// THE Adscheck brand mark (transparent PNG, colors/shape untouched — no
// recolor filter, no SVG re-creation). Reused verbatim everywhere a former
// SMIT logo/wordmark placeholder appeared; only its rendered SIZE varies by
// context, via `className` (see each stylesheet's own size rule for that
// context — never a second copy of the asset).
export function AdsCheckBrandMark({ className }: Props) {
  useAppLanguage();
  return <img src={adscheckBrandLogo} alt="" aria-hidden="true" className={`ads-brand-logo-mark${className ? ` ${className}` : ''}`} />
}

export default AdsCheckBrandMark
