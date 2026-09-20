import { BellRing, Check, Download, FileClock, FileSignature, Send, X } from 'lucide-react'
import { getSignatureProgress } from '@/lib/people-ops'
import type { PeopleDocument } from '@/types/people-ops'

const statusLabels: Record<PeopleDocument['status'], string> = { draft: 'Bản nháp', waiting: 'Chờ ký', signed: 'Đã ký', expiring: 'Sắp hết hạn' }

export function DocumentDetail({ document, onClose, onPrimaryAction, onDownload }: { document: PeopleDocument; onClose: () => void; onPrimaryAction: () => void; onDownload: () => void }) {
  const action = document.status === 'draft' ? { label: 'Gửi yêu cầu ký', icon: Send } : document.status === 'waiting' ? { label: 'Nhắc người chưa ký', icon: BellRing } : document.status === 'expiring' ? { label: 'Tạo bản gia hạn', icon: FileClock } : { label: 'Tải bản đã ký', icon: Download }
  const ActionIcon = action.icon
  const progress = getSignatureProgress(document)
  const signerRows = Array.from({ length: progress.total }, (_, index) => ({ label: index === progress.total - 1 ? document.employee : index === 0 ? 'Đại diện Fun Agency' : `Người duyệt ${index + 1}`, done: index < progress.signed }))
  return <div className="document-detail-stack">
    <div className="document-preview"><div className="document-preview-brand"><span>FA</span><div><strong>FUN AGENCY</strong><small>Tài liệu nhân sự điện tử</small></div><FileSignature size={26}/></div><span className="document-code">{document.code}</span><h3>{document.title}</h3><p>{document.employee} · Hiệu lực {document.effectiveDate}</p><div className="document-preview-lines"><i/><i/><i/><i/></div><b className={`document-stamp status-${document.status}`}>{statusLabels[document.status]}</b></div>
    <section className="signature-flow"><div className="section-title"><div><h3>Luồng xác nhận</h3><p className="muted">{progress.signed}/{progress.total} chữ ký đã hoàn tất</p></div><span className={`badge ${document.status === 'signed' ? 'badge-success' : document.status === 'expiring' ? 'badge-warning' : ''}`}>{statusLabels[document.status]}</span></div><div className="signature-progress"><i role="progressbar" aria-label="Tiến độ luồng ký" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage}><b style={{ width: `${progress.percentage}%` }}/></i><strong>{progress.percentage}%</strong></div><ol><li className={document.status === 'draft' ? '' : 'done'}><span>{document.status === 'draft' ? '1' : <Check size={13}/>}</span><div><strong>Vận hành phát hành tài liệu</strong><small>{document.status === 'draft' ? 'Chưa phát hành' : document.updatedAt}</small></div></li>{signerRows.map((signer, index) => <li className={signer.done ? 'done' : ''} key={`${signer.label}-${index}`}><span>{signer.done ? <Check size={13}/> : index + 2}</span><div><strong>{signer.label}</strong><small>{signer.done ? 'Đã xác nhận' : index === progress.total - 1 ? 'Chờ ký qua email' : 'Chờ ký'}</small></div></li>)}</ol></section>
    <div className="document-detail-actions"><button className="btn btn-secondary" onClick={document.status === 'signed' ? onClose : onDownload}>{document.status === 'signed' ? <X size={15}/> : <Download size={15}/>} {document.status === 'signed' ? 'Đóng' : 'Tải bản xem trước'}</button><button className="btn btn-primary" onClick={onPrimaryAction}><ActionIcon size={16}/>{action.label}</button></div>
  </div>
}
