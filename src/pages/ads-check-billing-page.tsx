import { AdsCheckCurveNeon } from '@/features/ads-check/ads-check-curve-neon'
import { m, useAppLanguage, t, tx } from '@/i18n'
import { forwardRef, useId, useLayoutEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Gift,
  History,
  LogOut,
  PackageCheck,
  Search,
  Users,
} from 'lucide-react'
import { AdsCheckBillingConsentModal } from '@/features/ads-check/ads-check-billing-consent-modal'
import { AdsCheckBillingFilterMenu, type BillingFilterSource, type BillingFilterUsageStatus } from '@/features/ads-check/ads-check-billing-filter-menu'
import { featureAccent } from '@/features/ads-check/ads-check-billing-feature-accent'
import { AdsCheckBillingGiftcodeModal } from '@/features/ads-check/ads-check-billing-giftcode-modal'
import { AdsCheckBillingHistoryPanel, AdsCheckBillingHistoryToolbar, demoTransactions, type BillingTransaction } from '@/features/ads-check/ads-check-billing-history-panel'
import { useToolmetaSession } from '@/features/ads-check/toolmeta-session'
import { AdsCheckBillingPurchasePanel } from '@/features/ads-check/ads-check-billing-purchase-panel'
import {
  assetManagementFeatures,
  controlHubFeature,
  formatUsd,
  otherBillingFeatures,
  type BillingFeature,
  type BillingOrderDraft,
} from '@/features/ads-check/ads-check-billing-data'
import { buildBillingWorkspacePath, type BillingWorkspaceTabPosition } from '@/features/ads-check/ads-check-billing-workspace-surface'
import { AdsCheckProductShell } from '@/features/ads-check/ads-check-product-shell'

type BillingTab = 'purchase' | 'plans' | 'history'

// Curve D — the LEFT billing panel's own dynamic surface (Mua gói / Quản lý
// gói cước / Lịch sử giao dịch). Re-enabled now that the left/right panel
// split and outer themed layer are both confirmed correct.
const SHOW_CURVE_D = true

// Same real feature/pricing data as Mua gói (ads-check-billing-data.ts) —
// no fake/duplicated package data, just the already-purchased view of the
// same 6 features: Control Hub, Quản lý TKQC/BM/Page, Advance Toolkit, Ads Save.
const managedFeatures: BillingFeature[] = [
  controlHubFeature,
  ...assetManagementFeatures,
  ...otherBillingFeatures.filter((feature) => feature.id === 'ads-save'),
]

// Demo-only session rows — enough of them to read as a real populated,
// scrollable list (matching the reference screenshot's density), never
// framed as production data. IPs stay inside the TEST-NET-3 (RFC 5737)
// documentation-only range, never a realistic-looking real address.
const demoSessions = [
  { id: 'DOC-001', ip: '203.0.113.10', browser: 'Chrome · Windows', date: m("ui.0048b6a408"), time: '09:42', active: true },
  { id: 'DOC-002', ip: '203.0.113.24', browser: 'Edge · Windows', date: m("ui.0048b6a408"), time: '08:15', active: false },
  { id: 'DOC-003', ip: '203.0.113.57', browser: 'Chrome · macOS', date: m("ui.47bd3511b2"), time: '21:04', active: false },
  { id: 'DOC-004', ip: '203.0.113.63', browser: 'Safari · macOS', date: m("ui.47bd3511b2"), time: '15:10', active: false },
  { id: 'DOC-005', ip: '203.0.113.71', browser: 'Firefox · Windows', date: m("ui.47bd3511b2"), time: '11:37', active: false },
  { id: 'DOC-006', ip: '203.0.113.88', browser: 'Chrome · Android', date: '20/08/2026', time: '19:52', active: false },
  { id: 'DOC-007', ip: '203.0.113.92', browser: 'Edge · Windows', date: '19/08/2026', time: '14:20', active: false },
  { id: 'DOC-008', ip: '203.0.113.101', browser: 'Chrome · macOS', date: '18/08/2026', time: '10:05', active: false },
  { id: 'DOC-009', ip: '203.0.113.115', browser: 'Safari · iOS', date: '17/08/2026', time: '22:41', active: false },
  { id: 'DOC-010', ip: '203.0.113.128', browser: 'Chrome · Windows', date: '16/08/2026', time: '08:59', active: false },
]


