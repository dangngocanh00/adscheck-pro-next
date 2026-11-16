import { Ellipsis } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { t, tx, useAppLanguage } from '@/i18n'
import { adsCheckShellNavigation } from './ads-check-shell-navigation'
import { AdsCheckModuleIcon } from './ads-check-module-icon'

export function AdsCheckShellBottomNav({ open, drawerId, onMore }: { open: boolean; drawerId: string; onMore: () => void }) {
  useAppLanguage()
  const { pathname } = useLocation()
  const primary = adsCheckShellNavigation.slice(0, 4)
  return <nav className="ads-shell-bottom-nav" aria-label={t('ui.f03700cd5e')}>
    {primary.map(item => <Link key={item.key} to={item.to} aria-label={tx(item.label)} aria-current={pathname === item.to ? 'page' : undefined}>
      <AdsCheckModuleIcon route={item.to} /><span>{tx(item.label)}</span>
    </Link>)}
    <button type="button" aria-label={t('ui.23e29182f4')} aria-expanded={open} aria-controls={drawerId} aria-haspopup="dialog" className={!primary.some(item => item.to === pathname) ? 'is-current' : undefined} onClick={onMore}>
      <Ellipsis size={22} /><span>{t('ui.cc88682f18')}</span>
    </button>
  </nav>
}
