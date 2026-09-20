import { appLanguageOptions, getAppLanguageLabel, m, useAppLanguage, tx, t } from '@/i18n'
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
  Bell, Bookmark, CreditCard, Grid2X2, Headphones, Home,
  Languages, Menu, Package, ShoppingCart, UserRound, X,
} from 'lucide-react'
import { AdsCheckProAppIcon } from '@/features/ads-check/ads-check-pro-app-icon'
import { AdsCheckNavIcon } from '@/features/ads-check/ads-check-nav-icon'
import { AdsCheckBrandMark } from '@/features/ads-check/ads-check-brand-mark'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { ControlHubModal } from '@/features/ads-save/ads-save-modals'
import { AdsCheckShellCurve } from '@/features/ads-check/ads-check-shell-curve'
import {
  readAdsCheckLanguage,
  readAdsCheckDefaultV6,
  readAdsCheckVersion,
  subscribeAdsCheckSessionState,
  writeAdsCheckLanguage,
  writeAdsCheckDefaultV6,
  writeAdsCheckVersion,
  type AdsCheckLanguage,
  type AdsCheckVersion,
} from '@/features/ads-check/ads-check-session-state'

type NavigationItem = {
  key: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  to: string
}

type AdsCheckProductShellProps = {
  activeNavigation: string
  children: ReactNode
}

const primaryNavigation: NavigationItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, to: '/app/home' },
  { key: 'ads-check-pro', label: 'Ads Check Pro', icon: AdsCheckProAppIcon, to: '/app/adscheck-pro/adaccounts' },
  { key: 'extended-payment', label: 'Extended Payment', icon: CreditCard, to: '/app/extended-payment' },
  { key: 'ads-save', label: 'Ads Save', icon: Bookmark, to: '/app/ads-save' },
  { key: 'billing', label: m("ui.b90857eb2c"), icon: Package, to: '/app/billing/payment' },
]

const languageOptions = appLanguageOptions

const routeTitles: Record<string, string> = {
  '/app/home': 'Dashboard',
  '/app/adscheck-pro/adaccounts': m("ui.ade9e0760e"),
  '/app/extended-payment': 'Extended Payment',
  '/app/billing/payment': m("ui.a998a8fb1c"),
  '/app/notification': m("ui.22d5e448ec"),
  '/app/account': m("ui.939401cab4"),
}

function RailLink({ item, active }: { item: NavigationItem; active: boolean }) {
  useAppLanguage();
  const Icon = item.icon
  return <Link className={`ads-rail-button${active ? ' is-active' : ''}`} aria-label={tx(item.label)} aria-current={active ? 'page' : undefined} to={item.to} title={tx(item.label)}>
    <Icon size={17} strokeWidth={1.9} />
  </Link>
}

