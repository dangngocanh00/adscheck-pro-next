import { Download, LockKeyhole } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { PayrollOverview, type PayrollStatusFilter } from '@/features/payroll/payroll-overview'
import { PayslipBody, PersonalPayslip } from '@/features/payroll/payslip-panel'
import { downloadFile, exportPayroll, formatVnd, payrollPeriods, payrollRowsByPeriod, type PayrollPeriod, type PayrollRow } from '@/features/payroll/payroll-data'
import { canViewSalary, demoViewerEmployeeId, useAppStore } from '@/store/app-store'

export default function PayrollPage() {
  const role = useAppStore((state) => state.role)
  const showToast = useAppStore((state) => state.showToast)
  const [period, setPeriod] = useState<PayrollPeriod>('08/2026')
  const [selected, setSelected] = useState<PayrollRow | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PayrollStatusFilter>('all')
  const rows = payrollRowsByPeriod[period]
  const personalPeriod = (Object.keys(payrollPeriods) as PayrollPeriod[])
    .filter((value) => payrollPeriods[value].stage === 5)
    .sort((a, b) => periodSortValue(b) - periodSortValue(a))[0] ?? '07/2026'
  const personalRows = payrollRowsByPeriod[personalPeriod]
  const personalRow = personalRows.find((row) => row.employeeId === demoViewerEmployeeId)

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    return rows.filter((row) => {
      const matchesSearch = !keyword || `${row.code} ${row.name} ${row.team} ${row.position}`.toLocaleLowerCase('vi').includes(keyword)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'issues' ? row.status !== 'ready' : row.status === statusFilter)
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  if (role === 'staff') {
    if (!personalRow) return <section className="surface permission-state"><h1>Chưa có phiếu lương</h1><p>Không tìm thấy phiếu lương đã phát hành cho tài khoản hiện tại.</p></section>
    return <PersonalPayslip row={personalRow} period={personalPeriod} onDownload={() => {
      downloadFile(`phieu-luong-ca-nhan-${personalPeriod.replace('/', '-')}.txt`, createPayslipText(personalRow, personalPeriod))
      showToast('Đã tải phiếu lương cá nhân')
    }}/>
  }

  if (!canViewSalary(role)) return <section className="surface permission-state"><div><LockKeyhole size={28}/></div><h1>Không có quyền xem bảng lương</h1><p>Vai trò hiện tại không thuộc phạm vi tài chính. Các trường được khóa để bảo vệ dữ liệu thu nhập.</p><div className="locked-field"><LockKeyhole size={15}/>Lương cơ bản · Không có quyền xem</div><div className="locked-field"><LockKeyhole size={15}/>Phụ cấp · Không có quyền xem</div></section>

  const exportTable = () => {
    exportPayroll(period, filteredRows)
    showToast(`Đã tải ${filteredRows.length} dòng dữ liệu lương mẫu`)
  }

  return <>
    <PayrollOverview period={period} setPeriod={setPeriod} rows={rows} filteredRows={filteredRows} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onSelect={setSelected} onExport={exportTable} onSubmit={() => {
      if (payrollPeriods[period].blocked > 0) {
        setStatusFilter('blocked')
        document.getElementById('payroll-reconciliation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        showToast(`Đang hiển thị hồ sơ bị chặn trong ${payrollPeriods[period].blocked} hồ sơ toàn kỳ`)
        return
      }
      showToast('Đã gửi kỳ lương sang bước phê duyệt')
    }}/>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `Phiếu lương · ${selected.name}` : 'Phiếu lương'} description={`Kỳ lương ${period} · Thông tin thu nhập bảo mật.`} size="lg" footer={<><button className="btn btn-secondary" onClick={() => setSelected(null)}>Đóng</button><button className="btn btn-primary" onClick={() => { if (selected) { downloadFile(`phieu-luong-${selected.code}-${period.replace('/', '-')}.txt`, createPayslipText(selected, period)); showToast('Đã tải phiếu lương') } }}><Download size={16}/>Tải phiếu</button></>}>
      {selected && <PayslipBody row={selected} period={period}/>} 
    </Modal>
  </>
}

function createPayslipText(row: PayrollRow, period: PayrollPeriod) {
  return `FUN AGENCY\nPHIẾU LƯƠNG ${period}\n${row.name} (${row.code})\nLương cơ bản: ${formatVnd(row.base)}\nPhụ cấp: ${formatVnd(row.allowance)}\nKPI/Hoa hồng: ${formatVnd(row.commission)}\nBảo hiểm và thuế: ${formatVnd(row.insurance + row.tax)}\nTạm ứng: ${formatVnd(row.advance)}\nThực lĩnh: ${formatVnd(row.net)}`
}

function periodSortValue(period: PayrollPeriod) {
  const [month, year] = period.split('/').map(Number)
  return year * 12 + month
}
