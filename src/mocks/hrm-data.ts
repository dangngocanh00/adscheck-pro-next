import type {
  ApprovalRequest,
  ApprovalStatus,
  ApprovalStep,
  AttendanceRecord,
  AttendanceStatus,
  Department,
  Employee,
  EmployeeRole,
  OrgChange,
  PayrollPeriod,
  PayrollPeriodStatus,
  PayrollSlip,
  Region,
  RoleDefinition,
} from '../types/hrm'

const pad = (value: number, size = 2): string => String(value).padStart(size, '0')
const employeeId = (index: number): string => `emp-${pad(index, 3)}`

export const regions: readonly Region[] = [
  { id: 'region-north', code: 'MB', name: 'Miền Bắc', colorToken: 'region-blue', seniorManagerId: 'emp-002' },
  { id: 'region-northeast', code: 'DB', name: 'Đông Bắc', colorToken: 'region-cyan', seniorManagerId: 'emp-002' },
  { id: 'region-central', code: 'MT', name: 'Miền Trung', colorToken: 'region-amber', seniorManagerId: 'emp-003' },
  { id: 'region-south', code: 'MN', name: 'Miền Nam', colorToken: 'region-emerald', seniorManagerId: 'emp-003' },
  { id: 'region-mekong', code: 'TNB', name: 'Tây Nam Bộ', colorToken: 'region-orange', seniorManagerId: 'emp-004' },
  { id: 'region-international', code: 'QT', name: 'Quốc tế', colorToken: 'region-violet', seniorManagerId: 'emp-004' },
]

export const departments: readonly Department[] = [
  { id: 'dept-001', code: 'MB-KD', name: 'Kinh doanh', regionId: 'region-north', leaderId: 'emp-005' },
  { id: 'dept-002', code: 'MB-MD', name: 'Media', regionId: 'region-north', leaderId: 'emp-006' },
  { id: 'dept-003', code: 'MB-ST', name: 'Sáng tạo', regionId: 'region-north', leaderId: 'emp-007' },
  { id: 'dept-004', code: 'DB-KD', name: 'Kinh doanh', regionId: 'region-northeast', leaderId: 'emp-008' },
  { id: 'dept-005', code: 'DB-CS', name: 'Chăm sóc khách hàng', regionId: 'region-northeast', leaderId: 'emp-009' },
  { id: 'dept-006', code: 'DB-VH', name: 'Vận hành', regionId: 'region-northeast', leaderId: 'emp-010' },
  { id: 'dept-007', code: 'MT-KD', name: 'Kinh doanh', regionId: 'region-central', leaderId: 'emp-011' },
  { id: 'dept-008', code: 'MT-CT', name: 'Content', regionId: 'region-central', leaderId: 'emp-012' },
  { id: 'dept-009', code: 'MT-MD', name: 'Media', regionId: 'region-central', leaderId: 'emp-013' },
  { id: 'dept-010', code: 'MN-AC', name: 'Account', regionId: 'region-south', leaderId: 'emp-014' },
  { id: 'dept-011', code: 'MN-MD', name: 'Media', regionId: 'region-south', leaderId: 'emp-015' },
  { id: 'dept-012', code: 'MN-SX', name: 'Sản xuất', regionId: 'region-south', leaderId: 'emp-016' },
  { id: 'dept-013', code: 'TNB-KD', name: 'Kinh doanh', regionId: 'region-mekong', leaderId: 'emp-017' },
  { id: 'dept-014', code: 'TNB-CS', name: 'Chăm sóc khách hàng', regionId: 'region-mekong', leaderId: 'emp-018' },
  { id: 'dept-015', code: 'TNB-VH', name: 'Vận hành', regionId: 'region-mekong', leaderId: 'emp-019' },
  { id: 'dept-016', code: 'QT-KD', name: 'Kinh doanh quốc tế', regionId: 'region-international', leaderId: 'emp-020' },
  { id: 'dept-017', code: 'QT-CN', name: 'Công nghệ', regionId: 'region-international', leaderId: 'emp-021' },
  { id: 'dept-018', code: 'QT-TCNS', name: 'Tài chính & Nhân sự', regionId: 'region-international', leaderId: 'emp-022' },
]

