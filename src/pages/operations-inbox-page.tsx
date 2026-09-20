import { AlarmClock, CheckCircle2, CircleAlert, ClipboardPlus, FileClock, Fingerprint, ListChecks, LockKeyhole, UserRoundCheck } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Modal } from '@/components/ui/modal'
import { TaskDetail } from '@/features/operations-inbox/task-detail'
import { formatTaskDue, getTaskSla, isTaskDueToday } from '@/lib/people-ops'
import { employees } from '@/mocks/hrm-data'
import { canAccessOpsTask, canEditOpsTaskOwner, canManageHrCenter, useAppStore } from '@/store/app-store'
import type { OpsTask, OpsTaskCategory } from '@/types/people-ops'

type TaskFilter = 'active' | 'urgent' | 'today' | 'blocked' | 'done'
const filters: Array<{ id: TaskFilter; label: string }> = [{ id: 'active', label: 'Đang mở' }, { id: 'urgent', label: 'Khẩn cấp' }, { id: 'today', label: 'Hôm nay' }, { id: 'blocked', label: 'Đang chờ' }, { id: 'done', label: 'Đã xong' }]
const categoryLabels: Record<OpsTaskCategory, string> = { onboarding: 'Onboarding', contract: 'Hợp đồng', attendance: 'Chấm công', approval: 'Phê duyệt', offboarding: 'Offboarding' }
const categoryIcons = { onboarding: Fingerprint, contract: FileClock, attendance: AlarmClock, approval: UserRoundCheck, offboarding: ListChecks }

