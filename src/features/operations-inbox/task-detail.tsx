import { ArrowUpRight, Check, CircleAlert, Clock3, UserRoundCog } from 'lucide-react'
import { formatTaskDue, getTaskSla } from '@/lib/people-ops'
import type { OpsTask } from '@/types/people-ops'

const categoryLabels: Record<OpsTask['category'], string> = {
  onboarding: 'Onboarding', contract: 'Hợp đồng', attendance: 'Chấm công', approval: 'Phê duyệt', offboarding: 'Offboarding',
}

export function TaskDetail({ task, canEditOwner, onComplete, onUnblock, onOpenSource, onOwnerChange }: { task: OpsTask; canEditOwner: boolean; onComplete: () => void; onUnblock: () => void; onOpenSource: () => void; onOwnerChange: (owner: string) => void }) {
  const ownerOptions = [...new Set([task.owner, 'Vận hành', 'Leader trực tiếp', 'KT + Vận hành', 'Quản lý miền Nam'])]
  return <aside id="ops-task-detail" className="surface ops-task-detail" tabIndex={-1}>
    <div className="ops-detail-kicker"><span className={`ops-priority priority-${task.priority}`}>{task.priority === 'urgent' ? 'Khẩn cấp' : task.priority === 'high' ? 'Ưu tiên cao' : 'Bình thường'}</span><span>{categoryLabels[task.category]}</span></div>
    <h2>{task.title}</h2><p className="ops-detail-subject">{task.subject}</p>
    <div className="ops-sla-card"><Clock3 size={19}/><span><small>Cam kết xử lý</small><strong>{getTaskSla(task)}</strong></span><b>{task.progress}%</b></div>
    <p className="ops-detail-description">{task.description}</p>
    <dl className="ops-detail-meta"><div><dt>Người phụ trách</dt><dd><UserRoundCog size={15}/><select aria-label="Đổi người phụ trách" value={task.owner} disabled={!canEditOwner || task.status === 'done'} onChange={(event) => onOwnerChange(event.target.value)}>{ownerOptions.map((owner) => <option key={owner}>{owner}</option>)}</select></dd></div><div><dt>Hạn xử lý</dt><dd>{formatTaskDue(task.dueDate)}</dd></div><div><dt>Trạng thái</dt><dd>{task.status === 'blocked' ? 'Đang chờ phản hồi' : task.status === 'done' ? 'Đã hoàn tất' : 'Đang xử lý'}</dd></div></dl>
    {task.status === 'blocked' && <div className="ops-blocked-note"><CircleAlert size={17}/><span><strong>Đang bị chặn</strong><small>Cập nhật khi đã nhận đủ thông tin từ nhân sự.</small></span><button className="btn btn-secondary" onClick={onUnblock}>Đã có phản hồi</button></div>}
    <div className="ops-detail-actions"><button className="btn btn-secondary" onClick={onOpenSource}>Mở hồ sơ nguồn <ArrowUpRight size={15}/></button><button className="btn btn-primary" disabled={task.status === 'done' || task.status === 'blocked'} onClick={onComplete}><Check size={16}/>{task.status === 'done' ? 'Đã hoàn tất' : task.status === 'blocked' ? 'Chờ phản hồi' : 'Hoàn tất việc'}</button></div>
  </aside>
}