const executiveNames = [
  'Nguyễn Minh Quân', 'Trần Thu Hà', 'Lê Hoàng Nam', 'Phạm Ngọc Anh',
  'Vũ Đức Long', 'Đặng Thùy Linh', 'Bùi Gia Hân', 'Đỗ Quang Huy',
  'Hồ Thanh Mai', 'Ngô Tuấn Kiệt', 'Dương Hải Yến', 'Lý Quốc Bảo',
  'Mai Phương Thảo', 'Tạ Minh Khôi', 'Cao Khánh Vân', 'Chu Anh Dũng',
  'Trịnh Bảo Ngọc', 'Phan Nhật Minh', 'Võ Tường Vy', 'Đinh Tiến Đạt',
  'Nguyễn Thành Công', 'Trần Mỹ Duyên',
] as const

const familyNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ'] as const
const middleNames = ['Văn', 'Thị', 'Minh', 'Ngọc', 'Hoài', 'Đức', 'Thanh', 'Gia', 'Khánh', 'Hữu'] as const
const givenNames = [
  'An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hiếu', 'Huy', 'Khôi', 'Lan',
  'Linh', 'Long', 'Mai', 'Nam', 'Nga', 'Ngân', 'Nhung', 'Phúc', 'Phong', 'Quân',
  'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Trang', 'Trung', 'Tú', 'Uyên', 'Việt', 'Vy',
] as const

const generatedFullName = (index: number): string => {
  const family = familyNames[index % familyNames.length]
  const middle = middleNames[Math.floor(index / familyNames.length) % middleNames.length]
  const given = givenNames[(index * 7 + Math.floor(index / 4)) % givenNames.length]
  return `${family} ${middle} ${given}`
}

const avatarColors = ['2563EB', '7C3AED', '0891B2', '059669', 'D97706', 'DC2626'] as const

const createAvatar = (name: string, index: number): string => {
  const initials = name.split(' ').slice(-2).map((part) => part[0]).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#${avatarColors[index % avatarColors.length]}"/><text x="48" y="58" text-anchor="middle" font-family="Arial" font-size="30" font-weight="600" fill="white">${initials}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const positionCatalog = [
  'CEO', 'Quản lý', 'Leader', 'Tài nguyên 1', 'Tài nguyên 2', 'MKT', 'TK',
  'Vận hành', 'KT', 'VĐ', 'Design', 'BA', 'Tester', 'TK 2', 'Support MKT',
] as const

// Frequency mirrors the current Fun Agency roster supplied by the operator.
const staffPositionRoster = [
  'Tài nguyên 1', 'Tài nguyên 2',
  'MKT', 'MKT',
  'TK', 'TK', 'TK', 'TK', 'TK',
  'Vận hành', 'Vận hành',
  'KT', 'KT', 'KT',
  'VĐ', 'Design', 'BA', 'Tester',
  'TK 2', 'TK 2', 'TK 2', 'TK 2', 'TK 2',
  'Support MKT', 'Support MKT', 'Support MKT', 'Support MKT', 'Support MKT',
  'Support MKT', 'Support MKT', 'Support MKT', 'Support MKT', 'Support MKT',
  'Support MKT', 'Support MKT', 'Support MKT', 'Support MKT', 'Support MKT',
  'Support MKT', 'Support MKT', 'Support MKT', 'Support MKT',
] as const

const getAgencyPosition = (sequence: number): string =>
  staffPositionRoster[(sequence - 23) % staffPositionRoster.length]

const salaryForRole = (role: EmployeeRole, index: number) => {
  const ranges: Record<EmployeeRole, [number, number]> = {
    ceo: [85000000, 15000000],
    senior_manager: [48000000, 8000000],
    leader: [28000000, 5000000],
    hr: [18000000, 2500000],
    accountant: [19000000, 2500000],
    staff: [14000000, 2000000],
  }
  const [base, allowance] = ranges[role]
  return { base: base + (index % 5) * 1000000, allowance, effectiveFrom: '2026-01-01' }
}

