import { ArrowLeft, Download, LockKeyhole, RefreshCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui'
import { createEmployeeProfileData, type EmployeeProfileData } from '@/features/employee-profile/employee-profile-data'
import { EmployeeProfileSummary } from '@/features/employee-profile/employee-profile-summary'
import { ProfileAttendancePanel, ProfileCompliancePanel } from '@/features/employee-profile/profile-compliance-panels'
import { ProfileContractPanel, ProfileSalaryPanel, ProfileWorkPanel } from '@/features/employee-profile/profile-employment-panels'
import { ProfileEditModal } from '@/features/employee-profile/profile-edit-modal'
import { ProfileOverviewPanel, ProfilePersonalPanel } from '@/features/employee-profile/profile-overview-panels'
import { ProfileDocumentsPanel, ProfileHistoryPanel } from '@/features/employee-profile/profile-records-panels'
import { departments, employees, regions } from '@/mocks/hrm-data'
import { canAccessEmployee, canAccessPeopleDocument, canEditEmployees, canManageDocuments, canViewEmployeeSalary, demoViewerEmployeeId, type AppRole, useAppStore } from '@/store/app-store'
import type { Employee } from '@/types/hrm'

const tabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'personal', label: 'Cá nhân' },
  { id: 'work', label: 'Công việc' },
  { id: 'contract', label: 'Hợp đồng' },
  { id: 'salary', label: 'Lương & phúc lợi', sensitive: true },
  { id: 'compliance', label: 'Bảo hiểm & thuế' },
  { id: 'attendance', label: 'Chấm công & phép' },
  { id: 'documents', label: 'Tài liệu' },
  { id: 'history', label: 'Lịch sử' },
] as const

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const createdEmployees = useAppStore((state) => state.createdEmployees)
  const role = useAppStore((state) => state.role)
  const employee = [...createdEmployees, ...employees].find((item) => item.id === id)
  if (!employee) return <MissingEmployee />
  if (!canAccessEmployee(role, employee)) return <RestrictedEmployee role={role} />
  return <EmployeeProfile key={employee.id} employee={employee} />
}

