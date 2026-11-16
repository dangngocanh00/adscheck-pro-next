import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Bell, ChartNoAxesColumnIncreasing, CheckCheck, ChevronDown, CircleHelp, House, Layers3, Play, RefreshCw, Search, ShieldCheck, UsersRound, Workflow, Zap } from 'lucide-react'
import { AdsCheckBrandMark } from './ads-check-brand-mark'

const features = [
  { title: 'Workflow thông minh', description: 'Xây dựng và tự động hóa quy trình vận hành quảng cáo theo cách của bạn.', icon: Workflow },
  { title: 'Control Hub tập trung', description: 'Quản lý tài sản, chiến dịch và hoạt động của đội ngũ tại một nơi.', icon: ShieldCheck },
  { title: 'Phân quyền linh hoạt', description: 'Thiết lập quyền truy cập theo vai trò, đảm bảo an toàn và kiểm soát tốt hơn.', icon: UsersRound },
  { title: 'Đồng bộ dữ liệu', description: 'Kết nối và đồng bộ dữ liệu mượt mà giữa các kênh, tiết kiệm thời gian xử lý.', icon: RefreshCw },
]
const metrics = [
  { title: 'Tài sản quảng cáo', value: '2.540', change: '+12%', icon: Layers3 },
  { title: 'Workflow đang chạy', value: '18', change: '+50%', icon: Workflow },
  { title: 'Tác vụ hoàn thành', value: '326', change: '+24%', icon: CheckCheck },
  { title: 'Thành viên', value: '24', icon: UsersRound },
]
const bars = [22, 31, 45, 30, 36, 51, 65, 44, 67, 43, 73, 64, 88, 70, 94]

