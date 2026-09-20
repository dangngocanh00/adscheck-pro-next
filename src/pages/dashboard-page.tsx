import { ArrowUpRight, Cake, Clock3, FileWarning, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getEffectiveApprovalRequests, getPendingApprovalCount } from '@/features/approvals/approval-data'
import { canAccessOpsTask, canAccessPeopleDocument, demoViewerEmployeeId, type AppRole, useAppStore } from '@/store/app-store'

const headcount = [{ name: 'Miền Bắc', value: 38 }, { name: 'Miền Nam', value: 32 }, { name: 'Miền Trung', value: 21 }, { name: 'Quốc tế', value: 13 }, { name: 'Tây Nguyên', value: 9 }, { name: 'Mekong', value: 7 }]
const departmentData = [{ name: 'Sale', value: 31, color: '#2563eb' }, { name: 'Media', value: 28, color: '#0f766e' }, { name: 'CSKH', value: 24, color: '#d97706' }, { name: 'Content', value: 17, color: '#7c3aed' }, { name: 'Khác', value: 20, color: '#64748b' }]
const trend = ['T9', 'T10', 'T11', 'T12', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'].map((name, index) => ({ name, value: [105, 108, 111, 109, 113, 115, 118, 117, 121, 124, 122, 120][index] }))
const roleIntro = { ceo: 'Toàn cảnh nhân sự và các điểm cần quyết định hôm nay.', senior_manager: 'Tình hình 2 vùng bạn đang phụ trách.', leader: 'Nhịp vận hành của bộ phận và việc cần duyệt.', hr: 'Hồ sơ, hợp đồng và tuyển dụng cần xử lý.', accountant: 'Kỳ công, bảo hiểm và bảng lương hiện tại.', staff: 'Thông tin cá nhân, lịch làm việc và đơn của bạn.' }
const queue: Array<{ icon: typeof Cake; title: string; text: string; tone: string; path: string; roles: AppRole[] }> = [
  { icon: Cake, title: 'Sinh nhật tuần này', text: '4 nhân sự · gần nhất là Nguyễn Minh Anh', tone: 'blue', path: '/hr-center', roles: ['ceo', 'senior_manager', 'leader', 'hr'] },
  { icon: FileWarning, title: 'Hợp đồng sắp hết hạn', text: 'Hợp đồng cần gia hạn', tone: 'orange', path: '/documents', roles: ['ceo', 'senior_manager', 'hr', 'accountant'] },
  { icon: Clock3, title: 'Sắp hết thử việc', text: 'Nhân sự cần đánh giá', tone: 'purple', path: '/work-inbox', roles: ['ceo', 'senior_manager', 'leader', 'hr'] },
  { icon: UserCheck, title: 'Đơn chờ duyệt', text: 'Yêu cầu đang chờ xử lý', tone: 'green', path: '/approvals', roles: ['ceo', 'senior_manager', 'leader', 'hr', 'staff'] },
]

function downloadDashboardReport() {
  const rows = [['Chỉ số', 'Giá trị'], ['Tổng nhân sự', '120'], ['Tuyển mới tháng', '8'], ['Nghỉ việc tháng', '3'], ['Tỷ lệ nghỉ việc', '2,4%'], ...headcount.map((item) => [`Nhân sự ${item.name}`, String(item.value)])]
  const blob = new Blob([`\uFEFF${rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'bao-cao-nhan-su-fun-agency.csv'; link.click(); URL.revokeObjectURL(link.href)
}

export default function DashboardPage() {
  const role = useAppStore((state) => state.role)
  const showToast = useAppStore((state) => state.showToast)
  const approvalActions = useAppStore((state) => state.approvalActions)
  const selfServiceRequests = useAppStore((state) => state.selfServiceRequests)
  const personalPending = getEffectiveApprovalRequests(approvalActions, selfServiceRequests).filter((request) => request.requesterId === demoViewerEmployeeId && request.id.startsWith('self-') && request.status === 'pending').length
  const pendingApprovals = role === 'staff' ? personalPending : getPendingApprovalCount(role, approvalActions, selfServiceRequests)
  const opsTasks = useAppStore((state) => state.opsTasks)
  const peopleDocuments = useAppStore((state) => state.peopleDocuments)
  const navigate = useNavigate()
  const exportReport = () => { downloadDashboardReport(); showToast('Đã tải báo cáo nhân sự') }
  const actionQueue = queue.filter((item) => item.roles.includes(role)).map((item) => item.path === '/documents' ? { ...item, text: `${peopleDocuments.filter((document) => canAccessPeopleDocument(role, document) && document.status === 'expiring').length} hợp đồng trong 30 ngày` } : item.path === '/work-inbox' ? { ...item, text: `${opsTasks.filter((task) => canAccessOpsTask(role, task) && task.status !== 'done' && task.title.toLocaleLowerCase('vi').includes('thử việc')).length} nhân sự cần đánh giá` } : item.path === '/approvals' ? { ...item, title: role === 'staff' ? 'Đơn của bạn' : item.title, text: role === 'staff' ? `${personalPending} đơn cá nhân đang chờ duyệt` : `${pendingApprovals} đơn đang chờ xử lý` } : item)
  return <>
    <div className="page-heading"><div><h1>Chào buổi chiều, Minh</h1><p>{roleIntro[role]}</p></div><button className="btn btn-secondary desktop-only" onClick={exportReport}>Xuất báo cáo <ArrowUpRight size={15}/></button></div>
    <section className="metric-grid" aria-label="Chỉ số nhân sự"><Metric label="Tổng nhân sự" value="120" delta="+2,5%"/><Metric label="Tuyển mới tháng" value="8" delta="+3"/><Metric label="Nghỉ việc tháng" value="3"/><Metric label="Tỷ lệ nghỉ việc" value="2,4%" delta="−0,8%"/><Metric label={role === 'staff' ? 'Đơn của tôi đang chờ' : 'Đơn chờ duyệt'} value={String(pendingApprovals)}/></section>
    <div className="dashboard-grid"><div><div className="chart-grid">
      <ChartPanel title="Nhân sự theo vùng" summary="Miền Bắc có headcount cao nhất với 38 người." onDetail={() => navigate('/departments')}><ResponsiveContainer width="100%" height={230}><BarChart data={headcount} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}><CartesianGrid stroke="var(--border)" vertical={false}/><XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}/><YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}/><Bar dataKey="value" fill="var(--primary)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></ChartPanel>
      <ChartPanel title="Theo bộ phận" summary="Sale và Media chiếm gần một nửa tổng nhân sự." onDetail={() => navigate('/departments')}><div className="donut-wrap"><ResponsiveContainer width="100%" height={170}><PieChart><Pie data={departmentData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={2}>{departmentData.map((item) => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}/></PieChart></ResponsiveContainer><div className="chart-legend">{departmentData.map((item) => <span key={item.name}><i style={{ background: item.color }}/>{item.name} <b>{item.value}</b></span>)}</div></div></ChartPanel>
    </div><ChartPanel title="Biến động nhân sự · 12 tháng" summary="Headcount tăng 15 người so với tháng 9 năm trước." onDetail={() => navigate('/hr-center')}><ResponsiveContainer width="100%" height={210}><LineChart data={trend} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}><CartesianGrid stroke="var(--border)" vertical={false}/><XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}/><YAxis domain={[100,130]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}/><Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 2, fill: 'var(--surface)', strokeWidth: 2 }} activeDot={{ r: 5 }}/></LineChart></ResponsiveContainer></ChartPanel></div>
      <aside className="surface panel-padding action-queue"><div className="section-title"><h2>Cần chú ý</h2><span className="badge">Hôm nay</span></div>{actionQueue.map(({ icon: Icon, title, text, tone, path }) => <button className="queue-item" key={title} onClick={() => navigate(path)}><span className={`queue-icon ${tone}`}><Icon size={17}/></span><span><strong>{title}</strong><small>{text}</small></span><ArrowUpRight size={15}/></button>)}{actionQueue.length ? <div className="queue-note"><strong>Gợi ý vận hành</strong><p>Tỷ lệ nghỉ việc Media miền Nam tăng 1,8% trong quý này. Xem danh sách để trao đổi cùng Regional Director.</p><button className="btn btn-secondary" onClick={() => navigate('/hr-center')}>Xem phân tích</button></div> : <div className="queue-note"><strong>Không có việc cần xử lý</strong><p>Các chỉ số cá nhân và lịch làm việc của bạn đang ổn định.</p></div>}</aside>
    </div>
  </>
}

function Metric({ label, value, delta }: { label: string; value: string; delta?: string }) { return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}{delta && <span className="metric-delta">{delta}</span>}</div></div> }
function ChartPanel({ title, summary, children, onDetail }: { title: string; summary: string; children: React.ReactNode; onDetail: () => void }) { return <section className="surface panel-padding chart-panel"><div className="section-title"><h2>{title}</h2><button className="btn btn-ghost" onClick={onDetail}>Chi tiết</button></div><p className="sr-chart-summary">{summary}</p>{children}</section> }
