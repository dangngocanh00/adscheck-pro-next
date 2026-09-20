import { useState } from 'react'
import { ArrowRight, BarChart3, Check, ChevronDown, FileStack, Menu, ShieldCheck, Sparkles, TimerReset, UsersRound, X } from 'lucide-react'
import { ProductDemo, type DemoMode } from '@/components/product/product-demo'

const features: Array<{ id: DemoMode; icon: typeof FileStack; title: string; text: string }> = [
  { id:'tests', icon:FileStack, title:'Xây bài đánh giá', text:'Tạo đề từ ngân hàng mẫu hoặc thiết kế lộ trình riêng cho từng vị trí.' },
  { id:'candidates', icon:UsersRound, title:'Quản lý người tham gia', text:'Mời theo nhóm, theo dõi tiến độ và nhắc lịch ngay trong một luồng làm việc.' },
  { id:'reports', icon:BarChart3, title:'Đọc báo cáo năng lực', text:'Nhìn rõ điểm mạnh, khoảng trống kỹ năng và mức phù hợp bằng dữ liệu trực quan.' },
]

const plans = [
  { name:'Khởi động', price:'4,8 triệu', note:'Cho đội ngũ dưới 50 người', items:['120 lượt đánh giá / tháng','Kho 300+ bài test mẫu','01 tài khoản quản trị'] },
  { name:'Tăng trưởng', price:'18 triệu', note:'Cho doanh nghiệp đang mở rộng', items:['600 lượt đánh giá / tháng','Báo cáo năng lực chuyên sâu','05 tài khoản quản trị'], featured:true },
  { name:'Doanh nghiệp', price:'Liên hệ', note:'Thiết kế theo quy mô vận hành', items:['Không giới hạn lượt đánh giá','SSO, API và phân quyền riêng','Hỗ trợ triển khai ưu tiên'] },
]

const faqs = [
  ['Có thể dùng ngay bộ đề sẵn có không?','Có. Thư viện mẫu được phân theo nhóm kỹ năng và vị trí. Bạn cũng có thể sao chép rồi điều chỉnh từng câu hỏi.'],
  ['Dữ liệu kết quả được bảo vệ thế nào?','Mỗi đợt đánh giá có mã truy cập riêng, lịch sử hoạt động và phân quyền xem báo cáo theo vai trò.'],
  ['Hệ thống có phù hợp cho đào tạo nội bộ?','Có. Ngoài tuyển dụng, bạn có thể dùng báo cáo năng lực để xây lộ trình học và đo lại sau đào tạo.'],
]

