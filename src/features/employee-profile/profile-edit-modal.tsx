import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui'
import type { Employee } from '@/types/hrm'
import type { EmployeeProfileData } from './employee-profile-data'

interface ProfileEditModalProps {
  open: boolean
  employee: Employee
  profile: EmployeeProfileData
  onClose: () => void
  onSave: (value: EmployeeProfileData) => void
}

export function ProfileEditModal({ open, employee, profile, onClose, onSave }: ProfileEditModalProps) {
  const [draft, setDraft] = useState(profile)
  useEffect(() => { if (open) setDraft(profile) }, [open, profile])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave(draft)
  }

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa hồ sơ" description={`Cập nhật thông tin của ${employee.fullName}. Các thay đổi chỉ lưu trong phiên demo.`} size="lg">
      <form onSubmit={submit}>
        <div className="profile-edit-grid">
          <label className="field"><span>Email công việc</span><input data-autofocus value={employee.email} readOnly aria-readonly="true" /></label>
          <label className="field"><span>Số điện thoại</span><input value={employee.phone} readOnly aria-readonly="true" /></label>
          <label className="field full-span"><span>Địa chỉ thường trú</span><input value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} required /></label>
          <label className="field"><span>Số CCCD</span><input value={draft.identityNumber} onChange={(event) => setDraft({ ...draft, identityNumber: event.target.value })} required /></label>
          <label className="field"><span>Ngày cấp</span><input type="date" value={draft.identityIssuedAt} onChange={(event) => setDraft({ ...draft, identityIssuedAt: event.target.value })} required /></label>
          <label className="field"><span>Mã số thuế</span><input value={draft.taxCode} onChange={(event) => setDraft({ ...draft, taxCode: event.target.value })} /></label>
          <label className="field"><span>Số sổ BHXH</span><input value={draft.socialInsuranceNumber} onChange={(event) => setDraft({ ...draft, socialInsuranceNumber: event.target.value })} /></label>
          <label className="field full-span"><span>Chi nhánh ngân hàng</span><input value={draft.bankBranch} onChange={(event) => setDraft({ ...draft, bankBranch: event.target.value })} /></label>
        </div>
        <div className="profile-modal-actions">
          <button className="btn btn-secondary" type="button" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" type="submit">Lưu thay đổi</button>
        </div>
      </form>
    </Modal>
  )
}
