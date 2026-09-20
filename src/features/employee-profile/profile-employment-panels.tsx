import { BriefcaseBusiness, CalendarDays, FileText, LockKeyhole, MapPin, Network, UserRoundCheck, WalletCards } from 'lucide-react'
import { employees } from '@/mocks/hrm-data'
import type { Employee } from '@/types/hrm'
import { ProfileInfo, ProfileSection } from './profile-info-elements'

export function ProfileWorkPanel({ employee, region, department }: { employee: Employee; region: string; department: string }) {
  const manager = employees.find((item) => item.id === employee.managerId)
  return (
    <div className="profile-panel-stack">
      <ProfileSection title="Vị trí hiện tại" description="Cơ cấu có hiệu lực từ 01/04/2026" action={<span className="badge badge-success">Đang hiệu lực</span>}>
        <div className="profile-info-grid">
          <ProfileInfo icon={MapPin} label="Vùng hoạt động" value={region} />
          <ProfileInfo icon={Network} label="Bộ phận" value={department} />
          <ProfileInfo icon={BriefcaseBusiness} label="Chức danh" value={employee.positionTitle} />
          <ProfileInfo icon={UserRoundCheck} label="Quản lý trực tiếp" value={manager?.fullName ?? 'CEO / Ban điều hành'} />
          <ProfileInfo icon={CalendarDays} label="Ngày bắt đầu" value={formatDate(employee.joinDate)} />
          <ProfileInfo icon={BriefcaseBusiness} label="Loại hình nhân sự" value={employee.status === 'probation' ? 'Thử việc' : 'Nhân sự chính thức'} />
        </div>
      </ProfileSection>
      <ProfileSection title="Phạm vi công việc" description="Dùng cho phân quyền dữ liệu và luồng phê duyệt">
        <div className="profile-assignment-card">
          <span><Network size={18} /></span>
          <div><strong>{department} · {region}</strong><p>Phạm vi chính · Nhận phê duyệt từ {manager?.fullName ?? 'Ban điều hành'}</p></div>
          <span className="badge">Mặc định</span>
        </div>
        {employee.isConcurrent ? <div className="profile-assignment-card secondary"><span><BriefcaseBusiness size={18} /></span><div><strong>Vai trò kiêm nhiệm</strong><p>Cố vấn chuyên môn · không quản lý trực tiếp nhân sự</p></div><span className="badge badge-warning">Kiêm nhiệm</span></div> : null}
      </ProfileSection>
    </div>
  )
}

export function ProfileContractPanel({ employee, onAction }: { employee: Employee; onAction?: (message: string) => void }) {
  const currentLabel = employee.contractType === 'probation' ? 'Hợp đồng thử việc' : employee.contractType === 'fixed_term' ? 'Hợp đồng xác định thời hạn' : 'Hợp đồng không xác định thời hạn'
  return (
    <div className="profile-panel-stack">
      <ProfileSection title="Hợp đồng hiện tại" description="Theo dõi hiệu lực và cảnh báo gia hạn" action={onAction ? <button className="btn btn-secondary" type="button" onClick={() => onAction('Đã mở luồng tạo phụ lục hợp đồng')}>Tạo phụ lục</button> : undefined}>
        <div className="profile-contract-current">
          <span><FileText size={22} /></span>
          <div><small>HĐLĐ/FUN/2025/{employee.code.slice(-4)}</small><h4>{currentLabel}</h4><p>Hiệu lực từ 01/08/2025 · Không xác định ngày kết thúc</p></div>
          <span className="badge badge-success">Đang hiệu lực</span>
        </div>
      </ProfileSection>
      <ProfileSection title="Hành trình hợp đồng" description="Toàn bộ phiên bản được lưu, không ghi đè">
        <div className="contract-timeline">
          {[
            ['Thử việc 2 tháng', '01/06/2023–31/07/2023', 'Hoàn thành'],
            ['Hợp đồng xác định thời hạn', '01/08/2023–31/07/2025', 'Đã hết hạn'],
            [currentLabel, '01/08/2025–Hiện tại', 'Đang hiệu lực'],
          ].map((item, index) => <div key={item[0]}><i>{index + 1}</i><span><strong>{item[0]}</strong><small>{item[1]}</small></span><b className={index === 2 ? 'current' : ''}>{item[2]}</b></div>)}
        </div>
      </ProfileSection>
    </div>
  )
}

export function ProfileSalaryPanel({ employee, allowed }: { employee: Employee; allowed: boolean }) {
  if (!allowed) return <div className="salary-locked"><LockKeyhole size={28} /><h3>Không có quyền xem</h3><p>Dữ liệu lương chỉ dành cho HR, Kế toán/C&amp;B, CEO và chính nhân viên.</p><div className="locked-field"><LockKeyhole size={15} />Lương cơ bản · Không có quyền xem</div><div className="locked-field"><LockKeyhole size={15} />Phụ cấp · Không có quyền xem</div></div>
  return (
    <div className="profile-panel-stack">
      <ProfileSection title="Thu nhập hiện tại" description="Mức thu nhập cố định dùng trong kỳ lương" action={<span className="badge badge-success">Hiệu lực {formatDate(employee.salary?.effectiveFrom ?? employee.joinDate)}</span>}>
        <div className="salary-cards">
          <div><WalletCards size={18} /><span>Lương cơ bản</span><strong>{formatCurrency(employee.salary?.base ?? 0)}</strong><small>Theo tháng</small></div>
          <div><WalletCards size={18} /><span>Phụ cấp cố định</span><strong>{formatCurrency(employee.salary?.allowance ?? 0)}</strong><small>Ăn trưa, điện thoại, trách nhiệm</small></div>
        </div>
      </ProfileSection>
      <div className="profile-data-note"><LockKeyhole size={16} /><span><strong>Thông tin thu nhập được bảo vệ.</strong> Không hiển thị trong tệp xuất nếu người dùng không có quyền xem lương.</span></div>
    </div>
  )
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN').format(new Date(value))
const formatCurrency = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} ₫`
