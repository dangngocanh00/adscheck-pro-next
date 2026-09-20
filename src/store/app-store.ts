import { create } from 'zustand'
import { getApprovalRoute } from '@/features/approvals/approval-routing'
import { approvalRequests, departments as mockDepartments, employees as mockEmployees, regions as mockRegions } from '@/mocks/hrm-data'
import { initialOpsTasks, initialPeopleDocuments } from '@/mocks/people-ops-data'
import type { ApprovalStatus, ApprovalStep, ApprovalStepStatus, Employee, SelfServiceRequest } from '@/types/hrm'
import type { OpsTask, PeopleDocument } from '@/types/people-ops'

export type AppRole = 'ceo' | 'senior_manager' | 'leader' | 'hr' | 'accountant' | 'staff'
type Theme = 'light' | 'dark'
export type ApprovalDecision = 'approved' | 'rejected'
export type ApprovalAction = {
  requestId: string
  stepId: string
  decision: ApprovalDecision
  note: string
  actedAt: string
  actorRole: AppRole
}

interface AppState {
  role: AppRole
  theme: Theme
  sidebarOpen: boolean
  toast: string | null
  approvalActions: Record<string, ApprovalAction>
  selfServiceRequests: SelfServiceRequest[]
  customPositions: string[]
  createdEmployees: Employee[]
  opsTasks: OpsTask[]
  peopleDocuments: PeopleDocument[]
  setRole: (role: AppRole) => void
  toggleTheme: () => void
  setSidebarOpen: (open: boolean) => void
  actOnApproval: (requestId: string, stepId: string, decision: ApprovalDecision, note: string) => boolean
  addSelfServiceRequest: (request: SelfServiceRequest) => void
  cancelSelfServiceRequest: (requestId: string) => boolean
  addCustomPosition: (position: string) => void
  addEmployee: (employee: Employee) => boolean
  addOpsTask: (task: OpsTask) => void
  updateOpsTask: (id: string, changes: Partial<OpsTask>) => void
  addPeopleDocument: (document: PeopleDocument) => void
  updatePeopleDocument: (id: string, changes: Partial<PeopleDocument>) => void
  showToast: (message: string) => void
  clearToast: () => void
}

const initialTheme: Theme = typeof window !== 'undefined' && window.localStorage.getItem('northstar-theme') === 'dark' ? 'dark' : 'light'
export const demoViewerEmployeeId = 'emp-023'

const createSelfServiceSteps = (requestId: string, requesterId: string, status: ApprovalStatus): ApprovalStep[] => {
  const route = getApprovalRoute(requesterId)
  return [
    { id: `${requestId}-step-1`, level: 1, approverId: route.leaderId, approverRole: 'leader', status: status === 'pending' ? 'waiting' : status === 'approved' ? 'approved' : 'rejected', actedAt: status === 'pending' ? null : '2026-08-16T09:30:00+07:00', note: status === 'rejected' ? 'Cần bổ sung xác nhận của quản lý trực tiếp.' : status === 'approved' ? 'Đã kiểm tra và đồng ý.' : null },
    { id: `${requestId}-step-2`, level: 2, approverId: route.seniorManagerId, approverRole: 'senior_manager', status: status === 'approved' ? 'approved' : status === 'pending' ? 'waiting' : 'skipped', actedAt: status === 'approved' ? '2026-08-16T11:00:00+07:00' : null, note: status === 'approved' ? 'Đã kiểm tra và đồng ý.' : null },
    { id: `${requestId}-step-3`, level: 3, approverId: route.ceoId, approverRole: 'ceo', status: status === 'approved' ? 'approved' : status === 'pending' ? 'waiting' : 'skipped', actedAt: status === 'approved' ? '2026-08-16T15:00:00+07:00' : null, note: status === 'approved' ? 'Đã duyệt hoàn tất.' : null },
  ]
}