// Demo-only "days remaining" per purchased feature — no real entitlement-
// expiry backend exists yet, purely illustrative to match the reference
// card layout (icon / title / Đã mua / Còn lại xxx ngày / Nâng cấp).
const demoFeatureExpiry: Record<string, number> = {
  'control-hub': 342,
  'ads-account': 298,
  businesses: 275,
  pages: 310,
  'advance-toolkit': 342,
  'ads-save': 256,
}

// Demo-only aggregate stats for the "Phiên đăng nhập Pro" summary card — no
// real session-quota/entitlement backend exists yet, so these follow the
// SAME clearly-illustrative convention as demoSessions/demoTransactions
// above. "used" is derived from the actual demoSessions array (not invented);
// currentIp uses a TEST-NET-3 (RFC 5737) documentation-only address, never a
// realistic-looking real IP.
const demoSessionStats = {
  limit: 100,
  purchasedExtra: 50,
  daysRemaining: 342,
  currentIp: '203.0.113.10',
}

const primaryTabs = [
  { id: 'purchase' as const, label: m("ui.b90857eb2c"), icon: CreditCard },
  { id: 'plans' as const, label: m("ui.7f07e0c141"), icon: PackageCheck },
  { id: 'history' as const, label: m("ui.cb21b1b632"), icon: History },
]

type BillingTabsProps = {
  active: BillingTab
  onChange: (tab: BillingTab) => void
  // Tab-specific controls rendered on the SAME row as the 3 tabs, right-
  // aligned (e.g. Quản lý gói cước's Giftcode/search/filter toolbar) — never
  // a 4th tab, never measured by Curve D (which only ever looks at
  // [role="tab"] buttons).
  trailing?: ReactNode
}

const BillingTabs: FC<BillingTabsProps> = ({ active, onChange, trailing }) => {
  useAppLanguage();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const selectTab = (index: number) => {
    const nextTab = primaryTabs[index]
    onChange(nextTab.id)
    tabRefs.current[index]?.focus()
  }

  return (
    <div className="ads-billing-tabs" role="tablist" aria-label={t("ui.508aad8d01")}>
      {primaryTabs.map(({ id, label, icon: Icon }, index) => (
        <button
          key={id}
          ref={(node) => { tabRefs.current[index] = node }}
          type="button"
          id={`billing-${id}-tab`}
          role="tab"
          aria-selected={active === id}
          aria-controls={`billing-${id}-panel`}
          tabIndex={active === id ? 0 : -1}
          className={active === id ? 'is-active' : ''}
          onClick={() => onChange(id)}
          onKeyDown={(event) => {
            const currentIndex = primaryTabs.findIndex((tab) => tab.id === active)
            if (event.key === 'ArrowRight') { event.preventDefault(); selectTab((currentIndex + 1) % primaryTabs.length) }
            if (event.key === 'ArrowLeft') { event.preventDefault(); selectTab((currentIndex - 1 + primaryTabs.length) % primaryTabs.length) }
            if (event.key === 'Home') { event.preventDefault(); selectTab(0) }
            if (event.key === 'End') { event.preventDefault(); selectTab(primaryTabs.length - 1) }
          }}
        ><Icon size={15} />{tx(label)}</button>
      ))}
      {trailing && <div className="ads-billing-tabs-trailing">{trailing}</div>}
    </div>
  )
}

