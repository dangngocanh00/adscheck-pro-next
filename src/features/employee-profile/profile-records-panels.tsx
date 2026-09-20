import { CheckCircle2, Download, FileSignature, FileText, History, Paperclip, TriangleAlert, UploadCloud } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import type { PeopleDocument } from '@/types/people-ops'
import type { EmployeeProfileData, ProfileDocument } from './employee-profile-data'
import { ProfileSection } from './profile-info-elements'

const documentStatus = {
  verified: { label: 'Đã xác minh', className: 'badge-success', icon: CheckCircle2 },
  expiring: { label: 'Sắp hết hạn', className: 'badge-warning', icon: TriangleAlert },
  missing: { label: 'Cần bổ sung', className: 'badge-danger', icon: Paperclip },
  draft: { label: 'Bản nháp', className: '', icon: FileText },
  waiting: { label: 'Chờ ký', className: 'badge-warning', icon: FileSignature },
} as const

export function ProfileDocumentsPanel({ profile, sharedDocuments, canUpload, onUploaded }: { profile: EmployeeProfileData; sharedDocuments: PeopleDocument[]; canUpload: boolean; onUploaded: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const shared: ProfileDocument[] = sharedDocuments.map((document) => ({ id: document.id, name: document.title, type: document.type, updatedAt: document.updatedAt, status: document.status === 'signed' ? 'verified' : document.status }))
  const documents: readonly ProfileDocument[] = [...profile.documents, ...shared]
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    onUploaded(file)
    event.target.value = ''
  }
  return (
        <ProfileSection title="Kho tài liệu nhân sự" description={`${documents.length} tài liệu · lưu tập trung theo từng hồ sơ`} action={canUpload ? <><input ref={inputRef} className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={upload} /><button className="btn btn-primary" type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={15} />Tải tài liệu</button></> : undefined}>
      <div className="profile-document-list">
        {documents.map((document) => {
          const status = documentStatus[document.status]
          const StatusIcon = status.icon
          return <div key={document.id}><span className="document-icon"><FileText size={18} /></span><span><strong>{document.name}</strong><small>{document.type} · Cập nhật {document.updatedAt}</small></span><span className={`badge ${status.className}`}><StatusIcon size={12} />{status.label}</span><button className="icon-action" type="button" aria-label={`Tải ${document.name}`} onClick={() => downloadProfileDocument(document)}><Download size={16} /></button></div>
        })}
      </div>
    </ProfileSection>
  )
}

function downloadProfileDocument(document: ProfileDocument) {
  const link = window.document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`${document.name}\n${document.type}\nCập nhật ${document.updatedAt}`], { type: 'text/plain;charset=utf-8' }))
  link.download = `${document.name.replace(/[^\p{L}\p{N}]+/gu, '-').toLocaleLowerCase('vi')}.txt`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function ProfileHistoryPanel({ profile }: { profile: EmployeeProfileData }) {
  return (
    <ProfileSection title="Lịch sử hồ sơ" description="Thay đổi quan trọng được lưu theo thời điểm hiệu lực">
      <ol className="profile-history-list">
        {[...profile.timeline].reverse().map((item) => <li key={item.id}><span><History size={16} /></span><div><time dateTime={item.date}>{formatDate(item.date)}</time><strong>{item.title}</strong><p>{item.description}</p></div><span className="badge">{kindLabel[item.kind]}</span></li>)}
      </ol>
    </ProfileSection>
  )
}

const kindLabel = { join: 'Onboarding', contract: 'Hợp đồng', transfer: 'Cơ cấu', review: 'Đánh giá' } as const
const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN').format(new Date(value))
