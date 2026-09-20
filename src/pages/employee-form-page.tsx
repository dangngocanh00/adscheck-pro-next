import { ArrowLeft, ArrowRight, Check, FileCheck2, Save } from 'lucide-react'
import { useEffect, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { departments, employees, positionCatalog, regions } from '@/mocks/hrm-data'
import { canEditEmployees, demoViewerEmployeeId, getDemoViewerEmployeeId, useAppStore } from '@/store/app-store'
import type { Employee } from '@/types/hrm'

const steps = ['Cá nhân', 'Công việc', 'Hợp đồng & lương', 'Bảo hiểm & thuế', 'Tài liệu']
const descriptions = ['Thông tin định danh và liên hệ cá nhân.', 'Vị trí, quản lý và phạm vi công việc.', 'Điều khoản hợp đồng và thu nhập.', 'Thông tin phục vụ kê khai, phúc lợi và trả lương.', 'Tài liệu phục vụ hồ sơ nhân sự.']
type Draft = {
  fullName: string; email: string; phone: string; dob: string; gender: string; identity: string; address: string
  regionId: string; departmentId: string; positionTitle: string; joinDate: string; managerId: string; employmentType: string; status: string; accessRole: string
  contractType: string; effective: string; salary: string; allowance: string; contractNote: string
  taxCode: string; socialInsurance: string; dependents: string; insuranceStatus: string; bankName: string; bankAccount: string; bankBranch: string
  documents: string
}
const initialDraft: Draft = { fullName: '', email: '', phone: '', dob: '', gender: 'female', identity: '', address: '', regionId: '', departmentId: '', positionTitle: '', joinDate: '', managerId: '', employmentType: 'probation', status: 'probation', accessRole: 'staff', contractType: 'probation', effective: '', salary: '', allowance: '', contractNote: '', taxCode: '', socialInsurance: '', dependents: '0', insuranceStatus: 'none', bankName: '', bankAccount: '', bankBranch: '', documents: '' }

export default function EmployeeFormPage() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(initialDraft)
  const navigate = useNavigate()
  const role = useAppStore((state) => state.role)
  const showToast = useAppStore((state) => state.showToast)
  const addEmployee = useAppStore((state) => state.addEmployee)
  const createdCount = useAppStore((state) => state.createdEmployees.length)
  useEffect(() => {
    setDraft(initialDraft)
    setStep(0)
  }, [role])
  const update = (name: keyof Draft, value: string) => setDraft((current) => ({ ...current, [name]: value }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step < steps.length - 1) { setStep((value) => value + 1); return }
    const added = addEmployee(createEmployeeFromDraft(draft, createdCount))
    if (!added) { showToast('Không thể tạo hồ sơ ngoài phạm vi hoặc vượt quyền vai trò'); return }
    showToast(`Đã tạo hồ sơ ${draft.fullName}`)
    navigate('/employees')
  }
  const fields = step === 0 ? <PersonalFields draft={draft} update={update}/> : step === 1 ? <WorkFields draft={draft} update={update}/> : step === 2 ? <ContractFields draft={draft} update={update}/> : step === 3 ? <ComplianceFields draft={draft} update={update}/> : <DocumentFields draft={draft} update={update}/>
  if (role === 'staff') return <Navigate to={`/employees/${demoViewerEmployeeId}`} replace />
  if (!canEditEmployees(role)) return <Navigate to="/employees" replace />
  return <>
    <Link className="back-link" to="/employees"><ArrowLeft size={15}/>Danh sách nhân sự</Link>
    <div className="form-page-heading"><div><h1>Thêm nhân sự</h1><p>Dữ liệu được giữ khi chuyển qua lại giữa các bước.</p></div><button className="btn btn-secondary" type="button" onClick={() => showToast('Đã lưu bản nháp trong phiên làm việc')}><Save size={15}/>Lưu nháp</button></div>
    <ol className="form-stepper">{steps.map((label, index) => <li key={label} className={index === step ? 'active' : index < step ? 'done' : ''}><i>{index < step ? <Check size={13}/> : index + 1}</i><span>{label}</span></li>)}</ol>
    <form className="surface employee-form" onSubmit={submit}><div className="form-section-head"><div><span>BƯỚC {step + 1}/{steps.length}</span><h2>{steps[step]}</h2><p>{descriptions[step]}</p></div><FileCheck2 size={24}/></div>{fields}<div className="form-footer"><button className="btn btn-secondary" type="button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Quay lại</button><button className="btn btn-primary" type="submit">{step === steps.length - 1 ? 'Hoàn tất hồ sơ' : 'Tiếp tục'}<ArrowRight size={15}/></button></div></form>
  </>
}

