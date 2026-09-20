import { m, useAppLanguage, t, tx } from '@/i18n'
import { ArrowRight, Bell, ChevronDown, Clock3, FileCheck2, LayoutDashboard, Menu, Moon, Search, Sun, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Drawer } from '@/components/ui/drawer'
import { employees } from '@/mocks/hrm-data'
import { canAccessEmployee, canAccessOpsTask, canAccessPeopleDocument, type AppRole, useAppStore } from '@/store/app-store'

const labels: Record<string, string> = {
  '/': m("ui.286a38e3d5"), '/hr-center': m("ui.3986b1b6f5"), '/work-inbox': m("ui.98dadd9a2b"), '/documents': m("ui.ceb1edc8de"), '/org-chart': m("ui.964624eb86"), '/employees': m("ui.7fdc3a2e46"),
  '/departments': m("ui.2683b99c77"), '/approvals': m("ui.f0c038e950"), '/attendance': m("ui.fc355fff83"),
  '/payroll': m("ui.e7c98a24dd"), '/settings': m("ui.01f3f39ff2"), '/styleguide': 'Styleguide',
}
const roleLabels: Record<AppRole, string> = {
  ceo: 'CEO', senior_manager: m("ui.320c0d21d7"), leader: 'Leader', hr: m("ui.20e40a6f80"), accountant: 'KT', staff: m("ui.14ddd70d25"),
}
const managerRoles: AppRole[] = ['ceo', 'senior_manager', 'leader', 'hr']
const moduleResults: Array<{ label: string; meta: string; path: string; roles: AppRole[] }> = [
  { label: m("ui.3986b1b6f5"), meta: m("ui.a437f9a4e3"), path: '/hr-center', roles: managerRoles },
  { label: m("ui.98dadd9a2b"), meta: m("ui.e5a5a6b1f9"), path: '/work-inbox', roles: managerRoles },
  { label: m("ui.ceb1edc8de"), meta: m("ui.9ec3f113b6"), path: '/documents', roles: ['ceo', 'senior_manager', 'hr', 'accountant'] },
  { label: m("ui.f0c038e950"), meta: m("ui.350391fdfe"), path: '/approvals', roles: [...managerRoles, 'staff'] },
  { label: m("ui.b4d20486e1"), meta: m("ui.e6de1e4153"), path: '/attendance', roles: ['ceo', 'senior_manager', 'leader', 'hr', 'accountant'] },
  { label: m("ui.e7c98a24dd"), meta: m("ui.8d856835a9"), path: '/payroll', roles: ['ceo', 'hr', 'accountant', 'staff'] },
]
const notifications: Array<{ icon: typeof FileCheck2; title: string; meta: string; time: string; path: string; roles: AppRole[] }> = [
  { icon: FileCheck2, title: m("ui.b10321a48e"), meta: m("ui.7fdb128b91"), time: m("ui.3ced348d06"), path: '/approvals', roles: managerRoles },
  { icon: FileCheck2, title: m("ui.01ef8caeaa"), meta: m("ui.c59da04ab8"), time: m("ui.0048b6a408"), path: '/approvals', roles: ['staff'] },
  { icon: UserRound, title: m("ui.112dc5dc71"), meta: m("ui.54cb40a020"), time: m("ui.1937949d87"), path: '/work-inbox', roles: managerRoles },
  { icon: Clock3, title: m("ui.3a1de0bd58"), meta: m("ui.29b58d485c"), time: m("ui.0048b6a408"), path: '/attendance', roles: ['ceo', 'senior_manager', 'leader', 'hr', 'accountant'] },
]