export default function ProductLandingPage(){
  const [menuOpen,setMenuOpen]=useState(false)
  const [demoMode,setDemoMode]=useState<DemoMode>('tests')
  return <div className="product-landing">
    <a className="product-skip" href="#product-main">Bỏ qua điều hướng</a>
    <header className="product-header"><a className="product-brand" href="#top" aria-label="VeraTest - Trang đầu"><span><Check/></span><b>VeraTest</b></a>
      <nav className={menuOpen?'is-open':''} aria-label="Điều hướng chính"><a href="#solutions" onClick={()=>setMenuOpen(false)}>Giải pháp</a><a href="#features" onClick={()=>setMenuOpen(false)}>Tính năng</a><a href="#pricing" onClick={()=>setMenuOpen(false)}>Bảng giá</a><a href="#faq" onClick={()=>setMenuOpen(false)}>Hỏi đáp</a><a className="nav-mobile-cta" href="#contact" onClick={()=>setMenuOpen(false)}>Dùng thử miễn phí</a></nav>
      <div className="product-header-actions"><a className="text-link" href="/login">Đăng nhập</a><a className="product-button product-button-small" href="#contact">Dùng thử miễn phí <ArrowRight/></a></div>
      <button className="menu-button" type="button" onClick={()=>setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen?'Đóng menu':'Mở menu'}>{menuOpen?<X/>:<Menu/>}</button>
    </header>

    <main id="product-main">
      <section className="product-hero" id="top"><div className="hero-copy"><span className="product-eyebrow"><Sparkles/> Nền tảng đánh giá năng lực thế hệ mới</span><h1>Đánh giá đúng người.<br/><em>Phát triển đúng năng lực.</em></h1><p>Biến một quy trình tuyển dụng và đánh giá rời rạc thành hệ thống rõ ràng, có dữ liệu và dễ vận hành cho mọi đội ngũ.</p><div className="hero-actions"><a className="product-button" href="#contact">Tạo bài đánh giá đầu tiên <ArrowRight/></a><a className="product-link" href="#features">Xem cách vận hành <span>↓</span></a></div><div className="hero-proof"><span><Check/>Không cần thẻ thanh toán</span><span><Check/>Thiết lập trong 5 phút</span></div></div>
        <div className="hero-visual"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><ProductDemo mode={demoMode}/></div>
      </section>

      <section className="proof-strip" aria-label="Thông số nổi bật"><div><strong>300+</strong><span>bài đánh giá mẫu</span></div><div><strong>4.8 phút</strong><span>để thiết lập một bài test</span></div><div><strong>87%</strong><span>tỷ lệ hoàn thành trung bình</span></div><div><strong>24/7</strong><span>theo dõi tiến độ trực tuyến</span></div></section>

      <section className="problem-section product-section" id="solutions"><div className="section-intro"><span className="section-index">01 — Vấn đề</span><h2>Ra quyết định về con người<br/>không nên dựa vào cảm giác.</h2></div><div className="problem-grid"><article className="problem-lead"><span className="problem-number">70%</span><h3>nhà tuyển dụng từng chọn nhầm ứng viên hơn một lần.</h3><p>CV đẹp và phỏng vấn tốt chưa đủ để phản ánh năng lực thật trong công việc.</p></article><div className="problem-list"><article><TimerReset/><div><h3>Tốn thời gian sàng lọc</h3><p>Đội ngũ lặp lại những bước thủ công nhưng vẫn thiếu dữ liệu so sánh.</p></div></article><article><ShieldCheck/><div><h3>Khó chuẩn hoá tiêu chí</h3><p>Mỗi người phỏng vấn dùng một thước đo khác nhau, kết quả thiếu nhất quán.</p></div></article><article><BarChart3/><div><h3>Báo cáo khó hành động</h3><p>Điểm số đứng riêng lẻ, không chỉ ra được bước tuyển hoặc đào tạo tiếp theo.</p></div></article></div></div></section>

      <section className="feature-section product-section" id="features"><div className="section-intro feature-intro"><span className="section-index">02 — Hệ thống</span><h2>Một dòng chảy liền mạch,<br/>từ câu hỏi đến quyết định.</h2><p>Chọn một bước để xem cách VeraTest biến dữ liệu đánh giá thành hành động.</p></div><div className="feature-workbench"><div className="feature-tabs" aria-label="Các nhóm tính năng">{features.map(({id,icon:Icon,title,text},index)=><button key={id} type="button" aria-pressed={demoMode===id} className={demoMode===id?'active':''} onClick={()=>setDemoMode(id)}><span>{String(index+1).padStart(2,'0')}</span><Icon/><div><b>{title}</b><p>{text}</p></div><ChevronDown/></button>)}</div><div className="feature-demo" aria-live="polite"><ProductDemo mode={demoMode}/></div></div></section>

      <section className="benefit-section product-section"><div className="benefit-quote"><span className="section-index">03 — Kết quả</span><blockquote>“Không chỉ biết ai đạt điểm cao. Bạn biết <em>vì sao</em> họ phù hợp.”</blockquote></div><div className="benefit-grid"><article><strong>01</strong><h3>Thước đo thống nhất</h3><p>Mọi ứng viên và nhân viên được đánh giá theo cùng một khung tiêu chí.</p></article><article><strong>02</strong><h3>Nhìn ra khoảng trống</h3><p>Báo cáo chỉ ra kỹ năng cần bổ sung cho từng cá nhân và cả đội ngũ.</p></article><article><strong>03</strong><h3>Quyết định nhanh hơn</h3><p>Thông tin quan trọng được gom về một nơi, sẵn sàng để so sánh và chia sẻ.</p></article></div></section>

      <section className="pricing-section product-section" id="pricing"><div className="section-intro pricing-intro"><span className="section-index">04 — Bảng giá</span><h2>Chọn theo nhịp phát triển<br/>của đội ngũ.</h2><p>Giá theo năm, đã bao gồm cập nhật tính năng và hỗ trợ khởi tạo.</p></div><div className="pricing-grid">{plans.map(plan=><article className={plan.featured?'featured':''} key={plan.name}>{plan.featured&&<span className="plan-label">Phổ biến nhất</span>}<h3>{plan.name}</h3><p>{plan.note}</p><strong>{plan.price}</strong>{plan.price!=='Liên hệ'&&<small>/ năm</small>}<ul>{plan.items.map(item=><li key={item}><Check/>{item}</li>)}</ul><a href="#contact">{plan.price==='Liên hệ'?'Trao đổi với tư vấn':'Bắt đầu dùng thử'} <ArrowRight/></a></article>)}</div></section>

      <section className="faq-section product-section" id="faq"><div className="section-intro"><span className="section-index">05 — Hỏi đáp</span><h2>Thông tin cần biết<br/>trước khi bắt đầu.</h2></div><div className="faq-list">{faqs.map(([question,answer],index)=><details key={question} open={index===0}><summary>{question}<ChevronDown/></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta" id="contact"><div><span className="product-eyebrow"><Sparkles/> Bắt đầu từ một bài đánh giá</span><h2>Đội ngũ tốt hơn bắt đầu<br/>từ một thước đo đúng.</h2></div><div><p>Tạo tài khoản miễn phí, chọn bộ đề mẫu và mời người tham gia trong chưa đầy 5 phút.</p><a className="product-button product-button-light" href="mailto:hello@veratest.vn">Dùng thử VeraTest <ArrowRight/></a></div></section>
    </main>
    <footer className="product-footer"><a className="product-brand" href="#top"><span><Check/></span><b>VeraTest</b></a><p>Nền tảng đánh giá năng lực dành cho doanh nghiệp Việt.</p><span>© 2026 VeraTest. Thiết kế mẫu frontend.</span></footer>
  </div>
}
