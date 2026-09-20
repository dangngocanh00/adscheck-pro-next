import { ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, Laptop2, PenLine, Plus, RotateCcw } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import { demoViewerEmployeeId, useAppStore } from '@/store/app-store'
import type { SelfServiceRequest, SelfServiceRequestType } from '@/types/hrm'
import { getCurrentApprovalStep, getEffectiveApprovalRequests, stepRoleLabels, type EffectiveSelfServiceRequest } from './approval-data'
import { getApprovalRoute } from './approval-routing'

const requestTypes: Array<{ type: SelfServiceRequestType; label: string; description: string; icon: typeof CalendarDays }> = [
  { type: 'leave', label: 'Nghỉ phép', description: 'Phép năm, nghỉ việc riêng', icon: CalendarDays },
  { type: 'remote', label: 'Làm việc từ xa', description: 'Đăng ký ngày WFH', icon: Laptop2 },
  { type: 'business_trip', label: 'Công tác', description: 'Lịch trình và bàn giao', icon: BriefcaseBusiness },
  { type: 'attendance_correction', label: 'Bổ sung công', description: 'Quên check-in / check-out', icon: RotateCcw },
]
const statusLabels = { pending: 'Đang chờ', approved: 'Đã duyệt', rejected: 'Từ chối', cancelled: 'Đã huỷ' }

