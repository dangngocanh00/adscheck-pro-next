import { appLanguageOptions, m, useAppLanguage, t, tx, type AppLanguage } from '@/i18n'
import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Headset, LogOut, Minus, UserRound, WalletCards } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'

export type AdsLanguage = AppLanguage
export type AdsRailMenu = 'version' | 'language' | null

const languages = appLanguageOptions

type AccountPanelProps = {
  open: boolean
  authenticated?: boolean
  onClose: () => void
  onExplore: () => void
  onManageAccount?: () => void
  onAction: (message: string) => void
}

export function AccountPanel({ open, authenticated = false, onClose, onExplore, onManageAccount, onAction }: AccountPanelProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  const signedOutManageRef = useRef<HTMLButtonElement>(null)
  const [facebookConnected, setFacebookConnected] = useState(false)
  const [smitConnected, setSmitConnected] = useState(authenticated)
  const [supportPin, setSupportPin] = useState<string | null>(null)
  useOverlayFocus(open, panelRef, onClose)
  useEffect(() => setSmitConnected(authenticated), [authenticated])
  if (!open) return null

  return <div className="ads-account-layer" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <section ref={panelRef} className="ads-account-panel" role="dialog" aria-modal="true" aria-label={t("ui.82fa5f31dc")}>
      <header><UserRound size={18} /><strong>{t("ui.82fa5f31dc")}</strong><button type="button" aria-label={t("ui.a2b1f3c584")} data-autofocus onClick={onClose}><Minus size={18} /></button></header>
      <div className="ads-account-body">
        <article><span>{tx(facebookConnected ? m("ui.cab8b25c8f") : m("ui.4c5024eb44"))}</span><button type="button" onClick={() => { setFacebookConnected((value) => !value); onAction(facebookConnected ? m("ui.8c25813644") : m("ui.4e513d9ea6")) }}>{tx(facebookConnected ? m("ui.ef495639b6") : m("ui.1c7a576979"))}</button></article>
        {tx(smitConnected ? <article className="ads-smit-account-card">
          <div><strong>{t("ui.939401cab4")}</strong><span>{t("ui.8624d8837a")}</span><small><WalletCards size={13} /> {" "}{t("ui.5106b020c3")}</small>{supportPin && <small>{t("ui.389fb6e1bc")}{" "}{supportPin}</small>}</div>
          <div className="ads-account-icon-actions">
            <button type="button" aria-label={t("ui.36deb79c09")} title={t("ui.36deb79c09")} onClick={() => { setSupportPin('248 731'); onAction(m("ui.5b806e5497")) }}><Headset size={15} /></button>
            <button type="button" aria-label={t("ui.a719f74187")} title={t("ui.a719f74187")} onClick={() => { onClose(); onManageAccount?.() }}><ExternalLink size={15} /></button>
            <button type="button" aria-label={t("ui.d513aac0be")} title={t("ui.d513aac0be")} onClick={() => { setSmitConnected(false); setSupportPin(null); window.requestAnimationFrame(() => signedOutManageRef.current?.focus()); onAction(m("ui.dc37282784")) }}><LogOut size={15} /></button>
          </div>
        </article> : <article><span>{t("ui.8984ee7c4b")}</span><button ref={signedOutManageRef} type="button" onClick={() => { onClose(); onManageAccount?.() }}>{t("ui.a719f74187")}{" "}<ExternalLink size={13} /></button></article>)}
        <button className="ads-account-explore" type="button" onClick={onExplore}>{t("ui.ddbdf98143")}{" "}<ExternalLink size={14} /></button>
      </div>
    </section>
  </div>
}

type RailMenusProps = {
  active: AdsRailMenu
  language: AdsLanguage
  version: 'v6' | 'v8'
  defaultV6: boolean
  onClose: () => void
  onLanguage: (language: AdsLanguage) => void
  onVersion: (version: 'v6' | 'v8') => void
  onDefaultV6: (value: boolean) => void
}

