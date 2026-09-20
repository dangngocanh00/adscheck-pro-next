import { Building2, ChevronRight, Eye, GitMerge, MapPin, MoreHorizontal, Plus, UsersRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/modal'
import { canEditOrganization, useAppStore } from '@/store/app-store'

type RegionItem = { name: string; count: number; color: string; departments: string[]; manager: string }
const initialRegions: RegionItem[] = [
  { name: 'Miền Bắc', count: 38, color: '#2563eb', departments: ['Sale', 'Media Buyer', 'CSKH'], manager: 'Trần Đức Long' },
  { name: 'Miền Trung', count: 21, color: '#0f766e', departments: ['Sale', 'Media Buyer', 'Vận hành'], manager: 'Nguyễn Thu Hà' },
  { name: 'Miền Nam', count: 32, color: '#d97706', departments: ['Sale', 'Media Buyer', 'CSKH'], manager: 'Phạm Hoàng Nam' },
  { name: 'Quốc tế', count: 13, color: '#7c3aed', departments: ['Sale Global', 'Creative', 'Support'], manager: 'Lê Minh Quân' },
]
const leaders = ['Nguyễn Thùy Linh', 'Phạm Quốc Huy', '—', 'Vũ Minh Châu']

export default function DepartmentsPage() {
  const [regions, setRegions] = useState(initialRegions)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [modal, setModal] = useState<'region' | 'department' | null>(null)
  const [name, setName] = useState('')
  const showToast = useAppStore((state) => state.showToast)
  const role = useAppStore((state) => state.role)
  const canEdit = canEditOrganization(role)
  const selected = regions[selectedIndex]
  const addUnit = (event: FormEvent) => {
    event.preventDefault(); const value = name.trim(); if (!canEdit || !value) return
    if (modal === 'region') {
      setRegions((current) => [...current, { name: value, count: 0, color: '#64748b', departments: [], manager: 'Chưa phân công' }]); setSelectedIndex(regions.length)
    } else setRegions((current) => current.map((region, index) => index === selectedIndex ? { ...region, departments: [...region.departments, value] } : region))
    showToast(`Đã thêm ${value}`); setName(''); setModal(null)
  }
  return <>
    <div className="page-heading"><div><h1>Vùng & phòng ban</h1><p>Quản lý cấu trúc vận hành và người phụ trách theo vùng.</p></div>{canEdit && <button className="btn btn-primary" onClick={() => setModal('region')}><Plus size={16}/>Thêm đơn vị</button>}</div>
    {!canEdit && <div className="readonly-banner"><Eye size={17}/><span><strong>Chế độ chỉ xem</strong>Bạn có thể xem cơ cấu nhưng không thể thay đổi vùng hoặc bộ phận.</span></div>}
    <div className="split-admin surface"><aside className="org-tree"><div className="tree-head"><strong>Cơ cấu hiện tại</strong>{canEdit && <button className="icon-action" onClick={() => setModal('region')} aria-label="Thêm vùng"><Plus size={17}/></button>}</div>{regions.map((region, index) => <div className="tree-region" key={region.name}><button className={`tree-region-row ${index === selectedIndex ? 'selected' : ''}`} onClick={() => setSelectedIndex(index)}><ChevronRight size={15}/><i style={{ background: region.color }}/><span>{region.name}</span><b>{region.count}</b></button>{index === selectedIndex && <div className="tree-children">{region.departments.map((department) => <button key={department} onClick={() => showToast(`Đã chọn ${department} · ${region.name}`)}><Building2 size={14}/>{department}</button>)}</div>}</div>)}</aside>
      <section className="admin-detail"><div className="detail-hero"><div className="region-symbol"><MapPin size={21}/></div><div><span className="badge">Vùng</span><h2>{selected.name}</h2><p>Phụ trách bởi {selected.manager} · hiệu lực từ 01/04/2026</p></div>{canEdit && <button className="btn btn-secondary" onClick={() => showToast('Đã mở menu chỉnh sửa đơn vị')}><MoreHorizontal size={16}/>Thao tác</button>}</div><div className="detail-metrics"><span><UsersRound size={16}/><strong>{selected.count}</strong> nhân sự</span><span><Building2 size={16}/><strong>{selected.departments.length}</strong> bộ phận</span><span><GitMerge size={16}/><strong>{selected.departments.length ? 1 : 0}</strong> vị trí trống</span></div><div className="section-title"><h3>Bộ phận trực thuộc</h3>{canEdit && <button className="btn btn-ghost" onClick={() => setModal('department')}><Plus size={15}/>Thêm bộ phận</button>}</div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>BỘ PHẬN</th><th>LEADER</th><th>NHÂN SỰ</th><th>TRẠNG THÁI</th></tr></thead><tbody>{selected.departments.map((department, index) => { const leader = leaders[index % leaders.length]; return <tr key={department}><td><strong>{department}</strong></td><td>{leader}</td><td>{Math.max(2, Math.round(selected.count / Math.max(1, selected.departments.length)) - index)}</td><td><span className={`badge ${leader === '—' ? 'badge-danger' : 'badge-success'}`}>{leader === '—' ? 'Thiếu leader' : 'Đang hoạt động'}</span></td></tr> })}</tbody></table></div></section>
    </div>
    <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal === 'region' ? 'Thêm vùng vận hành' : `Thêm bộ phận vào ${selected.name}`} footer={<><button className="btn btn-secondary" onClick={() => setModal(null)}>Huỷ</button><button className="btn btn-primary" type="submit" form="add-org-unit">Thêm mới</button></>}><form id="add-org-unit" onSubmit={addUnit}><label className="field"><span>Tên {modal === 'region' ? 'vùng' : 'bộ phận'}</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={modal === 'region' ? 'Ví dụ: Tây Nam Bộ' : 'Ví dụ: Support MKT'}/></label></form></Modal>
  </>
}