export function EmployeeRequestHub() {
  const requests = useAppStore((state) => state.selfServiceRequests).filter((request) => request.requesterId === demoViewerEmployeeId)
  const approvalActions = useAppStore((state) => state.approvalActions)
  const addRequest = useAppStore((state) => state.addSelfServiceRequest)
  const cancelRequest = useAppStore((state) => state.cancelSelfServiceRequest)
  const showToast = useAppStore((state) => state.showToast)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<SelfServiceRequestType>('leave')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [handover, setHandover] = useState('')
  const [destination, setDestination] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancellationMessage, setCancellationMessage] = useState<string | null>(null)
  const cancellationFocusRef = useRef<HTMLDivElement>(null)
  const effectiveRequests = useMemo(() => getEffectiveApprovalRequests(approvalActions, requests).filter((request): request is EffectiveSelfServiceRequest => requests.some((source) => source.id === request.id) && ['leave', 'business_trip', 'remote', 'attendance_correction'].includes(request.type)), [approvalActions, requests])
  const pendingCount = effectiveRequests.filter((request) => request.status === 'pending').length
  const approvedCount = effectiveRequests.filter((request) => request.status === 'approved').length
  const selectedType = requestTypes.find((item) => item.type === type) ?? requestTypes[0]
  const sortedRequests = useMemo(() => [...effectiveRequests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [effectiveRequests])

  const resetForm = () => { setStartDate(''); setEndDate(''); setReason(''); setHandover(''); setDestination(''); setErrors({}) }
  const startRequest = (nextType: SelfServiceRequestType = 'leave') => { resetForm(); setType(nextType); setOpen(true) }
  const close = () => { setOpen(false); resetForm() }
  const clearError = (field: string) => setErrors((current) => {
    if (!current[field]) return current
    const next = { ...current }
    delete next[field]
    return next
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!startDate) nextErrors.startDate = 'Chọn ngày bắt đầu.'
    if (!endDate) nextErrors.endDate = 'Chọn ngày kết thúc.'
    if (startDate && endDate && endDate < startDate) nextErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.'
    if (reason.trim().length < 8) nextErrors.reason = 'Mô tả lý do ít nhất 8 ký tự.'
    if (handover.trim().length < 5) nextErrors.handover = 'Nêu ngắn gọn phương án bàn giao.'
    if (type === 'business_trip' && destination.trim().length < 2) nextErrors.destination = 'Nhập địa điểm công tác.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.querySelector<HTMLElement>('#self-service-request [aria-invalid="true"]')?.focus()))
      return
    }
    addRequest(createSelfServiceRequest(type, selectedType.label, startDate, endDate, reason, handover, destination, requests.length))
    setOpen(false); resetForm()
    showToast('Đã gửi yêu cầu tới Leader trực tiếp')
  }
  const confirmCancellation = () => {
    if (!cancellingId) return
    const cancelled = cancelRequest(cancellingId)
    const message = cancelled ? 'Đã huỷ yêu cầu và rút khỏi hàng đợi' : 'Không thể huỷ vì đơn đã được xử lý'
    setCancellingId(null)
    setCancellationMessage(message)
    showToast(message)
    window.requestAnimationFrame(() => cancellationFocusRef.current?.focus())
  }

  return <>
    <div className="page-heading self-service-heading"><div><span className="page-eyebrow">KHÔNG GIAN CÁ NHÂN</span><h1>Đơn của tôi</h1><p>Tạo yêu cầu, theo dõi tiến độ và xem lại kết quả trên một màn hình.</p></div><button className="btn btn-primary" type="button" onClick={() => startRequest()}><Plus size={16}/>Tạo yêu cầu</button></div>
    <section className="self-service-metrics" aria-label="Tổng quan đơn cá nhân"><div className="surface"><span className="approval-metric-icon blue"><CalendarDays size={18}/></span><div><small>Phép năm còn lại</small><strong>8,5 ngày</strong></div></div><div className="surface"><span className="approval-metric-icon orange"><Clock3 size={18}/></span><div><small>Đang chờ duyệt</small><strong>{pendingCount}</strong></div></div><div className="surface"><span className="approval-metric-icon green"><CheckCircle2 size={18}/></span><div><small>Đã duyệt năm nay</small><strong>{approvedCount + 6}</strong></div></div></section>
    {cancellationMessage && <div ref={cancellationFocusRef} tabIndex={-1} className="self-service-cancel-result" role="status"><CheckCircle2 size={17}/><span>{cancellationMessage}</span></div>}
    <section className="surface self-service-quick"><div className="section-title"><div><h2>Tạo yêu cầu nhanh</h2><p>Chọn loại đơn để mở biểu mẫu phù hợp.</p></div></div><div className="self-service-type-grid">{requestTypes.map(({ type: itemType, label, description, icon: Icon }) => <button type="button" key={itemType} onClick={() => startRequest(itemType)}><span><Icon size={19}/></span><strong>{label}</strong><small>{description}</small><ArrowRight size={15}/></button>)}</div></section>
    <section className="surface self-service-history"><div className="section-title"><div><h2>Lịch sử yêu cầu</h2><p>{sortedRequests.length} yêu cầu gần nhất của bạn.</p></div></div><div className="self-request-list">{sortedRequests.map((request) => { const definition = requestTypes.find((item) => item.type === request.type) ?? requestTypes[0]; const Icon = definition.icon; const current = getCurrentApprovalStep(request); const rejected = request.steps.find((step) => step.status === 'rejected'); const canCancel = request.status === 'pending' && request.steps.every((step) => step.status === 'waiting'); return <article key={request.id} className="self-request-row"><span className="self-request-icon"><Icon size={17}/></span><div><strong>{request.title}</strong><small>{request.code} · {formatDate(request.startDate)}{request.endDate !== request.startDate ? ` – ${formatDate(request.endDate)}` : ''}</small>{rejected?.note && <small className="self-request-feedback">Lý do: {rejected.note}</small>}</div><span><em className={`approval-status status-${request.status}`}>{statusLabels[request.status]}</em><small>{current ? stepRoleLabels[current.approverRole] : request.status === 'approved' ? 'Hoàn tất' : 'Đã kết thúc'}</small>{canCancel && <button className="self-request-cancel" type="button" onClick={() => setCancellingId(request.id)}>Huỷ đơn</button>}</span></article>})}</div></section>
    <Modal open={open} onClose={close} title={`Tạo yêu cầu · ${selectedType.label}`} description="Điền đủ thông tin để người duyệt có thể quyết định ngay." size="md" footer={<><button className="btn btn-secondary" type="button" onClick={close}>Huỷ</button><button className="btn btn-primary" type="submit" form="self-service-request"><PenLine size={15}/>Gửi yêu cầu</button></>}>
      <form className="self-service-form" id="self-service-request" onSubmit={submit} noValidate>
        <label className="field full-span"><span>Loại yêu cầu</span><select name="requestType" value={type} onChange={(event) => { setType(event.target.value as SelfServiceRequestType); clearError('destination') }}>{requestTypes.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select></label>
        <RequestField id="start-date" label="Ngày bắt đầu" error={errors.startDate}><input id="start-date" name="startDate" type="date" required aria-required="true" value={startDate} onChange={(event) => { setStartDate(event.target.value); clearError('startDate') }} aria-invalid={Boolean(errors.startDate)} aria-describedby={errors.startDate ? 'start-date-error' : undefined}/></RequestField>
        <RequestField id="end-date" label="Ngày kết thúc" error={errors.endDate}><input id="end-date" name="endDate" type="date" required aria-required="true" value={endDate} onChange={(event) => { setEndDate(event.target.value); clearError('endDate') }} aria-invalid={Boolean(errors.endDate)} aria-describedby={errors.endDate ? 'end-date-error' : undefined}/></RequestField>
        {type === 'business_trip' && <RequestField id="destination" label="Địa điểm công tác" error={errors.destination} full><input id="destination" name="destination" required aria-required="true" value={destination} onChange={(event) => { setDestination(event.target.value); clearError('destination') }} aria-invalid={Boolean(errors.destination)} aria-describedby={errors.destination ? 'destination-error' : undefined} placeholder="Ví dụ: Đà Nẵng"/></RequestField>}
        <RequestField id="reason" label="Lý do" error={errors.reason} full><textarea id="reason" name="reason" required aria-required="true" value={reason} onChange={(event) => { setReason(event.target.value); clearError('reason') }} aria-invalid={Boolean(errors.reason)} aria-describedby={errors.reason ? 'reason-error' : undefined} placeholder="Mô tả ngắn gọn lý do…"/></RequestField>
        <RequestField id="handover" label="Kế hoạch bàn giao" error={errors.handover} full><textarea id="handover" name="handover" required aria-required="true" value={handover} onChange={(event) => { setHandover(event.target.value); clearError('handover') }} aria-invalid={Boolean(errors.handover)} aria-describedby={errors.handover ? 'handover-error' : undefined} placeholder="Ai tiếp nhận công việc, hạng mục nào cần lưu ý…"/></RequestField>
      </form>
    </Modal>
    <Modal open={Boolean(cancellingId)} onClose={() => setCancellingId(null)} title="Huỷ yêu cầu này?" description="Đơn sẽ được rút khỏi hàng đợi và không thể tiếp tục phê duyệt." size="sm" footer={<><button className="btn btn-secondary" type="button" onClick={() => setCancellingId(null)}>Giữ lại</button><button className="btn btn-danger" type="button" onClick={confirmCancellation}>Huỷ yêu cầu</button></>}><p className="muted">Chỉ huỷ được khi chưa có cấp nào xử lý.</p></Modal>
  </>
}