const CheckoutConfirmationPanel = forwardRef<HTMLHeadingElement, { draft: BillingOrderDraft | null; hidden?: boolean; onBack: () => void }>(({ draft, hidden = false, onBack }, headingRef) => { useAppLanguage(); return (
  <section className="ads-billing-panel ads-billing-checkout-panel" role="region" aria-labelledby="billing-checkout-title" hidden={hidden}>
    <article className="ads-payment-card ads-billing-checkout-card">
      <span className="ads-billing-checkout-icon"><PackageCheck size={28} /></span>
      <h2 id="billing-checkout-title" ref={headingRef} tabIndex={-1}>{t("ui.b6398cc564")}</h2>
      <p>{t("ui.a764899918")}</p>
      {tx(draft ? (
        <div className="ads-billing-checkout-summary">
          <span><strong>{t("ui.0aba562fe0")}</strong><small>{draft.tier === 'pro' ? 'Toolmeta Pro' : 'Priority'} · {draft.months} {" "}{t("ui.6c26ac1223")}{" "}{draft.selectedFeatures} {" "}{t("ui.c8afce04f5")}</small></span>
          <span><strong>{t("ui.e3dbec7ba0")}</strong><small>{draft.paymentMethod}</small></span>
          <span><strong>{t("ui.77cf068a58")}</strong><small>{tx(formatUsd(draft.subtotal))}</small></span>
          <span><strong>{t("ui.664253168e")}</strong><small>{t("ui.c34c242453")}{" "}{Math.round(draft.durationDiscount * 100)}{t("ui.abf1a7fd37")}{" "}{Math.round(draft.couponDiscount * 100)}%</small></span>
          <span><strong>{t("ui.5683b737bf")}</strong><small>{tx(draft.coupon || m("ui.6c82d87383"))}</small></span>
          <span><strong>{t("ui.492d472112")}</strong><small>{tx(formatUsd(draft.total))}</small></span>
        </div>
      ) : (
        <div className="ads-billing-checkout-summary" role="status"><span><strong>{t("ui.11c1245abb")}</strong><small>{t("ui.fb542efdf2")}</small></span></div>
      ))}
      <button type="button" className="ads-billing-checkout-back" onClick={onBack}><ArrowLeft size={17} />{t("ui.e85dc03381")}</button>
    </article>
  </section>
) })

CheckoutConfirmationPanel.displayName = 'CheckoutConfirmationPanel'

type PlanManagementPanelProps = {
  visibleFeatures: BillingFeature[]
  planMessage: string
  setPlanMessage: (message: string) => void
  // Threads the clicked feature through to the parent so a real preselect
  // mechanism can hook in later without another prop-plumbing change; Mua
  // gói itself has no such prop today and this task does not add one.
  onUpgradeContinue: (feature: BillingFeature | null) => void
}

