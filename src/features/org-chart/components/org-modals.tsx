import { ArrowRight, CalendarDays, Check, MoveRight, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import type { DraftMove } from '../store/org-chart-store'

interface PickerOption {
  id: string
  title: string
  meta: string
  parentId?: string
}

const todayValue = () => {
  const today = new Date()
  const offset = today.getTimezoneOffset() * 60_000
  return new Date(today.getTime() - offset).toISOString().slice(0, 10)
}

export function MovePickerModal({
  sources,
  targets,
  initialSourceId,
  onCancel,
  onContinue,
}: {
  sources: PickerOption[]
  targets: PickerOption[]
  initialSourceId?: string | null
  onCancel: () => void
  onContinue: (sourceId: string, targetId: string) => void
}) {
  const preferredSourceId = sources.some((item) => item.id === initialSourceId)
    ? initialSourceId ?? ''
    : sources[0]?.id ?? ''
  const [sourceId, setSourceId] = useState(preferredSourceId)
  const source = sources.find((item) => item.id === sourceId)
  const firstTarget = targets.find((item) => item.id !== source?.parentId)?.id ?? ''
  const [targetId, setTargetId] = useState(firstTarget)
  const selectedTarget = targetId === source?.parentId ? '' : targetId

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onCancel}>Huỷ</button>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!sourceId || !selectedTarget}
        onClick={() => onContinue(sourceId, selectedTarget)}
      >
        Tiếp tục
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </>
  )

  return (
    <Modal
      open
      onClose={onCancel}
      title="Điều chuyển nhanh"
      description="Cách thay thế kéo-thả, phù hợp với màn hình cảm ứng và bàn phím."
      footer={footer}
    >
      <div className="quick-move-intro">
        <MoveRight size={18} aria-hidden="true" />
        <p>Chọn nhân sự và bộ phận đích. Bạn sẽ được kiểm tra lại ngày hiệu lực trước khi tạo bản nháp.</p>
      </div>
      <div className="quick-move-grid">
        <label className="field">
          <span>Nhân sự cần chuyển</span>
          <select
            autoFocus
            data-autofocus
            value={sourceId}
            onChange={(event) => {
              const nextSource = sources.find((item) => item.id === event.target.value)
              setSourceId(event.target.value)
              if (targetId === nextSource?.parentId) {
                setTargetId(targets.find((item) => item.id !== nextSource.parentId)?.id ?? '')
              }
            }}
          >
            {sources.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.meta}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Bộ phận mới</span>
          <select value={selectedTarget} onChange={(event) => setTargetId(event.target.value)}>
            <option value="" disabled>Chọn bộ phận khác</option>
            {targets.filter((item) => item.id !== source?.parentId).map((item) => (
              <option key={item.id} value={item.id}>{item.title} · {item.meta}</option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  )
}

export function MoveConfirmModal({
  move,
  onCancel,
  onConfirm,
}: {
  move: Omit<DraftMove, 'id' | 'effectiveDate' | 'note' | 'includeSubordinates'>
  onCancel: () => void
  onConfirm: (rest: Pick<DraftMove, 'effectiveDate' | 'note' | 'includeSubordinates'>) => void
}) {
  const [date, setDate] = useState(todayValue())
  const [note, setNote] = useState('')
  const [include, setInclude] = useState(false)
  const canIncludeSubordinates = move.nodeType !== 'employee'
  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onCancel}>Huỷ</button>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!date}
        onClick={() => onConfirm({ effectiveDate: date, note, includeSubordinates: canIncludeSubordinates && include })}
      >
        <Check size={16} aria-hidden="true" />
        Tạo bản nháp
      </button>
    </>
  )

  return (
    <Modal
      open
      onClose={onCancel}
      title="Xác nhận điều chuyển"
      description="Thay đổi chỉ có hiệu lực sau bước xem lại và lưu."
      footer={footer}
    >
      <div className="move-summary" aria-label={`Chuyển ${move.nodeName} từ ${move.fromParentName} sang ${move.toParentName}`}>
        <strong>{move.nodeName}</strong>
        <div>
          <span><small>Từ</small>{move.fromParentName}</span>
          <ArrowRight size={18} aria-hidden="true" />
          <span className="move-destination"><small>Đến</small>{move.toParentName}</span>
        </div>
      </div>
      <label className="field">
        <span><CalendarDays size={15} aria-hidden="true" />Ngày hiệu lực</span>
        <input autoFocus data-autofocus required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="field">
        <span>Lý do / ghi chú <small>Không bắt buộc</small></span>
        <textarea
          value={note}
          maxLength={240}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ví dụ: Điều chỉnh cơ cấu vận hành quý 3…"
        />
        <small className="field-counter">{note.length}/240</small>
      </label>
      {canIncludeSubordinates ? (
        <label className="modal-checkbox">
          <input type="checkbox" checked={include} onChange={(event) => setInclude(event.target.checked)} />
          <span>Chuyển kèm các đơn vị trực thuộc</span>
        </label>
      ) : null}
    </Modal>
  )
}

export function ReviewModal({
  drafts,
  onCancel,
  onSave,
}: {
  drafts: DraftMove[]
  onCancel: () => void
  onSave: () => void
}) {
  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onCancel}>Quay lại chỉnh sửa</button>
      <button type="button" className="btn btn-primary" onClick={onSave}>
        <Check size={16} aria-hidden="true" />
        Xác nhận lưu
      </button>
    </>
  )

  return (
    <Modal
      open
      onClose={onCancel}
      title={`Xem lại ${drafts.length} thay đổi`}
      description="Kiểm tra kỹ đơn vị đi, đơn vị đến và ngày hiệu lực trước khi lưu."
      size="lg"
      footer={footer}
    >
      <div className="review-warning">
        <TriangleAlert size={17} aria-hidden="true" />
        <span>Sau khi lưu, cơ cấu hiện tại sẽ được cập nhật và thay đổi được ghi vào lịch sử.</span>
      </div>
      <ol className="review-list">
        {drafts.map((item) => (
          <li key={item.id}>
            <span className="review-index" aria-hidden="true" />
            <div>
              <strong>{item.nodeName}</strong>
              <span className="review-route">
                {item.fromParentName}
                <ArrowRight size={15} aria-hidden="true" />
                <b>{item.toParentName}</b>
              </span>
              <small>Hiệu lực {item.effectiveDate}{item.note ? ` · ${item.note}` : ''}</small>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  )
}
