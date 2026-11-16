import { adsCheckShellNavigation as navigationItems } from '@/features/ads-check/ads-check-shell-navigation'
import { AdsCheckShellBottomNav } from '@/features/ads-check/ads-check-shell-bottom-nav'
import { useShellDrawerMode } from '@/features/ads-check/use-shell-drawer-mode'
import { AdsCheckModuleIsland } from '@/features/ads-check/ads-check-module-island'
import { appLanguageOptions, m, useAppLanguage, tx, t } from '@/i18n'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bell, Headphones,
  Languages, Menu, ShoppingCart,
} from 'lucide-react'
import { AdsCheckModuleIcon } from '@/features/ads-check/ads-check-module-icon'
import { AdsCheckNavIcon } from '@/features/ads-check/ads-check-nav-icon'
import { ToolmetaWordmark } from '@/features/ads-check/ads-check-brand-mark'
import { Link, useNavigate } from 'react-router-dom'
import { AccountPanel, RailMenus, type AdsLanguage, type AdsRailMenu } from '@/features/ads-save/ads-save-panels'
import { ControlHubModal } from '@/features/ads-save/ads-save-modals'
import { ExploreV8Modal } from '@/features/ads-save/ads-save-explore-modal'
import { AdsSaveMobileDrawer } from '@/features/ads-save/ads-save-mobile-drawer'
import { AdsCheckAdAccountsWorkspace } from '@/features/ads-check/ads-check-adaccounts-workspace'
import { AdsSaveWorkspace } from '@/features/ads-save/ads-save-workspace'
import { AdsSaveConfiguredWorkspace } from '@/features/ads-save/ads-save-configured-workspace'
import { AdsSaveCreateConfigModal } from '@/features/ads-save/ads-save-create-config-modal'
import { createStoredConfiguration, triggerLocalCsvDownload, type AdsSaveStoredConfiguration } from '@/features/ads-save/ads-save-configuration-store'
import { AdsCheckShellCurve } from '@/features/ads-check/ads-check-shell-curve'
import {
  readAdsCheckDefaultV6,
  readAdsCheckLanguage,
  readAdsCheckVersion,
  subscribeAdsCheckSessionState,
  writeAdsCheckDefaultV6,
  writeAdsCheckLanguage,
  writeAdsCheckVersion,
} from '@/features/ads-check/ads-check-session-state'

type Notice = { message: string; tone?: 'success' | 'info' } | null
type DialogName = 'control' | 'explore' | null
export type AdsWorkspaceVariant = 'ads-save' | 'ads-check-pro'

const languageLabels: Record<AdsLanguage, string> = Object.fromEntries(
  appLanguageOptions.map((item) => [item.code, item.label]),
) as Record<AdsLanguage, string>

type RailButtonProps = {
  label: string; active?: boolean; selected?: boolean; expanded?: boolean; controls?: string; href?: string; external?: boolean; children: ReactNode; onClick?: () => void
}
function RailButton({ label, active, selected, expanded, controls, href, external, children, onClick }: RailButtonProps) {
  useAppLanguage();
  const className = `ads-rail-button${active ? ' is-active' : ''}${selected ? ' is-selected' : ''}`
  if (href && external) return <a className={className} aria-label={tx(label)} aria-current={active ? 'page' : undefined} href={href} target="_blank" rel="noreferrer" title={tx(label)}>{tx(children)}</a>
  if (href) return <Link className={className} aria-label={tx(label)} aria-current={active ? 'page' : undefined} to={href} title={tx(label)}>{tx(children)}</Link>
  return <button type="button" className={className} aria-label={tx(label)} aria-current={active ? 'page' : undefined} aria-haspopup={expanded !== undefined ? 'menu' : undefined} aria-expanded={expanded} aria-controls={controls} data-ads-menu-trigger={expanded !== undefined ? '' : undefined} title={tx(label)} onClick={onClick}>{tx(children)}</button>
}

