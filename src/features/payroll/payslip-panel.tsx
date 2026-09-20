import { BadgeCheck, Banknote, BriefcaseBusiness, CalendarDays, CheckCircle2, FileCheck2, Landmark, TrendingDown, TrendingUp } from 'lucide-react'
import { formatVnd, type PayrollPeriod, type PayrollRow } from './payroll-data'

export function PayslipBody({ row, period }: { row: PayrollRow; period: PayrollPeriod }) {
  const income = row.base + row.allowance + row.commission
  const deductions = row.insurance + row.tax + row.advance

  return <div className="payslip-detail">
    <div className="payslip-brand"><span>FA</span><div><strong>FUN AGENCY</strong><small>Phiếu lương điện tử · Kỳ {period}</small></div><FileCheck2 size={26}/></div>
    <section className="payslip-person-card">
      <div className="payslip-avatar">{row.name.split(' ').slice(-2).map((part) => part[0]).join('')}</div>
      <div><span>{row.code}</span><h3>{row.name}</h3><p>{row.position} · {row.team}</p></div>
      <span className={`payroll-row-status ${row.status}`}><i/><strong>{row.issue}</strong></span>
    </section>
    <div className="payslip-summary-grid">
      <div><span>Tổng thu nhập</span><strong>{formatVnd(income)}</strong></div>
      <div><span>Tổng khấu trừ</span><strong>− {formatVnd(deductions)}</strong></div>
      <div className="primary"><span>Thực lĩnh</span><strong>{formatVnd(row.net)}</strong></div>
    </div>
    <div className="payslip-detail-grid">
      <section className="payslip-breakdown">
        <header><div><span className="page-eyebrow">Cấu phần lương</span><h3>Thu nhập và khấu trừ</h3></div><BadgeCheck size={20}/></header>
        <BreakdownLine label="Lương cơ bản" value={row.base}/>
        <BreakdownLine label="Phụ cấp" value={row.allowance} positive/>
        <BreakdownLine label="KPI / Hoa hồng chiến dịch" value={row.commission} positive/>
        <BreakdownLine label="BHXH · BHYT · BHTN" value={row.insurance} negative/>
        <BreakdownLine label="Thuế TNCN" value={row.tax} negative/>
        {row.advance > 0 && <BreakdownLine label="Tạm ứng" value={row.advance} negative/>}
        <div className="payslip-total"><span>Thực lĩnh</span><strong>{formatVnd(row.net)}</strong></div>
      </section>
      <aside className="payslip-sources">
        <div><CalendarDays size={17}/><span><small>Dữ liệu công</small><strong>{row.attendance}</strong></span></div>
        <div><BriefcaseBusiness size={17}/><span><small>Nguồn KPI</small><strong>Campaign tracker · Đã khóa</strong></span></div>
        <div><Landmark size={17}/><span><small>Tài khoản nhận lương</small><strong>{row.bank}</strong></span></div>
        <div><Banknote size={17}/><span><small>So với kỳ trước</small><strong className={row.variance < 0 ? 'negative' : 'positive'}>{row.variance < 0 ? <TrendingDown size={14}/> : <TrendingUp size={14}/>} {row.variance > 0 ? '+' : ''}{row.variance.toLocaleString('vi-VN')}%</strong></span></div>
      </aside>
    </div>
    <p className="payslip-confirm"><CheckCircle2 size={17}/>Số liệu demo đã được đối chiếu giữa bảng công, KPI chiến dịch và hồ sơ nhân sự.</p>
  </div>
}

function BreakdownLine({ label, value, positive, negative }: { label: string; value: number; positive?: boolean; negative?: boolean }) {
  return <div className="payslip-line"><span>{label}</span><strong className={negative ? 'negative' : positive ? 'positive' : ''}>{negative ? '− ' : positive ? '+ ' : ''}{formatVnd(value)}</strong></div>
}

export function PersonalPayslip({ row, period, onDownload }: { row: PayrollRow; period: PayrollPeriod; onDownload: () => void }) {
  const income = row.base + row.allowance + row.commission
  const incomeRatio = (value: number) => income > 0 ? value / income : 0
  const varianceDirection = row.variance > 0 ? 'increase' : row.variance < 0 ? 'decrease' : 'neutral'
  const varianceLabel = varianceDirection === 'increase' ? 'Tăng' : varianceDirection === 'decrease' ? 'Giảm' : 'Không đổi'

  return <div className="payroll-page personal-payroll-page">
    <div className="page-heading payroll-heading"><div><span className="page-eyebrow">Không gian cá nhân</span><h1>Phiếu lương của tôi</h1><p>Dữ liệu thu nhập chỉ hiển thị cho chính bạn.</p></div><button className="btn btn-secondary" onClick={onDownload}><FileCheck2 size={16}/>Tải phiếu lương</button></div>
    <section className="personal-payroll-hero">
      <div><span className="badge badge-success">Đã phát hành · {period}</span><p>Thực lĩnh tháng này</p><h2>{formatVnd(row.net)}</h2><span className={`personal-variance ${varianceDirection}`}>{varianceDirection === 'decrease' ? <TrendingDown size={15}/> : <TrendingUp size={15}/>} {varianceLabel} {Math.abs(row.variance).toLocaleString('vi-VN')}% so với tháng trước</span></div>
      <div className="personal-payroll-bars" aria-label="Cơ cấu thu nhập"><span><i style={{ transform: `scaleX(${incomeRatio(row.base)})` }}/><small>Lương cơ bản</small><b>{formatVnd(row.base)}</b></span><span><i style={{ transform: `scaleX(${incomeRatio(row.allowance)})` }}/><small>Phụ cấp</small><b>{formatVnd(row.allowance)}</b></span><span><i style={{ transform: `scaleX(${incomeRatio(row.commission)})` }}/><small>KPI / Hoa hồng</small><b>{formatVnd(row.commission)}</b></span></div>
    </section>
    <div className="personal-payroll-grid">
      <section className="surface panel-padding"><div className="section-title"><div><h2>Chi tiết phiếu lương</h2><p className="muted">{row.name} · {row.code}</p></div><span className="badge"><FileCheck2 size={13}/>Đã xác nhận</span></div><div className="payslip-lines"><BreakdownLine label="Lương cơ bản" value={row.base}/><BreakdownLine label="Phụ cấp" value={row.allowance} positive/><BreakdownLine label="KPI / Hoa hồng" value={row.commission} positive/><BreakdownLine label="Bảo hiểm và thuế" value={row.insurance + row.tax} negative/></div></section>
      <aside className="surface personal-payroll-note"><CheckCircle2 size={22}/><div><h3>Dữ liệu đã đối soát</h3><p>Bảng công, KPI và thông tin tài khoản đã được khóa cho kỳ này.</p><span>{row.attendance}</span><span>{row.bank}</span></div></aside>
    </div>
  </div>
}