const initialSelfServiceRequests: SelfServiceRequest[] = [
  { id: 'self-001', code: 'CN-2026-018', requesterId: demoViewerEmployeeId, type: 'leave', title: 'Nghỉ phép năm', startDate: '2026-08-27', endDate: '2026-08-28', numberOfDays: 2, reason: 'Giải quyết việc gia đình.', handover: 'Bàn giao campaign cho Leader trước ngày nghỉ.', status: 'pending', submittedAt: '2026-08-23T09:20:00+07:00', steps: createSelfServiceSteps('self-001', demoViewerEmployeeId, 'pending') },
  { id: 'self-002', code: 'CN-2026-011', requesterId: demoViewerEmployeeId, type: 'remote', title: 'Làm việc từ xa', startDate: '2026-08-18', endDate: '2026-08-18', numberOfDays: 1, reason: 'Làm việc tại nhà do lịch bảo trì.', handover: 'Không ảnh hưởng lịch campaign.', status: 'approved', submittedAt: '2026-08-15T14:05:00+07:00', steps: createSelfServiceSteps('self-002', demoViewerEmployeeId, 'approved') },
  { id: 'self-003', code: 'CN-2026-006', requesterId: demoViewerEmployeeId, type: 'attendance_correction', title: 'Bổ sung chấm công', startDate: '2026-08-08', endDate: '2026-08-08', numberOfDays: 1, reason: 'Quên check-out cuối ngày.', handover: 'Đính kèm xác nhận của Leader.', status: 'rejected', submittedAt: '2026-08-09T08:10:00+07:00', steps: createSelfServiceSteps('self-003', demoViewerEmployeeId, 'rejected') },
]

export const useAppStore = create<AppState>((set, get) => ({
  role: 'ceo',
  theme: initialTheme,
  sidebarOpen: false,
  toast: null,
  approvalActions: {},
  selfServiceRequests: initialSelfServiceRequests,
  customPositions: [],
  createdEmployees: [],
  opsTasks: initialOpsTasks,
  peopleDocuments: initialPeopleDocuments,
  setRole: (role) => set({ role }),
  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light'
    window.localStorage.setItem('northstar-theme', theme)
    set({ theme })
  },
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  actOnApproval: (requestId, stepId, decision, note) => {
    const normalizedNote = note.trim()
    if (decision === 'rejected' && normalizedNote.length < 8) return false
    const state = get()
    const request = [...approvalRequests, ...state.selfServiceRequests].find((item) => item.id === requestId)
    if (!request || request.status === 'cancelled' || state.approvalActions[stepId]) return false
    const effectiveStatuses: ApprovalStepStatus[] = request.steps.map((step) => state.approvalActions[step.id]?.decision ?? step.status)
    if (effectiveStatuses.includes('rejected')) return false
    const currentStep = request.steps.find((_step, index) => effectiveStatuses[index] === 'waiting')
    if (!currentStep || currentStep.id !== stepId || currentStep.approverRole !== state.role || currentStep.approverId !== getDemoViewerEmployeeId(state.role)) return false
    set((state) => ({
      approvalActions: {
        ...state.approvalActions,
        [stepId]: { requestId, stepId, decision, note: normalizedNote, actedAt: new Date().toISOString(), actorRole: state.role },
      },
    }))
    return true
  },
  addSelfServiceRequest: (request) => set((state) => ({ selfServiceRequests: [request, ...state.selfServiceRequests] })),
  cancelSelfServiceRequest: (requestId) => {
    const state = get()
    if (state.role !== 'staff') return false
    const request = state.selfServiceRequests.find((item) => item.id === requestId)
    if (!request || request.requesterId !== demoViewerEmployeeId || request.status !== 'pending' || request.steps.some((step) => state.approvalActions[step.id])) return false
    set((state) => ({ selfServiceRequests: state.selfServiceRequests.map((item) => item.id === requestId ? { ...item, status: 'cancelled' } : item) }))
    return true
  },
  addCustomPosition: (position) => set((state) => ({ customPositions: [...state.customPositions, position] })),
  addEmployee: (employee) => {
    const role = get().role
    const department = mockDepartments.find((item) => item.id === employee.departmentId)
    const region = mockRegions.find((item) => item.id === employee.regionId)
    const validDepartment = !employee.departmentId || (department && department.regionId === employee.regionId)
    const expectedManagerId = employee.role === 'leader' ? region?.seniorManagerId : department?.leaderId
    const validManager = !employee.departmentId || employee.managerId === expectedManagerId
    const validRoleCeiling = role !== 'senior_manager' || ['staff', 'leader'].includes(employee.role)
    if (!['ceo', 'senior_manager', 'hr'].includes(role) || !validDepartment || !validManager || !validRoleCeiling || !canAccessEmployee(role, employee)) return false
    set((state) => ({ createdEmployees: [employee, ...state.createdEmployees] }))
    return true
  },
  addOpsTask: (task) => set((state) => state.opsTasks.some((item) => item.id === task.id) ? state : ({ opsTasks: [task, ...state.opsTasks] })),
  updateOpsTask: (id, changes) => set((state) => ({ opsTasks: state.opsTasks.map((task) => task.id === id ? { ...task, ...changes } : task) })),
  addPeopleDocument: (document) => set((state) => state.peopleDocuments.some((item) => item.id === document.id || item.code === document.code) ? state : ({ peopleDocuments: [document, ...state.peopleDocuments] })),
  updatePeopleDocument: (id, changes) => set((state) => ({ peopleDocuments: state.peopleDocuments.map((document) => document.id === id ? { ...document, ...changes } : document) })),
  showToast: (toast) => {
    set({ toast })
    window.setTimeout(() => set((state) => state.toast === toast ? { toast: null } : state), 4000)
  },
  clearToast: () => set({ toast: null }),
}))

