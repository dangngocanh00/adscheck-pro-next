import { CalendarCheck2, CheckCircle2, Clock3, HeartHandshake, Landmark, ShieldCheck, UserRoundPlus } from 'lucide-react'
import type { EmployeeProfileData } from './employee-profile-data'
import { ProfileInfo, ProfileSection } from './profile-info-elements'

export function ProfileCompliancePanel({ profile, onEdit }: { profile: EmployeeProfileData; onEdit?: () => void }) {
  return (
    <div className="profile-panel-stack">
      <ProfileSection title="Bảo hiểm & thuế" description="Dữ liệu phục vụ khai báo và đối soát" action={onEdit ? <button className="btn btn-secondary" type="button" onClick={onEdit}>Cập nhật</button> : undefined}>
        <div className="profile-info-grid">
          <ProfileInfo icon={ShieldCheck} label="Số sổ BHXH" value={profile.socialInsuranceNumber} note="Đóng theo lương cơ bản" />
          <ProfileInfo icon={CheckCircle2} label="Trạng thái BHXH" value={profile.insuranceStatus === 'active' ? 'Đang tham gia' : 'Chờ bổ sung'} />
          <ProfileInfo icon={Landmark} label="Mã số thuế cá nhân" value={profile.taxCode} />
          <ProfileInfo icon={UserRoundPlus} label="Người phụ thuộc" value={`${profile.dependents} người`} note="Đã xác minh trên hệ thống" />
        </div>
      </ProfileSection>
      <ProfileSection title="Tài khoản nhận lương" description="Thông tin ngân hàng đã đối chiếu chủ tài khoản">
        <div className="profile-info-grid">
          <ProfileInfo icon={Landmark} label="Ngân hàng" value={profile.bankName} />
          <ProfileInfo icon={Landmark} label="Số tài khoản" value={profile.bankAccount} />
          <ProfileInfo icon={Landmark} label="Chi nhánh" value={profile.bankBranch} note={profile.bankBranch === 'Chưa bổ sung' ? 'Cần bổ sung trước khi chốt lương' : undefined} />
        </div>
      </ProfileSection>
    </div>
  )
}

export function ProfileAttendancePanel({ profile }: { profile: EmployeeProfileData }) {
  const remaining = profile.annualLeaveTotal - profile.annualLeaveUsed
  return (
    <div className="profile-panel-stack">
      <div className="leave-summary-card">
        <div><span>Quỹ phép năm 2026</span><strong>{remaining}<small> ngày còn lại</small></strong><p>Đã sử dụng {profile.annualLeaveUsed} / {profile.annualLeaveTotal} ngày</p></div>
        <div className="leave-ring" style={{ '--leave-progress': `${(remaining / profile.annualLeaveTotal) * 360}deg` } as React.CSSProperties}><span>{Math.round((remaining / profile.annualLeaveTotal) * 100)}%</span></div>
      </div>
      <ProfileSection title="Tổng hợp tháng 08/2026" description="Dữ liệu chấm công được đồng bộ hằng ngày">
        <div className="profile-info-grid">
          <ProfileInfo icon={CalendarCheck2} label="Ngày công" value="17 / 22 ngày" />
          <ProfileInfo icon={Clock3} label="Đi muộn" value="01 lần · 12 phút" />
          <ProfileInfo icon={HeartHandshake} label="Làm việc từ xa" value="02 ngày" />
          <ProfileInfo icon={Clock3} label="Làm thêm" value="04 giờ 30 phút" />
        </div>
      </ProfileSection>
    </div>
  )
}