export function AdsCheckProductShell({ activeNavigation, children }: AdsCheckProductShellProps) {
  useAppLanguage();
  const location = useLocation()
  const navigate = useNavigate()
  const drawerRef = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const utilityMenuRef = useRef<HTMLDivElement>(null)
  const utilityShouldRestoreFocusRef = useRef(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileVersionOpen, setMobileVersionOpen] = useState(false)
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false)
  const [language, setLanguage] = useState<AdsCheckLanguage>(readAdsCheckLanguage)
  const [version, setVersion] = useState<AdsCheckVersion>(() => readAdsCheckVersion() ?? 'v8')
  const [defaultV6, setDefaultV6] = useState(readAdsCheckDefaultV6)
  const [utilityPanel, setUtilityPanel] = useState<'version' | 'language' | null>(null)
  const [controlHubOpen, setControlHubOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useOverlayFocus(mobileOpen, drawerRef, () => setMobileOpen(false))

  useEffect(() => subscribeAdsCheckSessionState(() => {
    setLanguage(readAdsCheckLanguage())
    const sharedVersion = readAdsCheckVersion()
    if (sharedVersion) setVersion(sharedVersion)
    setDefaultV6(readAdsCheckDefaultV6())
  }), [])

  useEffect(() => {
    const previousTitle = document.title
    const routeTitle = location.pathname === '/app/adscheck-pro/adaccounts'
      ? t("ui.ade9e0760e")
      : tx(routeTitles[location.pathname] ?? 'Ads Check')
    document.title = `${routeTitle} · Ads Check`
    const frame = window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }))
    return () => {
      window.cancelAnimationFrame(frame)
      document.title = previousTitle
    }
  }, [language, location.pathname])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!utilityPanel) return
    const menu = utilityMenuRef.current
    const trigger = document.querySelector<HTMLElement>(`[data-ads-shell-menu-trigger="${utilityPanel}"]`)
    const focusTimer = window.requestAnimationFrame(() => {
      const selected = menu?.querySelector<HTMLElement>('[aria-checked="true"]')
      ;(selected ?? menu?.querySelector<HTMLElement>('[role="menuitemradio"]'))?.focus()
    })
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault()
        utilityShouldRestoreFocusRef.current = false
        const controls = Array.from(document.querySelectorAll<HTMLElement>('.ads-rail-secondary > .ads-rail-button'))
        const currentIndex = trigger ? controls.indexOf(trigger) : -1
        const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1
        const nextControl = controls[nextIndex]
        setUtilityPanel(null)
        window.requestAnimationFrame(() => nextControl?.focus())
        return
      }
      if (event.key === 'Escape') {
        utilityShouldRestoreFocusRef.current = true
        setUtilityPanel(null)
        return
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      const items = Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitemcheckbox"]') ?? [])
      if (items.length === 0) return
      event.preventDefault()
      const current = Math.max(0, items.indexOf(document.activeElement as HTMLElement))
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length
      items[next]?.focus()
    }
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!menu?.contains(target) && !target.closest('[data-ads-shell-menu-trigger]')) setUtilityPanel(null)
    }
    document.addEventListener('keydown', handleKeys)
    document.addEventListener('mousedown', closeOutside)
    return () => {
      window.cancelAnimationFrame(focusTimer)
      document.removeEventListener('keydown', handleKeys)
      document.removeEventListener('mousedown', closeOutside)
      if (utilityShouldRestoreFocusRef.current) trigger?.focus()
      utilityShouldRestoreFocusRef.current = true
    }
  }, [utilityPanel])

  const chooseUtility = (panel: 'version' | 'language') => {
    utilityShouldRestoreFocusRef.current = true
    setUtilityPanel((current) => current === panel ? null : panel)
  }

  const selectVersion = (next: AdsCheckVersion) => {
    setVersion(next)
    writeAdsCheckVersion(next)
    setUtilityPanel(null)
    setMobileVersionOpen(false)
  }

  const selectLanguage = (next: AdsCheckLanguage) => {
    setLanguage(next)
    writeAdsCheckLanguage(next)
    setUtilityPanel(null)
    setMobileLanguageOpen(false)
  }

  const toggleDefaultV6 = () => {
    const next = !defaultV6
    setDefaultV6(next)
    writeAdsCheckDefaultV6(next)
  }

  const openControlHub = () => {
    setMobileOpen(false)
    setUtilityPanel(null)
    setControlHubOpen(true)
  }

  const languageLabel = getAppLanguageLabel(language)

  return <div className="ads-save-app ads-product-shell">
    <a className="ads-skip-link" href="#ads-product-main">{t("ui.9af88ffc6d")}</a>
    <header className="ads-topbar">
      <button className="ads-mobile-menu" type="button" aria-label={t("ui.23e29182f4")} aria-expanded={mobileOpen} aria-controls="ads-product-mobile-drawer" onClick={() => setMobileOpen(true)}><Menu size={18} /></button>
      <Link className="ads-brand" to="/app/home" aria-label="Ads Check home"><AdsCheckBrandMark className="ads-brand-header-logo" /><span><strong>{t("ui.0a099528df")}</strong><small>{t("ui.44a1737be5")}</small></span></Link>
      <div className="ads-top-actions">
        <Link className="ads-buy-button" aria-label={t("ui.b90857eb2c")} to="/app/billing/payment"><ShoppingCart size={15} /><span>{t("ui.b90857eb2c")}</span></Link>
        <Link className="ads-profile ads-shell-profile" aria-label={t("ui.da3dbde4f0")} to="/app/account"><span>{t("ui.82fa5f31dc")}</span></Link>
      </div>
    </header>

    <section className="ads-workspace ads-product-workspace">
      <AdsCheckShellCurve />
      <nav className="ads-rail" aria-label={t("ui.f03700cd5e")}>
        <div className="ads-rail-primary">{primaryNavigation.map((item) => <RailLink key={item.key} item={item} active={activeNavigation === item.key} />)}</div>
        <div className="ads-rail-secondary">
          <button className="ads-rail-button" type="button" aria-label={t("ui.b3755a35d8")} title={t("ui.b3755a35d8")} onClick={openControlHub}><AdsCheckNavIcon /></button>
          <button className={`ads-rail-button${utilityPanel === 'language' ? ' is-selected' : ''}`} type="button" aria-label={tx(m("ui.bc23ab2eaa", { 0: languageLabel }))} aria-haspopup="menu" aria-expanded={utilityPanel === 'language'} aria-controls="ads-shell-language-menu" data-ads-shell-menu-trigger="language" onClick={() => chooseUtility('language')}><Languages size={16} /></button>
          <a className="ads-rail-button" aria-label={t("ui.ed2a55ae3b")} href="https://www.facebook.com/adscheck.official/" target="_blank" rel="noreferrer" title={t("ui.ed2a55ae3b")}><Headphones size={16} /></a>
          <Link className={`ads-rail-button${activeNavigation === 'notification' ? ' is-active' : ''}`} aria-label={t("ui.5d6af377c2")} aria-current={activeNavigation === 'notification' ? 'page' : undefined} to="/app/notification" title={t("ui.5d6af377c2")}><Bell size={16} /></Link>
        </div>
      </nav>

      <main ref={mainRef} id="ads-product-main" className="ads-product-main" tabIndex={-1}>{tx(children)}</main>

      {tx(utilityPanel === 'version' && <div ref={utilityMenuRef} id="ads-shell-version-menu" className="ads-shell-utility-menu is-version" role="menu" aria-label={t("ui.a6d137b4a9")}>
        {(['v6', 'v8'] as const).map((item) => <button key={item} type="button" role="menuitemradio" aria-checked={version === item} onClick={() => selectVersion(item)}>{item === 'v6' ? 'Ads Check V6' : 'Ads Check'}<i className={version === item ? 'is-checked' : ''} /></button>)}
        <button type="button" role="menuitemcheckbox" aria-checked={defaultV6} onClick={toggleDefaultV6}>{t("ui.33a99b22be")}<i className={defaultV6 ? 'is-checked' : ''} /></button>
      </div>)}
      {tx(utilityPanel === 'language' && <div ref={utilityMenuRef} id="ads-shell-language-menu" className="ads-shell-utility-menu is-language" role="menu" aria-label={t("ui.302a3af50c")}>
        {languageOptions.map((item) => <button key={item.code} type="button" role="menuitemradio" aria-checked={language === item.code} onClick={() => selectLanguage(item.code)}>{item.label}<i className={language === item.code ? 'is-checked' : ''} /></button>)}
      </div>)}
    </section>

    {tx(mobileOpen && <div className="ads-drawer-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileOpen(false) }}>
      <section ref={drawerRef} id="ads-product-mobile-drawer" className="ads-mobile-drawer ads-product-mobile-drawer" role="dialog" aria-modal="true" aria-label={t("ui.69f43dc60e")}>
        <header className="ads-drawer-heading"><span>{t("ui.57f5f5efbc")}</span><button type="button" data-autofocus aria-label={t("ui.a2b1f3c584")} onClick={() => setMobileOpen(false)}><X size={18} /></button></header>
        <nav aria-label={t("ui.464ee7c2cd")}>{tx(primaryNavigation.map((item) => {
          const Icon = item.icon
          const active = activeNavigation === item.key
          return <Link key={item.key} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined} to={item.to} onClick={() => setMobileOpen(false)}><Icon size={18} />{tx(item.label)}</Link>
        }))}</nav>
        <div className="ads-drawer-divider" />
        <nav className="ads-product-drawer-tools" aria-label={t("ui.48403e80e3")}>
          <button type="button" onClick={openControlHub}><Grid2X2 size={18} />{t("ui.83612f5980")}</button>
          <button type="button" aria-expanded={mobileVersionOpen} aria-controls="ads-product-mobile-versions" onClick={() => setMobileVersionOpen((current) => !current)}>{version === 'v6' && <span className="ads-version">{version}</span>}{version === 'v6' ? 'Ads Check V6' : 'Ads Check'}</button>
          {tx(mobileVersionOpen && <div id="ads-product-mobile-versions" className="ads-mobile-languages" aria-label={t("ui.a6d137b4a9")}>{(['v6', 'v8'] as const).map((item) => <button key={item} type="button" aria-pressed={version === item} onClick={() => selectVersion(item)}>{item === 'v6' ? 'Ads Check V6' : 'Ads Check'}</button>)}<button type="button" aria-pressed={defaultV6} onClick={toggleDefaultV6}>{t("ui.33a99b22be")}</button></div>)}
          <button type="button" aria-expanded={mobileLanguageOpen} aria-controls="ads-product-mobile-languages" onClick={() => setMobileLanguageOpen((current) => !current)}><Languages size={18} />{languageLabel}</button>
          {tx(mobileLanguageOpen && <div id="ads-product-mobile-languages" className="ads-mobile-languages" aria-label={t("ui.302a3af50c")}>{languageOptions.map((item) => <button key={item.code} type="button" aria-pressed={language === item.code} onClick={() => selectLanguage(item.code)}>{item.label}</button>)}</div>)}
          <Link className={activeNavigation === 'notification' ? 'is-active' : ''} aria-current={activeNavigation === 'notification' ? 'page' : undefined} to="/app/notification" onClick={() => setMobileOpen(false)}><Bell size={18} />{t("ui.5d6af377c2")}</Link>
          <Link className={activeNavigation === 'account' ? 'is-active' : ''} aria-current={activeNavigation === 'account' ? 'page' : undefined} to="/app/account" onClick={() => setMobileOpen(false)}><UserRound size={18} />{t("ui.4a60abe525")}</Link>
          <a href="https://www.facebook.com/adscheck.official/" target="_blank" rel="noreferrer"><Headphones size={18} />{t("ui.ed2a55ae3b")}</a>
        </nav>
      </section>
    </div>)}
    <ControlHubModal open={controlHubOpen} onClose={() => setControlHubOpen(false)} onAction={setNotice} onRequestUpgrade={() => navigate('/app/billing/payment')} />
    <span className="sr-only" role="status" aria-live="polite">{tx(notice ?? m("ui.f355d17137", { 0: version === 'v6' ? 'Ads Check V6' : 'Ads Check', 1: languageLabel }))}</span>
  </div>
}

export default AdsCheckProductShell