const createEmployee = (index: number): Employee => {
  const id = employeeId(index)
  const fullName = executiveNames[index - 1] ?? generatedFullName(index)
  const staffDepartment = departments[(Math.max(index, 23) - 23) % departments.length]
  const isExecutive = index <= 4
  const isLeader = index >= 5 && index <= 22
  const assignedDepartment = isExecutive ? null : isLeader ? departments[index - 5] : staffDepartment
  const region = assignedDepartment ? regions.find((item) => item.id === assignedDepartment.regionId) ?? null : null
  const positionTitle = index === 1
    ? 'CEO'
    : index <= 4
      ? 'Quản lý'
      : isLeader
        ? 'Leader'
        : getAgencyPosition(index)
  const financeSequence = staffDepartment.id === 'dept-018' ? (index - 23) % 3 : -1
  const role: EmployeeRole = index === 1
    ? 'ceo'
    : index <= 4
      ? 'senior_manager'
      : isLeader
        ? 'leader'
        : financeSequence === 0
          ? 'accountant'
          : financeSequence === 2
            ? 'hr'
            : 'staff'
  const status = index % 37 === 0 ? 'resigned' : index % 29 === 0 ? 'on_leave' : index > 110 ? 'probation' : 'active'
  const gender = index % 2 === 0 ? 'female' : 'male'
  const managerId = index === 1
    ? null
    : index <= 4
      ? 'emp-001'
      : isLeader
        ? region?.seniorManagerId ?? 'emp-001'
        : staffDepartment.leaderId
  const isConcurrent = index === 8 || index === 14

  return {
    id,
    code: `FUN${pad(index, 4)}`,
    fullName,
    avatarUrl: createAvatar(fullName, index),
    email: `fun${pad(index, 3)}@funagency.vn`,
    phone: `09${pad((index * 7919) % 100000000, 8)}`,
    dob: `${1984 + (index % 17)}-${pad((index % 12) + 1)}-${pad((index % 27) + 1)}`,
    gender,
    regionId: region?.id ?? null,
    departmentId: assignedDepartment?.id ?? null,
    positionTitle,
    managerId,
    role,
    status,
    joinDate: status === 'probation' ? `2026-07-${pad((index % 20) + 1)}` : `${2018 + (index % 8)}-${pad((index % 12) + 1)}-${pad((index % 24) + 1)}`,
    ...(status === 'resigned' ? { resignationDate: `2026-07-${pad(12 + (index % 8))}` } : {}),
    contractType: status === 'probation' ? 'probation' : index % 4 === 0 ? 'fixed_term' : 'indefinite',
    salary: salaryForRole(role, index),
    ...(isConcurrent
      ? {
          isConcurrent: true,
          concurrentAssignments: [{
            departmentId: departments[(index + 4) % departments.length].id,
            positionTitle: 'Cố vấn chuyên môn',
            isDepartmentLeader: false,
          }],
        }
      : {}),
  }
}

export const employees: readonly Employee[] = Array.from({ length: 120 }, (_, index) => createEmployee(index + 1))

const approvalStatuses: readonly ApprovalStatus[] = ['pending', 'approved', 'pending', 'rejected', 'approved', 'cancelled']
const approvalReasons = [
  'Giải quyết việc gia đình', 'Khám sức khỏe định kỳ', 'Gặp khách hàng theo kế hoạch',
  'Điều chỉnh theo kết quả đánh giá', 'Mong muốn phát triển chuyên môn', 'Tham dự hội thảo ngành',
] as const