type FieldsProps = { draft: Draft; update: (name: keyof Draft, value: string) => void }
function PersonalFields({ draft, update }: FieldsProps) { return <div className="form-grid"><Field label="Họ và tên" name="fullName" value={draft.fullName} update={update} placeholder="Nguyễn Minh Anh" required/><Field label="Email công việc" name="email" value={draft.email} update={update} type="email" placeholder="minh.anh@funagency.vn" required/><Field label="Số điện thoại" name="phone" value={draft.phone} update={update} type="tel" placeholder="090 123 4567" required/><Field label="Ngày sinh" name="dob" value={draft.dob} update={update} type="date" required/><SelectField label="Giới tính" name="gender" value={draft.gender} update={update} options={[['female','Nữ'],['male','Nam'],['other','Khác']]}/><Field label="CCCD" name="identity" value={draft.identity} update={update} inputMode="numeric" placeholder="001204012345" required/><label className="field full-span"><span>Địa chỉ</span><textarea value={draft.address} onChange={(event) => update('address', event.target.value)} placeholder="Địa chỉ thường trú…"/></label></div> }

function WorkFields({ draft, update }: FieldsProps) {
  const customPositions = useAppStore((state) => state.customPositions)
  const role = useAppStore((state) => state.role)
  const viewerId = getDemoViewerEmployeeId(role)
  const visibleRegions = role === 'senior_manager' ? regions.filter((region) => region.seniorManagerId === viewerId) : regions
  const visibleRegionIds = new Set(visibleRegions.map((region) => region.id))
  const visibleDepartments = departments.filter((department) => visibleRegionIds.has(department.regionId) && (!draft.regionId || department.regionId === draft.regionId))
  const accessRoles: Array<[string, string]> = role === 'senior_manager' ? [['staff', 'Nhân viên'], ['leader', 'Leader']] : [['staff', 'Nhân viên'], ['leader', 'Leader'], ['hr', 'Vận hành'], ['accountant', 'Kế toán']]
  const selectedDepartment = departments.find((department) => department.id === draft.departmentId)
  const selectedRegion = regions.find((region) => region.id === selectedDepartment?.regionId)
  const expectedManagerId = draft.accessRole === 'leader' ? selectedRegion?.seniorManagerId : selectedDepartment?.leaderId
  const expectedManager = employees.find((employee) => employee.id === expectedManagerId)
  const managerOptions: Array<[string, string]> = expectedManagerId ? [[expectedManagerId, expectedManager?.fullName ?? expectedManagerId]] : []
  return <div className="form-grid"><SelectField label="Vùng" name="regionId" value={draft.regionId} update={(name, value) => { update(name, value); update('departmentId', ''); update('managerId', '') }} required options={visibleRegions.map((item) => [item.id, item.name])}/><SelectField label="Bộ phận" name="departmentId" value={draft.departmentId} update={(name, value) => { update(name, value); const department = departments.find((item) => item.id === value); const region = regions.find((item) => item.id === department?.regionId); update('managerId', draft.accessRole === 'leader' ? region?.seniorManagerId ?? '' : department?.leaderId ?? '') }} required options={visibleDepartments.map((item) => [item.id, item.name])}/><SelectField label="Chức danh" name="positionTitle" value={draft.positionTitle} update={update} required options={[...positionCatalog, ...customPositions].map((item) => [item, item])}/><Field label="Ngày vào làm" name="joinDate" value={draft.joinDate} update={update} type="date" required/><SelectField label="Quản lý trực tiếp" name="managerId" value={draft.managerId} update={update} required options={managerOptions}/><SelectField label="Loại hình nhân sự" name="employmentType" value={draft.employmentType} update={update} options={[['probation','Thử việc'],['official','Chính thức'],['intern','Thực tập'],['contractor','Cộng tác viên']]}/><SelectField label="Trạng thái" name="status" value={draft.status} update={update} options={[['probation','Thử việc'],['active','Đang làm việc'],['on_leave','Nghỉ phép']]}/><SelectField label="Quyền thao tác" name="accessRole" value={draft.accessRole} update={(name, value) => { update(name, value); update('managerId', value === 'leader' ? selectedRegion?.seniorManagerId ?? '' : selectedDepartment?.leaderId ?? '') }} options={accessRoles}/></div>
}