export default function OperationsInboxPage() {
  const role = useAppStore((state) => state.role)
  const tasks = useAppStore((state) => state.opsTasks)
  const addTask = useAppStore((state) => state.addOpsTask)
  const updateTask = useAppStore((state) => state.updateOpsTask)
  const createdEmployees = useAppStore((state) => state.createdEmployees)
  const showToast = useAppStore((state) => state.showToast)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState<TaskFilter>('active')
  const [selectedId, setSelectedId] = useState(searchParams.get('task') ?? 'ops-001')
  const [createOpen, setCreateOpen] = useState(false)
  const [clock, setClock] = useState(Date.now())
  const [draft, setDraft] = useState({ title: '', employeeId: 'emp-001', category: 'onboarding' as OpsTaskCategory, owner: 'Vận hành', due: '2026-08-28', priority: 'normal' as OpsTask['priority'] })
  const employeeOptions = [...createdEmployees, ...employees]
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 60_000); return () => window.clearInterval(timer) }, [])

  const scopedTasks = useMemo(() => tasks.filter((task) => canAccessOpsTask(role, task)), [role, tasks])
  const visible = useMemo(() => scopedTasks.filter((task) => filter === 'active' ? task.status !== 'done' : filter === 'urgent' ? task.priority === 'urgent' && task.status !== 'done' : filter === 'today' ? isTaskDueToday(task, new Date(clock)) && task.status !== 'done' : filter === 'blocked' ? task.status === 'blocked' : task.status === 'done'), [clock, filter, scopedTasks])
  const selected = visible.find((task) => task.id === selectedId) ?? visible[0] ?? null
  const metrics = { urgent: scopedTasks.filter((task) => task.priority === 'urgent' && task.status !== 'done').length, today: scopedTasks.filter((task) => isTaskDueToday(task, new Date(clock)) && task.status !== 'done').length, blocked: scopedTasks.filter((task) => task.status === 'blocked').length, done: scopedTasks.filter((task) => task.status === 'done').length }
  const selectTask = (id: string) => {
    setSelectedId(id)
    if (window.innerWidth >= 768) return
    window.requestAnimationFrame(() => {
      const detail = document.getElementById('ops-task-detail')
      detail?.focus({ preventScroll: true })
      detail?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    })
  }

  if (!canManageHrCenter(role)) return <section className="surface permission-state"><div><LockKeyhole size={28}/></div><h1>Không có quyền vào Hộp việc HR</h1><p>Phân hệ này dành cho CEO, Quản lý, Leader và Vận hành.</p></section>
  const complete = (task: OpsTask) => { updateTask(task.id, { status: 'done', progress: 100 }); showToast(`Đã hoàn tất: ${task.title}`) }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const title = draft.title.trim()
    const employee = employeeOptions.find((item) => item.id === draft.employeeId)
    if (!title || !employee || !draft.due) { showToast('Nhập tên việc, nhân sự và hạn xử lý'); return }
    const owner = role === 'leader' ? 'Leader trực tiếp' : draft.owner
    const task: OpsTask = { id: `ops-${Date.now()}`, employeeId: employee.id, title, subject: employee.fullName, category: draft.category, owner, dueDate: `${draft.due}T17:30:00+07:00`, priority: draft.priority, status: 'open', progress: 0, description: 'Tác vụ được tạo trực tiếp từ Hộp việc HR.', sourcePath: `/employees/${employee.id}` }
    addTask(task); setSelectedId(task.id); setFilter('active'); setCreateOpen(false); setDraft({ title: '', employeeId: 'emp-001', category: 'onboarding', owner: 'Vận hành', due: '2026-08-28', priority: 'normal' }); showToast(`Đã tạo việc cho ${task.subject}`)
  }

  return <>
    <div className="page-heading ops-page-heading"><div><span className="page-eyebrow">FUN AGENCY · OPERATIONS INBOX</span><h1>Hộp việc nhân sự</h1><p>Mọi việc cần xử lý, người chịu trách nhiệm và SLA trong một màn hình.</p></div><button className="btn btn-primary" onClick={() => setCreateOpen(true)}><ClipboardPlus size={16}/>Tạo việc mới</button></div>
    <section className="ops-command-strip" aria-label="Sức khỏe hàng đợi"><div className="ops-command-intro"><span className="ops-live-dot"/><div><strong>Nhịp vận hành hôm nay</strong><small>Ưu tiên việc quá hạn trước 14:00</small></div></div><OpsMetric icon={CircleAlert} label="Khẩn cấp" value={metrics.urgent} tone="danger"/><OpsMetric icon={AlarmClock} label="Đến hạn hôm nay" value={metrics.today} tone="warning"/><OpsMetric icon={ListChecks} label="Đang chờ" value={metrics.blocked} tone="blue"/><OpsMetric icon={CheckCircle2} label="Đã xong" value={metrics.done} tone="success"/></section>
    <div className="ops-inbox-layout"><section className="surface ops-worklist"><div className="ops-worklist-head"><div><h2>Hàng đợi xử lý</h2><span>{visible.length} việc trong bộ lọc</span></div><div className="segmented-control ops-filters" aria-label="Lọc hộp việc">{filters.map((item) => <button key={item.id} className={filter === item.id ? 'active' : ''} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div></div><div className="ops-task-list">{visible.map((task) => { const Icon = categoryIcons[task.category]; const sla = getTaskSla(task); return <button key={task.id} className={`ops-task-row ${selected?.id === task.id ? 'active' : ''}`} aria-pressed={selected?.id === task.id} onClick={() => selectTask(task.id)}><span className={`ops-category-icon category-${task.category}`}><Icon size={18}/></span><span className="ops-task-copy"><span><strong>{task.title}</strong><i className={`ops-priority priority-${task.priority}`}>{task.priority === 'urgent' ? 'Khẩn' : task.priority === 'high' ? 'Cao' : 'Thường'}</i></span><small>{task.subject} · {categoryLabels[task.category]}</small></span><span className="ops-task-owner"><strong>{task.owner}</strong><small>{formatTaskDue(task.dueDate)}</small></span><span className={`ops-sla ${sla.startsWith('Quá hạn') ? 'overdue' : ''}`}>{sla}</span></button> })}{!visible.length && <div className="ops-empty"><CheckCircle2 size={28}/><strong>Không còn việc trong bộ lọc này</strong><span>Chuyển bộ lọc hoặc tạo một việc mới.</span></div>}</div></section>{selected && <TaskDetail task={selected} canEditOwner={canEditOpsTaskOwner(role)} onComplete={() => complete(selected)} onUnblock={() => { updateTask(selected.id, { status: 'open', progress: Math.max(50, selected.progress) }); showToast('Đã đưa việc trở lại hàng đợi') }} onOpenSource={() => navigate(selected.sourcePath)} onOwnerChange={(owner) => { updateTask(selected.id, { owner }); showToast(`Đã giao cho ${owner}`) }}/>}</div>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo việc nhân sự" description="Việc mới sẽ xuất hiện ngay trong hàng đợi chung." footer={<><button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Hủy</button><button className="btn btn-primary" form="create-ops-task" type="submit">Tạo và giao việc</button></>}><form id="create-ops-task" className="form-grid" onSubmit={submit}><label className="field full-span"><span>Tên việc *</span><input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ví dụ: Hoàn tất đánh giá thử việc"/></label><label className="field"><span>Nhân sự liên quan *</span><select required value={draft.employeeId} onChange={(event) => setDraft({ ...draft, employeeId: event.target.value })}>{employeeOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.code} · {employee.fullName}</option>)}</select></label><label className="field"><span>Loại việc</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as OpsTaskCategory })}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field"><span>Người phụ trách</span><select value={role === 'leader' ? 'Leader trực tiếp' : draft.owner} disabled={role === 'leader'} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}>{role === 'leader' ? <option>Leader trực tiếp</option> : <><option>Vận hành</option><option>Leader trực tiếp</option><option>KT + Vận hành</option><option>Quản lý miền Nam</option></>}</select></label><label className="field"><span>Hạn xử lý *</span><input required type="date" value={draft.due} onChange={(event) => setDraft({ ...draft, due: event.target.value })}/></label><label className="field"><span>Mức ưu tiên</span><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as OpsTask['priority'] })}><option value="normal">Bình thường</option><option value="high">Ưu tiên cao</option><option value="urgent">Khẩn cấp</option></select></label></form></Modal>
  </>
}

function OpsMetric({ icon: Icon, label, value, tone }: { icon: typeof CircleAlert; label: string; value: number; tone: string }) { return <div className="ops-command-metric"><span className={`ops-metric-icon ${tone}`}><Icon size={17}/></span><span><small>{label}</small><strong>{String(value).padStart(2, '0')}</strong></span></div> }
