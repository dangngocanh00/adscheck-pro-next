import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Building2, ChevronRight, GripVertical, MapPin, UserRound, UsersRound } from 'lucide-react'
import type { OrgNodeType } from '@/types/hrm'

interface Props {
  id: string
  type: OrgNodeType | 'ceo'
  title: string
  subtitle: string
  count?: string
  draft?: boolean
  selected?: boolean
  lifted?: boolean
  activeTarget?: boolean
  dropEligible?: boolean
  dragActive?: boolean
  movable?: boolean
  editMode: boolean
  onSelect: () => void
  onKeyboard: (event: React.KeyboardEvent) => void
  children?: React.ReactNode
}

const iconMap = {
  ceo: UserRound,
  senior_manager: UsersRound,
  region: MapPin,
  department: Building2,
  employee: UserRound,
}

export function OrgNode({
  id,
  type,
  title,
  subtitle,
  count,
  draft,
  selected,
  lifted,
  activeTarget,
  dropEligible,
  dragActive,
  movable = true,
  editMode,
  onSelect,
  onKeyboard,
  children,
}: Props) {
  const canMove = editMode && movable && type !== 'ceo' && type !== 'senior_manager'
  const canReceiveDrop = editMode
    && type !== 'ceo'
    && type !== 'employee'
    && (!dragActive || Boolean(dropEligible))
  const draggable = useDraggable({ id, data: { type, title }, disabled: !canMove })
  const droppable = useDroppable({ id, data: { type, title }, disabled: !canReceiveDrop })
  const Icon = iconMap[type]
  const isValidOver = droppable.isOver && dropEligible
  const isInvalidOver = droppable.isOver && !dropEligible

  const setRef = (node: HTMLElement | null) => {
    draggable.setNodeRef(node)
    droppable.setNodeRef(node)
  }

  const stateLabel = [
    draft ? 'chờ lưu' : '',
    selected ? 'đang được chọn' : '',
    lifted ? 'đang được nhấc để di chuyển' : '',
    dropEligible && dragActive ? 'có thể thả vào đây' : '',
  ].filter(Boolean).join(', ')

  return (
    <div
      ref={setRef}
      className={`org-node org-${type} ${canMove ? 'is-movable' : ''} ${draft ? 'is-draft' : ''} ${selected ? 'is-selected' : ''} ${lifted ? 'is-lifted' : ''} ${dropEligible && dragActive ? 'can-drop' : ''} ${isValidOver ? 'is-over' : ''} ${isInvalidOver ? 'is-invalid-over' : ''} ${activeTarget ? 'keyboard-target' : ''} ${draggable.isDragging ? 'is-dragging' : ''}`}
      data-org-node-id={id}
      style={{
        transform: draggable.transform
          ? `translate3d(${draggable.transform.x}px,${draggable.transform.y}px,0)`
          : undefined,
      }}
    >
      <div className="org-node-row">
        <button
          type="button"
          className="org-node-main"
          onClick={onSelect}
          onKeyDown={onKeyboard}
          aria-label={`${title}, ${subtitle}${stateLabel ? `, ${stateLabel}` : ''}`}
          aria-describedby={canMove ? 'org-drag-instructions' : undefined}
          aria-pressed={lifted || undefined}
        >
          <span className="org-node-icon" aria-hidden="true">
            <Icon size={type === 'employee' ? 14 : 17} />
          </span>
          <span className="org-node-copy">
            <strong title={title}>{title}</strong>
            <small title={subtitle}>{subtitle}</small>
          </span>
          {count ? <span className="badge">{count}</span> : null}
          {!canMove ? <ChevronRight size={14} aria-hidden="true" /> : null}
        </button>
        {canMove ? (
          <span
            ref={draggable.setActivatorNodeRef}
            className="drag-handle"
            {...draggable.listeners}
            aria-hidden="true"
          >
            <GripVertical size={17} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}
