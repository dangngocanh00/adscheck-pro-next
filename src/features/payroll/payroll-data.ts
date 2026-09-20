export type PayrollStatus = 'ready' | 'warning' | 'blocked'

export type PayrollRow = {
  employeeId: string
  code: string
  name: string
  team: string
  position: string
  base: number
  allowance: number
  commission: number
  insurance: number
  tax: number
  advance: number
  net: number
  variance: number
  status: PayrollStatus
  issue: string
  attendance: string
  bank: string
}

export const payrollPeriods = {
  '08/2026': {
    total: 2_918_420_000,
    people: 120,
    status: 'Đang đối soát',
    deadline: 'Còn 4 ngày',
    readiness: 86,
    exceptions: 7,
    blocked: 2,
    stage: 2,
    lastSync: '09:42 hôm nay',
  },
  '07/2026': {
    total: 2_856_130_000,
    people: 118,
    status: 'Đã phát hành',
    deadline: 'Hoàn tất 31/07',
    readiness: 100,
    exceptions: 0,
    blocked: 0,
    stage: 5,
    lastSync: '31/07/2026',
  },
} as const

export type PayrollPeriod = keyof typeof payrollPeriods

const augustRows: PayrollRow[] = [
  { employeeId: 'emp-023', code: 'FUN0023', name: 'Đỗ Thị Nhung', team: 'Support MKT', position: 'Support MKT', base: 17_000_000, allowance: 2_000_000, commission: 1_350_000, insurance: 1_650_000, tax: 220_000, advance: 0, net: 18_480_000, variance: 3.8, status: 'ready', issue: 'Đã khớp dữ liệu', attendance: '25,5 công · 4 giờ OT', bank: 'Vietcombank · •••• 2468' },
  { employeeId: 'emp-031', code: 'FUN0031', name: 'Nguyễn Minh Anh', team: 'MKT', position: 'MKT', base: 24_000_000, allowance: 2_400_000, commission: 3_800_000, insurance: 2_128_000, tax: 1_240_000, advance: 0, net: 26_832_000, variance: 6.2, status: 'warning', issue: 'Chờ xác nhận KPI chiến dịch', attendance: '25 công · 8 giờ OT', bank: 'Techcombank · •••• 8192' },
  { employeeId: 'emp-038', code: 'FUN0038', name: 'Phạm Quốc Huy', team: 'Sáng tạo', position: 'TK 2', base: 31_500_000, allowance: 3_150_000, commission: 4_600_000, insurance: 2_340_000, tax: 3_020_000, advance: 2_000_000, net: 31_890_000, variance: -1.4, status: 'ready', issue: 'Đã khớp dữ liệu', attendance: '26 công · 2 giờ OT', bank: 'ACB · •••• 5704' },
  { employeeId: 'emp-056', code: 'FUN0056', name: 'Trần Mai Chi', team: 'Sáng tạo', position: 'Design', base: 22_800_000, allowance: 1_850_000, commission: 2_350_000, insurance: 2_006_000, tax: 940_000, advance: 0, net: 24_054_000, variance: 4.7, status: 'blocked', issue: 'Thiếu tài khoản nhận lương', attendance: '24 công · 6 giờ OT', bank: 'Chưa cập nhật' },
  { employeeId: 'emp-072', code: 'FUN0072', name: 'Võ Khánh Linh', team: 'Vận hành', position: 'Vận hành', base: 18_600_000, allowance: 1_200_000, commission: 800_000, insurance: 1_846_000, tax: 180_000, advance: 0, net: 18_574_000, variance: 1.9, status: 'warning', issue: '1 ngày công cần giải trình', attendance: '24 công · 0 giờ OT', bank: 'MB Bank · •••• 1036' },
  { employeeId: 'emp-094', code: 'FUN0094', name: 'Lê Gia Hân', team: 'Support MKT', position: 'Support MKT', base: 16_800_000, allowance: 1_200_000, commission: 1_900_000, insurance: 1_680_000, tax: 230_000, advance: 0, net: 17_990_000, variance: 7.1, status: 'ready', issue: 'Đã khớp dữ liệu', attendance: '26 công · 5 giờ OT', bank: 'VietinBank · •••• 6621' },
]

const julyRows = augustRows.map((row) => {
  const base = Math.round(row.base * 0.98)
  const allowance = Math.round(row.allowance * 0.96)
  const commission = Math.round(row.commission * 0.82)
  const insurance = Math.round(row.insurance * 0.98)
  const tax = Math.round(row.tax * 0.9)
  return { ...row, base, allowance, commission, insurance, tax, advance: 0, net: base + allowance + commission - insurance - tax, variance: 0, status: 'ready' as const, issue: 'Đã phát hành' }
})

export const payrollRowsByPeriod: Record<PayrollPeriod, PayrollRow[]> = {
  '08/2026': augustRows,
  '07/2026': julyRows,
}

export const payrollStatusLabels: Record<PayrollStatus, string> = {
  ready: 'Sẵn sàng',
  warning: 'Cần kiểm tra',
  blocked: 'Bị chặn',
}

export const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value)

const escapeCsvCell = (value: string | number) => {
  const rawValue = String(value)
  const safeValue = typeof value === 'string' && /^[=+\-@]/.test(rawValue.trimStart()) ? `'${rawValue}` : rawValue
  return `"${safeValue.replaceAll('"', '""')}"`
}

export function downloadFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type }))
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0)
}

export function exportPayroll(period: PayrollPeriod, rows: PayrollRow[]) {
  const header = ['Mã NV', 'Nhân sự', 'Nhóm', 'Vị trí', 'Lương cơ bản', 'Phụ cấp', 'KPI/Hoa hồng', 'Khấu trừ', 'Thực lĩnh', 'Trạng thái']
  const body = rows.map((row) => [row.code, row.name, row.team, row.position, row.base, row.allowance, row.commission, row.insurance + row.tax + row.advance, row.net, payrollStatusLabels[row.status]])
  const csv = [header, ...body].map((row) => row.map(escapeCsvCell).join(',')).join('\n')
  downloadFile(`bang-luong-mau-${period.replace('/', '-')}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8')
}
