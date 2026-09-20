import { Check, FileClock, LockKeyhole, Plus, Settings2, ShieldCheck, SlidersHorizontal, UserRoundCog } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/modal'
import { positionCatalog } from '@/mocks/hrm-data'
import { canManageSettings, useAppStore } from '@/store/app-store'

type SettingsTab = 'roles' | 'positions' | 'contracts' | 'leave' | 'audit'
const settingsTabs: Array<{ id: SettingsTab; label: string; icon: typeof ShieldCheck }> = [
  { id: 'roles', label: 'Vai trò & quyền', icon: ShieldCheck },
  { id: 'positions', label: 'Danh mục chức danh', icon: UserRoundCog },
  { id: 'contracts', label: 'Loại hợp đồng', icon: FileClock },
  { id: 'leave', label: 'Quy tắc phép', icon: SlidersHorizontal },
  { id: 'audit', label: 'Nhật ký hệ thống', icon: Settings2 },
]
const permissionLabels = ['Xem hồ sơ đầy đủ', 'Xem lương', 'Sửa sơ đồ tổ chức', 'Duyệt phép cấp 1', 'Duyệt phép cấp 2', 'Chấm KPI', 'Quản lý hợp đồng']
const initialChecks = [[1,0,0,1,0,0],[1,0,0,1,1,0],[1,1,0,1,0,0],[1,0,1,1,0,0],[1,1,0,1,0,0],[1,1,1,1,0,0],[1,0,0,1,0,0]].map((row) => row.map(Boolean))
const contractTypes = ['Thử việc', 'Xác định thời hạn', 'Không xác định thời hạn', 'Cộng tác viên']
type AuditEntry = [string, string, string, string]
const initialAuditRows: AuditEntry[] = [
  ['24/08 · 10:12', 'Lê Hoàng Minh', 'Cập nhật quyền xem lương', 'Vai trò Kế toán'],
  ['24/08 · 09:48', 'Trần Thu Hà', 'Thêm chức danh', 'Support MKT'],
  ['23/08 · 17:31', 'Nguyễn Minh Anh', 'Sửa quy tắc phép', 'Phép năm 12 ngày'],
  ['23/08 · 15:06', 'Hệ thống', 'Đồng bộ hồ sơ', '120 nhân sự'],
]