const createApprovalSteps = (
  requestIndex: number,
  status: ApprovalStatus,
  requester: Employee,
  submittedDay: number,
): readonly ApprovalStep[] => {
  const department = departments.find((item) => item.id === requester.departmentId)
  const region = regions.find((item) => item.id === requester.regionId)
  const approvers = [department?.leaderId ?? 'emp-005', region?.seniorManagerId ?? 'emp-002', 'emp-001'] as const
  const approvedThrough = status === 'approved' ? 3 : status === 'pending' ? Math.floor(requestIndex / 3) % 3 : status === 'rejected' ? 1 : 0

  return approvers.map((approverId, stepIndex) => {
    const level = (stepIndex + 1) as 1 | 2 | 3
    const isRejectedStep = status === 'rejected' && stepIndex === 1
    const isApprovedStep = stepIndex < approvedThrough
    const stepStatus = status === 'cancelled' || (status === 'rejected' && stepIndex > 1)
      ? 'skipped'
      : isRejectedStep
        ? 'rejected'
        : isApprovedStep
          ? 'approved'
          : 'waiting'

    return {
      id: `approval-${pad(requestIndex, 3)}-step-${level}`,
      level,
      approverId,
      approverRole: level === 1 ? 'leader' : level === 2 ? 'senior_manager' : 'ceo',
      status: stepStatus,
      actedAt: stepStatus === 'approved' || stepStatus === 'rejected' ? `2026-08-${pad(submittedDay + level)}T${pad(8 + level)}:30:00+07:00` : null,
      note: isRejectedStep ? 'Chưa đủ thông tin bàn giao công việc.' : stepStatus === 'approved' ? 'Đã kiểm tra và đồng ý.' : null,
    }
  })
}

const createApprovalRequest = (offset: number): ApprovalRequest => {
  const requestIndex = offset + 1
  const requester = employees[22 + ((offset * 7) % 98)]
  const types = ['leave', 'business_trip', 'salary_increase', 'transfer'] as const
  const type = types[offset % types.length]
  const status = approvalStatuses[offset % approvalStatuses.length]
  const startDay = (offset % 20) + 5
  const submittedDay = (offset % 14) + 1
  const numberOfDays = type === 'leave' || type === 'business_trip' ? (offset % 3) + 1 : 0
  const targetDepartment = departments[(offset + 5) % departments.length]
  const titles = {
    leave: 'Đơn xin nghỉ phép',
    business_trip: 'Đề nghị công tác',
    salary_increase: 'Đề nghị điều chỉnh lương',
    transfer: 'Đề nghị điều chuyển bộ phận',
  } as const

  const baseRequest = {
    id: `approval-${pad(requestIndex, 3)}`,
    code: `DX-2026-${pad(requestIndex, 3)}`,
    type,
    requesterId: requester.id,
    title: titles[type],
    reason: approvalReasons[offset % approvalReasons.length],
    status,
    submittedAt: `2026-08-${pad(submittedDay)}T${pad(8 + (offset % 9))}:15:00+07:00`,
    steps: createApprovalSteps(requestIndex, status, requester, submittedDay),
  }

  if (type === 'leave') {
    return { ...baseRequest, type, startDate: `2026-08-${pad(startDay)}`, endDate: `2026-08-${pad(startDay + numberOfDays - 1)}`, numberOfDays }
  }
  if (type === 'business_trip') {
    return { ...baseRequest, type, startDate: `2026-08-${pad(startDay)}`, endDate: `2026-08-${pad(startDay + numberOfDays - 1)}`, numberOfDays, destination: ['Hà Nội', 'Đà Nẵng', 'TP. Hồ Chí Minh'][offset % 3] }
  }
  if (type === 'salary_increase') {
    return { ...baseRequest, type, effectiveDate: `2026-09-${pad((offset % 20) + 1)}`, amount: 1500000 + (offset % 4) * 500000 }
  }
  return { ...baseRequest, type, effectiveDate: `2026-09-${pad((offset % 20) + 1)}`, targetDepartmentId: targetDepartment.id }
}

export const approvalRequests: readonly ApprovalRequest[] = Array.from({ length: 30 }, (_, offset) => createApprovalRequest(offset))

const workingDaysInJuly = Array.from({ length: 31 }, (_, index) => index + 1).filter((day) => {
  const weekday = new Date(`2026-07-${pad(day)}T00:00:00Z`).getUTCDay()
  return weekday !== 0 && weekday !== 6
})

