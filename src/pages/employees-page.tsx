import { AlertTriangle, CheckCircle2, ChevronDown, Download, FileSpreadsheet, Grid2X2, List, Network, Plus, Search, ShieldAlert, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Modal } from '@/components/ui'
import { departments, employees, positionCatalog, regions } from '@/mocks/hrm-data'
import { canAccessEmployee, canEditEmployees, demoViewerEmployeeId, useAppStore } from '@/store/app-store'
import type { Employee, EmployeeStatus } from '@/types/hrm'

const statusLabels = { active: 'Đang làm', probation: 'Thử việc', on_leave: 'Nghỉ phép', resigned: 'Đã nghỉ' } as const

export default function EmployeesPage() {
  const [query, setQuery] = useState('')
  const [regionId, setRegionId] = useState('all')
  const [status, setStatus] = useState<'all' | EmployeeStatus>('all')
  const [position, setPosition] = useState('all')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState('')
  const [visibleCount, setVisibleCount] = useState(30)
  const showToast = useAppStore((state) => state.showToast)
  const role = useAppStore((state) => state.role)
  const customPositions = useAppStore((state) => state.customPositions)
  const createdEmployees = useAppStore((state) => state.createdEmployees)
  const allPositions = [...positionCatalog, ...customPositions]
  const canEdit = canEditEmployees(role)
  const allEmployees = useMemo(() => [...createdEmployees, ...employees].filter((employee) => canAccessEmployee(role, employee)), [createdEmployees, role])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    return allEmployees.filter((employee) => {
      const matchesQuery = !normalized || [employee.fullName, employee.code, employee.email, employee.positionTitle].some((value) => value.toLocaleLowerCase('vi').includes(normalized))
      return matchesQuery && (regionId === 'all' || employee.regionId === regionId) && (status === 'all' || employee.status === status) && (position === 'all' || employee.positionTitle === position)
    })
  }, [allEmployees, position, query, regionId, status])

  const confirmImport = () => {
    if (!importFile) return
    setImportOpen(false)
    setImportFile('')
    showToast('Đã kiểm tra tệp: 18 hợp lệ · 2 dòng cần sửa')
  }

  if (role === 'staff') return <Navigate to={`/employees/${demoViewerEmployeeId}`} replace />
  if (role === 'accountant') return <section className="surface permission-state"><div><ShieldAlert size={28} /></div><h1>Không có quyền xem hồ sơ nhân sự</h1><p>Vai trò Kế toán chỉ truy cập dữ liệu phục vụ chấm công và bảng lương.</p><Link className="btn btn-primary" to="/payroll">Mở bảng lương</Link></section>

  return (
    <>
      <div className="page-heading employee-page-heading">
        <div><span className="page-eyebrow">QUẢN LÝ HỒ SƠ 360°</span><h1>Thông tin nhân sự</h1><p>{allEmployees.length} hồ sơ trong phạm vi của bạn · cập nhật gần nhất 14:26 hôm nay.</p></div>
        {canEdit && <div className="employee-heading-actions"><button className="btn btn-secondary" type="button" onClick={() => setImportOpen(true)}><Upload size={16} />Import</button><Link className="btn btn-primary" to="/employees/new"><Plus size={16} />Thêm nhân sự</Link></div>}
      </div>

      <section className="employee-health-grid" aria-label="Chất lượng dữ liệu nhân sự">
        <div><span className="health-icon success"><CheckCircle2 size={17} /></span><span><small>Hồ sơ hoàn thiện</small><strong>{Math.round(allEmployees.length * 0.84)} / {allEmployees.length}</strong></span><b>84%</b></div>
        <div><span className="health-icon warning"><AlertTriangle size={17} /></span><span><small>Hợp đồng sắp hạn</small><strong>04 hồ sơ</strong></span><b>30 ngày</b></div>
        <div><span className="health-icon danger"><ShieldAlert size={17} /></span><span><small>Thiếu dữ liệu BHXH</small><strong>06 hồ sơ</strong></span><b>Cần xử lý</b></div>
        <div><span className="health-icon blue"><FileSpreadsheet size={17} /></span><span><small>Đang thử việc</small><strong>{allEmployees.filter((item) => item.status === 'probation').length} nhân sự</strong></span><b>Đang theo dõi</b></div>
      </section>

      <div className="toolbar employee-toolbar">
        <label className="search-field"><Search size={16} /><span className="sr-only">Tìm nhân sự</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, mã hoặc email…" /></label>
        <select className="native-select" aria-label="Lọc theo vùng" value={regionId} onChange={(event) => setRegionId(event.target.value)}><option value="all">Mọi vùng</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select>
        <select className="native-select" aria-label="Lọc theo trạng thái" value={status} onChange={(event) => setStatus(event.target.value as 'all' | EmployeeStatus)}><option value="all">Trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select className="native-select desktop-only" aria-label="Lọc theo vị trí" value={position} onChange={(event) => setPosition(event.target.value)}><option value="all">Mọi vị trí</option>{allPositions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <div className="view-switch" aria-label="Chế độ xem"><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} aria-label="Xem dạng bảng" aria-pressed={view === 'table'}><List size={16} /></button><button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')} aria-label="Xem dạng thẻ" aria-pressed={view === 'cards'}><Grid2X2 size={16} /></button><Link to="/org-chart" aria-label="Xem sơ đồ tổ chức"><Network size={16} /></Link></div>
        <button className="btn btn-secondary desktop-only employee-export-button" type="button" onClick={() => exportEmployees(filtered)}><Download size={15} />Xuất CSV</button>
      </div>

      <section className="surface employee-results">
        <div className="result-meta"><span><strong>{filtered.length}</strong> kết quả</span><span className="muted">Sắp xếp: Ngày vào làm mới nhất</span></div>
        {filtered.length === 0 ? <div className="employee-empty"><Search size={22} /><strong>Không tìm thấy nhân sự</strong><p>Thử bỏ bớt bộ lọc hoặc dùng từ khóa khác.</p></div> : view === 'table' ? <EmployeeTable employeeList={filtered.slice(0, visibleCount)} /> : <EmployeeCards employeeList={filtered.slice(0, visibleCount)} />}
        {filtered.length > visibleCount && <div className="employee-load-more"><span>Đang hiển thị {visibleCount} / {filtered.length} hồ sơ</span><button className="btn btn-secondary" onClick={() => setVisibleCount((count) => Math.min(filtered.length, count + 30))}><ChevronDown size={16}/>Xem thêm 30</button></div>}
      </section>

      <Modal open={canEdit && importOpen} onClose={() => setImportOpen(false)} title="Import hồ sơ nhân sự" description="Thêm mới hoặc cập nhật hàng loạt bằng tệp Excel/CSV." size="md" footer={<><button className="btn btn-secondary" type="button" onClick={() => setImportOpen(false)}>Hủy</button><button className="btn btn-primary" type="button" disabled={!importFile} onClick={confirmImport}>Kiểm tra dữ liệu</button></>}>
        <label className={`employee-import-drop ${importFile ? 'has-file' : ''}`}>
          <input className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setImportFile(event.target.files?.[0]?.name ?? '')} />
          {importFile ? <><CheckCircle2 size={28} /><strong>{importFile}</strong><span>Sẵn sàng kiểm tra định dạng và dữ liệu trùng.</span></> : <><Upload size={28} /><strong>Chọn tệp từ máy tính</strong><span>XLSX, XLS hoặc CSV · tối đa 10 MB</span></>}
        </label>
        <div className="import-guidance"><FileSpreadsheet size={18} /><span><strong>Chưa có tệp mẫu?</strong><small>Tệp cần có Mã nhân viên, Họ tên, Số điện thoại, Vị trí, Trạng thái và Ngày bắt đầu.</small></span><button className="btn btn-ghost" type="button" onClick={() => { downloadImportTemplate(); showToast('Đã tải tệp mẫu import nhân sự') }}>Tải file mẫu</button></div>
      </Modal>
    </>
  )
}