function EmployeeProfile({ employee }: { employee: Employee }) {
  const [tab, setTab] = useState('overview')
  const [profile, setProfile] = useState(() => createEmployeeProfileData(employee))
  const [editing, setEditing] = useState(false)
  const role = useAppStore((state) => state.role)
  const showToast = useAppStore((state) => state.showToast)
  const peopleDocuments = useAppStore((state) => state.peopleDocuments)
  const addPeopleDocument = useAppStore((state) => state.addPeopleDocument)
  const isOwnStaffProfile = role === 'staff' && employee.id === demoViewerEmployeeId
  const canEditProfile = canEditEmployees(role)
  const sharedDocuments = useMemo(() => peopleDocuments.filter((document) => document.employeeId === employee.id && (canAccessPeopleDocument(role, document) || isOwnStaffProfile)), [employee.id, isOwnStaffProfile, peopleDocuments, role])
  const canUploadDocument = (canManageDocuments(role) && role !== 'accountant') || isOwnStaffProfile
  const salaryAllowed = canViewEmployeeSalary(role, employee.id)
  const region = regions.find((item) => item.id === employee.regionId)?.name ?? 'Toàn công ty'
  const department = departments.find((item) => item.id === employee.departmentId)?.name ?? 'Ban điều hành'

  const saveProfile = (value: EmployeeProfileData) => {
    setProfile({ ...value, completion: Math.max(value.completion, 92) })
    setEditing(false)
    showToast('Đã lưu thay đổi hồ sơ trong phiên demo')
  }
  const exportProfile = () => {
    downloadProfile(employee, profile, salaryAllowed)
    showToast('Đã xuất hồ sơ nhân sự')
  }
  const uploadDocument = (file: File) => {
    const suffix = String(Date.now()).slice(-6)
    if (!canUploadDocument) { showToast('Bạn không có quyền thêm tài liệu vào hồ sơ này'); return }
    addPeopleDocument({ id: `doc-${Date.now()}`, employeeId: employee.id, code: `TL-${suffix}`, title: file.name, employee: employee.fullName, type: 'Tài liệu bổ sung', status: isOwnStaffProfile ? 'waiting' : 'signed', updatedAt: '24/08 · vừa tải', effectiveDate: '24/08/2026', signers: 1, signed: isOwnStaffProfile ? 0 : 1, owner: 'Vận hành' })
    showToast(`Đã thêm tài liệu: ${file.name}`)
  }

  return (
    <>
      <div className="profile-breadcrumb-row">
        <Link className="back-link" to="/employees"><ArrowLeft size={15} />Danh sách nhân sự</Link>
        <span>Cập nhật lần cuối 14:26 · 23/08/2026</span>
      </div>
      <div className="profile-layout">
        <EmployeeProfileSummary employee={employee} region={region} department={department} completion={profile.completion} onEdit={canEditProfile ? () => setEditing(true) : undefined} />
        <section className="surface profile-content" aria-label="Chi tiết hồ sơ nhân sự">
          <div className="profile-header">
            <div><span>HỒ SƠ 360° · {employee.code}</span><h2>Thông tin nhân sự</h2><p>Tập trung toàn bộ dữ liệu từ onboarding đến quá trình công tác.</p></div>
            <div className="profile-header-actions">
              <button className="btn btn-secondary" type="button" onClick={() => showToast('Dữ liệu hồ sơ đã được đồng bộ mới nhất')}><RefreshCcw size={15} />Đồng bộ</button>
              <button className="btn btn-secondary" type="button" onClick={exportProfile}><Download size={15} />Xuất hồ sơ</button>
            </div>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabList label="Nội dung hồ sơ" className="profile-tabs">
              {tabs.map((item) => <Tab value={item.id} key={item.id}>{item.label}{'sensitive' in item && item.sensitive && !salaryAllowed ? <LockKeyhole size={12} /> : null}</Tab>)}
            </TabList>
            <div className="profile-tab-panel">
              <TabPanel value="overview"><ProfileOverviewPanel employee={employee} profile={profile} onEdit={canEditProfile ? () => setEditing(true) : undefined} /></TabPanel>
              <TabPanel value="personal"><ProfilePersonalPanel employee={employee} profile={profile} onEdit={canEditProfile ? () => setEditing(true) : undefined} /></TabPanel>
              <TabPanel value="work"><ProfileWorkPanel employee={employee} region={region} department={department} /></TabPanel>
              <TabPanel value="contract"><ProfileContractPanel employee={employee} onAction={canEditProfile ? showToast : undefined} /></TabPanel>
              <TabPanel value="salary"><ProfileSalaryPanel employee={employee} allowed={salaryAllowed} /></TabPanel>
              <TabPanel value="compliance"><ProfileCompliancePanel profile={profile} onEdit={canEditProfile ? () => setEditing(true) : undefined} /></TabPanel>
              <TabPanel value="attendance"><ProfileAttendancePanel profile={profile} /></TabPanel>
              <TabPanel value="documents"><ProfileDocumentsPanel profile={profile} sharedDocuments={sharedDocuments} canUpload={canUploadDocument} onUploaded={uploadDocument} /></TabPanel>
              <TabPanel value="history"><ProfileHistoryPanel profile={profile} /></TabPanel>
            </div>
          </Tabs>
        </section>
      </div>
      <ProfileEditModal open={canEditProfile && editing} employee={employee} profile={profile} onClose={() => setEditing(false)} onSave={saveProfile} />
    </>
  )
}

function MissingEmployee() {
  return <section className="surface permission-state"><div><LockKeyhole size={28} /></div><h1>Không tìm thấy nhân sự</h1><p>Hồ sơ này không tồn tại hoặc đã được chuyển.</p><Link className="btn btn-primary" to="/employees">Về danh sách</Link></section>
}

function RestrictedEmployee({ role }: { role: AppRole }) {
  const destination = role === 'staff' ? `/employees/${demoViewerEmployeeId}` : role === 'accountant' ? '/payroll' : '/employees'
  const action = role === 'staff' ? 'Mở hồ sơ của tôi' : role === 'accountant' ? 'Mở bảng lương' : 'Về danh sách trong phạm vi'
  return <section className="surface permission-state"><div><LockKeyhole size={28} /></div><h1>Hồ sơ này nằm ngoài phạm vi của bạn</h1><p>Dữ liệu nhân sự được giới hạn theo vùng, bộ phận và vai trò hiện tại.</p><Link className="btn btn-primary" to={destination}>{action}</Link></section>
}

function downloadProfile(employee: Employee, profile: EmployeeProfileData, includeSalary: boolean) {
  const payload = {
    exportedAt: new Date().toISOString(),
    employee: { code: employee.code, fullName: employee.fullName, email: employee.email, phone: employee.phone, positionTitle: employee.positionTitle, joinDate: employee.joinDate, status: employee.status },
    personal: { address: profile.address, identityNumber: profile.identityNumber, taxCode: profile.taxCode, socialInsuranceNumber: profile.socialInsuranceNumber },
    ...(includeSalary ? { salary: employee.salary } : {}),
    documents: profile.documents,
    history: profile.timeline,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `ho-so-${employee.code.toLowerCase()}.json`
  anchor.click()
  URL.revokeObjectURL(href)
}
