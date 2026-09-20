import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  FileSignature,
  HeartHandshake,
  PackageCheck,
} from 'lucide-react'

export type HrCenterModuleId =
  | 'lifecycle'
  | 'schedules'
  | 'contracts'
  | 'assets'
  | 'reports'
  | 'experience'

export interface HrCenterModule {
  id: HrCenterModuleId
  label: string
  description: string
  metric: string
  metricLabel: string
  icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'purple'
}

export const hrCenterModules: readonly HrCenterModule[] = [
  {
    id: 'lifecycle',
    label: 'Vòng đời nhân sự',
    description: 'Onboarding, thử việc, chính thức và offboarding.',
    metric: '11',
    metricLabel: 'hành trình đang mở',
    icon: BriefcaseBusiness,
    tone: 'blue',
  },
  {
    id: 'schedules',
    label: 'Ca làm & lịch',
    description: 'Phân ca, công bố lịch và xử lý đổi ca.',
    metric: '94,8%',
    metricLabel: 'ca đã được phủ',
    icon: CalendarRange,
    tone: 'green',
  },
  {
    id: 'contracts',
    label: 'Hợp đồng',
    description: 'Phiên bản, phụ lục và cảnh báo hết hạn.',
    metric: '07',
    metricLabel: 'hợp đồng cần xử lý',
    icon: FileSignature,
    tone: 'orange',
  },
  {
    id: 'assets',
    label: 'Tài sản',
    description: 'Bàn giao, thu hồi và lịch sử sử dụng.',
    metric: '126',
    metricLabel: 'tài sản đang cấp phát',
    icon: PackageCheck,
    tone: 'purple',
  },
  {
    id: 'reports',
    label: 'Báo cáo',
    description: 'Biến động, chi phí và chất lượng dữ liệu.',
    metric: '18',
    metricLabel: 'chỉ số realtime',
    icon: BarChart3,
    tone: 'blue',
  },
  {
    id: 'experience',
    label: 'Trải nghiệm nhân viên',
    description: 'Tin nội bộ, ghi nhận và khảo sát nhanh.',
    metric: '78%',
    metricLabel: 'mức độ tham gia',
    icon: HeartHandshake,
    tone: 'green',
  },
]

export const contractRows = [
  { code: 'HĐ-0089', employeeId: 'emp-004', name: 'Phạm Ngọc Anh', type: 'Xác định thời hạn', expires: '29/08/2026', remaining: '5 ngày', status: 'Cần gia hạn' },
  { code: 'HĐ-0064', employeeId: 'emp-005', name: 'Vũ Đức Long', type: 'Xác định thời hạn', expires: '04/09/2026', remaining: '11 ngày', status: 'Chờ quản lý' },
  { code: 'TV-0102', employeeId: 'emp-014', name: 'Tạ Minh Khôi', type: 'Thử việc', expires: '08/09/2026', remaining: '15 ngày', status: 'Chờ đánh giá' },
]

export const assetRows = [
  { code: 'FA-MAC-042', asset: 'MacBook Air M3 · 16GB', holder: 'Nguyễn Hải Anh', state: 'Đang sử dụng', handover: '18/08/2026' },
  { code: 'FA-CAM-011', asset: 'Sony A7 IV · Body', holder: 'Kho Media', state: 'Sẵn sàng', handover: '—' },
  { code: 'FA-MIC-029', asset: 'DJI Mic 2 · Combo', holder: 'Lê Ngọc Hà', state: 'Chờ thu hồi', handover: '30/08/2026' },
]

export const schedulePeople = [
  { name: 'Hồ Thanh Mai', role: 'Leader · CSKH', shifts: ['Sáng', 'Sáng', 'Nghỉ', 'Sáng', 'Sáng', 'Sáng'] },
  { name: 'Phạm Minh Ngân', role: 'TK · CSKH', shifts: ['Chiều', 'Chiều', 'Chiều', 'Nghỉ', 'Chiều', 'Chiều'] },
  { name: 'Nguyễn Ngọc Sơn', role: 'KT · Vận hành', shifts: ['HC', 'HC', 'HC', 'HC', 'Nghỉ', 'Nghỉ'] },
  { name: 'Trần Ngọc Việt', role: 'VĐ · Vận hành', shifts: ['Tối', 'Tối', 'Nghỉ', 'Tối', 'Tối', 'Tối'] },
]

export const reportBarsByPeriod = {
  'Tháng 08': [
    { label: 'Tuyển mới', value: 68, amount: '8 người' },
    { label: 'Hoàn tất onboarding', value: 84, amount: '11/13' },
    { label: 'Đúng hạn hợp đồng', value: 92, amount: '113/120' },
    { label: 'Hồ sơ đủ dữ liệu', value: 86, amount: '103/120' },
  ],
  'Quý 3': [
    { label: 'Tuyển mới', value: 76, amount: '19 người' },
    { label: 'Hoàn tất onboarding', value: 89, amount: '24/27' },
    { label: 'Đúng hạn hợp đồng', value: 95, amount: '337/354' },
    { label: 'Hồ sơ đủ dữ liệu', value: 91, amount: '109/120' },
  ],
  '12 tháng': [
    { label: 'Tuyển mới', value: 82, amount: '47 người' },
    { label: 'Hoàn tất onboarding', value: 93, amount: '52/56' },
    { label: 'Đúng hạn hợp đồng', value: 97, amount: '468/482' },
    { label: 'Hồ sơ đủ dữ liệu', value: 96, amount: '115/120' },
  ],
} as const

export type ReportPeriod = keyof typeof reportBarsByPeriod
