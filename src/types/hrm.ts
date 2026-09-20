export type EmployeeRole =
  | 'ceo'
  | 'senior_manager'
  | 'leader'
  | 'staff'
  | 'hr'
  | 'accountant'

export type EmployeeStatus = 'probation' | 'active' | 'on_leave' | 'resigned'
export type Gender = 'male' | 'female' | 'other'
export type ContractType = 'probation' | 'fixed_term' | 'indefinite'

export interface Salary {
  base: number
  allowance: number
  effectiveFrom: string
}

export interface ConcurrentAssignment {
  departmentId: string
  positionTitle: string
  isDepartmentLeader: boolean
}

export interface Employee {
  id: string
  code: string
  fullName: string
  avatarUrl: string
  email: string
  phone: string
  dob: string
  gender: Gender
  regionId: string | null
  departmentId: string | null
  positionTitle: string
  managerId: string | null
  role: EmployeeRole
  status: EmployeeStatus
  joinDate: string
  resignationDate?: string
  contractType: ContractType
  salary?: Salary
  isConcurrent?: boolean
  concurrentAssignments?: readonly ConcurrentAssignment[]
}

export interface Region {
  id: string
  code: string
  name: string
  colorToken: string
  seniorManagerId: string
}

export interface Department {
  id: string
  code: string
  name: string
  regionId: string
  leaderId: string | null
}

export type ApprovalRequestType =
  | 'leave'
  | 'business_trip'
  | 'salary_increase'
  | 'transfer'
  | 'remote'
  | 'attendance_correction'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type ApprovalStepStatus = 'waiting' | 'approved' | 'rejected' | 'skipped'

export interface ApprovalStep {
  id: string
  level: 1 | 2 | 3
  approverId: string
  approverRole: EmployeeRole
  status: ApprovalStepStatus
  actedAt: string | null
  note: string | null
}

export interface ApprovalRequestBase {
  id: string
  code: string
  requesterId: string
  title: string
  reason: string
  status: ApprovalStatus
  submittedAt: string
  steps: readonly ApprovalStep[]
  handover?: string
}

export interface LeaveApprovalRequest extends ApprovalRequestBase {
  type: 'leave'
  startDate: string
  endDate: string
  numberOfDays: number
}

export interface BusinessTripApprovalRequest extends ApprovalRequestBase {
  type: 'business_trip'
  startDate: string
  endDate: string
  numberOfDays: number
  destination: string
}

export interface SalaryIncreaseApprovalRequest extends ApprovalRequestBase {
  type: 'salary_increase'
  effectiveDate: string
  amount: number
}

export interface TransferApprovalRequest extends ApprovalRequestBase {
  type: 'transfer'
  effectiveDate: string
  targetDepartmentId: string
}

export interface RemoteApprovalRequest extends ApprovalRequestBase {
  type: 'remote'
  startDate: string
  endDate: string
  numberOfDays: number
}

export interface AttendanceCorrectionApprovalRequest extends ApprovalRequestBase {
  type: 'attendance_correction'
  startDate: string
  endDate: string
  numberOfDays: number
}

export type ApprovalRequest =
  | LeaveApprovalRequest
  | BusinessTripApprovalRequest
  | SalaryIncreaseApprovalRequest
  | TransferApprovalRequest
  | RemoteApprovalRequest
  | AttendanceCorrectionApprovalRequest

export type SelfServiceRequestType = 'leave' | 'remote' | 'business_trip' | 'attendance_correction'

export type SelfServiceRequest = Extract<ApprovalRequest, { type: SelfServiceRequestType }>

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'early_leave'
  | 'absent'
  | 'paid_leave'
  | 'remote'

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  workingMinutes: number
  overtimeMinutes: number
  status: AttendanceStatus
  note: string | null
}

export type PayrollPeriodStatus = 'draft' | 'reviewing' | 'finalized' | 'paid'

export interface PayrollPeriod {
  id: string
  code: string
  name: string
  startDate: string
  endDate: string
  payDate: string
  status: PayrollPeriodStatus
  totalGross: number
  totalNet: number
  employeeCount: number
}

export interface PayrollSlip {
  id: string
  payrollPeriodId: string
  employeeId: string
  baseSalary: number
  allowance: number
  overtimePay: number
  bonus: number
  insuranceDeduction: number
  personalIncomeTax: number
  unpaidLeaveDeduction: number
  grossPay: number
  netPay: number
}

export type OrgNodeType = 'senior_manager' | 'region' | 'department' | 'employee'
export type OrgChangeStatus = 'draft' | 'saved' | 'cancelled'

export interface OrgChange {
  id: string
  nodeType: OrgNodeType
  nodeId: string
  fromParentId: string
  toParentId: string
  effectiveDate: string
  note: string
  includeSubordinates: boolean
  requestedBy: string
  createdAt: string
  status: OrgChangeStatus
}

export type DataScope = 'company' | 'managed_regions' | 'department' | 'self' | 'finance'

export type Permission =
  | 'dashboard:view_company'
  | 'employees:view'
  | 'employees:edit'
  | 'employees:view_salary'
  | 'org:view'
  | 'org:edit'
  | 'approvals:level_1'
  | 'approvals:level_2'
  | 'approvals:final'
  | 'attendance:view'
  | 'payroll:manage'
  | 'profile:view_self'
  | 'leave:create'
  | 'kpi:score'

export interface RoleDefinition {
  id: EmployeeRole
  name: string
  description: string
  dataScope: DataScope
  permissions: readonly Permission[]
}