const PlanManagementPanel: FC<PlanManagementPanelProps> = ({ visibleFeatures, planMessage, setPlanMessage, onUpgradeContinue }) => {
  useAppLanguage();
  const { email } = useToolmetaSession()
  const [revokedSessions, setRevokedSessions] = useState<string[]>([])
  // "Nâng cấp" reuses the SAME consent modal as Mua gói (AdsCheckBillingConsentModal) —
  // no duplicate modal. selectedUpgradeFeature is kept only so a future task can
  // continue an upgrade flow for that specific feature; nothing else consumes it yet.
  const [upgradeConsentOpen, setUpgradeConsentOpen] = useState(false)
  const [selectedUpgradeFeature, setSelectedUpgradeFeature] = useState<BillingFeature | null>(null)

  // RIGHT panel — session search + multi-select bulk logout, layered on top
  // of the existing demoSessions/revokedSessions state (no new fake session
  // records, just real client-side filter/select/bulk-revoke over them).
  const [sessionQuery, setSessionQuery] = useState('')
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])

  const openUpgradeConsent = (feature: BillingFeature) => {
    setSelectedUpgradeFeature(feature)
    setUpgradeConsentOpen(true)
  }
  const closeUpgradeConsent = () => setUpgradeConsentOpen(false)
  // Continue → close the modal, then switch the active billing tab to "Mua
  // gói" via the SAME moveToTab mechanism the 3 billing tabs themselves use
  // (passed down as onUpgradeContinue), not a DOM click/route change. Mua
  // gói has no prop today to accept a preselected feature id (its own
  // selectedFeatureIds state is fully internal) — per instruction this does
  // NOT add one; selectedUpgradeFeature is simply left set (not cleared
  // here) so it's still available to wire a real preselect later.
  const continueUpgrade = () => {
    setUpgradeConsentOpen(false)
    onUpgradeContinue(selectedUpgradeFeature)
  }

  const visibleSessions = useMemo(() => {
    if (!email) return []
    const query = sessionQuery.trim().toLowerCase()
    if (!query) return demoSessions
    return demoSessions.filter((session) => session.browser.toLowerCase().includes(query) || session.id.toLowerCase().includes(query) || session.ip.includes(query))
  }, [email, sessionQuery])

  const selectableSessionIds = useMemo(() => email ? demoSessions.filter((session) => !session.active && !revokedSessions.includes(session.id)).map((session) => session.id) : [], [email, revokedSessions])
  const allSelected = selectableSessionIds.length > 0 && selectableSessionIds.every((id) => selectedSessionIds.includes(id))

  const toggleSessionSelected = (id: string) => {
    setSelectedSessionIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
  }
  const toggleSelectAll = () => {
    setSelectedSessionIds(allSelected ? [] : selectableSessionIds)
  }
  const bulkLogout = () => {
    if (selectedSessionIds.length === 0) return
    setRevokedSessions((current) => [...new Set([...current, ...selectedSessionIds])])
    setPlanMessage(m("ui.c30e524750", { 0: selectedSessionIds.length }))
    setSelectedSessionIds([])
  }

  return (
    <section className="ads-billing-panel ads-purchase-panel" id="billing-plans-panel" role="tabpanel" aria-labelledby="billing-plans-tab">
      <div className="ads-purchase-layout">
        {/* LEFT — same box/surface as Mua gói's own .ads-purchase-builder:
            transparent (Curve D shows through), 16px 4-corner radius. */}
        <div className="ads-purchase-builder">
          <div className="ads-billing-plan-cards">
            {visibleFeatures.map((feature) => {
              const Icon = feature.icon
              const accent = featureAccent[feature.id]
              return (
                <article key={feature.id} className="ads-billing-managed-plan">
                  <span className="ads-billing-plan-logo" style={accent}><Icon size={18} /></span>
                  <h3>{tx(feature.title)}</h3>
                  <span className="ads-billing-plan-badge">{t("ui.19ce3eeba0")}</span>
                  <p className="ads-billing-plan-expiry"><CalendarDays size={12} />{t("ui.dac73a26d3")}{" "}{demoFeatureExpiry[feature.id]} {" "}{t("ui.8ccdd04078")}</p>
                  <button type="button" className="ads-billing-plan-upgrade" onClick={() => openUpgradeConsent(feature)}>{t("ui.21e732e8e0")}</button>
                </article>
              )
            })}
            {tx(visibleFeatures.length === 0 && <div className="ads-billing-empty"><Gift size={24} /><p>{t("ui.b7adc31d64")}</p></div>)}
          </div>
          <span className="ads-billing-plan-status" role="status" aria-live="polite">{tx(planMessage)}</span>
        </div>
        {/* RIGHT — same box/surface as Mua gói's own .ads-purchase-summary
            ("Gói của bạn"'s slot), now holding Phiên đăng nhập Pro instead. */}
        <aside className="ads-purchase-summary" aria-labelledby="billing-session-title">
          <div className="ads-billing-session-card">
            <div className="ads-billing-session-header">
              <div className="ads-billing-session-title-group">
                <span className="ads-billing-session-title-icon"><Users size={17} /></span>
                <h2 className="ads-billing-session-title" id="billing-session-title">{t("ui.165f09d4d4")}</h2>
              </div>
            </div>
            <div className="ads-billing-session-summary">
              <div className="ads-billing-session-summary-top"><span>{t("ui.de94eef999")}</span><strong>{email ? `${demoSessions.length}/${demoSessionStats.limit}` : '—'} {" "}{t("ui.1d7b419f66")}</strong></div>
              <div className="ads-billing-session-summary-ip"><span>{t("ui.f555c34c2a")}</span><strong>{email ? demoSessionStats.currentIp : '—'}</strong></div>
              <div className="ads-billing-session-summary-foot">
                <div><span>{t("ui.19ce3eeba0")}</span><strong>{email ? demoSessionStats.purchasedExtra : '—'} {" "}{t("ui.8f0fe24897")}</strong></div>
                <div><span>{t("ui.dac73a26d3")}</span><strong>{email ? demoSessionStats.daysRemaining : '—'} {" "}{t("ui.8ccdd04078")}</strong></div>
              </div>
            </div>
            <small className="ads-billing-session-stats-note">{t("ui.36d8843730")}</small>
            <div className="ads-billing-session-toolbar">
              <label className="ads-billing-session-search">
                <Search size={13} />
                <input type="text" placeholder={t("ui.6e518b7a24")} value={sessionQuery} onChange={(event) => setSessionQuery(event.target.value)} />
              </label>
              <button className="ads-billing-add-session" type="button" onClick={() => onUpgradeContinue(null)}>{t("ui.4502b5651c")}</button>
            </div>
            <div className="ads-billing-session-bulk">
              <label><input type="checkbox" checked={allSelected} disabled={selectableSessionIds.length === 0} onChange={toggleSelectAll} />{t("ui.d14d3f05e9")}</label>
              <button type="button" disabled={selectedSessionIds.length === 0} onClick={bulkLogout}><LogOut size={13} />{t("ui.d513aac0be")}</button>
            </div>
            <div className="ads-billing-session-list">{visibleSessions.map((session) => {
              const revoked = revokedSessions.includes(session.id)
              return (
                <article key={session.id} className={revoked ? 'is-revoked' : session.active ? 'is-current' : ''}>
                  <label className="ads-billing-session-check"><span className="ads-visually-hidden">{t("ui.74f75741ba")}{" "}{session.id}</span><input type="checkbox" checked={selectedSessionIds.includes(session.id)} disabled={session.active || revoked} onChange={() => toggleSessionSelected(session.id)} /></label>
                  <div className="ads-billing-session-id"><strong>{session.ip}</strong><small>{session.browser}</small></div>
                  <div className="ads-billing-session-time"><strong>{tx(session.date)}</strong><small>{tx(session.time)}</small></div>
                </article>
              )
            })}</div>
          </div>
        </aside>
      </div>
      {upgradeConsentOpen && <AdsCheckBillingConsentModal onClose={closeUpgradeConsent} onContinue={continueUpgrade} />}
    </section>
  )
}