export default function SettingsPage() {
  const role = useAppStore((state) => state.role)
  const [tab, setTab] = useState<SettingsTab>('roles')
  const [roles, setRoles] = useState(['CEO', 'Quản lý', 'Leader', 'Vận hành', 'KT', 'Nhân viên'])
  const [checks, setChecks] = useState(initialChecks)
  const customPositions = useAppStore((state) => state.customPositions)
  const addCustomPosition = useAppStore((state) => state.addCustomPosition)
  const positions: string[] = [...positionCatalog, ...customPositions]
  const [modal, setModal] = useState<'role' | 'position' | null>(null)
  const [newName, setNewName] = useState('')
  const [leaveDays, setLeaveDays] = useState(12)
  const [carryOver, setCarryOver] = useState(true)
  const [enabledContracts, setEnabledContracts] = useState([...contractTypes])
  const [auditEntries, setAuditEntries] = useState(initialAuditRows)
  const showToast = useAppStore((state) => state.showToast)
  if (!canManageSettings(role)) return <section className="surface permission-state"><div><LockKeyhole size={28}/></div><h1>Không có quyền thay đổi cài đặt</h1><p>Chỉ CEO và Vận hành được quản lý vai trò, danh mục và chính sách hệ thống.</p></section>

  const recordAudit = (action: string, scope: string) => setAuditEntries((current) => [[new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date()), 'Tài khoản hiện tại', action, scope], ...current])
  const addItem = (event: FormEvent) => {
    event.preventDefault()
    const name = newName.trim()
    if (!name) return
    const currentItems = modal === 'role' ? roles : positions
    if (currentItems.some((item) => item.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
      showToast(`${name} đã tồn tại trong danh mục`)
      return
    }
    if (modal === 'role') {
      setRoles((current) => [...current, name])
      setChecks((current) => current.map((row) => [...row, false]))
    } else addCustomPosition(name)
    recordAudit(modal === 'role' ? 'Thêm vai trò' : 'Thêm chức danh', name)
    showToast(`Đã thêm ${name}`); setNewName(''); setModal(null)
  }
  const togglePermission = (permissionIndex: number, roleIndex: number) => {
    setChecks((current) => current.map((row, rowIndex) => rowIndex === permissionIndex ? row.map((value, columnIndex) => columnIndex === roleIndex ? !value : value) : row))
    recordAudit('Cập nhật quyền', `${permissionLabels[permissionIndex]} · ${roles[roleIndex]}`)
    showToast('Đã lưu thay đổi quyền')
  }
  const saveLeave = () => {
    if (!Number.isFinite(leaveDays) || leaveDays < 0 || leaveDays > 30) { showToast('Số ngày phép phải từ 0 đến 30'); return }
    recordAudit('Sửa quy tắc phép', `${leaveDays} ngày · ${carryOver ? 'Có chuyển phép' : 'Không chuyển phép'}`)
    showToast('Đã lưu quy tắc phép')
  }

  return <>
    <div className="page-heading"><div><h1>Cài đặt hệ thống</h1><p>Quyền truy cập, danh mục và chính sách vận hành Fun Agency.</p></div>{tab === 'roles' && <button className="btn btn-primary" onClick={() => setModal('role')}><Plus size={16}/>Thêm vai trò</button>}{tab === 'positions' && <button className="btn btn-primary" onClick={() => setModal('position')}><Plus size={16}/>Thêm chức danh</button>}</div>
    <div className="settings-layout">
      <aside className="surface settings-nav" aria-label="Nhóm cài đặt">{settingsTabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={17}/>{label}</button>)}</aside>
      <div>
        {tab === 'roles' && <RolesPanel roles={roles} checks={checks} onToggle={togglePermission}/>} 
        {tab === 'positions' && <PositionsPanel positions={positions} onAdd={() => setModal('position')}/>} 
        {tab === 'contracts' && <ContractsPanel enabled={enabledContracts} setEnabled={setEnabledContracts} onSave={() => { recordAudit('Cập nhật loại hợp đồng', `${enabledContracts.length}/${contractTypes.length} loại đang dùng`); showToast('Đã lưu cấu hình hợp đồng') }}/>} 
        {tab === 'leave' && <LeavePanel days={leaveDays} carryOver={carryOver} setDays={setLeaveDays} setCarryOver={setCarryOver} onSave={saveLeave}/>} 
        {tab === 'audit' && <AuditPanel rows={auditEntries}/>} 
      </div>
    </div>
    <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal === 'role' ? 'Thêm vai trò mới' : 'Thêm chức danh mới'} description="Danh mục mới sẽ có hiệu lực ngay trong bản demo." footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Huỷ</button><button className="btn btn-primary" form="add-setting-item" type="submit">Thêm mới</button></>}>
      <form id="add-setting-item" onSubmit={addItem}><label className="field"><span>Tên {modal === 'role' ? 'vai trò' : 'chức danh'}</span><input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={modal === 'role' ? 'Ví dụ: HR Manager' : 'Ví dụ: Motion Designer'}/></label></form>
    </Modal>
  </>
}

