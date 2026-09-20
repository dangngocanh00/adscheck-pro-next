import { AlertTriangle, Banknote, CalendarClock, Check, ChevronRight, CircleAlert, Search, ShieldCheck, UsersRound } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { formatVnd, payrollPeriods, payrollStatusLabels, type PayrollPeriod, type PayrollRow, type PayrollStatus } from './payroll-data'

export type PayrollStatusFilter = 'all' | 'issues' | PayrollStatus

const workflowSteps = ['Nhập dữ liệu', 'Đối soát', 'Duyệt', 'Chốt kỳ', 'Phát hành']

type PayrollOverviewProps = {
  period: PayrollPeriod
  setPeriod: (period: PayrollPeriod) => void
  rows: PayrollRow[]
  filteredRows: PayrollRow[]
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  statusFilter: PayrollStatusFilter
  setStatusFilter: Dispatch<SetStateAction<PayrollStatusFilter>>
  onSelect: (row: PayrollRow) => void
  onExport: () => void
  onSubmit: () => void
}

export function PayrollOverview({ period, setPeriod, rows, filteredRows, search, setSearch, statusFilter, setStatusFilter, onSelect, onExport, onSubmit }: PayrollOverviewProps) {
  const periodData = payrollPeriods[period]
  const warningCount = rows.filter((row) => row.status !== 'ready').length
  const payrollGrowth = period === '08/2026' ? ((payrollPeriods['08/2026'].total / payrollPeriods['07/2026'].total - 1) * 100).toFixed(1) : '0,0'

  return <div className="payroll-page">
    <div className="page-heading payroll-heading">
      <div><span className="page-eyebrow">Tài chính nhân sự</span><h1>Trung tâm bảng lương</h1><p>Theo dõi độ sẵn sàng, xử lý ngoại lệ và phát hành phiếu lương.</p></div>
      <button className="btn btn-secondary" onClick={onExport}><DownloadIcon/>Xuất dữ liệu mẫu</button>
    </div>

    <section className="payroll-command" aria-labelledby="payroll-command-title">
      <div className="payroll-command-main">
        <div className="payroll-period-caption"><span className="payroll-live-dot"/><span>Kỳ {period}</span><span>{periodData.status}</span></div>
        <h2 id="payroll-command-title">{formatVnd(periodData.total)}</h2>
        <p>Tổng thực lĩnh dự kiến cho <strong>{periodData.people} nhân sự</strong>. Đồng bộ gần nhất lúc {periodData.lastSync}.</p>
        <div className="payroll-command-actions">
          <button className="btn payroll-primary-action" onClick={onSubmit} disabled={periodData.stage === 5}><ShieldCheck size={16}/>{periodData.stage === 5 ? 'Kỳ đã phát hành' : periodData.blocked > 0 ? 'Xem hồ sơ bị chặn' : 'Gửi duyệt kỳ lương'}</button>
          <span>{periodData.blocked > 0 ? `${periodData.blocked} hồ sơ đang chặn chốt kỳ` : 'Không còn hồ sơ bị chặn'}</span>
        </div>
      </div>
      <div className="payroll-readiness">
        <div className="payroll-readiness-head"><span>Độ sẵn sàng</span><strong>{periodData.readiness}%</strong></div>
        <div className="payroll-progress" role="progressbar" aria-label="Độ sẵn sàng chốt lương" aria-valuenow={periodData.readiness} aria-valuemin={0} aria-valuemax={100}><i style={{ transform: `scaleX(${periodData.readiness / 100})` }}/></div>
        <div className="payroll-readiness-list">
          <span><Check size={15}/>Chấm công đã khóa</span>
          <span><Check size={15}/>Hợp đồng đã đồng bộ</span>
          <button type="button" onClick={() => setStatusFilter('issues')}><AlertTriangle size={15}/>{periodData.exceptions} ngoại lệ cần xử lý</button>
        </div>
      </div>
      <div className="payroll-command-metrics">
        <CommandMetric icon={UsersRound} label="Nhân sự" value={String(periodData.people)} note="Trong kỳ"/>
        <CommandMetric icon={CircleAlert} label="Cần xử lý" value={String(warningCount).padStart(2, '0')} note="Trong dữ liệu mẫu" action={() => setStatusFilter('issues')}/>
        <CommandMetric icon={Banknote} label="Tăng chi phí" value={`${payrollGrowth}%`} note="So với tháng trước"/>
        <CommandMetric icon={CalendarClock} label="Hạn chốt" value={periodData.deadline} note="Theo lịch vận hành"/>
      </div>
    </section>

    <section className="payroll-control-surface surface" aria-label="Tiến độ kỳ lương">
      <div className="payroll-period-switcher" aria-label="Chọn kỳ lương">
        {(Object.keys(payrollPeriods) as PayrollPeriod[]).map((value) => <button key={value} onClick={() => { setPeriod(value); setStatusFilter('all'); setSearch('') }} aria-pressed={period === value} className={period === value ? 'active' : ''}><span>Kỳ {value}</span><small>{payrollPeriods[value].status}</small></button>)}
      </div>
      <ol className="payroll-workflow">
        {workflowSteps.map((step, index) => {
          const stepNumber = index + 1
          const isDone = stepNumber < periodData.stage || periodData.stage === 5
          const isActive = stepNumber === periodData.stage && periodData.stage < 5
          return <li key={step} className={`${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}><span>{isDone ? <Check size={14}/> : stepNumber}</span><div><strong>{step}</strong><small>{isActive ? 'Đang thực hiện' : isDone ? 'Hoàn tất' : 'Chưa bắt đầu'}</small></div></li>
        })}
      </ol>
    </section>

    <section className="surface payroll-reconciliation" id="payroll-reconciliation">
      <header className="payroll-table-header">
        <div><span className="page-eyebrow">Bàn đối soát</span><h2>Chi tiết kỳ {period}</h2><p>{filteredRows.length} trong {rows.length} dòng dữ liệu mẫu · Toàn kỳ có {periodData.people} nhân sự</p></div>
        <span className={`badge ${periodData.stage === 5 ? 'badge-success' : 'badge-warning'}`}>{periodData.status}</span>
      </header>
      <div className="payroll-toolbar">
        <label className="payroll-search"><Search size={16}/><span className="sr-only">Tìm nhân sự</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc mã nhân sự"/></label>
        <div className="payroll-status-filters" aria-label="Lọc trạng thái">
          {(['all', 'ready', 'issues', 'blocked'] as PayrollStatusFilter[]).map((value) => <button key={value} onClick={() => setStatusFilter(value)} aria-pressed={statusFilter === value} className={statusFilter === value ? 'active' : ''}>{value === 'all' ? 'Tất cả' : value === 'issues' ? 'Cần xử lý' : payrollStatusLabels[value]}</button>)}
        </div>
      </div>
      {filteredRows.length > 0 ? <PayrollRows rows={filteredRows} onSelect={onSelect}/> : <div className="payroll-empty"><Search size={22}/><strong>Không có dòng lương phù hợp</strong><p>Thử đổi từ khóa hoặc bỏ bớt bộ lọc trạng thái.</p><button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter('all') }}>Xóa bộ lọc</button></div>}
    </section>
  </div>
}

function DownloadIcon() {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/></svg>
}

function CommandMetric({ icon: Icon, label, value, note, action }: { icon: typeof UsersRound; label: string; value: string; note: string; action?: () => void }) {
  const content = <><Icon size={17}/><span><small>{label}</small><strong>{value}</strong><em>{note}</em></span></>
  return action ? <button type="button" className="payroll-command-metric" onClick={action}>{content}</button> : <div className="payroll-command-metric">{content}</div>
}

function PayrollRows({ rows, onSelect }: { rows: PayrollRow[]; onSelect: (row: PayrollRow) => void }) {
  return <>
    <div className="data-table-wrap payroll-desktop-table"><table className="data-table payroll-table" aria-label="Chi tiết đối soát bảng lương"><thead><tr><th scope="col">Nhân sự</th><th scope="col">Nhóm / vị trí</th><th scope="col" className="money-column">Thu nhập</th><th scope="col" className="money-column">Khấu trừ</th><th scope="col" className="money-column">Thực lĩnh</th><th scope="col">Chênh lệch</th><th scope="col">Trạng thái</th><th scope="col"><span className="sr-only">Chi tiết</span></th></tr></thead><tbody>{rows.map((row) => <tr key={row.code}><td><div className="payroll-person"><span>{row.name.split(' ').slice(-2).map((part) => part[0]).join('')}</span><div><strong>{row.name}</strong><small>{row.code}</small></div></div></td><td><strong>{row.team}</strong><small className="payroll-table-subline">{row.position}</small></td><td className="money-column">{formatVnd(row.base + row.allowance + row.commission)}</td><td className="money-column">{formatVnd(row.insurance + row.tax + row.advance)}</td><td className="money-column payroll-net">{formatVnd(row.net)}</td><td><span className={`payroll-variance ${row.variance < 0 ? 'negative' : ''}`}>{row.variance > 0 ? '+' : ''}{row.variance.toLocaleString('vi-VN')}%</span></td><td><Status status={row.status} issue={row.issue}/></td><td><button className="icon-action" onClick={() => onSelect(row)} aria-label={`Xem phiếu lương ${row.name}`}><ChevronRight size={17}/></button></td></tr>)}</tbody></table></div>
    <div className="payroll-mobile-list">{rows.map((row) => <button key={row.code} className="payroll-mobile-card" onClick={() => onSelect(row)}><div className="payroll-mobile-head"><div className="payroll-person"><span>{row.name.split(' ').slice(-2).map((part) => part[0]).join('')}</span><div><strong>{row.name}</strong><small>{row.code} · {row.position}</small></div></div><ChevronRight size={18}/></div><b>{formatVnd(row.net)}</b><div className="payroll-mobile-meta"><Status status={row.status} issue={row.issue}/><em>{row.variance > 0 ? '+' : ''}{row.variance.toLocaleString('vi-VN')}%</em></div></button>)}</div>
  </>
}

function Status({ status, issue }: { status: PayrollStatus; issue: string }) {
  return <span className={`payroll-row-status ${status}`}><i/><span><strong>{payrollStatusLabels[status]}</strong><small>{issue}</small></span></span>
}