function ContractFields({ draft, update }: FieldsProps) { return <div className="form-grid"><SelectField label="Loại hợp đồng" name="contractType" value={draft.contractType} update={update} options={[['probation','Thử việc'],['fixed_term','Xác định thời hạn'],['indefinite','Không xác định thời hạn']]}/><Field label="Ngày hiệu lực" name="effective" value={draft.effective} update={update} type="date" required/><Field label="Lương cơ bản" name="salary" value={draft.salary} update={update} inputMode="numeric" placeholder="20.000.000" required/><Field label="Phụ cấp" name="allowance" value={draft.allowance} update={update} inputMode="numeric" placeholder="2.000.000"/><label className="field full-span"><span>Ghi chú điều khoản</span><textarea value={draft.contractNote} onChange={(event) => update('contractNote', event.target.value)} placeholder="Ghi chú thêm…"/></label></div> }
function ComplianceFields({ draft, update }: FieldsProps) { return <div className="form-grid"><Field label="Mã số thuế cá nhân" name="taxCode" value={draft.taxCode} update={update} inputMode="numeric"/><Field label="Số sổ BHXH" name="socialInsurance" value={draft.socialInsurance} update={update}/><Field label="Số người phụ thuộc" name="dependents" value={draft.dependents} update={update} inputMode="numeric"/><SelectField label="Trạng thái BHXH" name="insuranceStatus" value={draft.insuranceStatus} update={update} options={[['none','Chưa tham gia'],['pending','Chờ báo tăng'],['active','Đang tham gia']]}/><Field label="Ngân hàng" name="bankName" value={draft.bankName} update={update}/><Field label="Số tài khoản" name="bankAccount" value={draft.bankAccount} update={update} inputMode="numeric"/><Field label="Chi nhánh ngân hàng" name="bankBranch" value={draft.bankBranch} update={update}/></div> }
function DocumentFields({ draft, update }: FieldsProps) { const files = draft.documents ? draft.documents.split('|') : []; return <div className="document-drop"><FileCheck2 size={28}/><h3>Tài liệu hồ sơ</h3><p>CCCD, hợp đồng, bằng cấp · PDF, JPG hoặc PNG · tối đa 10 MB/tệp</p><label className="btn btn-secondary">Chọn từ máy tính<input className="sr-only" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(event: ChangeEvent<HTMLInputElement>) => update('documents', Array.from(event.target.files ?? []).map((file) => file.name).join('|'))}/></label>{files.length > 0 && <ul className="document-file-list">{files.map((file) => <li key={file}><Check size={14}/>{file}</li>)}</ul>}</div> }

function Field({ label, name, update, ...props }: { label: string; name: keyof Draft; update: (name: keyof Draft, value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) { return <label className="field"><span>{label}{props.required ? ' *' : ''}</span><input {...props} name={name} onChange={(event) => update(name, event.target.value)}/></label> }
function SelectField({ label, name, value, update, options, required = false }: { label: string; name: keyof Draft; value: string; update: (name: keyof Draft, value: string) => void; options: readonly (readonly [string, string])[]; required?: boolean }) { return <label className="field"><span>{label}{required ? ' *' : ''}</span><select name={name} value={value} required={required} onChange={(event) => update(name, event.target.value)}>{required && <option value="">Chọn {label.toLocaleLowerCase('vi')}</option>}{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label> }

function createEmployeeFromDraft(draft: Draft, createdCount: number): Employee {
  const numeric = (value: string) => Number(value.replace(/\D/g, '')) || 0
  const initials = draft.fullName.split(' ').slice(-2).map((part) => part[0]).join('')
  const avatar = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#2563EB"/><text x="48" y="58" text-anchor="middle" font-family="Arial" font-size="30" font-weight="600" fill="white">${initials}</text></svg>`
  return { id: `emp-local-${Date.now()}`, code: `FUN${String(121 + createdCount).padStart(4, '0')}`, fullName: draft.fullName, avatarUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(avatar)}`, email: draft.email, phone: draft.phone, dob: draft.dob, gender: parseOption(draft.gender, ['female', 'male', 'other'] as const, 'other'), regionId: draft.regionId || null, departmentId: draft.departmentId || null, positionTitle: draft.positionTitle, managerId: draft.managerId || null, role: parseOption(draft.accessRole, ['staff', 'leader', 'hr', 'accountant'] as const, 'staff'), status: parseOption(draft.status, ['active', 'probation', 'on_leave'] as const, 'probation'), joinDate: draft.joinDate, contractType: parseOption(draft.contractType, ['probation', 'fixed_term', 'indefinite'] as const, 'probation'), salary: { base: numeric(draft.salary), allowance: numeric(draft.allowance), effectiveFrom: draft.effective } }
}

const parseOption = <T extends string>(value: string, options: readonly T[], fallback: T): T => options.find((option) => option === value) ?? fallback
