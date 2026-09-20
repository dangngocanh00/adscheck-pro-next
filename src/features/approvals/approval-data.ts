import { approvalRequests, departments, employees, regions } from '@/mocks/hrm-data'
import { getDemoViewerEmployeeId, type AppRole, type ApprovalAction } from '@/store/app-store'
import type { ApprovalRequest, ApprovalStatus, ApprovalStep, SelfServiceRequest } from '@/types/hrm'

export type EffectiveApprovalStep = ApprovalStep & { actorRole?: AppRole }

type WithEffectiveApproval<T extends ApprovalRequest> = T extends ApprovalRequest
  ? Omit<T, 'steps' | 'status'> & { status: ApprovalStatus; steps: EffectiveApprovalStep[] }
  : never

export type EffectiveApprovalRequest = WithEffectiveApproval<ApprovalRequest>
export type EffectiveSelfServiceRequest = Extract<EffectiveApprovalRequest, { type: 'leave' | 'business_trip' | 'remote' | 'attendance_correction' }>

export const approvalTypeLabels = {
  leave: 'Nghỉ phép',
  business_trip: 'Công tác',
  salary_increase: 'Điều chỉnh lương',
  transfer: 'Điều chuyển',
  remote: 'Làm việc từ xa',
  attendance_correction: 'Bổ sung chấm công',
} as const

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  pending: 'Đang chờ',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã huỷ',
}

export const stepRoleLabels: Record<ApprovalStep['approverRole'], string> = {
  leader: 'Leader trực tiếp',
  senior_manager: 'Quản lý vùng',
  ceo: 'CEO',
  hr: 'Vận hành',
  accountant: 'Kế toán',
  staff: 'Nhân viên',
}

export function getEffectiveApprovalRequests(actions: Record<string, ApprovalAction>, supplementalRequests: readonly SelfServiceRequest[] = []): EffectiveApprovalRequest[] {
  return [...supplementalRequests, ...approvalRequests].map((request) => {
    let rejected = false
    const steps = request.steps.map((step) => {
      const action = actions[step.id]
      if (rejected) return { ...step, status: 'skipped' as const }
      if (!action) {
        if (step.status === 'rejected') rejected = true
        return { ...step }
      }
      if (action.decision === 'rejected') rejected = true
      return {
        ...step,
        status: action.decision,
        note: action.note || 'Đã kiểm tra và đồng ý.',
        actedAt: action.actedAt,
        actorRole: action.actorRole,
      }
    })
    const status: ApprovalStatus = request.status === 'cancelled'
      ? 'cancelled'
      : steps.some((step) => step.status === 'rejected')
        ? 'rejected'
        : steps.every((step) => step.status === 'approved')
          ? 'approved'
          : 'pending'
    return { ...request, status, steps } as EffectiveApprovalRequest
  })
}

export function getCurrentApprovalStep(request: EffectiveApprovalRequest) {
  return request.status === 'pending' ? request.steps.find((step) => step.status === 'waiting') ?? null : null
}

export function canRoleActOnRequest(role: AppRole, request: EffectiveApprovalRequest) {
  const currentStep = getCurrentApprovalStep(request)
  return Boolean(currentStep && isStepAssignedToRole(role, currentStep))
}

export function isStepAssignedToRole(role: AppRole, step: ApprovalStep) {
  return step.approverRole === role && step.approverId === getDemoViewerEmployeeId(role)
}

export function getRequestsForRole(role: AppRole, requests: EffectiveApprovalRequest[]) {
  if (role === 'hr' || role === 'ceo') return requests
  return requests.filter((request) => {
    const current = getCurrentApprovalStep(request)
    return Boolean(current && isStepAssignedToRole(role, current)) || request.steps.some((step) => isStepAssignedToRole(role, step) && step.status !== 'waiting')
  })
}

export function getPendingApprovalCount(role: AppRole, actions: Record<string, ApprovalAction>, supplementalRequests: readonly SelfServiceRequest[] = []) {
  const requests = getRequestsForRole(role, getEffectiveApprovalRequests(actions, supplementalRequests))
  return role === 'hr'
    ? requests.filter((request) => request.status === 'pending').length
    : requests.filter((request) => canRoleActOnRequest(role, request)).length
}

export function getRequestPerson(request: ApprovalRequest) {
  const employee = employees.find((item) => item.id === request.requesterId)
  const department = departments.find((item) => item.id === employee?.departmentId)
  const region = regions.find((item) => item.id === employee?.regionId)
  return {
    employee,
    department: department?.name ?? 'Ban điều hành',
    region: region?.name ?? 'Toàn công ty',
  }
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

export function getRequestSummary(request: ApprovalRequest) {
  if (request.type === 'leave') return `${request.numberOfDays} ngày · ${formatDate(request.startDate)} – ${formatDate(request.endDate)}`
  if (request.type === 'business_trip') return `${request.destination} · ${request.numberOfDays} ngày`
  if (request.type === 'salary_increase') return `${formatMoney(request.amount)} · từ ${formatDate(request.effectiveDate)}`
  if (request.type === 'transfer') return `${departments.find((item) => item.id === request.targetDepartmentId)?.name ?? 'Bộ phận mới'} · từ ${formatDate(request.effectiveDate)}`
  return `${request.numberOfDays} ngày · ${formatDate(request.startDate)} – ${formatDate(request.endDate)}`
}

export function getRequestContext(request: ApprovalRequest) {
  if (request.type === 'leave') return { label: 'Thời gian nghỉ', value: `${formatDate(request.startDate)} – ${formatDate(request.endDate)}`, secondaryLabel: 'Số ngày', secondaryValue: `${request.numberOfDays} ngày` }
  if (request.type === 'business_trip') return { label: 'Điểm đến', value: request.destination, secondaryLabel: 'Thời gian', secondaryValue: `${request.numberOfDays} ngày` }
  if (request.type === 'salary_increase') return { label: 'Mức điều chỉnh', value: formatMoney(request.amount), secondaryLabel: 'Hiệu lực', secondaryValue: formatDate(request.effectiveDate) }
  if (request.type === 'transfer') return { label: 'Bộ phận mới', value: departments.find((item) => item.id === request.targetDepartmentId)?.name ?? 'Chưa xác định', secondaryLabel: 'Hiệu lực', secondaryValue: formatDate(request.effectiveDate) }
  return { label: request.type === 'remote' ? 'Lịch làm việc từ xa' : 'Ngày cần bổ sung', value: `${formatDate(request.startDate)} – ${formatDate(request.endDate)}`, secondaryLabel: 'Phạm vi', secondaryValue: `${request.numberOfDays} ngày` }
}

export function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function getInitials(name: string) {
  return name.split(' ').slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi')
}
