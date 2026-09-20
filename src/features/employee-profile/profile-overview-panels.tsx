import { AlertCircle, CalendarClock, CheckCircle2, CircleUserRound, FileCheck2, Landmark, Mail, MapPin, Phone, ShieldCheck, UserRoundCheck } from 'lucide-react'
import type { Employee } from '@/types/hrm'
import type { EmployeeProfileData } from './employee-profile-data'
import { MetricCard, ProfileInfo, ProfileSection } from './profile-info-elements'

export function ProfileOverviewPanel({ employee, profile, onEdit }: { employee: Employee; profile: EmployeeProfileData; onEdit?: () => void }) {
  const leaveRemaining = profile.annualLeaveTotal - profile.annualLeaveUsed
  const missingCount = profile.documents.filter((item) => item.status !== 'verified').length
  return (
    <div className="profile-panel-stack">
      <div className="profile-metric-grid">
        <MetricCard icon={UserRoundCheck} label="Trạng thái" value={employee.status === 'probation' ? 'Thử việc' : 'Chính thức'} note={`Từ ${formatDate(employee.joinDate)}`} tone="green" />
        <MetricCard icon={CalendarClock} label="Phép còn lại" value={`${leaveRemaining} ngày`} note={`Đã dùng ${profile.annualLeaveUsed}/${profile.annualLeaveTotal} ngày`} tone="blue" />
        <MetricCard icon={FileCheck2} label="Hồ sơ tài liệu" value={`${profile.documents.length - missingCount}/${profile.documents.length} mục`} note={`${missingCount} mục cần xử lý`} tone="amber" />
        <MetricCard icon={ShieldCheck} label="Bảo hiểm" value={profile.insuranceStatus === 'active' ? 'Đang tham gia' : 'Chờ bổ sung'} note="Cập nhật 01/08/2026" tone="violet" />
      </div>

      <div className="profile-overview-grid">
        <ProfileSection title="Việc cần hoàn tất" description="Ưu tiên theo mức độ ảnh hưởng dữ liệu">
          <div className="profile-task-list">
            <button type="button" onClick={onEdit} disabled={!onEdit}><AlertCircle size={17} /><span><strong>Bổ sung chi nhánh ngân hàng</strong><small>Ảnh hưởng kỳ lương tháng 08/2026</small></span><b>Quan trọng</b></button>
            <button type="button"><CalendarClock size={17} /><span><strong>Gia hạn giấy khám sức khỏe</strong><small>Hết hạn sau 28 ngày</small></span><b className="neutral">Sắp đến hạn</b></button>
            <button type="button"><FileCheck2 size={17} /><span><strong>Đối chiếu bằng cấp bản gốc</strong><small>HR chưa đánh dấu xác minh</small></span><b className="neutral">Hồ sơ</b></button>
          </div>
        </ProfileSection>
        <ProfileSection title="Thông tin nhanh" description="Dữ liệu thường dùng trong vận hành">
          <div className="profile-info-grid compact">
            <ProfileInfo icon={CircleUserRound} label="Mã nhân sự" value={employee.code} />
            <ProfileInfo icon={Mail} label="Email" value={employee.email} />
            <ProfileInfo icon={Phone} label="Điện thoại" value={employee.phone} />
            <ProfileInfo icon={Landmark} label="Tài khoản lương" value={maskAccount(profile.bankAccount)} />
          </div>
        </ProfileSection>
      </div>
    </div>
  )
}

export function ProfilePersonalPanel({ employee, profile, onEdit }: { employee: Employee; profile: EmployeeProfileData; onEdit?: () => void }) {
  return (
    <div className="profile-panel-stack">
      <ProfileSection title="Thông tin cá nhân" description="Thông tin định danh được HR xác minh" action={onEdit ? <button className="btn btn-secondary" type="button" onClick={onEdit}>Chỉnh sửa</button> : undefined}>
        <div className="profile-info-grid">
          <ProfileInfo icon={CircleUserRound} label="Họ và tên" value={employee.fullName} />
          <ProfileInfo icon={CalendarClock} label="Ngày sinh" value={formatDate(employee.dob)} />
          <ProfileInfo icon={ShieldCheck} label="Số CCCD" value={profile.identityNumber} note={`Cấp ${formatDate(profile.identityIssuedAt)}`} />
          <ProfileInfo icon={MapPin} label="Nơi cấp" value={profile.identityIssuedBy} />
          <ProfileInfo icon={MapPin} label="Địa chỉ thường trú" value={profile.address} />
          <ProfileInfo icon={Mail} label="Email cá nhân" value={profile.personalEmail} />
        </div>
      </ProfileSection>
      <ProfileSection title="Liên hệ khẩn cấp" description="Chỉ HR và quản lý có thẩm quyền được sử dụng">
        <div className="profile-info-grid">
          <ProfileInfo icon={UserRoundCheck} label="Người liên hệ" value={profile.emergencyContact} />
          <ProfileInfo icon={Phone} label="Điện thoại" value={profile.emergencyPhone} />
        </div>
      </ProfileSection>
      <div className="profile-data-note"><CheckCircle2 size={16} /><span><strong>Dữ liệu nhạy cảm được kiểm soát theo vai trò.</strong> Mọi lần xem và chỉnh sửa sẽ được ghi vào lịch sử hồ sơ.</span></div>
    </div>
  )
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN').format(new Date(value))
const maskAccount = (value: string) => `•••• ${value.slice(-4)}`
