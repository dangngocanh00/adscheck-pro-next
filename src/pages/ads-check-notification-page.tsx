import { m, useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CalendarDays, ChevronDown, CircleSlash2, Gift, MailOpen, Megaphone, Search, SlidersHorizontal } from 'lucide-react'
import { AdsCheckProductShell } from '@/features/ads-check/ads-check-product-shell'

type NotificationFilter = 'all' | 'unread' | 'system' | 'promotion'

const filters: { id: NotificationFilter; label: string; icon: typeof Bell }[] = [
  { id: 'all', label: m("ui.f7a578dcbd"), icon: Bell },
  { id: 'unread', label: m("ui.a900732f94"), icon: MailOpen },
  { id: 'system', label: m("ui.8f92d9663d"), icon: Megaphone },
  { id: 'promotion', label: m("ui.02c4809a31"), icon: Gift },
]

export default function AdsCheckNotificationPage() {
  useAppLanguage();
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [query, setQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<string>(m("ui.71f6cb94e3"))
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searching = useMemo(() => query.trim().length > 0, [query])

  useEffect(() => { const previous = document.title; document.title = m("ui.f6a3ca93f9"); return () => { document.title = previous } }, [])
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const cycleTimeFilter = () => {
    setTimeFilter((current) => current === m("ui.71f6cb94e3") ? m("ui.aff54b0200") : current === m("ui.aff54b0200") ? m("ui.ea9556b5ff") : m("ui.71f6cb94e3"))
  }

  return <AdsCheckProductShell activeNavigation="notification">
    <section className="ads-notification-page" aria-labelledby="ads-notification-title">
      <header className="ads-section-heading">
        <div><h1 id="ads-notification-title"><Bell size={19} /> {" "}{t("ui.22d5e448ec")}</h1></div>
      </header>

      <div className="ads-notification-toolbar">
        <div className="ads-notification-filters" role="group" aria-label={t("ui.d6cc7daceb")}>{tx(filters.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={filter === id ? 'is-active' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}><Icon size={16} />{tx(label)}<span>0</span></button>))}</div>
      </div>
      <div className="ads-notification-actions">
        <button type="button" disabled aria-label={t("ui.55408d1a97")}><MailOpen size={15} /> {" "}{t("ui.0b05959109")}</button>
        <button type="button" aria-label={tx(m("ui.55c17138b1", { 0: timeFilter }))} onClick={cycleTimeFilter}><CalendarDays size={15} /> {tx(timeFilter)} <ChevronDown size={14} /></button>
        <span className="sr-only" role="status" aria-live="polite">{t("ui.2fcfa6d874")}{" "}{tx(timeFilter)}</span>
        <label className="ads-notification-search"><span className="sr-only">{t("ui.416c92cea5")}</span><Search size={17} /><input ref={searchInputRef} value={query} placeholder={t("ui.a0c881ab3c")} onChange={(event) => setQuery(event.target.value)} /><kbd>{t("ui.f1f00b4ae0")}</kbd></label>
      </div>

      <div className="ads-notification-empty">
        <div className="ads-empty-illustration" aria-hidden="true"><span /><span /><span /><CircleSlash2 size={52} /></div>
        <span className="ads-empty-chip"><SlidersHorizontal size={14} /> {filters.find((item) => item.id === filter)?.label}</span>
        <div role="status" aria-live="polite" aria-atomic="true">
          <h2>{tx(searching ? m("ui.09cd1d3b8a") : m("ui.880c4b1e6d"))}</h2>
          <p>{tx(searching ? m("ui.5f832c2db2") : m("ui.2e5a0aedce"))}</p>
        </div>
        {searching && <p>{t("ui.0063739451")}{query.trim()}”</p>}
        {searching && <button type="button" onClick={() => setQuery('')}>{t("ui.d8f702c3e6")}</button>}
      </div>
    </section>
  </AdsCheckProductShell>
}
