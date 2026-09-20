import { MoveRight, PanelRightClose } from 'lucide-react'
import type { OrgNodeType } from '@/types/hrm'

const typeLabels: Record<OrgNodeType | 'ceo', string> = {
  ceo: 'Ban điều hành',
  senior_manager: 'Quản lý cấp cao',
  region: 'Vùng',
  department: 'Bộ phận',
  employee: 'Nhân sự',
}

interface Props {
  name: string
  type: OrgNodeType | 'ceo'
  parentName: string
  editMode: boolean
  onClose: () => void
  onViewDetails: () => void
  onQuickMove: () => void
}

export function OrgChartInspector({ name, type, parentName, editMode, onClose, onViewDetails, onQuickMove }: Props) {
  const initials = name.split(' ').slice(-2).map((part) => part[0]).join('')
  const canMove = type === 'employee'

  return (
    <aside className="org-inspector" aria-label={`Chi tiết ${name}`}>
      <button type="button" className="icon-action inspector-close" onClick={onClose} aria-label="Đóng bảng chi tiết">
        <PanelRightClose size={19} />
      </button>
      <div className="inspector-symbol" aria-hidden="true">{initials}</div>
      <span className="badge">{typeLabels[type]}</span>
      <h2>{name}</h2>
      <p>{type === 'region' ? 'Đơn vị vận hành theo khu vực' : 'Thông tin nhanh trong cơ cấu hiện tại'}</p>
      <dl>
        <div>
          <dt>Đơn vị trực thuộc</dt>
          <dd>{parentName || 'Không có'}</dd>
        </div>
        <div>
          <dt>Trạng thái</dt>
          <dd><span className="status-dot" />Đang hoạt động</dd>
        </div>
        <div>
          <dt>Thay đổi gần nhất</dt>
          <dd>01/04/2026</dd>
        </div>
      </dl>
      <button type="button" className="btn btn-primary" onClick={onViewDetails}>
        {type === 'region' || type === 'department' ? 'Xem danh sách nhân sự' : 'Xem hồ sơ'}
      </button>
      {canMove ? (
        <button type="button" className="btn btn-secondary" disabled={!editMode} onClick={onQuickMove}>
          <MoveRight size={16} aria-hidden="true" />
          Điều chuyển
        </button>
      ) : null}
    </aside>
  )
}