const noTransactions: BillingTransaction[] = []

export const AdsCheckBillingPage: FC = () => {
  const { email, openAuth } = useToolmetaSession()
  const surfaceId = useId()
  useAppLanguage();
  const [activeTab, setActiveTab] = useState<BillingTab>('purchase')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [orderDraft, setOrderDraft] = useState<BillingOrderDraft | null>(null)
  const checkoutHeadingRef = useRef<HTMLHeadingElement>(null)
  const checkoutTriggerRef = useRef<HTMLElement | null>(null)
  const workspaceFrameRef = useRef<HTMLDivElement>(null)

  // Quản lý gói cước's toolbar (Giftcode trigger / search / filter) — lifted
  // up here (out of PlanManagementPanel) so it renders on the SAME row as
  // the 3 billing tabs instead of inside the LEFT panel content.
  const [planMessage, setPlanMessage] = useState('')
  const [giftcodeModalOpen, setGiftcodeModalOpen] = useState(false)
  const [featureQuery, setFeatureQuery] = useState('')
  // "Hạn sử dụng" is real — derived from each feature's own demoFeatureExpiry
  // (active = daysRemaining > 0; every current demo feature is active, so
  // "Đã hết hạn" correctly shows an empty grid rather than fabricated rows).
  // "Chức năng" (nguồn: Mua gói / Giftcode) has no such metadata anywhere on
  // BillingFeature — the selection UI below is fully functional and updates
  // immediately, but per instruction it does not invent a source tag just to
  // make the filter appear to change results.
  const [usageStatus, setUsageStatus] = useState<BillingFilterUsageStatus>('all')
  const [source, setSource] = useState<BillingFilterSource>('all')

  const visiblePlanFeatures = useMemo(() => {
    if (!email) return []
    const query = featureQuery.trim().toLowerCase()
    return managedFeatures.filter((feature) => {
      if (query && !feature.title.toLowerCase().includes(query)) return false
      if (usageStatus === 'all') return true
      const isActive = (demoFeatureExpiry[feature.id] ?? 0) > 0
      return usageStatus === 'active' ? isActive : !isActive
    })
  }, [email, featureQuery, usageStatus])

  const planToolbar = (
    <div className="ads-billing-plan-toolbar">
      <button type="button" className="ads-billing-giftcode-trigger" onClick={() => email ? setGiftcodeModalOpen(true) : openAuth()}>
        <Gift size={13} />{t("ui.51676257d0")}{" "}</button>
      <label className="ads-billing-plan-search">
        <Search size={13} />
        <input type="text" placeholder={t("ui.4556841a2b")} value={featureQuery} onChange={(event) => setFeatureQuery(event.target.value)} />
      </label>
      <AdsCheckBillingFilterMenu usageStatus={usageStatus} onUsageStatusChange={setUsageStatus} source={source} onSourceChange={setSource} />
    </div>
  )

  // Lịch sử giao dịch's toolbar (Filter/Toàn thời gian/Search) — same
  // "render in the shared tabs row via `trailing`" mechanism as Quản lý gói
  // cước's own toolbar above. It owns all 3 filter states itself and
  // reports the combined result up via setHistoryRows (a stable useState
  // setter), since the toolbar (tabs row) and the table (content area
  // below Curve D) are two separate DOM subtrees.
  const [historyRows, setHistoryRows] = useState<BillingTransaction[]>([])
  const historyToolbar = <AdsCheckBillingHistoryToolbar transactions={email ? demoTransactions : noTransactions} onFilteredChange={setHistoryRows} />

  // Curve D — production-verified fallback (Mua gói/first-tab shape at a
  // plausible default size) shown only until the first live measurement.
  const [workspaceSurface, setWorkspaceSurface] = useState(() => ({
    width: 624.84375,
    height: 1204,
    path: buildBillingWorkspacePath({ frameWidth: 624.84375, frameHeight: 1204, tabRowHeight: 52, activeTabRect: { left: 8, right: 100 }, lastTabRight: 590, tabPosition: 'first' }),
  }))

  useLayoutEffect(() => {
    const frame = workspaceFrameRef.current
    const nav = frame?.querySelector<HTMLElement>('.ads-billing-tabs')
    if (!frame || !nav) return
    const recompute = () => {
      const frameRect = frame.getBoundingClientRect()
      if (frameRect.width === 0 || frameRect.height === 0) return
      const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      const activeIndex = buttons.findIndex((button) => button.getAttribute('aria-selected') === 'true')
      const activeButton = buttons[activeIndex]
      if (!activeButton) return
      const buttonRect = activeButton.getBoundingClientRect()
      const lastButtonRect = buttons[buttons.length - 1].getBoundingClientRect()
      const navRect = nav.getBoundingClientRect()
      // Curve D belongs to the LEFT panel only — it must terminate before
      // the RIGHT panel ("Gói của bạn" on Mua gói, "Phiên đăng nhập Pro" on
      // Quản lý gói cước), never span the full workspace width.
      // `.ads-purchase-builder` is each tab's own LEFT-panel element — BOTH
      // Mua gói and Quản lý gói cước now render one (see PlanManagementPanel),
      // so the query is scoped to the currently VISIBLE tab content wrapper
      // only; otherwise querySelector would always return the 'purchase'
      // tab's builder (first in DOM order) even while a different tab is
      // active and that one is [hidden]. Falls back to the frame's own
      // width when there's no competing right column to avoid (Lịch sử
      // giao dịch has none; the checkout-confirmation card is single-column too).
      const leftPanel = frame.querySelector<HTMLElement>('.ads-billing-workspace-content:not([hidden]) .ads-purchase-builder')
      const leftPanelRect = leftPanel?.getBoundingClientRect()
      const frameWidth = leftPanelRect && leftPanelRect.width > 0 ? leftPanelRect.width : frameRect.width
      // Share actual panel width with the action row; percentage estimates drift
      // when the summary column hits its minimum width.
      frame.style.setProperty('--billing-action-width', `${frameWidth}px`)
      const available = frameWidth - (lastButtonRect.right - frameRect.left) - 76
      const progress = frame.querySelector<HTMLElement>('.ads-billing-workspace-content:not([hidden]) .ads-purchase-progress')
      frame.toggleAttribute('data-progress-below', !!progress && progress.scrollWidth > available)
      const toolbar = nav.querySelector<HTMLElement>('.ads-billing-plan-toolbar')
      const toolbarMinimum = toolbar ? Array.from(toolbar.children).reduce((total, child) => {
        const control = child as HTMLElement
        return total + (control.matches('.ads-billing-plan-search') ? 100 : control.getBoundingClientRect().width) + 6
      }, 0) : 0
      frame.toggleAttribute('data-toolbar-below', toolbarMinimum > available)
      const tabPosition: BillingWorkspaceTabPosition = activeIndex === 0 ? 'first' : activeIndex === buttons.length - 1 ? 'last' : 'middle'
      const path = buildBillingWorkspacePath({
        frameWidth,
        frameHeight: frameRect.height,
        tabRowHeight: navRect.height,
        activeTabRect: { left: buttonRect.left - frameRect.left, right: buttonRect.right - frameRect.left },
        lastTabRight: lastButtonRect.right - frameRect.left,
        tabPosition,
      })
      setWorkspaceSurface({ width: frameWidth, height: frameRect.height, path })
    }
    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(frame)
    observer.observe(nav)
    nav.querySelectorAll('[role="tab"], .ads-billing-plan-toolbar, .ads-billing-plan-toolbar > *').forEach((element) => observer.observe(element))
    frame.querySelectorAll('.ads-purchase-builder, .ads-purchase-progress').forEach((element) => observer.observe(element))
    window.addEventListener('resize', recompute)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', recompute)
    }
  }, [activeTab, checkoutOpen])

  const moveToTab = (nextTab: BillingTab) => {
    setActiveTab(nextTab)
    setCheckoutOpen(false)
    window.requestAnimationFrame(() => document.getElementById(`billing-${nextTab}-tab`)?.focus())
  }

  const openCheckout = (draft?: BillingOrderDraft) => {
    if (!email) { openAuth(); return }
    checkoutTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (draft) setOrderDraft(draft)
    setActiveTab('purchase')
    setCheckoutOpen(true)
    window.requestAnimationFrame(() => checkoutHeadingRef.current?.focus())
  }

  const returnToPurchase = () => {
    setCheckoutOpen(false)
    window.requestAnimationFrame(() => {
      const trigger = checkoutTriggerRef.current
      if (trigger?.isConnected) trigger.focus()
      else document.getElementById('billing-purchase-tab')?.focus()
    })
  }

  return (
    <AdsCheckProductShell activeNavigation="billing">
      <div className="ads-payment-page ads-billing-page" id="ads-billing-main">
        <h1 className="ads-visually-hidden">{t("ui.8f4bb51027")}</h1>
        <div ref={workspaceFrameRef} className="ads-billing-workspace-frame">
          {/* Curve D — LEFT panel's own dynamic surface. Sized (inline
              width/height below, from workspaceSurface — not CSS 100%) to
              .ads-purchase-builder's own measured width, so it never spans
              behind "Gói của bạn". Renders BEFORE the tabs/content in DOM
              order and stays z-index:0 (see CSS) so it paints as their
              background, never on top. */}
          {tx(SHOW_CURVE_D && (
            <svg
              className="ads-billing-workspace-surface"
              aria-hidden="true"
              focusable="false"
              viewBox={`0 0 ${workspaceSurface.width} ${workspaceSurface.height}`}
              preserveAspectRatio="none"
              style={{ width: workspaceSurface.width, height: workspaceSurface.height }}
            >
              <defs>
                {/* Same wash gradient/stops (and same --cv-workspace-wash-*
                    tokens) already used by Curve B, so V1–V5 behave
                    identically here without a separate theme system. */}
                <linearGradient id={surfaceId + "-wash"} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--cv-workspace-wash-strong, rgba(77, 255, 127, 0.06))" />
                  <stop offset="0.519231" stopColor="var(--cv-workspace-wash-soft, rgba(77, 255, 127, 0.02))" />
                  <stop offset="1" stopColor="var(--cv-workspace-wash-strong, rgba(77, 255, 127, 0.06))" />
                </linearGradient>
              </defs>
              <path d={workspaceSurface.path} fill="rgba(255, 255, 255, 0.95)" />
              <path d={workspaceSurface.path} fill={`url(#${surfaceId}-wash)`} />
              {/* Third layer, matching production's 3-path structure. No
                  texture asset/pattern exists anywhere in this project yet
                  (checked before implementing) — kept transparent as a
                  structural placeholder rather than inventing one. */}
              <path d={workspaceSurface.path} fill="transparent" />
            </svg>
          ))}
          {SHOW_CURVE_D && <svg className="ads-billing-curve-neon" aria-hidden="true" focusable="false"
            viewBox={'0 0 ' + workspaceSurface.width + ' ' + workspaceSurface.height}
            preserveAspectRatio="none" style={{ width: workspaceSurface.width, height: workspaceSurface.height }}>
            <AdsCheckCurveNeon path={workspaceSurface.path.replace(/^M0 [^ ]+ V([^ ]+) /, 'M0 $1 ').split(' V')[0]} curve="d" runnerLength={4} runnerWidth={1.5} />
          </svg>}
          <BillingTabs active={activeTab} onChange={moveToTab} trailing={activeTab === 'plans' ? planToolbar : activeTab === 'history' ? historyToolbar : undefined} />
          <div id="billing-purchase-panel" className="ads-billing-workspace-content" role="tabpanel" aria-labelledby="billing-purchase-tab" hidden={activeTab !== 'purchase'}>
            <AdsCheckBillingPurchasePanel hidden={checkoutOpen} onCheckout={openCheckout} />
            <CheckoutConfirmationPanel ref={checkoutHeadingRef} draft={orderDraft} hidden={!checkoutOpen} onBack={returnToPurchase} />
          </div>
          <div className="ads-billing-workspace-content" hidden={activeTab !== 'plans'}><PlanManagementPanel visibleFeatures={visiblePlanFeatures} planMessage={planMessage} setPlanMessage={setPlanMessage} onUpgradeContinue={() => moveToTab('purchase')} /></div>
          <div className="ads-billing-workspace-content" hidden={activeTab !== 'history'}><AdsCheckBillingHistoryPanel rows={historyRows} onNavigateToPurchase={() => moveToTab('purchase')} /></div>
        </div>
      </div>
      {giftcodeModalOpen && <AdsCheckBillingGiftcodeModal onClose={() => setGiftcodeModalOpen(false)} />}
    </AdsCheckProductShell>
  )
}

export default AdsCheckBillingPage
