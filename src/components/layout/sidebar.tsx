import { m, useAppLanguage, t, tx } from '@/i18n'
import { BadgeDollarSign, Building2, CalendarClock, CalendarDays, ChartNoAxesCombined, ClipboardCheck, ContactRound, FileSignature, LayoutDashboard, ListTodo, Network, Settings2, UsersRound, X, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { getEffectiveApprovalRequests, getPendingApprovalCount } from '@/features/approvals/approval-data'
import { canAccessOpsTask, demoViewerEmployeeId, type AppRole, useAppStore } from '@/store/app-store'

type NavItem = { to: string; label: string; icon: LucideIcon; roles?: AppRole[]; count?: 'approvals' | 'work' }
const managers: AppRole[] = ['ceo', 'senior_manager', 'leader', 'hr']
const navItems: NavItem[] = [
  { to: '/', label: m("ui.286a38e3d5"), icon: ChartNoAxesCombined },
  { to: '/hr-center', label: m("ui.3986b1b6f5"), icon: LayoutDashboard, roles: managers },
  { to: '/work-inbox', label: m("ui.98dadd9a2b"), icon: ListTodo, roles: managers, count: 'work' },
  { to: '/documents', label: m("ui.59d172137b"), icon: FileSignature, roles: ['ceo', 'senior_manager', 'hr', 'accountant'] },
  { to: '/org-chart', label: m("ui.964624eb86"), icon: Network },
  { to: '/employees', label: m("ui.f3d81e4e1b"), icon: UsersRound, roles: ['ceo', 'senior_manager', 'leader', 'hr', 'staff'] },
  { to: '/departments', label: m("ui.2683b99c77"), icon: Building2 },
  { to: '/approvals', label: m("ui.51d387b58c"), icon: ClipboardCheck, roles: [...managers, 'staff'], count: 'approvals' },
  { to: '/attendance', label: m("ui.fc355fff83"), icon: CalendarClock, roles: ['ceo', 'senior_manager', 'leader', 'hr', 'accountant'] },
  { to: '/payroll', label: m("ui.e7c98a24dd"), icon: BadgeDollarSign, roles: ['ceo', 'hr', 'accountant', 'staff'] },
  { to: '/settings', label: m("ui.01f3f39ff2"), icon: Settings2, roles: ['ceo', 'hr'] },
]

export function Sidebar() {
  useAppLanguage();
  const { sidebarOpen, setSidebarOpen, role, approvalActions, selfServiceRequests, opsTasks } = useAppStore()
  const closeRef = useRef<HTMLButtonElement>(null)
  const pendingApprovals = role === 'staff' ? getEffectiveApprovalRequests(approvalActions, selfServiceRequests).filter((request) => request.requesterId === demoViewerEmployeeId && request.id.startsWith('self-') && request.status === 'pending').length : getPendingApprovalCount(role, approvalActions, selfServiceRequests)
  const pendingWork = opsTasks.filter((task) => canAccessOpsTask(role, task) && task.status !== 'done').length
  useEffect(() => {
    if (!sidebarOpen) return
    closeRef.current?.focus()
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSidebarOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [sidebarOpen, setSidebarOpen])
  return <>
    <button className={`sidebar-scrim ${sidebarOpen ? 'visible' : ''}`} aria-label={t("ui.ef10b4f036")} tabIndex={sidebarOpen ? 0 : -1} onClick={() => setSidebarOpen(false)}/>
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label={t("ui.f03700cd5e")}><div className="brand-row"><div className="brand-mark" aria-hidden="true"><ContactRound size={19}/></div><div className="brand-copy"><strong>{t("ui.4697e7e146")}</strong><span>{t("ui.112e141e49")}</span></div><button ref={closeRef} className="icon-action mobile-only" onClick={() => setSidebarOpen(false)} aria-label={t("ui.ef10b4f036")}><X size={20}/></button></div><div className="nav-label">{t("ui.0a3511c50c")}</div><nav>{tx(navItems.filter((item) => !item.roles || item.roles.includes(role)).map(({ to, label, icon: Icon, count }) => { const destination = role === 'staff' && to === '/employees' ? `/employees/${demoViewerEmployeeId}` : to; const visibleLabel = role === 'staff' && to === '/employees' ? m("ui.fc70cfcb0a") : role === 'staff' && to === '/approvals' ? m("ui.45ed57801e") : label; return <NavLink key={to} to={destination} end={to === '/'} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={18} strokeWidth={1.8}/><span>{tx(visibleLabel)}</span>{count === 'approvals' && pendingApprovals > 0 ? <b>{pendingApprovals}</b> : count === 'work' && pendingWork > 0 ? <b>{pendingWork}</b> : null}</NavLink>}))}</nav><div className="sidebar-foot"><CalendarDays size={17}/><div><strong>{t("ui.7667584bf8")}</strong><span>{t("ui.519985db68")}</span></div></div></aside>
  </>
}