export const attendanceRecords: readonly AttendanceRecord[] = employees.flatMap((employee, employeeIndex) =>
  workingDaysInJuly.filter((day) => {
    const date = `2026-07-${pad(day)}`
    return date >= employee.joinDate && (!employee.resignationDate || date <= employee.resignationDate)
  }).map((day, dayIndex) => {
    const selector = employeeIndex * 31 + dayIndex
    const status: AttendanceStatus = selector % 71 === 0
      ? 'absent'
      : selector % 43 === 0
        ? 'paid_leave'
        : selector % 17 === 0
          ? 'remote'
          : selector % 11 === 0
            ? 'late'
            : selector % 19 === 0
              ? 'early_leave'
              : 'present'
    const hasCheckTime = status !== 'absent' && status !== 'paid_leave'
    const lateMinutes = status === 'late' ? 12 + (selector % 24) : 0
    const earlyMinutes = status === 'early_leave' ? 20 : 0
    const checkInMinutes = 8 * 60 + 30 + lateMinutes
    const checkOutMinutes = 17 * 60 + 30 - earlyMinutes

    return {
      id: `att-${employee.id}-202607${pad(day)}`,
      employeeId: employee.id,
      date: `2026-07-${pad(day)}`,
      checkIn: hasCheckTime ? `${pad(Math.floor(checkInMinutes / 60))}:${pad(checkInMinutes % 60)}` : null,
      checkOut: hasCheckTime ? `${pad(Math.floor(checkOutMinutes / 60))}:${pad(checkOutMinutes % 60)}` : null,
      workingMinutes: hasCheckTime ? checkOutMinutes - checkInMinutes - 60 : 0,
      overtimeMinutes: selector % 13 === 0 ? 60 + (selector % 3) * 30 : 0,
      status,
      note: status === 'late' ? 'Kẹt xe, đã báo quản lý.' : status === 'remote' ? 'Làm việc từ xa theo lịch.' : null,
    }
  }),
)

interface PayrollPeriodSeed {
  id: string
  code: string
  month: string
  startDate: string
  endDate: string
  payDate: string
  status: PayrollPeriodStatus
}

const payrollPeriodSeeds: readonly PayrollPeriodSeed[] = [
  { id: 'payroll-2026-06', code: 'BL-2026-06', month: '06', startDate: '2026-06-01', endDate: '2026-06-30', payDate: '2026-07-05', status: 'paid' },
  { id: 'payroll-2026-07', code: 'BL-2026-07', month: '07', startDate: '2026-07-01', endDate: '2026-07-31', payDate: '2026-08-05', status: 'finalized' },
]

const createPayrollSlips = (period: PayrollPeriodSeed, periodOffset: number): readonly PayrollSlip[] => employees
  .filter((employee) => employee.joinDate <= period.endDate && (!employee.resignationDate || employee.resignationDate >= period.startDate))
  .map((employee, index) => {
  const salary = employee.salary ?? { base: 0, allowance: 0 }
  const periodDays = Number(period.endDate.slice(-2))
  const employmentStartDay = employee.joinDate > period.startDate ? Number(employee.joinDate.slice(-2)) : 1
  const employmentEndDay = employee.resignationDate && employee.resignationDate < period.endDate ? Number(employee.resignationDate.slice(-2)) : periodDays
  const employmentRatio = Math.max(employmentEndDay - employmentStartDay + 1, 0) / periodDays
  const proratedBaseSalary = Math.round(salary.base * employmentRatio)
  const proratedAllowance = Math.round(salary.allowance * employmentRatio)
  const overtimePay = ((index + periodOffset) % 4) * 450000
  const bonus = (index + periodOffset) % 10 === 0 ? 2000000 : 0
  const insuranceDeduction = Math.round(Math.min(proratedBaseSalary, 36000000) * 0.105)
  const unpaidLeaveDeduction = (index + periodOffset) % 31 === 0 ? Math.round(proratedBaseSalary / 26) : 0
  const grossPay = proratedBaseSalary + proratedAllowance + overtimePay + bonus
  const taxableIncome = Math.max(grossPay - insuranceDeduction - 11000000, 0)
  const personalIncomeTax = Math.round(taxableIncome * 0.05)
  const netPay = grossPay - insuranceDeduction - personalIncomeTax - unpaidLeaveDeduction

  return {
    id: `slip-${period.id}-${employee.id}`,
    payrollPeriodId: period.id,
    employeeId: employee.id,
    baseSalary: proratedBaseSalary,
    allowance: proratedAllowance,
    overtimePay,
    bonus,
    insuranceDeduction,
    personalIncomeTax,
    unpaidLeaveDeduction,
    grossPay,
    netPay,
  }
})