export function Header() {
  useAppLanguage();
  const location = useLocation()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState<'search' | 'notifications' | null>(null)
  const [query, setQuery] = useState('')
  const [hasUnread, setHasUnread] = useState(true)
  const { role, setRole, theme, toggleTheme, setSidebarOpen, showToast } = useAppStore()
  const createdEmployees = useAppStore((state) => state.createdEmployees)
  const opsTasks = useAppStore((state) => state.opsTasks)
  const peopleDocuments = useAppStore((state) => state.peopleDocuments)
  const page = labels[location.pathname] ?? (location.pathname.startsWith('/employees/') ? m("ui.56a31d8a7e") : 'Fun Agency')
  const changeRole = (next: AppRole) => { setRole(next); showToast(m("ui.cfbfb0af31", { 0: roleLabels[next] })) }
  const employeeResults = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const searchableEmployees = [...createdEmployees, ...employees].filter((employee) => canAccessEmployee(role, employee))
    if (!normalized) return searchableEmployees.slice(0, 5)
    return searchableEmployees.filter((employee) => `${employee.fullName} ${employee.code} ${employee.positionTitle}`.toLowerCase().includes(normalized)).slice(0, 6)
  }, [createdEmployees, query, role])
  const matchingModules = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const openTasks = opsTasks.filter((task) => canAccessOpsTask(role, task) && task.status !== 'done').length
    const pendingDocuments = peopleDocuments.filter((document) => canAccessPeopleDocument(role, document) && ['waiting', 'expiring'].includes(document.status)).length
    return moduleResults.filter((item) => item.roles.includes(role)).map((item) => item.path === '/work-inbox' ? { ...item, meta: m("ui.761af559a3", { 0: openTasks }) } : item.path === '/documents' ? { ...item, meta: m("ui.52bdb38c68", { 0: pendingDocuments }) } : item.path === '/approvals' && role === 'staff' ? { ...item, label: m("ui.45ed57801e"), meta: m("ui.86e436a2f1") } : item).filter((item) => !normalized || `${item.label} ${item.meta}`.toLowerCase().includes(normalized)).slice(0, 4)
  }, [opsTasks, peopleDocuments, query, role])
  const visibleNotifications = useMemo(() => notifications.filter((notification) => notification.roles.includes(role)).map((notification) => notification.path === '/work-inbox' ? { ...notification, title: m("ui.61a66ffed3", { 0: opsTasks.filter((task) => canAccessOpsTask(role, task) && task.status !== 'done' && task.title.toLocaleLowerCase('vi').includes('thử việc')).length }) } : notification), [opsTasks, role])
  const alertFingerprint = `${opsTasks.map((task) => `${task.id}:${task.status}:${task.owner}`).join('|')}::${peopleDocuments.map((document) => `${document.id}:${document.status}:${document.updatedAt}`).join('|')}`
  const previousAlertFingerprint = useRef(alertFingerprint)
  useEffect(() => {
    if (previousAlertFingerprint.current !== alertFingerprint) setHasUnread(true)
    previousAlertFingerprint.current = alertFingerprint
  }, [alertFingerprint])
  const goTo = (path: string) => { navigate(path); setDrawer(null); setQuery('') }
  const submitSearch = (event: FormEvent) => { event.preventDefault(); setDrawer('search') }

  return <>
    <header className="app-header">
      <div className="header-context">
        <button className="icon-action mobile-only" onClick={() => setSidebarOpen(true)} aria-label={t("ui.23e29182f4")}><Menu size={21}/></button>
        <div><span>{t("ui.4697e7e146")}</span><strong>{page}</strong></div>
      </div>
      <div className="header-actions">
        <form className="header-search desktop-only" onSubmit={submitSearch}><Search size={16}/><input aria-label={t("ui.8b7147fb02")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("ui.19c847a528")}/><button type="submit" aria-label={t("ui.160cc9a2f3")}><ArrowRight size={15}/></button></form>
        <button className="icon-action mobile-only" onClick={() => setDrawer('search')} aria-label={t("ui.6671928637")}><Search size={18}/></button>
        <label className="role-switcher"><span className="desktop-only">{t("ui.3aa6f85583")}</span><select aria-label={t("ui.951d256b1a")} value={role} onChange={(event) => changeRole(event.target.value as AppRole)}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{tx(label)}</option>)}</select><ChevronDown size={14} aria-hidden="true"/></label>
        <button className="icon-action theme-toggle" onClick={toggleTheme} aria-label={tx(theme === 'dark' ? m("ui.397d64f155") : m("ui.7e1a30e49f"))}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
        <button className="icon-action notification" onClick={() => setDrawer('notifications')} aria-label={tx(hasUnread && visibleNotifications.length ? m("ui.4273eff867", { 0: visibleNotifications.length }) : m("ui.5d6af377c2"))}><Bell size={18}/>{hasUnread && visibleNotifications.length > 0 && <i/>}</button>
        <div className="header-avatar" title="Fun Agency">{t("ui.c919853c89")}</div>
      </div>
    </header>
    <Drawer open={drawer === 'search'} onClose={() => setDrawer(null)} title={t("ui.5bb8218108")} description={t("ui.5115405fee")} width="md">
      <label className="global-search-field"><Search size={18}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("ui.0e608b03c0")}/></label>
      <div className="global-search-section"><span className="drawer-eyebrow">{t("ui.786a4ad08c")}{" "}{employeeResults.length} {" "}{t("ui.60e1350df1")}</span>{employeeResults.map((employee) => <button className="global-result" key={employee.id} onClick={() => goTo(`/employees/${employee.id}`)}><img src={employee.avatarUrl} alt=""/><span><strong>{employee.fullName}</strong><small>{employee.code} · {tx(employee.positionTitle)}</small></span></button>)}{tx(!employeeResults.length && <div className="drawer-empty"><strong>{t("ui.3074ab66f9")}</strong><span>{t("ui.e2d61f30d0")}</span></div>)}</div>
      {tx(matchingModules.length > 0 && <div className="global-search-section"><span className="drawer-eyebrow">{t("ui.d4ee3205bb")}</span>{tx(matchingModules.map((item) => <button className="global-result" key={item.path} onClick={() => goTo(item.path)}><span className="result-icon"><LayoutDashboard size={17}/></span><span><strong>{tx(item.label)}</strong><small>{item.meta}</small></span></button>))}</div>)}
    </Drawer>
    <Drawer open={drawer === 'notifications'} onClose={() => setDrawer(null)} title={t("ui.5d6af377c2")} description={t("ui.0b6f973603")} width="sm">
      <div className="notification-list">{tx(visibleNotifications.map(({ icon: Icon, title, meta, time, path }) => <button key={`${path}-${title}`} onClick={() => goTo(path)}><span className="result-icon"><Icon size={18}/></span><span><strong>{tx(title)}</strong><small>{meta}</small><em>{tx(time)}</em></span></button>))}{tx(!visibleNotifications.length && <div className="drawer-empty"><strong>{t("ui.7c4dc3f5c2")}</strong><span>{t("ui.f3dc9e705c")}</span></div>)}</div><button className="btn btn-secondary drawer-full-action" disabled={!hasUnread || !visibleNotifications.length} onClick={() => { setHasUnread(false); showToast(m("ui.500f3d906b")); setDrawer(null) }}>{tx(hasUnread ? m("ui.55408d1a97") : m("ui.e512ac9c5e"))}</button>
    </Drawer>
  </>
}
