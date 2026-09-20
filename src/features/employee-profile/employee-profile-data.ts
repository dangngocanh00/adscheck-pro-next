import type { Employee } from '@/types/hrm'

export interface ProfileDocument {
  id: string
  name: string
  type: string
  updatedAt: string
  status: 'verified' | 'expiring' | 'missing' | 'draft' | 'waiting'
}

export interface ProfileTimelineItem {
  id: string
  date: string
  title: string
  description: string
  kind: 'join' | 'contract' | 'transfer' | 'review'
}

export interface EmployeeProfileData {
  address: string
  identityNumber: string
  identityIssuedAt: string
  identityIssuedBy: string
  personalEmail: string
  emergencyContact: string
  emergencyPhone: string
  taxCode: string
  socialInsuranceNumber: string
  insuranceStatus: 'active' | 'pending'
  bankName: string
  bankAccount: string
  bankBranch: string
  annualLeaveTotal: number
  annualLeaveUsed: number
  dependents: number
  completion: number
  documents: readonly ProfileDocument[]
  timeline: readonly ProfileTimelineItem[]
}

const profileAddresses = [
  'Cầu Giấy, Hà Nội',
  'Thanh Xuân, Hà Nội',
  'Hải Châu, Đà Nẵng',
  'Bình Thạnh, TP. Hồ Chí Minh',
] as const

export function createEmployeeProfileData(employee: Employee): EmployeeProfileData {
  const sequence = Number(employee.code.replace(/\D/g, '')) || 1
  const contractStart = employee.status === 'probation' ? employee.joinDate : '2025-08-01'
  const completion = sequence % 7 === 0 ? 78 : sequence % 5 === 0 ? 92 : 86

  return {
    address: profileAddresses[sequence % profileAddresses.length],
    identityNumber: `00120${String(sequence * 7919).padStart(7, '0').slice(-7)}`,
    identityIssuedAt: '2021-06-18',
    identityIssuedBy: 'Cục Cảnh sát QLHC về TTXH',
    personalEmail: `${employee.fullName.toLocaleLowerCase('vi').replaceAll(' ', '.')}@gmail.com`,
    emergencyContact: sequence % 2 === 0 ? 'Nguyễn Thu Hương · Chị gái' : 'Trần Minh Hải · Anh trai',
    emergencyPhone: `098${String(sequence * 3187).padStart(7, '0').slice(-7)}`,
    taxCode: `879${String(sequence * 1297).padStart(7, '0').slice(-7)}`,
    socialInsuranceNumber: `BH${String(1000000000 + sequence * 887).slice(-10)}`,
    insuranceStatus: sequence % 9 === 0 ? 'pending' : 'active',
    bankName: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)',
    bankAccount: `1903${String(sequence * 9389).padStart(10, '0').slice(-10)}`,
    bankBranch: completion < 85 ? 'Chưa bổ sung' : 'Hội sở Hà Nội',
    annualLeaveTotal: 12,
    annualLeaveUsed: 5 + (sequence % 3),
    dependents: sequence % 3,
    completion,
    documents: [
      { id: 'doc-identity', name: 'Căn cước công dân.pdf', type: 'Giấy tờ định danh', updatedAt: '12/08/2026', status: 'verified' },
      { id: 'doc-contract', name: `Hợp đồng lao động_${employee.code}.pdf`, type: 'Hợp đồng', updatedAt: '01/08/2025', status: 'verified' },
      { id: 'doc-degree', name: 'Bằng cấp chuyên môn.pdf', type: 'Bằng cấp', updatedAt: '04/06/2023', status: completion < 85 ? 'missing' : 'verified' },
      { id: 'doc-health', name: 'Giấy khám sức khỏe.pdf', type: 'Hồ sơ sức khỏe', updatedAt: '20/09/2025', status: 'expiring' },
    ],
    timeline: [
      { id: 'history-join', date: employee.joinDate, title: 'Gia nhập Fun Agency', description: `Bắt đầu làm việc với vị trí ${employee.positionTitle}.`, kind: 'join' },
      { id: 'history-contract', date: contractStart, title: 'Cập nhật hợp đồng', description: 'Hợp đồng lao động và chính sách thu nhập có hiệu lực.', kind: 'contract' },
      { id: 'history-transfer', date: '2026-04-01', title: 'Cập nhật cơ cấu', description: 'Điều chuyển bộ phận, giữ nguyên lịch sử phân công trước đó.', kind: 'transfer' },
      { id: 'history-review', date: '2026-07-30', title: 'Đánh giá định kỳ', description: 'Hoàn tất đánh giá 6 tháng đầu năm, xếp loại Tốt.', kind: 'review' },
    ],
  }
}
