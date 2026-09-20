import { CalendarDays, CheckCircle2, Mail, MapPin, Phone } from 'lucide-react'
import type { Employee } from '@/types/hrm'

const statusLabels = {
  active: 'Đang làm việc',
  probation: 'Đang thử việc',
  on_leave: 'Đang nghỉ phép',
  resigned: 'Đã nghỉ việc',
} as const

interface EmployeeProfileSummaryProps {
  employee: Employee
  region: string
  department: string
  completion: number
  onEdit?: () => void
}

export function EmployeeProfileSummary({ employee, region, department, completion, onEdit }: EmployeeProfileSummaryProps) {
  return (
    <aside className="surface profile-summary-card" aria-label="Tóm tắt hồ sơ">
      <div className="profile-summary-status">
        <span className={`employee-status ${employee.status}`}><i />{statusLabels[employee.status]}</span>
        <span className="profile-code">{employee.code}</span>
      </div>
      <img className="profile-avatar" src={employee.avatarUrl} alt={`Ảnh đại diện ${employee.fullName}`} />
      <h1>{employee.fullName}</h1>
      <p>{employee.positionTitle}</p>
      <div className="profile-org-line"><MapPin size={14} aria-hidden="true" />{region} · {department}</div>

      <div className="profile-completion">
        <div><span>Mức độ hoàn thiện</span><strong>{completion}%</strong></div>
        <div className="profile-progress" role="progressbar" aria-label="Mức độ hoàn thiện hồ sơ" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}>
          <i style={{ width: `${completion}%` }} />
        </div>
        <small><CheckCircle2 size={13} aria-hidden="true" /> Đã xác minh thông tin định danh</small>
      </div>

      <dl className="identity-list">
        <div><dt><Mail size={15} aria-hidden="true" />Email công việc</dt><dd>{employee.email}</dd></div>
        <div><dt><Phone size={15} aria-hidden="true" />Điện thoại</dt><dd>{employee.phone}</dd></div>
        <div><dt><CalendarDays size={15} aria-hidden="true" />Ngày vào làm</dt><dd>{new Intl.DateTimeFormat('vi-VN').format(new Date(employee.joinDate))}</dd></div>
      </dl>
      {onEdit && <button className="btn btn-primary" type="button" onClick={onEdit}>Chỉnh sửa hồ sơ</button>}
    </aside>
  )
}
