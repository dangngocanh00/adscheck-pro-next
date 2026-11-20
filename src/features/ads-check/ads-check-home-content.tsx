import { Link } from 'react-router-dom'
import { ArrowRight, Layers3, Puzzle, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'

const workspace = '/app/adscheck-pro/adaccounts'
const extensionUrl = import.meta.env.VITE_TOOLMETA_EXTENSION_URL?.trim()
const extensionLabel = <><Puzzle size={16} aria-hidden="true" /> Cài đặt extension</>

const features = [
  { title: 'Workflow', description: 'Chuẩn hóa quy trình, phối hợp rõ ràng.', icon: Layers3 },
  { title: 'Control Hub', description: 'Quản lý tập trung toàn bộ tài sản.', icon: ShieldCheck },
  { title: 'Priority', description: 'Thiết lập quyền linh hoạt, an toàn.', icon: UsersRound },
]

export function AdsCheckHomeContent() {
  return (
    <section className="ads-home" aria-labelledby="ads-home-title">
      <div className="ads-home-wave" aria-hidden="true" />
      <div className="ads-home-hero">
        <p className="ads-home-badge"><Sparkles size={17} aria-hidden="true" /> Chào mừng đến với Ads Check</p>
        <h1 id="ads-home-title">Một cách vận hành quảng cáo <em>hoàn toàn mới.</em></h1>
        <p className="ads-home-intro">Tập trung tài sản, tổ chức workflow, kiểm soát phân quyền và theo dõi trạng thái quảng cáo trong một nền tảng duy nhất.</p>
        <div className="ads-home-actions">
          <Link className="ads-home-explore" to={workspace}>Bắt đầu khám phá <ArrowRight size={18} aria-hidden="true" /></Link>
          {extensionUrl ? (
            <a className="ads-home-install" href={extensionUrl} target="_blank" rel="noopener noreferrer">{extensionLabel}</a>
          ) : (
            <button className="ads-home-install" type="button" disabled title="Chưa có đường dẫn cài đặt Toolmeta">{extensionLabel}</button>
          )}
        </div>
      </div>

      <div className="ads-home-features">
        {features.map(({ title, description, icon: Icon }) => (
          <article key={title} className="ads-home-feature">
            <Icon aria-hidden="true" />
            <div><h2>{title}</h2><p>{description}</p></div>
          </article>
        ))}
      </div>
    </section>
  )
}