function RequestField({ id, label, error, full = false, children }: { id: string; label: string; error?: string; full?: boolean; children: ReactNode }) {
  return <label className={`field ${full ? 'full-span' : ''}`}><span>{label} *</span>{children}{error && <small className="field-error" id={`${id}-error`} role="alert">{error}</small>}</label>
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

function createSelfServiceRequest(type: SelfServiceRequestType, title: string, startDate: string, endDate: string, reason: string, handover: string, destination: string, count: number): SelfServiceRequest {
  const timestamp = Date.now()
  const id = `self-${timestamp}`
  const numberOfDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1)
  const route = getApprovalRoute(demoViewerEmployeeId)
  const base = { id, code: `CN-2026-${String(count + 19).padStart(3, '0')}`, requesterId: demoViewerEmployeeId, title, startDate, endDate, numberOfDays, reason: reason.trim(), handover: handover.trim(), status: 'pending' as const, submittedAt: new Date(timestamp).toISOString(), steps: [
    { id: `${id}-step-1`, level: 1 as const, approverId: route.leaderId, approverRole: 'leader' as const, status: 'waiting' as const, actedAt: null, note: null },
    { id: `${id}-step-2`, level: 2 as const, approverId: route.seniorManagerId, approverRole: 'senior_manager' as const, status: 'waiting' as const, actedAt: null, note: null },
    { id: `${id}-step-3`, level: 3 as const, approverId: route.ceoId, approverRole: 'ceo' as const, status: 'waiting' as const, actedAt: null, note: null },
  ] }
  if (type === 'business_trip') return { ...base, type, destination: destination.trim() }
  return { ...base, type }
}
