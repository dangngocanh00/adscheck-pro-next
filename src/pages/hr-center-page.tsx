import { ArrowRight, CheckCircle2, ClipboardList, LockKeyhole, Plus } from 'lucide-react'
import { useState } from 'react'
import { Modal, Tab, TabList, TabPanel, Tabs } from '@/components/ui'
import { AssetsPanel, ContractsPanel, LifecyclePanel } from '@/features/hr-center/people-operations-panels'
import { hrCenterModules, type HrCenterModuleId } from '@/features/hr-center/hr-center-data'
import { ExperiencePanel, ReportsPanel, SchedulesPanel } from '@/features/hr-center/workforce-insight-panels'
import { employees } from '@/mocks/hrm-data'
import { canManageHrCenter, useAppStore } from '@/store/app-store'
import type { OpsTaskCategory, OpsTaskPriority } from '@/types/people-ops'

const flow = ['Hồ sơ', 'Lịch làm', 'Chấm công', 'Đơn từ', 'Bảng lương']

export default function HrCenterPage() {
  const role = useAppStore((state) => state.role)
  const [active, setActive] = useState<HrCenterModuleId>('lifecycle')
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskType, setTaskType] = useState('Onboarding')
  const [taskEmployeeId, setTaskEmployeeId] = useState('emp-001')
  const [taskOwner, setTaskOwner] = useState('Vận hành')
  const [taskDue, setTaskDue] = useState('2026-08-28')
  const [taskPriority, setTaskPriority] = useState<OpsTaskPriority>('normal')
  const [taskNote, setTaskNote] = useState('')
  const addOpsTask = useAppStore((state) => state.addOpsTask)
  const createdEmployees = useAppStore((state) => state.createdEmployees)
  const showToast = useAppStore((state) => state.showToast)
  const employeeOptions = [...createdEmployees, ...employees]
  if (!canManageHrCenter(role)) return <section className="surface permission-state"><div><LockKeyhole size={28}/></div><h1>Không có quyền vào Trung tâm HRM</h1><p>Phân hệ này dành cho CEO, Quản lý, Leader và Vận hành. Dữ liệu cá nhân vẫn có trong hồ sơ của bạn.</p></section>
  const createTask = () => {
    const employee = employeeOptions.find((item) => item.id === taskEmployeeId)
    if (!employee || !taskDue) { showToast('Chọn nhân sự liên quan và hạn xử lý'); return }
    const categoryMap: Record<string, OpsTaskCategory> = { 'Onboarding': 'onboarding', 'Đánh giá thử việc': 'approval', 'Gia hạn hợp đồng': 'contract', 'Offboarding': 'offboarding', 'Bàn giao tài sản': 'offboarding' }
    const owner = role === 'leader' ? 'Leader trực tiếp' : taskOwner
    addOpsTask({ id: `ops-${Date.now()}`, employeeId: employee.id, title: taskType, subject: employee.fullName, category: categoryMap[taskType] ?? 'onboarding', owner, dueDate: `${taskDue}T17:30:00+07:00`, priority: taskPriority, status: 'open', progress: 0, description: taskNote.trim() || 'Tác vụ được tạo từ Trung tâm vận hành nhân sự.', sourcePath: `/employees/${employee.id}` })
    setTaskOpen(false)
    setTaskDue('2026-08-28')
    setTaskNote('')
    showToast(`Đã tạo tác vụ ${taskType} và giao cho ${owner}`)
  }

  return <>
    <div className="page-heading hr-center-heading"><div><span className="page-eyebrow">FUN AGENCY · PEOPLE OPERATIONS</span><h1>Trung tâm vận hành nhân sự</h1><p>Một luồng dữ liệu xuyên suốt từ lúc nhận việc đến chấm công, đơn từ và bảng lương.</p></div><button className="btn btn-primary" onClick={() => setTaskOpen(true)}><Plus size={16}/>Tạo tác vụ</button></div>
    <section className="surface hr-flow-ribbon" aria-label="Luồng dữ liệu nhân sự"><div className="flow-summary"><span className="flow-status"><CheckCircle2 size={17}/>06 phân hệ đã kết nối</span><strong>Dữ liệu đi qua một lần, không nhập lại giữa các bộ phận.</strong></div><ol>{flow.map((item, index) => <li key={item}><i>{index + 1}</i><span>{item}</span>{index < flow.length - 1 ? <ArrowRight size={16}/> : null}</li>)}</ol></section>
    <Tabs value={active} onValueChange={(value) => setActive(value as HrCenterModuleId)} className="hr-center-tabs">
      <TabList label="Phân hệ HRM" className="hr-module-tabs">{hrCenterModules.map(({ id, label, icon: Icon, metric }) => <Tab value={id} key={id} className="hr-module-tab"><span><Icon size={17}/>{label}</span><b>{metric}</b></Tab>)}</TabList>
      <div className="hr-module-overview">{hrCenterModules.map(({ id, label, description, icon: Icon, metric, metricLabel, tone }) => <button key={id} className={`hr-module-card ${active === id ? 'active' : ''}`} onClick={() => setActive(id)} aria-pressed={active === id}><span className={`hr-module-icon ${tone}`}><Icon size={18}/></span><span><strong>{label}</strong><small>{description}</small></span><span><b>{metric}</b><small>{metricLabel}</small></span></button>)}</div>
      <TabPanel value="lifecycle"><LifecyclePanel/></TabPanel>
      <TabPanel value="schedules"><SchedulesPanel/></TabPanel>
      <TabPanel value="contracts"><ContractsPanel/></TabPanel>
      <TabPanel value="assets"><AssetsPanel/></TabPanel>
      <TabPanel value="reports"><ReportsPanel/></TabPanel>
      <TabPanel value="experience"><ExperiencePanel/></TabPanel>
    </Tabs>
    <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Tạo tác vụ nhân sự" description="Giao một đầu việc có hạn xử lý và người phụ trách." footer={<><button className="btn btn-secondary" onClick={() => setTaskOpen(false)}>Hủy</button><button className="btn btn-primary" onClick={createTask}><ClipboardList size={16}/>Tạo tác vụ</button></>}>
      <div className="form-grid"><label className="field"><span>Loại tác vụ</span><select value={taskType} onChange={(event) => setTaskType(event.target.value)}><option>Onboarding</option><option>Đánh giá thử việc</option><option>Gia hạn hợp đồng</option><option>Offboarding</option><option>Bàn giao tài sản</option></select></label><label className="field"><span>Nhân sự liên quan *</span><select required value={taskEmployeeId} onChange={(event) => setTaskEmployeeId(event.target.value)}>{employeeOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.code} · {employee.fullName}</option>)}</select></label><label className="field"><span>Người phụ trách</span><select value={role === 'leader' ? 'Leader trực tiếp' : taskOwner} disabled={role === 'leader'} onChange={(event) => setTaskOwner(event.target.value)}>{role === 'leader' ? <option>Leader trực tiếp</option> : <><option>Vận hành</option><option>Leader trực tiếp</option><option>KT + Vận hành</option><option>IT & Tài sản</option></>}</select></label><label className="field"><span>Hạn xử lý *</span><input required type="date" value={taskDue} onChange={(event) => setTaskDue(event.target.value)}/></label><label className="field"><span>Mức ưu tiên</span><select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as OpsTaskPriority)}><option value="normal">Bình thường</option><option value="high">Quan trọng</option><option value="urgent">Khẩn cấp</option></select></label><label className="field full-span"><span>Ghi chú</span><textarea value={taskNote} onChange={(event) => setTaskNote(event.target.value)} placeholder="Mục tiêu, tài liệu cần chuẩn bị và kết quả mong đợi…"/></label></div>
    </Modal>
  </>
}