export function RailMenus(props: RailMenusProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(props.onClose)
  const shouldRestoreFocusRef = useRef(true)

  useEffect(() => { closeRef.current = props.onClose }, [props.onClose])

  useEffect(() => {
    if (!props.active) return
    const panel = panelRef.current
    const trigger = document.querySelector<HTMLElement>(`[aria-controls="ads-${props.active}-menu"]`)
    const positionMenu = () => {
      if (!panel || !trigger?.classList.contains('ads-header-utility')) return
      const rect = trigger.getBoundingClientRect()
      Object.assign(panel.style, { position: 'fixed', top: (rect.bottom + 8) + 'px', bottom: 'auto', left: 'auto', right: Math.max(12, window.innerWidth - rect.right) + 'px' })
    }
    positionMenu()
    window.addEventListener('resize', positionMenu)
    const focusTimer = window.requestAnimationFrame(() => {
      const selected = panel?.querySelector<HTMLElement>('[aria-checked="true"]')
      const focusTarget = selected ?? panel?.querySelector<HTMLElement>('button')
      focusTarget?.focus()
    })
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault()
        shouldRestoreFocusRef.current = false
        const controls = Array.from(document.querySelectorAll<HTMLElement>('.ads-top-actions > a, .ads-top-actions > button'))
        const currentIndex = trigger ? controls.indexOf(trigger) : -1
        const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1
        const nextControl = controls[nextIndex]
        closeRef.current()
        window.requestAnimationFrame(() => nextControl?.focus())
        return
      }
      if (event.key === 'Escape') {
        shouldRestoreFocusRef.current = true
        closeRef.current()
        return
      }
      if ((event.key === 'Enter' || event.key === ' ') && panel?.contains(document.activeElement)) {
        event.preventDefault()
        const activeElement = document.activeElement as HTMLElement
        activeElement.click()
        return
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      const items = Array.from(panel?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])
      if (items.length === 0) return
      event.preventDefault()
      const current = Math.max(0, items.indexOf(document.activeElement as HTMLElement))
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length
      items[next]?.focus()
    }
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!panelRef.current?.contains(target) && !target.closest('[data-ads-menu-trigger]')) closeRef.current()
    }
    document.addEventListener('keydown', handleKeys)
    document.addEventListener('mousedown', closeOutside)
    return () => {
      window.removeEventListener('resize', positionMenu)
      window.cancelAnimationFrame(focusTimer)
      document.removeEventListener('keydown', handleKeys)
      document.removeEventListener('mousedown', closeOutside)
      if (shouldRestoreFocusRef.current) trigger?.focus()
      shouldRestoreFocusRef.current = true
    }
  }, [props.active])

  if (!props.active) return null
  if (props.active === 'language') return <div ref={panelRef} id="ads-language-menu" className="ads-rail-popover is-language" role="menu" aria-label={t("ui.65074a8565")}>
    {languages.map((item) => <button key={item.code} type="button" role="menuitemradio" aria-checked={props.language === item.code} onClick={() => props.onLanguage(item.code)}>
      <span className={`ads-flag is-${item.flag}`} aria-hidden="true" /><span>{item.label}</span><i className={props.language === item.code ? 'is-checked' : ''} aria-hidden="true" />
    </button>)}
  </div>

  return <div ref={panelRef} id="ads-version-menu" className="ads-rail-popover is-version" role="menu" aria-label={t("ui.a6d137b4a9")}>
    <button type="button" role="menuitemradio" aria-checked={props.version === 'v6'} onClick={() => props.onVersion('v6')}><span className="ads-mini-app is-v6">{t("ui.874146faa9")}</span><span>{t("ui.cefa427321")}</span><i className={props.version === 'v6' ? 'is-checked' : ''} aria-hidden="true" /></button>
    <button type="button" role="menuitemradio" aria-checked={props.version === 'v8'} onClick={() => props.onVersion('v8')}><span className="ads-mini-app is-v8">{t("ui.6dcd4ce23d")}</span><span>{t("ui.0a099528df")}</span><i className={props.version === 'v8' ? 'is-checked' : ''} aria-hidden="true" /></button>
    <button className="ads-version-default" type="button" role="menuitemcheckbox" aria-checked={props.defaultV6} onClick={() => props.onDefaultV6(!props.defaultV6)}><span className={`ads-fake-check${props.defaultV6 ? ' is-checked' : ''}`} aria-hidden="true" /><span>{t("ui.33a99b22be")}</span></button>
  </div>
}