export default function AdsSavePage({ variant = 'ads-save' }: { variant?: AdsWorkspaceVariant }) {
  useAppLanguage();
  const navigate = useNavigate()
  const isAdsCheckPro = variant === 'ads-check-pro'
  const standardEditionLabel = isAdsCheckPro ? 'Pro' : 'Basic'
  const navigation = navigationItems.map((item) => ({
    ...item,
    active: item.label === (isAdsCheckPro ? 'Ads Check Pro' : 'Ads Save'),
  }))
  const initialVersion = useRef(readAdsCheckVersion()).current
  const initialDefaultV6 = useRef(readAdsCheckDefaultV6()).current
  const [mobileOpen, setMobileOpen] = useState(false)
  useShellDrawerMode(setMobileOpen)
  const [accountOpen, setAccountOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<AdsRailMenu>(null)
  const [dialog, setDialog] = useState<DialogName>(null)
  const [language, setLanguage] = useState<AdsLanguage>(readAdsCheckLanguage)
  const [version, setVersion] = useState<'v6' | 'v8'>(initialVersion ?? 'v8')
  const [defaultV6, setDefaultV6] = useState(initialDefaultV6)
  const [notice, setNotice] = useState<Notice>(null)
  const [createConfigOpen, setCreateConfigOpen] = useState(false)
  // No real Ads Save configuration backend/store exists in this project —
  // this collection lives only in this page's own React state for the
  // current session (see ads-save-configuration-store.ts's header comment
  // for the same honest limitation).
  const [configurations, setConfigurations] = useState<AdsSaveStoredConfiguration[]>([])
  // null → the modal (when open) is in 'create' mode; an id → 'edit' mode
  // for that specific configuration. Cleared whenever the modal closes so
  // a later "+ Thêm cấu hình mới" never accidentally reopens in edit mode.
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = isAdsCheckPro ? m("ui.f5d32037f2") : 'Ads Save · Ads Check'
    return () => { document.title = previousTitle }
  }, [isAdsCheckPro])
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 3200); return () => window.clearTimeout(timer) }, [notice])
  useEffect(() => subscribeAdsCheckSessionState(() => {
    const sharedVersion = readAdsCheckVersion()
    if (sharedVersion) {
      setVersion(sharedVersion)
    }
    setLanguage(readAdsCheckLanguage())
  }), [])

  const announce = (message: string, tone: 'success' | 'info' = 'info') => setNotice({ message, tone })
  const openDialog = (next: Exclude<DialogName, null>) => { setAccountOpen(false); setActiveMenu(null); setMobileOpen(false); setDialog(next) }
  const toggleMenu = (next: Exclude<AdsRailMenu, null>) => { setAccountOpen(false); setDialog(null); setActiveMenu((current) => current === next ? null : next) }
  const navigatePreview = (label: string, active?: boolean) => {
    setMobileOpen(false)
    if (active) return
    const target = navigationItems.find((item) => item.label === label)?.to
    if (target) navigate(target)
    else announce(m("ui.9556e04180", { 0: label }))
  }
  const updateDefaultV6 = (enabled: boolean) => {
    setDefaultV6(enabled)
    if (writeAdsCheckDefaultV6(enabled)) {
      announce(enabled ? m("ui.63eba1f096") : m("ui.b042dad963"), 'success')
    } else {
      announce(m("ui.f5e8a08054", { 0: enabled ? 'bật' : 'tắt' }))
    }
  }
  const activateV8 = (message: string) => {
    setVersion('v8')
    setDialog(null)
    writeAdsCheckVersion('v8')
    announce(message, 'success')
  }
  const selectVersion = (value: 'v6' | 'v8') => {
    setVersion(value)
    setActiveMenu(null)
    writeAdsCheckVersion(value)
    announce(m("ui.0bff507373", { 0: value === 'v6' ? 'Ads Check V6' : 'Ads Check' }), 'success')
  }
  const handleOpenCreateConfig = () => { setEditingConfigId(null); setCreateConfigOpen(true) }
  const handleOpenEditConfig = (id: string) => { setEditingConfigId(id); setCreateConfigOpen(true) }
  // "Tải ngay" — no real Meta insights API exists in this clone, so this
  // triggers the HONEST local CSV export (see triggerLocalCsvDownload's
  // own comment) and records only the resulting real download.
  const handleDownloadNow = (id: string) => {
    const stored = configurations.find((item) => item.id === id)
    if (!stored) return
    const record = triggerLocalCsvDownload(stored.configuration)
    setConfigurations((current) => current.map((item) => item.id === id ? { ...item, downloadHistory: [...item.downloadHistory, record] } : item))
    announce(m("ui.f6bb9f869b", { 0: record.fileName, 1: stored.configuration.configurationName }), 'success')
  }

  return <div className={`ads-save-app${isAdsCheckPro ? ' is-ads-check-pro' : ''}`}>
    <a className="ads-skip-link" href="#ads-save-main">{t("ui.9af88ffc6d")}</a>
    <header className="ads-topbar">
      <button className="ads-mobile-menu" type="button" aria-label={t("ui.23e29182f4")} aria-expanded={mobileOpen} aria-controls="ads-mobile-drawer" onClick={() => setMobileOpen(true)}><Menu size={17} /></button>
      <Link className="ads-brand" to={isAdsCheckPro ? '/app/adscheck-pro/adaccounts' : '/app/ads-save'} aria-label="Ads Check home"><ToolmetaWordmark /></Link>
      <div className="ads-top-actions">
        <button className="ads-buy-button" type="button" aria-label={t("ui.b90857eb2c")} onClick={() => navigate('/app/billing/payment')}><ShoppingCart size={15} /><span>{t("ui.b90857eb2c")}</span></button>
        <button className="ads-profile" type="button" aria-haspopup="dialog" aria-expanded={accountOpen} onClick={() => { setActiveMenu(null); setDialog(null); setAccountOpen((value) => !value) }}>{tx(isAdsCheckPro ? m("ui.4f4d141887") : m("ui.0f366f2fcc"))}</button>
        <button className={`ads-header-utility${activeMenu === 'language' ? ' is-selected' : ''}`} type="button" aria-label={t("ui.65074a8565")} aria-haspopup="menu" aria-expanded={activeMenu === 'language'} aria-controls="ads-language-menu" data-ads-menu-trigger="language" onClick={() => toggleMenu('language')}><Languages size={16} /></button>
        <a className="ads-header-utility" aria-label={t("ui.ed2a55ae3b")} title={t("ui.ed2a55ae3b")} href="https://www.facebook.com/adscheck.official/" target="_blank" rel="noreferrer"><Headphones size={16} /></a>
        <Link className="ads-header-utility ads-header-utility--notification" aria-label={t("ui.5d6af377c2")} title={t("ui.5d6af377c2")} to="/app/notification"><Bell size={16} /></Link>
      </div>
    </header>

    <section className="ads-workspace">
      <AdsCheckShellCurve enableLeftCornerAccents={!isAdsCheckPro} enableBottomLeftAccent={isAdsCheckPro} />
      <nav className="ads-rail" aria-label={t("ui.f03700cd5e")}>
        <div className="ads-rail-primary"><AdsCheckModuleIsland />{tx(navigation.map(({ label, active, to }) => <RailButton key={label} label={tx(label)} active={active} href={to}><AdsCheckModuleIcon route={to} /></RailButton>))}</div>
        <div className="ads-rail-secondary">
          <RailButton label={t("ui.b3755a35d8")} onClick={() => openDialog('control')}><AdsCheckNavIcon /></RailButton>
        </div>
      </nav>

      <main ref={mainRef} id="ads-save-main" className="ads-main-panel" tabIndex={-1}>
        {tx(isAdsCheckPro ? <AdsCheckAdAccountsWorkspace onAnnounce={announce} />
        : configurations.length === 0
          ? <AdsSaveWorkspace onCreateConfig={handleOpenCreateConfig} />
          : <AdsSaveConfiguredWorkspace
              configurations={configurations}
              onAddConfig={handleOpenCreateConfig}
              onEditConfig={handleOpenEditConfig}
              onToggleEnabled={(id) => setConfigurations((current) => current.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))}
              onRemoveConfig={(id) => setConfigurations((current) => current.filter((item) => item.id !== id))}
              onDownloadNow={handleDownloadNow}
            />)}
      </main>
    </section>

    <AdsCheckShellBottomNav open={mobileOpen} drawerId="ads-mobile-drawer" onMore={() => setMobileOpen(true)} />
    <RailMenus active={activeMenu} language={language} version={version} defaultV6={defaultV6} onClose={() => setActiveMenu(null)} onLanguage={(value) => { setLanguage(value); writeAdsCheckLanguage(value); setActiveMenu(null); announce(m("ui.1e074cd52d", { 0: languageLabels[value] }), 'success') }} onVersion={selectVersion} onDefaultV6={updateDefaultV6} />
    <AccountPanel open={accountOpen} authenticated={isAdsCheckPro} onClose={() => setAccountOpen(false)} onExplore={() => openDialog('explore')} onManageAccount={() => navigate('/app/account')} onAction={announce} />
    {tx(mobileOpen && <AdsSaveMobileDrawer open navigation={navigation} standardEditionLabel={standardEditionLabel} language={language} languageLabel={languageLabels[language]} onClose={() => setMobileOpen(false)} onNavigate={navigatePreview} onControlHub={() => openDialog('control')} onAccount={() => { setMobileOpen(false); setAccountOpen(true) }} onLanguage={(value) => { const next = value as AdsLanguage; setLanguage(next); writeAdsCheckLanguage(next); announce(m("ui.1e074cd52d", { 0: languageLabels[next] }), 'success') }} />)}
    {dialog === 'control' && <ControlHubModal open onClose={() => setDialog(null)} onAction={announce} onRequestUpgrade={() => navigate('/app/billing/payment')} />}
    {tx(dialog === 'explore' && <ExploreV8Modal open onClose={() => setDialog(null)} onAction={announce} onOpenControlHub={() => setDialog('control')} onChooseV8={() => activateV8(m("ui.d36d533285"))} onExperienceV8={() => activateV8(m("ui.61ee591bad"))} />)}
    {tx(createConfigOpen && <AdsSaveCreateConfigModal
      mode={editingConfigId ? 'edit' : 'create'}
      initialConfiguration={editingConfigId ? configurations.find((item) => item.id === editingConfigId)?.configuration : undefined}
      onClose={() => { setCreateConfigOpen(false); setEditingConfigId(null) }}
      onSubmit={(configuration) => {
        // No real Ads Save configuration backend/store exists anywhere in
        // this project yet — the configured state below is real, driven by
        // this actual configuration object, but it only lives in this
        // page's React state for the current session (announced honestly,
        // not claimed as a remote save).
        setCreateConfigOpen(false)
        if (editingConfigId) {
          const id = editingConfigId
          setEditingConfigId(null)
          setConfigurations((current) => current.map((item) => item.id === id ? { ...item, configuration } : item))
          announce(m("ui.d41e543f8e", { 0: configuration.configurationName }), 'success')
        } else {
          setConfigurations((current) => [...current, createStoredConfiguration(configuration)])
          announce(m("ui.bf08b5ccab", { 0: configuration.configurationName }), 'success')
        }
      }}
    />)}
    {tx(notice && <div className={`ads-toast is-${notice.tone ?? 'info'}`} role="status" aria-live="polite">{tx(notice.message)}</div>)}
  </div>
}
