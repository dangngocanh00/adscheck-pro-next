import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Download, Info, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { useAppStore } from '@/store/app-store'

const people = ['Nguyễn Minh Anh', 'Trần Nhật Nam', 'Lê Thùy Dương', 'Phạm Quốc Huy', 'Võ Khánh Linh', 'Đặng Quang Sơn', 'Mai Ngọc Hân', 'Bùi Tuấn Kiệt']
const days = Array.from({ length: 18 }, (_, index) => index + 1)
type AttendanceType = 'ok' | 'late' | 'leave' | 'missing'
type AttendanceDetail = { person: string; day: number; type: AttendanceType }
const statusLabels: Record<AttendanceType, string> = { ok: 'Đúng giờ', late: 'Đi muộn', leave: 'Nghỉ có phép', missing: 'Thiếu dữ liệu' }

function getType(day: number, personIndex: number, month: number): AttendanceType {
  const seed = day + personIndex + month
  if (seed % 11 === 0) return 'leave'
  if (seed % 7 === 0) return 'late'
  if (seed % 13 === 0) return 'missing'
  return 'ok'
}

function downloadAttendance(month: number) {
  const header = ['Nhân sự', ...days.map((day) => `${day}/${month}/2026`)]
  const rows = people.map((person, personIndex) => [person, ...days.map((day) => statusLabels[getType(day, personIndex, month)])])
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  link.download = `bang-cong-${String(month).padStart(2, '0')}-2026.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function AttendancePage() {
  const [month, setMonth] = useState(8)
  const [selected, setSelected] = useState<AttendanceDetail | null>(null)
  const showToast = useAppStore((state) => state.showToast)
  const summary = useMemo(() => {
    const counts: Record<AttendanceType, number> = { ok: 0, late: 0, leave: 0, missing: 0 }
    people.forEach((_, personIndex) => days.forEach((day) => { counts[getType(day, personIndex, month)] += 1 }))
    return { ...counts, onTimeRate: `${(counts.ok / (people.length * days.length) * 100).toFixed(1).replace('.', ',')}%` }
  }, [month])
  const changeMonth = (offset: number) => setMonth((value) => Math.min(12, Math.max(1, value + offset)))
  const exportTable = () => { downloadAttendance(month); showToast('Đã tải bảng công dạng CSV') }

  return <>
    <div className="page-heading"><div><h1>Chấm công</h1><p>Theo dõi thời gian làm việc và các ngoại lệ trong kỳ công.</p></div><button className="btn btn-secondary" onClick={exportTable}><Download size={16}/>Xuất bảng công</button></div>
    <div className="attendance-summary"><div className="surface-flat"><span>Đúng giờ</span><strong>{summary.onTimeRate}</strong></div><div className="surface-flat"><span>Đi muộn</span><strong>{summary.late} lượt</strong></div><div className="surface-flat"><span>Thiếu chấm công</span><strong>{summary.missing} lượt</strong></div><div className="surface-flat"><span>Nghỉ có phép</span><strong>{summary.leave} ngày</strong></div></div>
    <section className="surface attendance-panel">
      <div className="attendance-toolbar"><div><button className="icon-action" onClick={() => changeMonth(-1)} disabled={month === 1} aria-label="Tháng trước"><ChevronLeft size={17}/></button><strong>Tháng {String(month).padStart(2, '0')}, 2026</strong><button className="icon-action" onClick={() => changeMonth(1)} disabled={month === 12} aria-label="Tháng sau"><ChevronRight size={17}/></button></div><span><Info size={14}/>Chọn một ô để xem giờ vào/ra</span></div>
      <div className="heatmap-scroll"><div className="heatmap" role="grid" aria-label={`Bảng công tháng ${month}`}><div className="heatmap-head person-name">Nhân sự</div>{days.map((day) => <div className="heatmap-head" key={day}>{day}</div>)}{people.flatMap((person, personIndex) => [<div className="person-name" key={person}><span className="avatar">{person.split(' ').slice(-2).map((value) => value[0]).join('')}</span><strong>{person}</strong></div>, ...days.map((day) => { const type = getType(day, personIndex, month); return <button key={`${person}-${day}`} className={`heat-cell ${type}`} onClick={() => setSelected({ person, day, type })} aria-label={`${person}, ngày ${day}: ${statusLabels[type]}`}><span/></button> })])}</div></div>
      <div className="heat-legend"><span><i className="ok"/>Đúng giờ</span><span><i className="late"/>Đi muộn</span><span><i className="leave"/>Nghỉ phép</span><span><i className="missing"/>Thiếu dữ liệu</span></div>
    </section>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `${selected.person} · ${selected.day}/${month}/2026` : 'Chi tiết chấm công'} description="Dữ liệu ghi nhận trong ngày và đơn liên quan." footer={<button className="btn btn-primary" onClick={() => setSelected(null)}>Đã hiểu</button>}>
      {selected && <div className="attendance-detail-stack"><div className={`attendance-status-card ${selected.type}`}><span>Trạng thái</span><strong>{statusLabels[selected.type]}</strong></div><div className="attendance-detail-grid"><div><Clock3 size={18}/><span>Check-in</span><strong>{selected.type === 'leave' ? '—' : selected.type === 'late' ? '09:12' : '08:24'}</strong></div><div><Clock3 size={18}/><span>Check-out</span><strong>{selected.type === 'missing' ? 'Thiếu' : selected.type === 'leave' ? '—' : '17:42'}</strong></div><div><CalendarDays size={18}/><span>Công ghi nhận</span><strong>{selected.type === 'leave' ? '1 ngày phép' : selected.type === 'missing' ? 'Chờ bổ sung' : '8 giờ'}</strong></div><div><MapPin size={18}/><span>Phương thức</span><strong>{selected.type === 'leave' ? 'Đơn đã duyệt' : 'Wi-Fi văn phòng'}</strong></div></div>{selected.type === 'late' && <div className="attendance-warning"><strong>Đi muộn 42 phút</strong><span>Nhân sự chưa gửi đơn giải trình.</span><button className="btn btn-secondary" onClick={() => showToast('Đã gửi nhắc giải trình')}>Nhắc giải trình</button></div>}</div>}
    </Modal>
  </>
}
