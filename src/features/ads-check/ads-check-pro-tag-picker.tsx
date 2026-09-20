import { useAppLanguage, t, tx, m } from '@/i18n'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, Plus, Search, Trash2, X } from 'lucide-react'
import { TAG_COLOR_PALETTE, type TagDefinition } from './ads-check-pro-tag-system'

type TagPickerProps = {
  tags: TagDefinition[]
  assignedTagIds: string[]
  anchorEl: HTMLElement | null
  onClose: () => void
  onToggleAssign: (tagId: string) => void
  onCreate: (name: string, colorHex: string) => void
  onDeleteTag: (tagId: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  placement?: 'top' | 'bottom'
}

function SortableTagRow({ tag, assigned, onToggleAssign, onDeleteTag }: { tag: TagDefinition; assigned: boolean; onToggleAssign: (id: string) => void; onDeleteTag: (id: string) => void }) {
  useAppLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.id })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`ads-tag-picker-row${isDragging ? ' is-dragging' : ''}`}>
    <button type="button" className="ads-tag-picker-handle" title={t("ui.626879ace2")} aria-label={tx(m("ui.08b05e9d59", { 0: tag.name }))} onClick={(event) => event.stopPropagation()} {...attributes} {...listeners}>
      <GripVertical size={13} />
    </button>
    <button type="button" className={`ads-tag-picker-item${assigned ? ' is-assigned' : ''}`} aria-pressed={assigned} onClick={() => onToggleAssign(tag.id)}>
      <i className="ads-tag-swatch" style={{ background: tag.colorHex }} aria-hidden="true" />
      <span>{tag.name}</span>
      {assigned && <Check size={13} aria-hidden="true" />}
    </button>
    {tx(confirmingDelete
      ? <span className="ads-tag-picker-confirm">
          <button type="button" aria-label={tx(m("ui.93e7ce65b3", { 0: tag.name }))} onClick={() => onDeleteTag(tag.id)}>{t("ui.aa1d94fc16")}</button>
          <button type="button" aria-label={t("ui.6fe445d9e5")} onClick={() => setConfirmingDelete(false)}>{t("ui.34ca764caf")}</button>
        </span>
      : <button type="button" className="ads-tag-picker-delete" aria-label={tx(m("ui.82a88aeca9", { 0: tag.name }))} onClick={() => setConfirmingDelete(true)}><Trash2 size={13} /></button>)}
  </li>
}

// VIA + TKQC Tag manager (Batch Update Part B + D6) — reusable popover
// anchored to the triggering cell, matching the Final Update dropdown
// portal pattern (position:fixed, coordinates from the anchor's own rect,
// so it is never clipped by an ancestor's overflow:hidden).
export function AdsProTagPicker({ tags, assignedTagIds, anchorEl, onClose, onToggleAssign, onCreate, onDeleteTag, onReorder, placement = 'bottom' }: TagPickerProps) {
  useAppLanguage();
  const [screen, setScreen] = useState<'pick' | 'create'>('pick')
  const [query, setQuery] = useState('')
  const [draftName, setDraftName] = useState('')
  const [draftColor, setDraftColor] = useState(TAG_COLOR_PALETTE[0])
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  useLayoutEffect(() => {
    if (!anchorEl) return
    const recompute = () => {
      const rect = anchorEl.getBoundingClientRect()
      // Clamp so the (fixed-width, 260px) panel never extends past the
      // right edge on narrow/mobile viewports — a plain rect.left anchor
      // left "Đóng chọn Tag" unreachable when the trigger sits near the
      // right edge of a narrow screen.
      const left = Math.min(rect.left, window.innerWidth - 260 - 8)
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 260
      const preferredTop = placement === 'top' ? rect.top - panelHeight - 13 : rect.bottom + 6
      setPos({ top: Math.max(8, Math.min(preferredTop, window.innerHeight - panelHeight - 8)), left: Math.max(8, left) })
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [anchorEl, placement])

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || anchorEl?.contains(target)) return
      onClose()
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [anchorEl, onClose])

  const filteredTags = tags.filter((tag) => tag.name.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tags.findIndex((tag) => tag.id === active.id)
    const newIndex = tags.findIndex((tag) => tag.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(oldIndex, newIndex)
  }

  const submitCreate = () => {
    const name = draftName.trim()
    if (!name) return
    onCreate(name, draftColor)
    setQuery('')
    setDraftName('')
    setDraftColor(TAG_COLOR_PALETTE[0])
    setScreen('pick')
  }

  return createPortal(
    <div ref={panelRef} className="ads-tag-picker" role="dialog" aria-label={tx(screen === 'pick' ? m("ui.138527cbbc") : m("ui.48da4ef1f5"))} style={{ top: pos.top, left: pos.left }}>
      {tx(screen === 'pick'
        ? <>
            <header>
              <strong>{t("ui.138527cbbc")}{" "}{assignedTagIds.length}/{tags.length}</strong>
              <button type="button" className="ads-tag-picker-close" aria-label={t("ui.1f4f86e101")} onClick={onClose}><X size={14} /></button>
            </header>
            <div className="ads-tag-picker-toolbar">
              <label className="ads-tag-picker-search">
                <Search size={14} aria-hidden="true" />
                <input aria-label={t("ui.328a7f98d9")} placeholder={t("ui.328a7f98d9")} value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <button type="button" className="ads-tag-picker-create-trigger" onClick={() => setScreen('create')}><Plus size={14} />{t("ui.2b1b7fc61f")}</button>
            </div>
            {filteredTags.length === 0
              ? <p className="ads-tag-picker-empty">{t("ui.b9b956280d")}</p>
              : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredTags.map((tag) => tag.id)} strategy={verticalListSortingStrategy}>
                    <ul className="ads-tag-picker-list">
                      {filteredTags.map((tag) => <SortableTagRow key={tag.id} tag={tag} assigned={assignedTagIds.includes(tag.id)} onToggleAssign={onToggleAssign} onDeleteTag={onDeleteTag} />)}
                    </ul>
                  </SortableContext>
                </DndContext>}
          </>
        : <>
            <header>
              <strong>{t("ui.48da4ef1f5")}</strong>
              <button type="button" className="ads-tag-picker-close" aria-label={t("ui.48d322a24e")} onClick={() => setScreen('pick')}><X size={14} /></button>
            </header>
            <label className="ads-tag-picker-name-field">
              <span className="sr-only">{t("ui.0c8de591d5")}</span>
              <input autoFocus aria-label={t("ui.0c8de591d5")} placeholder={t("ui.0c8de591d5")} value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitCreate() }} />
            </label>
            <div className="ads-tag-picker-colors" role="radiogroup" aria-label={t("ui.8bb5298d80")}>
              {tx(TAG_COLOR_PALETTE.map((color) => <button key={color} type="button" role="radio" aria-checked={draftColor === color} aria-label={tx(m("ui.ff93cb2d9b", { 0: color }))} className={`ads-tag-swatch-button${draftColor === color ? ' is-selected' : ''}`} style={{ background: color }} onClick={() => setDraftColor(color)} />))}
            </div>
            <footer>
              {tx(draftName.trim().length === 0
                ? <button type="button" className="is-secondary" onClick={() => setScreen('pick')}>{t("ui.34ca764caf")}</button>
                : <button type="button" className="is-confirm" aria-label={t("ui.916ab4b77f")} onClick={submitCreate}><Check size={16} /></button>)}
            </footer>
          </>)}
    </div>,
    document.body,
  )
}