export const canViewSalary = (role: AppRole) => ['ceo', 'hr', 'accountant', 'staff'].includes(role)
export const canEditOrganization = (role: AppRole) => ['ceo', 'senior_manager', 'hr'].includes(role)
export const canEditEmployees = (role: AppRole) => ['ceo', 'senior_manager', 'hr'].includes(role)
export const canApproveRequests = (role: AppRole) => ['ceo', 'senior_manager', 'leader', 'hr'].includes(role)
export const canManageSettings = (role: AppRole) => ['ceo', 'hr'].includes(role)
export const canManageHrCenter = (role: AppRole) => ['ceo', 'senior_manager', 'leader', 'hr'].includes(role)
export const canManageDocuments = (role: AppRole) => ['ceo', 'senior_manager', 'hr', 'accountant'].includes(role)
export const canAccessOpsTask = (role: AppRole, task: OpsTask) => {
  if (['ceo', 'senior_manager', 'hr'].includes(role)) return true
  return role === 'leader' && (task.owner.toLocaleLowerCase('vi').includes('leader') || ['attendance', 'approval'].includes(task.category))
}
export const canEditOpsTaskOwner = (role: AppRole) => ['ceo', 'senior_manager', 'hr'].includes(role)
export const canAccessPeopleDocument = (role: AppRole, document: PeopleDocument) => {
  if (['ceo', 'senior_manager', 'hr'].includes(role)) return true
  return role === 'accountant' && ['Hợp đồng', 'Phụ lục', 'Đánh giá'].includes(document.type)
}
const demoViewerEmployeeIds: Partial<Record<AppRole, string>> = {
  ceo: 'emp-001',
  senior_manager: 'emp-002',
  leader: 'emp-005',
  staff: demoViewerEmployeeId,
}

export const getDemoViewerEmployeeId = (role: AppRole) => demoViewerEmployeeIds[role] ?? null

export const canAccessEmployee = (role: AppRole, target: Employee) => {
  if (role === 'ceo' || role === 'hr') return true
  if (role === 'accountant') return false
  const viewerId = getDemoViewerEmployeeId(role)
  if (!viewerId) return false
  if (target.id === viewerId) return true
  if (role === 'staff') return false
  const viewer = mockEmployees.find((employee) => employee.id === viewerId)
  if (role === 'leader') return Boolean(viewer?.departmentId && target.departmentId === viewer.departmentId)
  if (role === 'senior_manager') {
    const managedRegions = new Set(mockRegions.filter((region) => region.seniorManagerId === viewerId).map((region) => region.id))
    return Boolean(target.regionId && managedRegions.has(target.regionId))
  }
  return false
}
export const canViewEmployeeSalary = (role: AppRole, employeeId: string) => ['ceo', 'hr', 'accountant'].includes(role) || (role === 'staff' && employeeId === demoViewerEmployeeId)