export function AdsCheckHomeContent() {
  const demoRef = useRef<HTMLElement>(null)
  const [demo, setDemo] = useState(false)
  const [tab, setTab] = useState('Tổng quan')
  const startDemo = () => {
    setDemo(true)
    setTab('Workflow')
    demoRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' })
    demoRef.current?.focus({ preventScroll: true })
  }
  return <section className="ads-home" aria-label="Trang chủ Ads Check">
    <div className="ads-home-backdrop" aria-hidden="true" />
    <div className="ads-home-container">
      <header className="ads-home-header">
        <a className="ads-home-brand" href="#ads-home-intro"><AdsCheckBrandMark /><strong>Ads Check</strong></a>
        <nav aria-label="Nội dung Trang chủ">
          <a href="#ads-home-intro" aria-current="location">Trang chủ</a><a href="#ads-home-features">Tính năng</a><Link to="/app/billing/payment">Bảng giá</Link><a href="https://www.facebook.com/adscheck.official/" target="_blank" rel="noreferrer">Hỗ trợ</a>
        </nav>
        <Link className="ads-home-button is-small" to="/app/adscheck-pro/adaccounts">Bắt đầu khám phá<ArrowRight size={17} /></Link>
      </header>
      <div className="ads-home-hero" id="ads-home-intro">
        <span className="ads-home-badge"><Zap size={15} fill="currentColor" />Nền tảng vận hành quảng cáo toàn diện</span>
        <h1>Vận hành quảng cáo<br /><em>thông minh hơn</em> tại một nơi.</h1>
        <p>Ads Check giúp bạn tập trung tài sản quảng cáo, chuẩn hóa quy trình làm việc<br className="ads-home-desktop-break" /> và theo dõi vận hành rõ ràng, hiệu quả hơn.</p>
        <div className="ads-home-actions"><Link className="ads-home-button" to="/app/adscheck-pro/adaccounts">Bắt đầu khám phá<ArrowRight size={19} /></Link><button className="ads-home-button is-outline" onClick={startDemo}><Play size={16} fill="currentColor" />Xem demo</button></div>
      </div>
      <section className={`ads-home-demo${demo ? ' is-demo-active' : ''}`} aria-label="Giao diện minh họa Ads Check" ref={demoRef} tabIndex={-1}>
        <header className="ads-home-demo-header"><div className="ads-home-brand"><AdsCheckBrandMark /><strong>Ads Check</strong></div><div className="ads-home-demo-search"><Search size={15} /><span>Tìm kiếm tài sản, chiến dịch, workflow...</span></div><span className="ads-home-demo-tools" aria-hidden="true"><Bell size={17} /><CircleHelp size={17} /><b>AD</b><ChevronDown size={13} /></span></header>
        <div className="ads-home-demo-body">
          <nav className="ads-home-demo-nav" aria-label="Các màn hình minh họa">
            {([{ title: 'Tổng quan', icon: House }, { title: 'Workflow', icon: Workflow }, { title: 'Tài sản quảng cáo', icon: Layers3 }, { title: 'Control Hub', icon: ShieldCheck }, { title: 'Báo cáo', icon: ChartNoAxesColumnIncreasing }]).map(({ title, icon: Icon }) => <button key={title} aria-pressed={tab === title} className={tab === title ? 'is-active' : ''} onClick={() => setTab(title)}><Icon size={17} />{title}</button>)}
          </nav>
          <div className="ads-home-demo-content">
            <div className="ads-home-demo-title"><div><h2>{tab === 'Tổng quan' ? 'Tổng quan vận hành' : tab}</h2><p>{demo ? 'Khám phá cách tổ chức công việc trong Ads Check.' : 'Toàn cảnh hoạt động quảng cáo của bạn tại Ads Check.'}</p></div><span className="ads-home-demo-label">Dữ liệu minh họa</span></div>
            <div className="ads-home-metrics">{metrics.map(({ title, value, change, icon: Icon }) => <article key={title}><Icon size={22} /><div><h3>{title}</h3><strong>{value}</strong>{change && <p><b>↗ {change}</b> so với kỳ trước</p>}</div></article>)}</div>
            {tab === 'Workflow' || tab === 'Control Hub' ? <div className="ads-home-workflows"><h3>{tab === 'Workflow' ? 'Quy trình vận hành' : 'Các phiên làm việc'}</h3>{['Kiểm tra trạng thái tài khoản', 'Đồng bộ tài sản quảng cáo', 'Tổng hợp báo cáo hoạt động'].map((title, index) => <div key={title}><span className="ads-home-task-icon"><Workflow size={18} /></span><strong>{title}</strong><span className={index === 1 ? 'is-waiting' : ''}>{index === 1 ? 'Chờ duyệt' : 'Đang chạy'}</span><Activity size={17} /></div>)}</div> : <div className="ads-home-charts">
              <article className="ads-home-bar-chart"><header><h3>{tab === 'Báo cáo' ? 'Báo cáo hiệu suất' : tab === 'Tài sản quảng cáo' ? 'Hoạt động tài sản' : 'Hiệu quả vận hành'}</h3><span><i />Đã hoàn thành<i />Đang xử lý</span></header><div className="ads-home-bars" role="img" aria-label="Biểu đồ minh họa hiệu quả vận hành tăng theo thời gian">{bars.map((height, index) => <div key={index} style={{ height: `${height}%` }}><i style={{ height: `${44 + (index % 3) * 9}%` }} /></div>)}</div><div className="ads-home-chart-axis"><span>01/01</span><span>05/01</span><span>09/01</span><span>13/01</span><span>17/01</span><span>21/01</span><span>25/01</span><span>29/01</span></div></article>
              <article className="ads-home-status-chart"><h3>Trạng thái workflow</h3><div><div className="ads-home-donut" role="img" aria-label="18 workflow minh họa"><strong>18<small>workflow</small></strong></div><ul>{[['Đang chạy', '11'], ['Chờ duyệt', '4'], ['Tạm dừng', '2'], ['Hoàn thành', '1']].map(([title, value], index) => <li key={title}><i style={{ opacity: 1 - index * .2 }} />{title}<b>{value}</b></li>)}</ul></div></article>
            </div>}
          </div>
        </div>
      </section>
      <div className="ads-home-features" id="ads-home-features">{features.map(({ title, description, icon: Icon }) => <article key={title}><span><Icon size={25} /></span><h2>{title}</h2><p>{description}</p></article>)}</div>
    </div>
  </section>
}
