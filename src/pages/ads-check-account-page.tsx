import { appLanguageOptions, m, useAppLanguage, t, tx } from '@/i18n'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check, Copy, KeyRound, Laptop, Monitor, ShieldCheck, WalletCards } from 'lucide-react'
import { AdsCheckProductShell } from '@/features/ads-check/ads-check-product-shell'
import { toolmetaDemoAccount, useToolmetaSession } from '@/features/ads-check/toolmeta-session'
import {
  readAdsCheckLanguage,
  readAdsCheckLoginSession,
  subscribeAdsCheckSessionState,
  type AdsCheckLanguage,
  type AdsCheckLoginSessionPreference,
} from '@/features/ads-check/ads-check-session-state'

type AccountTab = 'overview' | 'security'
type CopyStatus = 'idle' | 'success' | 'failure'

const accountId = toolmetaDemoAccount.id
const accountTabs: AccountTab[] = ['overview', 'security']
const languageLabels: Record<AdsCheckLanguage, string> = Object.fromEntries(
  appLanguageOptions.map((item) => [item.code, item.label]),
) as Record<AdsCheckLanguage, string>

function copyWithLegacyFallback(value: string) {
  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('Copy command was not accepted')
}

export default function AdsCheckAccountPage() {
  useAppLanguage();
  const { email, signOut } = useToolmetaSession()
  const [tab, setTab] = useState<AccountTab>('overview')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const [language, setLanguage] = useState(readAdsCheckLanguage)
  const [loginSession, setLoginSession] = useState<AdsCheckLoginSessionPreference | null>(readAdsCheckLoginSession)
  const copyTimerRef = useRef<number | null>(null)
  const tabRefs = useRef<Record<AccountTab, HTMLButtonElement | null>>({ overview: null, security: null })

  useEffect(() => { const previous = document.title; document.title = m("ui.2026b0163d"); return () => { document.title = previous } }, [])
  useEffect(() => subscribeAdsCheckSessionState(() => {
    setLanguage(readAdsCheckLanguage())
    setLoginSession(readAdsCheckLoginSession())
  }), [])
  useEffect(() => () => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
  }, [])

  const copyAccountId = useCallback(async () => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(accountId)
      } else {
        copyWithLegacyFallback(accountId)
      }
      setCopyStatus('success')
    } catch {
      try {
        copyWithLegacyFallback(accountId)
        setCopyStatus('success')
      } catch {
        setCopyStatus('failure')
      }
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopyStatus('idle')
      copyTimerRef.current = null
    }, 1800)
  }, [])

  const selectTab = (nextTab: AccountTab, focus = false) => {
    setTab(nextTab)
    if (focus) tabRefs.current[nextTab]?.focus()
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = accountTabs.indexOf(tab)
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % accountTabs.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + accountTabs.length) % accountTabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = accountTabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    selectTab(accountTabs[nextIndex], true)
  }

  const effectiveSession = loginSession ?? 'pro'
  const sessionLabel = effectiveSession === 'pro' ? m("ui.165f09d4d4") : m("ui.d0a3923562")
  const sessionLimit = effectiveSession === 'pro' ? 100 : 1

  return <AdsCheckProductShell activeNavigation="account">
    <section className="ads-account-page" aria-labelledby="ads-account-title">
      <header className="ads-account-hero">
        <div className="ads-account-avatar" aria-hidden="true">{t("ui.6dcd4ce23d")}</div>
        <div><span className="ads-section-eyebrow">{t("ui.e54ecac76d")}</span><h1 id="ads-account-title">{t("ui.939401cab4")}</h1><p className="toolmeta-account-email">{email ?? '—'}</p></div>
        {email && <div className="toolmeta-account-tools">
          <span className="ads-account-plan"><ShieldCheck size={15} /> {tx(effectiveSession === 'pro' ? 'Pro' : m("ui.a1e9637858"))}</span>
          <button className="toolmeta-sign-out" type="button" onClick={signOut}>{t("ui.d513aac0be")}</button>
        </div>}
      </header>

      <div className="ads-account-balance">
        <span><WalletCards size={18} /> {" "}{t("ui.6c17bb89b4")}</span><strong>{email ? t("ui.4ccb02fc39") : '—'}</strong><small>{t("ui.3ea3676ec5")}</small>
      </div>

      <div className="ads-account-tabs" role="tablist" aria-label={t("ui.c3c4a622df")}>
        <button ref={(node) => { tabRefs.current.overview = node }} id="ads-account-overview-tab" type="button" role="tab" aria-selected={tab === 'overview'} aria-controls="ads-account-overview" tabIndex={tab === 'overview' ? 0 : -1} onClick={() => selectTab('overview')} onKeyDown={handleTabKeyDown}>{t("ui.286a38e3d5")}</button>
        <button ref={(node) => { tabRefs.current.security = node }} id="ads-account-security-tab" type="button" role="tab" aria-selected={tab === 'security'} aria-controls="ads-account-security" tabIndex={tab === 'security' ? 0 : -1} onClick={() => selectTab('security')} onKeyDown={handleTabKeyDown}>{t("ui.ea8dedae2e")}</button>
      </div>

      {tx(tab === 'overview' ? <div id="ads-account-overview" className="ads-account-tab-panel" role="tabpanel" aria-labelledby="ads-account-overview-tab">
        <article className="ads-account-information">
          <header><div><span className="ads-section-eyebrow">{t("ui.22508e5da7")}</span><h2>{t("ui.022547201a")}</h2></div>{email && <span className="ads-status-dot"><i /> {" "}{t("ui.9a616fcdad")}</span>}</header>
          <dl>
            <div><dt>{t("ui.84add5b295")}</dt><dd>{email ? t("ui.57f6ff5a6b") : '—'}</dd></div>
            <div><dt>{t("ui.6f35cfbf96")}</dt><dd>{email ? <>{t("ui.750af8815e")}{" "}<button type="button" aria-label={t("ui.189d36a759")} title={tx(copyStatus === 'success' ? m("ui.40e825dba7") : copyStatus === 'failure' ? m("ui.3e2f232da9") : m("ui.189d36a759"))} onClick={copyAccountId}>{copyStatus === 'success' ? <Check size={15} /> : <Copy size={15} />}</button></> : '—'}</dd></div>
            <div><dt>{t("ui.3c4ed56c40")}</dt><dd>{email ? t("ui.0c2f43cf3c") : '—'}</dd></div>
            <div><dt>{t("ui.65074a8565")}</dt><dd>{languageLabels[language]}</dd></div>
          </dl>
        </article>
        <aside className="ads-account-summary"><span className="ads-summary-icon"><KeyRound size={22} /></span><h2>{t("ui.fa4bb68df7")}</h2><p>{t("ui.18a3063a97")}</p><button type="button" onClick={() => selectTab('security', true)}>{t("ui.de2c8df44d")}</button></aside>
      </div> : <div id="ads-account-security" className="ads-account-tab-panel is-security" role="tabpanel" aria-labelledby="ads-account-security-tab">
        <article className="ads-session-card">
          <header><div><span className="ads-section-eyebrow">{t("ui.6e9379b397")}</span><h2>{email ? tx(sessionLabel) : '—'}</h2><p>{t("ui.29b3984c59")}</p></div><span className="ads-session-count">{email ? `1 / ${sessionLimit}` : '0'} {" "}{t("ui.8f0fe24897")}</span></header>
          <div className="ads-session-progress" role="progressbar" aria-label={tx(m("ui.33e7de3636", { 0: sessionLabel }))} aria-valuemin={0} aria-valuemax={sessionLimit} aria-valuenow={email ? 1 : 0}><i style={{ width: !email ? '0%' : effectiveSession === 'pro' ? '1%' : '100%' }} /></div>
          {email && <div className="ads-current-session"><span className="ads-device-icon"><Laptop size={21} /></span><div><strong>{t("ui.82fa5f31dc")}</strong><span><i /> {" "}{t("ui.6e11d26140")}</span></div><span className="ads-current-badge"><Monitor size={14} /> {" "}{t("ui.626c8756be")}</span></div>}
        </article>
        <aside className="ads-security-note"><ShieldCheck size={23} /><div><h2>{t("ui.03b7dba044")}</h2><p>{t("ui.016b7c1b7f")}</p></div></aside>
      </div>)}
      <span className="sr-only" role="status" aria-live="polite">{tx(copyStatus === 'success' ? m("ui.693fe06125") : copyStatus === 'failure' ? m("ui.1e8b91e7d0") : '')}</span>
    </section>
  </AdsCheckProductShell>
}
