import { BarChart3, Check, Clock3, Search, UsersRound } from 'lucide-react'

export type DemoMode = 'tests' | 'candidates' | 'reports'

const demoCopy: Record<DemoMode, { title: string; label: string; value: string }> = {
  tests: { title: 'Bài đánh giá đang hoạt động', label: 'Hoàn thành hôm nay', value: '68' },
  candidates: { title: 'Ứng viên theo chiến dịch', label: 'Ứng viên phù hợp', value: '24' },
  reports: { title: 'Báo cáo năng lực đội ngũ', label: 'Điểm trung bình', value: '8.4' },
}

export function ProductDemo({ mode }: { mode: DemoMode }) {
  const copy = demoCopy[mode]
  return <div className="product-demo" aria-label={`Minh hoạ ${copy.title}`}>
    <div className="demo-rail"><span className="demo-mini-mark">V</span><span/><span/><span/><i/></div>
    <div className="demo-main">
      <div className="demo-topbar"><div><b>{copy.title}</b><small>Dữ liệu cập nhật 2 phút trước</small></div><Search size={15}/></div>
      <div className="demo-metrics"><div><small>{copy.label}</small><strong>{copy.value}</strong><em>+12.6%</em></div><div><small>Tỷ lệ hoàn thành</small><strong>87%</strong><span className="demo-bars"><i/><i/><i/><i/><i/></span></div></div>
      <div className="demo-table">
        <div className="demo-table-head"><span>Người tham gia</span><span>Tiến độ</span><span>Kết quả</span></div>
        {['Nguyễn Minh Anh','Trần Gia Huy','Lê Khánh Linh'].map((name,index)=><div className="demo-row" key={name}><span><i>{name.split(' ').at(-1)?.[0]}</i>{name}</span><span><b style={{width:`${82-index*13}%`}}/></span><span><Check size={12}/>{[8.8,8.2,7.6][index]}</span></div>)}
      </div>
    </div>
    <div className="demo-float-card demo-float-top"><Clock3 size={17}/><span><small>Thời gian thiết lập</small><b>4 phút 38 giây</b></span></div>
    <div className="demo-float-card demo-float-bottom"><BarChart3 size={17}/><span><small>Phân tích tự động</small><b>Đã sẵn sàng</b></span></div>
    <div className="demo-participants"><UsersRound size={14}/> 136 người đang làm bài</div>
  </div>
}