function EmployeeTable({ employeeList }: { employeeList: readonly Employee[] }) {
  const createdEmployees = useAppStore((state) => state.createdEmployees)
  const managerPool = [...createdEmployees, ...employees]
  return <><div className="data-table-wrap desktop-employee-table"><table className="data-table"><thead><tr><th>NHÂN SỰ</th><th>MÃ NV</th><th>VÙNG</th><th>BỘ PHẬN</th><th>CHỨC DANH</th><th>QUẢN LÝ</th><th>TRẠNG THÁI</th><th aria-sort="descending">NGÀY VÀO</th></tr></thead><tbody>{employeeList.map((employee) => <tr key={employee.id}><td><Link className="person-cell" to={`/employees/${employee.id}`}><img className="avatar" src={employee.avatarUrl} alt="" /><span><strong>{employee.fullName}</strong><small>{employee.email}</small></span></Link></td><td>{employee.code}</td><td>{regions.find((item) => item.id === employee.regionId)?.name ?? 'Toàn công ty'}</td><td>{departments.find((item) => item.id === employee.departmentId)?.name ?? 'Ban điều hành'}</td><td>{employee.positionTitle}{employee.isConcurrent ? <span className="badge badge-warning concurrent-badge">Kiêm nhiệm</span> : null}</td><td>{managerPool.find((item) => item.id === employee.managerId)?.fullName ?? '—'}</td><td><span className={`employee-status ${employee.status}`}><i />{statusLabels[employee.status]}</span></td><td>{formatDate(employee.joinDate)}</td></tr>)}</tbody></table></div><div className="mobile-employee-cards"><EmployeeCards employeeList={employeeList} /></div></>
}

function EmployeeCards({ employeeList }: { employeeList: readonly Employee[] }) {
  return <div className="employee-card-grid">{employeeList.map((employee) => <Link className="employee-card" to={`/employees/${employee.id}`} key={employee.id}><img className="avatar large" src={employee.avatarUrl} alt="" /><div><strong>{employee.fullName}</strong><span>{employee.positionTitle}</span><small>{regions.find((item) => item.id === employee.regionId)?.name ?? 'Toàn công ty'} · {departments.find((item) => item.id === employee.departmentId)?.name ?? 'Ban điều hành'}</small></div><span className={`employee-status ${employee.status}`}><i />{statusLabels[employee.status]}</span></Link>)}</div>
}

function exportEmployees(employeeList: readonly Employee[]) {
  const rows = [['Mã nhân viên', 'Họ và tên', 'Email', 'Số điện thoại', 'Vị trí', 'Trạng thái'], ...employeeList.map((item) => [item.code, item.fullName, item.email, item.phone, item.positionTitle, statusLabels[item.status]])]
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = 'danh-sach-nhan-su-fun-agency.csv'
  anchor.click()
  URL.revokeObjectURL(href)
}

function downloadImportTemplate() {
  const rows = [['Mã nhân viên', 'Họ và tên', 'Số điện thoại', 'Email', 'Vị trí', 'Trạng thái', 'Ngày bắt đầu'], ['FUN0121', 'Nguyễn Văn A', '0900000000', 'vana@funagency.vn', 'Support MKT', 'Đang làm', '2026-08-24']]
  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'mau-import-nhan-su-fun-agency.csv'; anchor.click(); URL.revokeObjectURL(href)
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN').format(new Date(value))
