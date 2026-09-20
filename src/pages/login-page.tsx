import { ArrowRight, CheckCircle2, LockKeyhole, Network, ShieldCheck, UsersRound } from 'lucide-react'
import { type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const submit = (event: FormEvent) => { event.preventDefault(); navigate('/') }
  return <main className="login-page">
    <section className="login-story">
      <div className="login-brand"><Network size={20}/><span>Fun Agency HRM</span></div>
      <div className="login-message"><span className="login-kicker">Không gian vận hành Fun Agency</span><h1>Mỗi người đúng vai.<br/>Mỗi team chung một nhịp.</h1><p>Quản lý CEO, Quản lý, Leader, Tài nguyên, MKT, Thiết kế, Kế toán và Support MKT trong một hệ thống thống nhất.</p></div>
      <div className="login-proof"><span><UsersRound size={17}/>Cơ cấu chức danh thực tế</span><span><ShieldCheck size={17}/>Phân quyền theo vai trò</span><span><CheckCircle2 size={17}/>Lịch sử thay đổi rõ ràng</span></div>
    </section>
    <section className="login-form-side"><form className="login-form" onSubmit={submit}>
      <div className="login-lock"><LockKeyhole size={20}/></div><span className="login-eyebrow">ĐĂNG NHẬP NỘI BỘ</span><h2>Chào mừng trở lại</h2><p>Dùng tài khoản Fun Agency để tiếp tục.</p>
      <div className="field"><label htmlFor="email">Email công việc</label><input id="email" name="email" type="email" autoComplete="email" defaultValue="admin@funagency.vn" required/></div>
      <div className="field"><div className="field-row"><label htmlFor="password">Mật khẩu</label><a href="#reset">Quên mật khẩu?</a></div><input id="password" name="password" type="password" autoComplete="current-password" defaultValue="funagency-demo" required/></div>
      <label className="remember"><input type="checkbox" defaultChecked/>Duy trì đăng nhập trên thiết bị này</label><button className="btn btn-primary login-submit" type="submit">Đăng nhập <ArrowRight size={17}/></button><small>Bản demo frontend · Không gửi dữ liệu ra ngoài</small>
    </form></section>
  </main>
}
