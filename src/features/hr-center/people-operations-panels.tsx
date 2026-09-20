import { Check, ChevronRight, FileClock, Laptop, PackagePlus, RotateCcw, UserRoundCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/modal'
import { formatTaskDue } from '@/lib/people-ops'
import { canAccessOpsTask, canManageDocuments, useAppStore } from '@/store/app-store'
import type { OpsTaskCategory } from '@/types/people-ops'
import { assetRows, contractRows } from './hr-center-data'

const lifecycleLabels: Record<OpsTaskCategory, string> = { onboarding: 'Onboarding', contract: 'Hợp đồng', attendance: 'Chấm công', approval: 'Đánh giá & phê duyệt', offboarding: 'Offboarding' }
const checklistTemplates: Record<'onboarding' | 'approval' | 'offboarding', Array<{ id: string; title: string; owner: string }>> = {
  onboarding: [{ id: 'account', title: 'Tạo tài khoản và phân quyền', owner: 'Vận hành' }, { id: 'device', title: 'Bàn giao thiết bị làm việc', owner: 'IT & Tài sản' }, { id: 'policy', title: 'Xác nhận chính sách và tài liệu', owner: 'Nhân sự mới' }],
  approval: [{ id: 'review', title: 'Thu nhận đánh giá từ Leader', owner: 'Leader trực tiếp' }, { id: 'decision', title: 'Xác nhận đề xuất chính thức', owner: 'Quản lý' }, { id: 'notice', title: 'Thông báo kết quả cho nhân sự', owner: 'Vận hành' }],
  offboarding: [{ id: 'handover', title: 'Xác nhận biên bản bàn giao', owner: 'Vận hành' }, { id: 'asset', title: 'Thu hồi tài sản và thiết bị', owner: 'IT & Tài sản' }, { id: 'access', title: 'Khóa quyền truy cập hệ thống', owner: 'Vận hành' }],
}

export function LifecyclePanel() {
  const navigate = useNavigate()
  const showToast = useAppStore((state) => state.showToast)
  const role = useAppStore((state) => state.role)
  const opsTasks = useAppStore((state) => state.opsTasks)
  const lifecycleTasks = opsTasks.filter((task) => canAccessOpsTask(role, task) && ['onboarding', 'approval', 'offboarding'].includes(task.category) && task.status !== 'done').slice(0, 3)
  const focusTask = lifecycleTasks[0]
  const focusKind = focusTask?.category === 'approval' ? 'approval' : focusTask?.category === 'offboarding' ? 'offboarding' : 'onboarding'
  const checklist = checklistTemplates[focusKind].map((item, index) => ({ ...item, id: `${focusTask?.id ?? 'empty'}-${item.id}`, due: index === 0 ? 'Đã xong' : index === 1 ? 'Hôm nay' : focusTask ? formatTaskDue(focusTask.dueDate) : '—' }))
  const [completed, setCompleted] = useState<string[]>([])
  const toggle = (id: string, title: string) => {
    setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
    showToast(`Đã cập nhật: ${title}`)
  }
  return <div className="hr-panel-grid lifecycle-layout">
    <section className="surface hr-worklist">
      <div className="hr-section-head"><div><span className="page-eyebrow">HÀNH TRÌNH ĐANG MỞ</span><h2>Điểm chuyển trạng thái cần theo dõi</h2></div><button className="btn btn-secondary" onClick={() => navigate('/work-inbox')}>Mở hộp việc</button></div>
      <div className="lifecycle-list">{lifecycleTasks.map((task) => <button className="lifecycle-row" key={task.id} onClick={() => navigate(`/work-inbox?task=${task.id}`)}>
        <span className="lifecycle-avatar">{task.subject.split(' ').slice(-2).map((part) => part[0]).join('')}</span>
        <span><strong>{task.subject}</strong><small>{lifecycleLabels[task.category]} · {task.owner}</small><small className="mobile-only lifecycle-mobile-meta">{task.progress}% · {formatTaskDue(task.dueDate)} · {task.status === 'blocked' ? 'Chờ phản hồi' : 'Đang thực hiện'}</small></span>
        <span className="lifecycle-progress"><i><b style={{ width: `${task.progress}%` }} /></i><small>{task.progress}%</small></span>
        <span><strong>{formatTaskDue(task.dueDate)}</strong><small>{task.status === 'blocked' ? 'Chờ phản hồi' : 'Đang thực hiện'}</small></span><ChevronRight size={17}/>
      </button>)}{!lifecycleTasks.length && <div className="ops-empty"><Check size={24}/><strong>Không có hành trình đang mở</strong><span>Các tác vụ trong phạm vi của bạn đã hoàn tất.</span></div>}</div>
    </section>
    <aside className="surface hr-checklist">
      <div className="hr-section-head"><div><span className="page-eyebrow">{focusTask ? `${lifecycleLabels[focusTask.category].toLocaleUpperCase('vi')} · ${focusTask.subject.toLocaleUpperCase('vi')}` : 'HÀNH TRÌNH ĐÃ HOÀN TẤT'}</span><h2>Việc cần hoàn tất hôm nay</h2></div><span className={`badge ${completed.length === checklist.length ? 'badge-success' : 'badge-warning'}`}>{completed.length}/{checklist.length} việc</span></div>
      {checklist.map((item) => { const done = completed.includes(item.id); return <button className={`checklist-row ${done ? 'done' : ''}`} key={item.id} onClick={() => toggle(item.id, item.title)} aria-pressed={done}>
        <i>{done ? <Check size={14}/> : null}</i><span><strong>{item.title}</strong><small>{item.owner} · {item.due}</small></span>
      </button> })}
      <button className="btn btn-primary hr-full-button" onClick={() => showToast('Đã gửi nhắc việc cho các bên phụ trách')}><UserRoundCheck size={16}/>Nhắc người phụ trách</button>
    </aside>
  </div>
}

export function ContractsPanel() {
  const navigate = useNavigate()
  const showToast = useAppStore((state) => state.showToast)
  const addDocument = useAppStore((state) => state.addPeopleDocument)
  const documents = useAppStore((state) => state.peopleDocuments)
  const role = useAppStore((state) => state.role)
  const canDraftDocuments = canManageDocuments(role)
  const drafting = contractRows.filter((row) => documents.some((document) => document.code === `PL-${row.code.replace(/\D/g, '')}`)).map((row) => row.code)
  const startDraft = (code: string, employeeId: string, name: string) => {
    const renewalCode = `PL-${code.replace(/\D/g, '')}`
    if (documents.some((document) => document.code === renewalCode)) { showToast(`Bản nháp ${renewalCode} đã tồn tại`); navigate('/documents'); return }
    addDocument({ id: `doc-${Date.now()}`, employeeId, code: renewalCode, title: 'Phụ lục gia hạn hợp đồng', employee: name, type: 'Phụ lục', status: 'draft', updatedAt: '24/08 · vừa tạo', effectiveDate: '01/09/2026', signers: 2, signed: 0, owner: 'Vận hành' })
    showToast(`Đã tạo bản nháp gia hạn cho ${name}`)
  }
  return <section className="surface hr-table-panel">
    <div className="hr-section-head"><div><span className="page-eyebrow">CẢNH BÁO HIỆU LỰC</span><h2>Hợp đồng và thử việc sắp đến hạn</h2><p>Ưu tiên theo ngày hết hạn và trạng thái đánh giá.</p></div><button className="btn btn-primary" onClick={() => navigate(canDraftDocuments ? '/documents' : '/work-inbox')}><FileClock size={16}/>{canDraftDocuments ? 'Tạo hợp đồng' : 'Mở hộp việc'}</button></div>
    <div className="data-table-wrap"><table className="data-table hr-center-table"><thead><tr><th>MÃ</th><th>NHÂN SỰ</th><th>LOẠI</th><th>HẾT HẠN</th><th>TRẠNG THÁI</th><th>HÀNH ĐỘNG</th></tr></thead><tbody>{contractRows.map((row) => <tr key={row.code}><td>{row.code}</td><td><strong>{row.name}</strong></td><td>{row.type}</td><td><strong>{row.expires}</strong><small>{row.remaining}</small></td><td><span className="badge badge-warning">{drafting.includes(row.code) ? 'Đang soạn' : row.status}</span></td><td><button className="btn btn-secondary" onClick={() => startDraft(row.code, row.employeeId, row.name)} disabled={!canDraftDocuments || drafting.includes(row.code)}>{canDraftDocuments ? 'Soạn gia hạn' : 'Vận hành xử lý'}</button></td></tr>)}</tbody></table></div>
  </section>
}

export function AssetsPanel() {
  const showToast = useAppStore((state) => state.showToast)
  const [selectedAsset, setSelectedAsset] = useState<(typeof assetRows)[number] | null>(null)
  return <>
  <div className="hr-panel-grid asset-layout">
    <section className="surface hr-table-panel">
      <div className="hr-section-head"><div><span className="page-eyebrow">TÀI SẢN ĐANG THEO DÕI</span><h2>Bàn giao và thu hồi thiết bị</h2></div><button className="btn btn-primary" onClick={() => showToast('Đã mở phiếu cấp phát tài sản')}><PackagePlus size={16}/>Cấp phát</button></div>
      <div className="asset-list">{assetRows.map((row) => <article key={row.code} className="asset-row"><span className="asset-icon"><Laptop size={19}/></span><span><strong>{row.asset}</strong><small>{row.code} · {row.holder}</small><small className="mobile-only asset-mobile-meta">{row.state} · Bàn giao {row.handover}</small></span><span className={`badge ${row.state === 'Chờ thu hồi' ? 'badge-warning' : row.state === 'Sẵn sàng' ? 'badge-success' : ''}`}>{row.state}</span><span><small>Bàn giao</small><strong>{row.handover}</strong></span><button className="icon-action" aria-label={`Xem lịch sử ${row.asset}`} onClick={() => setSelectedAsset(row)}><ChevronRight size={17}/></button></article>)}</div>
    </section>
    <aside className="surface asset-summary"><span className="asset-summary-icon"><RotateCcw size={21}/></span><span className="page-eyebrow">OFFBOARDING</span><h2>03 tài sản cần thu hồi</h2><p>Hai thiết bị cần bàn giao trước khi khóa tài khoản của Lê Ngọc Hà.</p><button className="btn btn-secondary" onClick={() => showToast('Đã mở biên bản thu hồi tài sản')}>Mở biên bản thu hồi</button></aside>
  </div>
  <Modal open={Boolean(selectedAsset)} onClose={() => setSelectedAsset(null)} title={selectedAsset ? `${selectedAsset.asset} · ${selectedAsset.code}` : 'Lịch sử tài sản'} description="Thông tin cấp phát và các lần bàn giao gần nhất." footer={<button className="btn btn-primary" onClick={() => setSelectedAsset(null)}>Đóng</button>}>
    {selectedAsset && <div className="asset-history"><div><span>Người đang giữ</span><strong>{selectedAsset.holder}</strong></div><div><span>Trạng thái</span><strong>{selectedAsset.state}</strong></div><div><span>Ngày bàn giao</span><strong>{selectedAsset.handover}</strong></div><ol><li><i/><span><strong>Cấp phát cho {selectedAsset.holder}</strong><small>{selectedAsset.handover} · Biên bản điện tử đã ký</small></span></li><li><i/><span><strong>Kiểm tra thiết bị</strong><small>Đạt tiêu chuẩn · Không ghi nhận hư hỏng</small></span></li></ol></div>}
  </Modal>
  </>
}