function RolesPanel({ roles, checks, onToggle }: { roles: string[]; checks: boolean[][]; onToggle: (permissionIndex: number, roleIndex: number) => void }) {
  return <section className="surface permission-matrix"><div className="section-title panel-padding"><div><h2>Ma trận quyền</h2><p className="muted">Chọn từng ô để cấp hoặc thu hồi quyền.</p></div><span className="badge"><LockKeyhole size={12}/>Có audit log</span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>QUYỀN</th>{roles.map((role) => <th key={role}>{role}</th>)}</tr></thead><tbody>{permissionLabels.map((label, permissionIndex) => <tr key={label}><td><strong>{label}</strong></td>{roles.map((role, roleIndex) => { const checked = checks[permissionIndex]?.[roleIndex] ?? false; return <td key={role}><button className={`permission-check ${checked ? 'checked' : ''}`} onClick={() => onToggle(permissionIndex, roleIndex)} aria-label={`${label} cho ${role}: ${checked ? 'cho phép' : 'không cho phép'}`} aria-pressed={checked}>{checked && <Check size={14}/>}</button></td> })}</tr>)}</tbody></table></div></section>
}

function PositionsPanel({ positions, onAdd }: { positions: readonly string[]; onAdd: () => void }) {
  return <section className="surface panel-padding position-catalog"><div className="section-title"><div><h2>Danh mục chức danh Fun Agency</h2><p className="muted">{positions.length} chức danh đang dùng trong hồ sơ và sơ đồ tổ chức.</p></div><button className="btn btn-secondary" onClick={onAdd}><Plus size={15}/>Thêm chức danh</button></div><div className="settings-chip-grid">{positions.map((position) => <span className="badge" key={position}>{position}</span>)}</div></section>
}

function ContractsPanel({ enabled, setEnabled, onSave }: { enabled: string[]; setEnabled: (value: string[]) => void; onSave: () => void }) {
  const toggle = (type: string) => setEnabled(enabled.includes(type) ? enabled.filter((item) => item !== type) : [...enabled, type])
  return <section className="surface panel-padding settings-form-panel"><div className="section-title"><div><h2>Loại hợp đồng</h2><p className="muted">Cấu hình hạn mặc định và luồng nhắc gia hạn.</p></div></div>{contractTypes.map((type, index) => <div className="setting-rule" key={type}><div><strong>{type}</strong><span>{index === 0 ? '60 ngày · nhắc trước 10 ngày' : index === 3 ? 'Theo dự án · nhắc khi kết thúc' : '12 tháng · nhắc trước 30 ngày'}</span></div><label className="toggle-field"><input type="checkbox" checked={enabled.includes(type)} onChange={() => toggle(type)}/><span>{enabled.includes(type) ? 'Đang dùng' : 'Đã tắt'}</span></label></div>)}<button className="btn btn-primary" onClick={onSave}>Lưu cấu hình</button></section>
}

function LeavePanel({ days, carryOver, setDays, setCarryOver, onSave }: { days: number; carryOver: boolean; setDays: (value: number) => void; setCarryOver: (value: boolean) => void; onSave: () => void }) {
  return <section className="surface panel-padding settings-form-panel"><div className="section-title"><div><h2>Quy tắc phép năm</h2><p className="muted">Áp dụng mặc định cho nhân sự toàn công ty.</p></div></div><label className="field"><span>Số ngày phép mỗi năm</span><input type="number" min="0" max="30" value={days} onChange={(event) => setDays(Number(event.target.value))}/></label><label className="toggle-field setting-rule"><input type="checkbox" checked={carryOver} onChange={(event) => setCarryOver(event.target.checked)}/><span>Cho phép chuyển tối đa 5 ngày phép sang năm sau</span></label><button className="btn btn-primary" onClick={onSave}>Lưu quy tắc</button></section>
}

function AuditPanel({ rows }: { rows: AuditEntry[] }) {
  return <section className="surface permission-matrix"><div className="section-title panel-padding"><div><h2>Nhật ký hệ thống</h2><p className="muted">Lịch sử thay đổi quyền và cấu hình quan trọng.</p></div><span className="badge badge-success">Đang ghi nhận</span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>THỜI GIAN</th><th>NGƯỜI THỰC HIỆN</th><th>THAO TÁC</th><th>PHẠM VI</th></tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${row.join('-')}-${rowIndex}`}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{index === 2 ? <strong>{cell}</strong> : cell}</td>)}</tr>)}</tbody></table></div></section>
}
