import { ArrowUpRight, CalendarCheck2, Check, Download, Megaphone, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { reportBarsByPeriod, schedulePeople, type ReportPeriod } from './hr-center-data'

const weekDays = ['T2 · 24', 'T3 · 25', 'T4 · 26', 'T5 · 27', 'T6 · 28', 'T7 · 29']

function downloadWorkforceReport(period: ReportPeriod, reportRows: (typeof reportBarsByPeriod)[ReportPeriod]) {
  const rows = [['Chỉ số', 'Giá trị', 'Tỷ lệ'], ...reportRows.map((row) => [row.label, row.amount, `${row.value}%`])]
  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  link.download = `bao-cao-nhan-su-${period.toLocaleLowerCase('vi').replaceAll(' ', '-')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function SchedulesPanel() {
  const showToast = useAppStore((state) => state.showToast)
  const [published, setPublished] = useState(false)
  const publish = () => { setPublished(true); showToast('Đã công bố lịch tuần 24–29/08 cho 38 nhân sự') }
  return <section className="surface schedule-panel">
    <div className="hr-section-head"><div><span className="page-eyebrow">TUẦN 24–29/08</span><h2>Lịch làm việc · Miền Bắc</h2><p>Ba ca chuẩn, một ca hành chính · 02 yêu cầu đổi ca.</p></div><button className="btn btn-primary" onClick={publish} disabled={published}>{published ? <Check size={16}/> : <CalendarCheck2 size={16}/>} {published ? 'Đã công bố' : 'Công bố lịch'}</button></div>
    <div className="schedule-scroll"><div className="schedule-grid"><div className="schedule-head person">Nhân sự</div>{weekDays.map((day) => <div className="schedule-head" key={day}>{day}</div>)}{schedulePeople.flatMap((person) => [<div className="schedule-person" key={`${person.name}-person`}><strong>{person.name}</strong><small>{person.role}</small></div>, ...person.shifts.map((shift, index) => <button key={`${person.name}-${weekDays[index]}`} className={`shift-cell shift-${shift.toLocaleLowerCase('vi')}`} onClick={() => showToast(`${person.name} · ${weekDays[index]} · Ca ${shift}`)}><strong>{shift}</strong><small>{shift === 'Nghỉ' ? 'Không phân ca' : shift === 'HC' ? '08:30–17:30' : shift === 'Tối' ? '14:00–22:00' : shift === 'Chiều' ? '12:00–20:00' : '08:00–16:00'}</small></button>)])}</div></div>
    <div className="schedule-foot"><span><i className="shift-dot morning"/>Ca sáng</span><span><i className="shift-dot afternoon"/>Ca chiều</span><span><i className="shift-dot night"/>Ca tối</span><span><i className="shift-dot off"/>Nghỉ</span><button className="btn btn-ghost" onClick={() => showToast('Đã mở 2 yêu cầu đổi ca')}>Xem 2 yêu cầu đổi ca <ArrowUpRight size={15}/></button></div>
  </section>
}

export function ReportsPanel() {
  const showToast = useAppStore((state) => state.showToast)
  const [period, setPeriod] = useState<ReportPeriod>('Tháng 08')
  const activeReportRows = reportBarsByPeriod[period]
  return <div className="hr-panel-grid reports-layout">
    <section className="surface report-panel">
      <div className="hr-section-head"><div><span className="page-eyebrow">SỨC KHỎE VẬN HÀNH</span><h2>Báo cáo nhân sự realtime</h2></div><div className="segmented-control" aria-label="Kỳ báo cáo">{(Object.keys(reportBarsByPeriod) as ReportPeriod[]).map((item) => <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)} aria-pressed={period === item}>{item}</button>)}</div></div>
      <div className="report-bars" aria-live="polite">{activeReportRows.map((row) => <div key={row.label}><span><strong>{row.label}</strong><small>{row.amount}</small></span><i><b style={{ width: `${row.value}%` }}/></i><strong>{row.value}%</strong></div>)}</div>
      <button className="btn btn-secondary" onClick={() => { downloadWorkforceReport(period, activeReportRows); showToast(`Đã tải báo cáo ${period}`) }}><Download size={16}/>Xuất báo cáo {period}</button>
    </section>
    <aside className="surface insight-panel"><span className="insight-icon"><Sparkles size={20}/></span><span className="page-eyebrow">GỢI Ý VẬN HÀNH</span><h2>Media miền Nam cần giữ chân nhân sự</h2><p>Tỷ lệ nghỉ việc quý này tăng 1,8%. Nhóm có thâm niên 6–12 tháng chiếm phần lớn biến động.</p><dl><div><dt>Nguy cơ cao</dt><dd>06 người</dd></div><div><dt>Chi phí thay thế ước tính</dt><dd>184 triệu</dd></div></dl><button className="btn btn-primary" onClick={() => showToast('Đã mở danh sách 6 nhân sự cần theo dõi')}>Xem nhóm cần theo dõi</button></aside>
  </div>
}

export function ExperiencePanel() {
  const showToast = useAppStore((state) => state.showToast)
  const [pulse, setPulse] = useState<number | null>(null)
  return <div className="hr-panel-grid experience-layout">
    <section className="surface experience-feed"><div className="hr-section-head"><div><span className="page-eyebrow">TRUYỀN THÔNG NỘI BỘ</span><h2>Bản tin Fun Agency</h2></div><button className="btn btn-primary" onClick={() => showToast('Đã mở trình soạn bản tin')}><Megaphone size={16}/>Soạn bản tin</button></div><article className="featured-story"><span className="story-date">24<br/><small>THÁNG 8</small></span><div><span className="badge">Văn hoá</span><h3>Fun Friday: cùng nhìn lại những campaign nổi bật tháng 8</h3><p>Đăng ký chia sẻ một case study ngắn trước 16:00 thứ Năm.</p><button className="btn btn-ghost" onClick={() => showToast('Đã mở chi tiết bản tin')}>Đọc bản tin <ArrowUpRight size={15}/></button></div></article><div className="recognition-row"><span className="recognition-mark">FA</span><div><strong>Ghi nhận tuần này</strong><p>12 lời cảm ơn đã được gửi giữa các đội MKT, TK và Support MKT.</p></div><button className="btn btn-secondary" onClick={() => showToast('Đã mở bảng ghi nhận đồng đội')}>Gửi lời cảm ơn</button></div></section>
    <aside className="surface pulse-card"><span className="page-eyebrow">PULSE · 10 GIÂY</span><h2>Tuần này bạn làm việc thế nào?</h2><p>Phản hồi ẩn danh giúp Vận hành nhận biết sớm điểm nghẽn.</p><div className="pulse-options">{[1,2,3,4,5].map((value) => <button key={value} className={pulse === value ? 'active' : ''} onClick={() => setPulse(value)} aria-label={`Mức độ ${value} trên 5`} aria-pressed={pulse === value}>{value}</button>)}</div><label className="field"><span>Muốn đội ngũ hỗ trợ điều gì?</span><textarea placeholder="Một câu ngắn là đủ…"/></label><button className="btn btn-primary hr-full-button" disabled={!pulse} onClick={() => showToast(`Đã ghi nhận pulse ${pulse}/5`)}><Send size={16}/>Gửi phản hồi</button></aside>
  </div>
}
