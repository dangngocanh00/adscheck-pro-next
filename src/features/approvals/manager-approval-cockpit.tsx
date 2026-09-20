import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, Clock3, Search, ShieldCheck, X } from 'lucide-react'
import { useMemo, useRef, useState, type RefObject } from 'react'
import { Modal } from '@/components/ui/modal'
import { employees } from '@/mocks/hrm-data'
import { type AppRole, type ApprovalDecision, useAppStore } from '@/store/app-store'
import {
  approvalStatusLabels,
  approvalTypeLabels,
  canRoleActOnRequest,
  formatSubmittedAt,
  getCurrentApprovalStep,
  getEffectiveApprovalRequests,
  getInitials,
  getRequestContext,
  getRequestPerson,
  getRequestSummary,
  getRequestsForRole,
  isStepAssignedToRole,
  stepRoleLabels,
  type EffectiveApprovalRequest,
} from './approval-data'

type StatusFilter = 'pending' | 'processed' | 'all'

export function ManagerApprovalCockpit() {
  const role = useAppStore((state) => state.role)
  const approvalActions = useAppStore((state) => state.approvalActions)
  const selfServiceRequests = useAppStore((state) => state.selfServiceRequests)
  const actOnApproval = useAppStore((state) => state.actOnApproval)
  const showToast = useAppStore((state) => state.showToast)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')
  const [confirmation, setConfirmation] = useState<ApprovalDecision | null>(null)
  const queueRef = useRef<HTMLElement>(null)
  const detailRef = useRef<HTMLElement>(null)

  const scopedRequests = useMemo(() => getRequestsForRole(role, getEffectiveApprovalRequests(approvalActions, selfServiceRequests)), [approvalActions, role, selfServiceRequests])
  const visibleRequests = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    return scopedRequests.filter((request) => {
      const person = getRequestPerson(request)
      const matchesQuery = !normalized || `${request.code} ${request.title} ${person.employee?.fullName ?? ''} ${getRequestSummary(request)}`.toLocaleLowerCase('vi').includes(normalized)
      const hasProcessedStep = request.steps.some((step) => isStepAssignedToRole(role, step) && ['approved', 'rejected'].includes(step.status))
      const matchesStatus = statusFilter === 'all' || (role === 'hr' ? (statusFilter === 'pending' ? request.status === 'pending' : request.status !== 'pending') : statusFilter === 'pending' ? canRoleActOnRequest(role, request) : hasProcessedStep)
      return matchesQuery && matchesStatus && (typeFilter === 'all' || request.type === typeFilter)
    }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  }, [query, role, scopedRequests, statusFilter, typeFilter])
  const item = activeId === null ? visibleRequests[0] ?? null : visibleRequests.find((request) => request.id === activeId) ?? null
  const pending = scopedRequests.filter((request) => canRoleActOnRequest(role, request))
  const monitoringPending = scopedRequests.filter((request) => request.status === 'pending')
  const metricPending = role === 'hr' ? monitoringPending : pending
  const riskBoundary = Date.now() - 3 * 24 * 60 * 60 * 1000
  const riskCount = metricPending.filter((request) => new Date(request.submittedAt).getTime() < riskBoundary).length
  const highImpact = metricPending.filter((request) => ['salary_increase', 'transfer'].includes(request.type)).length
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
  const decisionsToday = Object.values(approvalActions).filter((action) => action.actorRole === role && new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(action.actedAt)) === today).length

  const selectRequest = (requestId: string) => {
    setActiveId(requestId)
    setMobileDetail(true)
    setNote('')
    setNoteError('')
    if (isMobileApprovalView()) window.requestAnimationFrame(() => detailRef.current?.focus())
  }
  const returnToQueue = () => {
    setMobileDetail(false)
    if (isMobileApprovalView()) window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-request-id="${activeId}"]`)?.focus())
  }
  const requestDecision = (decision: ApprovalDecision) => {
    if (!item) return
    if (decision === 'rejected' && note.trim().length < 8) {
      setNoteError('Nhập lý do từ chối ít nhất 8 ký tự để nhân viên biết cần bổ sung gì.')
      return
    }
    setNoteError('')
    setConfirmation(decision)
  }
  const confirmDecision = () => {
    if (!item || !confirmation) return
    const currentStep = getCurrentApprovalStep(item)
    if (!currentStep || !actOnApproval(item.id, currentStep.id, confirmation, note)) return
    showToast(confirmation === 'approved' ? (currentStep.level === 3 ? 'Đã duyệt và hoàn tất quy trình' : 'Đã duyệt và chuyển sang cấp tiếp theo') : 'Đã từ chối và gửi lý do cho nhân viên')
    setConfirmation(null)
    setNote('')
    setActiveId('')
    setMobileDetail(false)
    window.requestAnimationFrame(() => queueRef.current?.focus())
  }

  return <>
    <div className="page-heading approval-page-heading">
      <div><span className="page-eyebrow">BÀN ĐIỀU HÀNH PHÊ DUYỆT</span><h1>Đơn từ & phê duyệt</h1><p>Ưu tiên việc cần quyết định, kiểm tra đủ ngữ cảnh và theo dõi xuyên suốt 3 cấp.</p></div>
      <span className={`badge ${metricPending.length ? 'badge-warning' : 'badge-success'}`}>{role === 'hr' ? `${metricPending.length} đơn đang trong luồng` : `${pending.length} việc chờ bạn`}</span>
    </div>
    <section className="approval-command-strip" aria-label="Tình hình phê duyệt">
      <ApprovalMetric icon={Clock3} label={role === 'hr' ? 'Đang trong luồng' : 'Đang chờ bạn'} value={metricPending.length} tone="blue" />
      <ApprovalMetric icon={AlertTriangle} label="Có nguy cơ trễ" value={riskCount} tone="orange" />
      <ApprovalMetric icon={ShieldCheck} label="Tác động cao" value={highImpact} tone="purple" />
      <ApprovalMetric icon={CheckCircle2} label="Đã xử lý hôm nay" value={decisionsToday} tone="green" />
    </section>
    <div className={`approval-workspace ${mobileDetail ? 'show-mobile-detail' : ''}`}>
      <section ref={queueRef} className="surface approval-queue" aria-label="Danh sách đơn" tabIndex={-1}>
        <div className="approval-queue-head">
          <div className="approval-tabs" role="group" aria-label="Lọc trạng thái">
            {([['pending', 'Đang chờ'], ['processed', 'Đã xử lý'], ['all', 'Tất cả']] as const).map(([value, label]) => <button type="button" key={value} className={statusFilter === value ? 'active' : ''} aria-pressed={statusFilter === value} onClick={() => { setStatusFilter(value); setActiveId(null); setNote(''); setNoteError('') }}>{label}</button>)}
          </div>
          <label className="search-field approval-search"><Search size={16}/><span className="sr-only">Tìm đơn</span><input value={query} onChange={(event) => { setQuery(event.target.value); setActiveId(null); setNote(''); setNoteError('') }} placeholder="Tên, mã đơn…"/></label>
          <select className="native-select" aria-label="Lọc loại đơn" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setActiveId(null); setNote(''); setNoteError('') }}><option value="all">Mọi loại đơn</option>{Object.entries(approvalTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
        <div className="approval-queue-meta"><strong>{visibleRequests.length} đơn</strong><span>Sắp theo thời gian gửi</span></div>
        <div className="approval-request-list">
          {visibleRequests.map((request) => <RequestRow key={request.id} request={request} active={item?.id === request.id} onSelect={() => selectRequest(request.id)} />)}
          {!visibleRequests.length && <div className="approval-empty"><CheckCircle2 size={24}/><strong>Không có đơn phù hợp</strong><span>Thử đổi bộ lọc hoặc từ khoá tìm kiếm.</span></div>}
        </div>
      </section>
      <ApprovalDetail detailRef={detailRef} request={item} role={role} note={note} noteError={noteError} onNoteChange={(value) => { setNote(value); if (value.trim().length >= 8) setNoteError('') }} onBack={returnToQueue} onDecision={requestDecision} />
    </div>
    <Modal open={Boolean(confirmation)} onClose={() => setConfirmation(null)} title={confirmation === 'approved' ? 'Xác nhận duyệt đơn?' : 'Xác nhận từ chối đơn?'} description={confirmation === 'approved' ? 'Đơn sẽ chuyển sang cấp duyệt tiếp theo hoặc hoàn tất nếu đây là cấp cuối.' : 'Nhân viên sẽ nhận được lý do từ chối ngay sau khi xác nhận.'} size="sm" footer={<><button className="btn btn-secondary" type="button" onClick={() => setConfirmation(null)}>Quay lại</button><button className={`btn ${confirmation === 'rejected' ? 'btn-danger' : 'btn-primary'}`} type="button" onClick={confirmDecision}>{confirmation === 'approved' ? 'Duyệt đơn' : 'Từ chối đơn'}</button></>}><div className="approval-confirm-summary"><strong>{item?.code}</strong><span>{item ? `${getRequestPerson(item).employee?.fullName} · ${approvalTypeLabels[item.type]}` : ''}</span>{note.trim() && <p>“{note.trim()}”</p>}</div></Modal>
  </>
}

function ApprovalMetric({ icon: Icon, label, value, tone }: { icon: typeof Clock3; label: string; value: number; tone: string }) {
  return <div className="surface approval-metric"><span className={`approval-metric-icon ${tone}`}><Icon size={18}/></span><div><small>{label}</small><strong>{String(value).padStart(2, '0')}</strong></div></div>
}

function RequestRow({ request, active, onSelect }: { request: EffectiveApprovalRequest; active: boolean; onSelect: () => void }) {
  const person = getRequestPerson(request)
  const current = getCurrentApprovalStep(request)
  return <button type="button" className={`approval-request-row ${active ? 'active' : ''}`} data-request-id={request.id} aria-pressed={active} aria-controls="approval-detail-panel" onClick={onSelect}>
    <span className="avatar">{getInitials(person.employee?.fullName ?? 'NA')}</span>
    <span className="approval-row-copy"><span><strong>{person.employee?.fullName ?? 'Không xác định'}</strong><em className={`approval-status status-${request.status}`}>{approvalStatusLabels[request.status]}</em></span><small>{approvalTypeLabels[request.type]} · {getRequestSummary(request)}</small><span className="approval-row-meta">{request.code} · {current ? stepRoleLabels[current.approverRole] : formatSubmittedAt(request.submittedAt)}</span></span>
    <ChevronRight size={17}/>
  </button>
}

function ApprovalDetail({ detailRef, request, role, note, noteError, onNoteChange, onBack, onDecision }: { detailRef: RefObject<HTMLElement | null>; request: EffectiveApprovalRequest | null; role: AppRole; note: string; noteError: string; onNoteChange: (value: string) => void; onBack: () => void; onDecision: (decision: ApprovalDecision) => void }) {
  if (!request) return <section ref={detailRef} id="approval-detail-panel" tabIndex={-1} className="surface approval-detail approval-detail-empty"><CheckCircle2 size={28}/><h2>Không có đơn để hiển thị</h2><p>Chọn bộ lọc khác hoặc tìm theo tên, mã đơn.</p></section>
  const person = getRequestPerson(request)
  const context = getRequestContext(request)
  const current = getCurrentApprovalStep(request)
  const canAct = canRoleActOnRequest(role, request)
  return <section ref={detailRef} id="approval-detail-panel" tabIndex={-1} className="surface approval-detail" aria-label={`Chi tiết ${request.code}`}>
    <button className="btn btn-ghost mobile-only approval-back" type="button" onClick={onBack}><ArrowLeft size={16}/>Quay lại danh sách</button>
    <div className="approval-detail-head"><div><span className="page-eyebrow">{request.code}</span><h2>{request.title}</h2><p>Gửi {formatSubmittedAt(request.submittedAt)} · {person.department}, {person.region}</p></div><span className={`approval-status status-${request.status}`}>{approvalStatusLabels[request.status]}</span></div>
    <div className="approval-requester"><span className="avatar">{getInitials(person.employee?.fullName ?? 'NA')}</span><div><strong>{person.employee?.fullName}</strong><span>{person.employee?.positionTitle} · {person.employee?.code}</span></div></div>
    <div className="approval-context-grid"><div><small>{context.label}</small><strong>{context.value}</strong></div><div><small>{context.secondaryLabel}</small><strong>{context.secondaryValue}</strong></div></div>
    <div className="approval-reason"><span>LÝ DO ĐỀ XUẤT</span><p>{request.reason}</p></div>
    {request.handover && <div className="approval-reason"><span>KẾ HOẠCH BÀN GIAO</span><p>{request.handover}</p></div>}
    <div className="approval-flow"><div className="section-title"><h3>Luồng phê duyệt</h3>{current && <span className="badge badge-warning">Đang ở cấp {current.level}/3</span>}</div><ol>{request.steps.map((step) => { const approver = employees.find((employee) => employee.id === step.approverId); const actor = step.actorRole ? `Mô phỏng bởi ${stepRoleLabels[step.actorRole]}` : approver?.fullName ?? 'Chưa phân công'; const status = step.status === 'waiting' ? (current?.id === step.id ? 'Chờ xử lý' : 'Chưa tới lượt') : step.status === 'approved' ? 'Đã duyệt' : step.status === 'rejected' ? 'Từ chối' : 'Bỏ qua'; return <li key={step.id} className={`step-${step.status}`}><i>{step.status === 'approved' ? <Check size={14}/> : step.status === 'rejected' ? <X size={14}/> : <Clock3 size={13}/>}</i><span><strong>{stepRoleLabels[step.approverRole]}</strong><small>{actor}{step.note ? ` · ${step.note}` : ''}</small></span><em>{status}</em></li>})}</ol></div>
    {canAct ? <div className="approval-decision-panel"><label className="field"><span>Ghi chú quyết định <small>(bắt buộc khi từ chối)</small></span><textarea value={note} onChange={(event) => onNoteChange(event.target.value)} aria-invalid={Boolean(noteError)} aria-describedby={noteError ? 'approval-note-error' : undefined} placeholder="Nêu rõ điều kiện duyệt hoặc thông tin cần bổ sung…"/></label>{noteError && <p className="form-error" id="approval-note-error" role="alert"><AlertTriangle size={14}/>{noteError}</p>}<div className="approval-actions"><button className="btn btn-secondary approval-reject" type="button" onClick={() => onDecision('rejected')}><X size={16}/>Từ chối</button><button className="btn btn-primary" type="button" onClick={() => onDecision('approved')}><Check size={16}/>Duyệt đơn</button></div></div> : <div className="approval-readonly-note"><ShieldCheck size={18}/><div><strong>{request.status === 'pending' ? 'Đang chờ cấp khác xử lý' : 'Quy trình đã kết thúc'}</strong><span>{request.status === 'pending' && current ? `Cấp hiện tại: ${stepRoleLabels[current.approverRole]}` : 'Bạn có thể xem lại toàn bộ lịch sử quyết định.'}</span></div></div>}
  </section>
}

const isMobileApprovalView = () => window.matchMedia('(max-width: 900px)').matches
