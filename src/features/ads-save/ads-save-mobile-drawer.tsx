import { appLanguageOptions, useAppLanguage, t, tx } from '@/i18n'
import { useRef, useState, type ComponentType } from 'react'
import { Bell, Grid2X2, Headphones, Languages, UserRound, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'

type DrawerItem = { label: string; icon: ComponentType<{ size?: number }>; active?: boolean; to?: string }

type MobileDrawerProps = {
  open: boolean
  navigation: DrawerItem[]
  accountLabel: string
  language: string
  languageLabel: string
  onClose: () => void
  onNavigate: (label: string, active?: boolean) => void
  onControlHub: () => void
  onAccount: () => void
  onLanguage: (language: string) => void
}

export function AdsSaveMobileDrawer(props: MobileDrawerProps) {
  useAppLanguage();
  const drawerRef = useRef<HTMLElement>(null)
  const languageTriggerRef = useRef<HTMLButtonElement>(null)
  const [languagesOpen, setLanguagesOpen] = useState(false)
  useOverlayFocus(props.open, drawerRef, props.onClose)
  if (!props.open) return null

  const run = (action: () => void) => { props.onClose(); action() }
  return <div className="ads-drawer-layer" onMouseDown={(event) => {
    if (event.target === event.currentTarget) props.onClose()
  }}>
    <section ref={drawerRef} id="ads-mobile-drawer" className="ads-mobile-drawer" role="dialog" aria-modal="true" aria-label={t("ui.69f43dc60e")}>
      <header className="ads-drawer-heading"><span>{t("ui.57f5f5efbc")}</span><button type="button" aria-label={t("ui.a2b1f3c584")} data-autofocus onClick={props.onClose}><X size={18} /></button></header>
      <nav aria-label={t("ui.464ee7c2cd")}>
        {tx(props.navigation.map(({ label, icon: Icon, active, to }) => to
          ? <Link key={label} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined} to={to} onClick={props.onClose}><Icon size={18} />{tx(label)}</Link>
          : <button type="button" key={label} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined} onClick={() => props.onNavigate(label, active)}><Icon size={18} />{tx(label)}</button>))}
      </nav>
      <div className="ads-drawer-divider" />
      <div className="ads-drawer-tools">
        <button type="button" onClick={() => run(props.onControlHub)}><Grid2X2 size={18} />{t("ui.83612f5980")}{" "}<b>{t("ui.c2649c2792")}</b></button>
        <button ref={languageTriggerRef} type="button" aria-expanded={languagesOpen} aria-controls="ads-mobile-languages" onClick={() => setLanguagesOpen((value) => !value)}><Languages size={18} />{props.languageLabel}</button>
        {tx(languagesOpen && <div id="ads-mobile-languages" className="ads-mobile-languages">{appLanguageOptions.map((item) => <button key={item.code} type="button" aria-pressed={props.language === item.code} onClick={() => { props.onLanguage(item.code); setLanguagesOpen(false); languageTriggerRef.current?.focus() }}>{item.label}</button>)}</div>)}
        <a href="https://www.facebook.com/adscheck.official/" target="_blank" rel="noreferrer" onClick={props.onClose}><Headphones size={18} />{t("ui.ed2a55ae3b")}</a>
        <Link to="/app/notification" onClick={props.onClose}><Bell size={18} />{t("ui.5d6af377c2")}</Link>
        <button type="button" onClick={() => run(props.onAccount)}><UserRound size={18} />{props.accountLabel}</button>
      </div>
    </section>
  </div>
}