export const payrollSlips: readonly PayrollSlip[] = payrollPeriodSeeds.flatMap((period, index) => createPayrollSlips(period, index))

export const payrollPeriods: readonly PayrollPeriod[] = payrollPeriodSeeds.map((period) => {
  const periodSlips = payrollSlips.filter((slip) => slip.payrollPeriodId === period.id)
  return {
    id: period.id,
    code: period.code,
    name: `Kỳ lương tháng ${period.month}/2026`,
    startDate: period.startDate,
    endDate: period.endDate,
    payDate: period.payDate,
    status: period.status,
    totalGross: periodSlips.reduce((sum, slip) => sum + slip.grossPay, 0),
    totalNet: periodSlips.reduce((sum, slip) => sum + slip.netPay, 0),
    employeeCount: periodSlips.length,
  }
})

export const orgChangeHistory: readonly OrgChange[] = [
  {
    id: 'org-change-001', nodeType: 'department', nodeId: 'dept-009',
    fromParentId: 'region-north', toParentId: 'region-central', effectiveDate: '2026-01-01',
    note: 'Điều chỉnh vùng phụ trách theo kế hoạch kinh doanh 2026.', includeSubordinates: true,
    requestedBy: 'emp-001', createdAt: '2025-12-20T09:00:00+07:00', status: 'saved',
  },
  {
    id: 'org-change-002', nodeType: 'employee', nodeId: 'emp-047',
    fromParentId: 'dept-001', toParentId: 'dept-007', effectiveDate: '2026-04-15',
    note: 'Điều chuyển theo định hướng chuyên môn Media.', includeSubordinates: false,
    requestedBy: 'emp-003', createdAt: '2026-04-08T14:20:00+07:00', status: 'saved',
  },
  {
    id: 'org-change-003', nodeType: 'region', nodeId: 'region-mekong',
    fromParentId: 'emp-003', toParentId: 'emp-004', effectiveDate: '2026-07-01',
    note: 'Cân đối lại phạm vi quản lý cấp cao.', includeSubordinates: true,
    requestedBy: 'emp-001', createdAt: '2026-06-23T10:10:00+07:00', status: 'saved',
  },
]

export const roleDefinitions: readonly RoleDefinition[] = [
  { id: 'ceo', name: 'CEO', description: 'Quản trị và duyệt cuối toàn công ty', dataScope: 'company', permissions: ['dashboard:view_company', 'employees:view', 'employees:edit', 'employees:view_salary', 'org:view', 'org:edit', 'approvals:final', 'attendance:view'] },
  { id: 'senior_manager', name: 'Quản lý cấp cao', description: 'Quản lý các vùng được phân công', dataScope: 'managed_regions', permissions: ['employees:view', 'employees:edit', 'org:view', 'org:edit', 'approvals:level_2', 'attendance:view', 'kpi:score'] },
  { id: 'leader', name: 'Leader bộ phận', description: 'Quản lý trực tiếp một bộ phận', dataScope: 'department', permissions: ['employees:view', 'org:view', 'approvals:level_1', 'attendance:view', 'kpi:score'] },
  { id: 'hr', name: 'Nhân sự', description: 'Quản trị hồ sơ nhân sự toàn công ty', dataScope: 'company', permissions: ['dashboard:view_company', 'employees:view', 'employees:edit', 'employees:view_salary', 'org:view', 'attendance:view'] },
  { id: 'accountant', name: 'Kế toán / C&B', description: 'Quản trị dữ liệu tài chính và bảng lương', dataScope: 'finance', permissions: ['employees:view', 'employees:view_salary', 'payroll:manage'] },
  { id: 'staff', name: 'Nhân viên', description: 'Truy cập dữ liệu cá nhân', dataScope: 'self', permissions: ['profile:view_self', 'leave:create', 'org:view'] },
]

export const hrmMockData = {
  employees,
  regions,
  departments,
  approvalRequests,
  attendanceRecords,
  payrollPeriods,
  payrollSlips,
  orgChangeHistory,
  roleDefinitions,
} as const
