import{ArrowLeft,FileQuestion}from'lucide-react'
import{Link}from'react-router-dom'
export default function NotFoundPage(){return <section className="surface permission-state"><div><FileQuestion size={28}/></div><h1>Không tìm thấy trang</h1><p>Đường dẫn này không tồn tại hoặc đã được chuyển.</p><Link className="btn btn-primary" to="/"><ArrowLeft size={15}/>Về tổng quan</Link></section>}
