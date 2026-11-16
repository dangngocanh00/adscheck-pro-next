import { useAppLanguage } from '@/i18n'
import toolmetaIcon from '../../../assets/Media Toolmeta/toolmeta-logo-icon-gradient.png.png'
import toolmetaWordmark from '../../../assets/Media Toolmeta/toolmeta-logo-white-horizontal.png.png'

type Props = { className?: string }

// Use the supplied Toolmeta artwork directly; preserve its original colors.
export function AdsCheckBrandMark({ className }: Props) {
  useAppLanguage();
  return <img src={toolmetaIcon} alt="" aria-hidden="true" className={`ads-brand-logo-mark${className ? ` ${className}` : ''}`} />
}

export function ToolmetaWordmark({ className }: Props) {
  return <img src={toolmetaWordmark} alt="Toolmeta" className={`toolmeta-wordmark${className ? ` ${className}` : ''}`} />
}

export default AdsCheckBrandMark
