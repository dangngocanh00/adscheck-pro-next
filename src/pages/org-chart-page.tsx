import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CircleHelp, GripVertical, LockKeyhole, MoveRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrgChartBranch } from '@/features/org-chart/components/org-chart-branch'
import { OrgChartInspector } from '@/features/org-chart/components/org-chart-inspector'
import { OrgChartMobile } from '@/features/org-chart/components/org-chart-mobile'
import {
  MoveConfirmModal,
  MovePickerModal,
  ReviewModal,
} from '@/features/org-chart/components/org-modals'
import { OrgNode } from '@/features/org-chart/components/org-node'
import {
  OrgChartToolbar,
  type OrgSearchResult,
  type OrgViewMode,
} from '@/features/org-chart/components/org-chart-toolbar'
import {
  projectedParent,
  type DraftMove,
  useOrgChartStore,
} from '@/features/org-chart/store/org-chart-store'
import { departments, employees, regions } from '@/mocks/hrm-data'
import { canEditOrganization, useAppStore } from '@/store/app-store'
import type { OrgNodeType } from '@/types/hrm'

type ChartNodeType = OrgNodeType | 'ceo'
type MoveCandidate = Omit<DraftMove, 'id' | 'effectiveDate' | 'note' | 'includeSubordinates'>
type RevealRequest = { id: string; requestId: number }

const managers = employees.filter((item) => item.role === 'senior_manager')
const demoSeniorManagerId = 'emp-002'
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const nodeType = (id: string): ChartNodeType => {
  if (id.startsWith('dept-')) return 'department'
  if (id.startsWith('region-')) return 'region'
  const role = employees.find((item) => item.id === id)?.role
  if (role === 'ceo') return 'ceo'
  if (role === 'senior_manager') return 'senior_manager'
  return 'employee'
}

const parentTypeFor = (source: ChartNodeType): OrgNodeType | null => {
  if (source === 'employee') return 'department'
  if (source === 'department') return 'region'
  if (source === 'region') return 'senior_manager'
  return null
}

const targetTypeLabel: Partial<Record<OrgNodeType, string>> = {
  department: 'bộ phận',
  region: 'vùng',
  senior_manager: 'quản lý cấp cao',
}

export default function OrgChartPage() {
  const navigate = useNavigate()
  const role = useAppStore((state) => state.role)
  const showToast = useAppStore((state) => state.showToast)
  const { savedParents, drafts, redoStack, addDraft, undo, redo, save, discard } = useOrgChartStore()
  const [editMode, setEditMode] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [view, setView] = useState<OrgViewMode>('tree')
  const [selected, setSelected] = useState<string | null>('region-north')
  const [dragId, setDragId] = useState<string | null>(null)
  const [pending, setPending] = useState<MoveCandidate | null>(null)
  const [review, setReview] = useState(false)
  const [quickMove, setQuickMove] = useState(false)
  const [quickMoveSource, setQuickMoveSource] = useState<string | null>(null)
  const [lifted, setLifted] = useState<string | null>(null)
  const [targetIndex, setTargetIndex] = useState(0)
  const [live, setLive] = useState('')
  const [query, setQuery] = useState('')
  const [revealRequest, setRevealRequest] = useState<RevealRequest | null>(null)
  const previousRole = useRef(role)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }))
  const canEdit = canEditOrganization(role)
  const effectiveEditMode = canEdit && editMode
  const parentOf = useCallback(
    (id: string) => projectedParent(id, savedParents, drafts),
    [drafts, savedParents],
  )
  const expectedTargetType = dragId ? parentTypeFor(nodeType(dragId)) : null

  const getNodeName = useCallback((id: string) => employees.find((item) => item.id === id)?.fullName
    ?? departments.find((item) => item.id === id)?.name
    ?? regions.find((item) => item.id === id)?.name
    ?? id, [])

  const managerForNode = useCallback((id: string) => {
    const type = nodeType(id)
    if (type === 'senior_manager') return id
    if (type === 'region') return parentOf(id)
    if (type === 'department') return parentOf(parentOf(id))
    if (type === 'employee') return parentOf(parentOf(parentOf(id)))
    return ''
  }, [parentOf])

  const savedManagerForNode = useCallback((id: string) => {
    const type = nodeType(id)
    if (type === 'senior_manager') return id
    if (type === 'region') return savedParents[id]
    if (type === 'department') return savedParents[savedParents[id]]
    if (type === 'employee') return savedParents[savedParents[savedParents[id]]]
    return ''
  }, [savedParents])

  const canViewNode = useCallback((id: string) => {
    if (role !== 'senior_manager') return true
    const type = nodeType(id)
    if (type === 'ceo') return true
    if (type === 'senior_manager') return id === demoSeniorManagerId
    return managerForNode(id) === demoSeniorManagerId
  }, [managerForNode, role])

  const canMoveNode = useCallback((id: string) => {
    if (!canEdit) return false
    const type = nodeType(id)
    const employee = type === 'employee' ? employees.find((item) => item.id === id) : null
    if (type === 'ceo' || type === 'senior_manager' || employee?.role === 'leader' || employee?.status === 'resigned') return false
    if (role !== 'senior_manager') return true
    if (type === 'region') return false
    return managerForNode(id) === demoSeniorManagerId
  }, [canEdit, managerForNode, role])

  const canUseTarget = useCallback((id: string) => {
    if (!canEdit) return false
    if (role !== 'senior_manager') return true
    if (nodeType(id) === 'senior_manager') return false
    return managerForNode(id) === demoSeniorManagerId
  }, [canEdit, managerForNode, role])

  const isMoveAuthorized = useCallback((move: MoveCandidate | DraftMove) => {
    if (!canEdit) return false
    const sourceType = nodeType(move.nodeId)
    const targetType = nodeType(move.toParentId)
    const employee = sourceType === 'employee' ? employees.find((item) => item.id === move.nodeId) : null
    if (
      !parentTypeFor(sourceType)
      || parentTypeFor(sourceType) !== targetType
      || sourceType === 'ceo'
      || sourceType === 'senior_manager'
      || employee?.role === 'leader'
      || employee?.status === 'resigned'
    ) return false
    if (role !== 'senior_manager') return true
    if (sourceType === 'region') return false
    return savedManagerForNode(move.fromParentId) === demoSeniorManagerId
      && savedManagerForNode(move.toParentId) === demoSeniorManagerId
  }, [canEdit, role, savedManagerForNode])

  const validTargets = useMemo(() => {
    if (!lifted) return []
    const expected = parentTypeFor(nodeType(lifted))
    const currentParent = parentOf(lifted)
    if (expected === 'department') return departments.map((item) => item.id).filter((id) => id !== currentParent && canUseTarget(id))
    if (expected === 'region') return regions.map((item) => item.id).filter((id) => id !== currentParent && canUseTarget(id))
    if (expected === 'senior_manager') return managers.map((item) => item.id).filter((id) => id !== currentParent && canUseTarget(id))
    return []
  }, [canUseTarget, lifted, parentOf])

  const searchIndex = useMemo<OrgSearchResult[]>(() => [
    ...employees.filter((item) => canViewNode(item.id)).map((item) => ({
      id: item.id,
      title: item.fullName,
      meta: `${item.positionTitle}${parentOf(item.id) ? ` · ${getNodeName(parentOf(item.id))}` : ''}`,
    })),
    ...departments.filter((item) => canViewNode(item.id)).map((item) => ({
      id: item.id,
      title: item.name,
      meta: `Bộ phận · ${getNodeName(parentOf(item.id))}`,
    })),
    ...regions.filter((item) => canViewNode(item.id)).map((item) => ({
      id: item.id,
      title: item.name,
      meta: `Vùng · ${getNodeName(parentOf(item.id))}`,
    })),
  ], [canViewNode, getNodeName, parentOf])

  const searchResults = useMemo(() => {
    const term = normalizeSearch(query.trim())
    if (!term) return []
    return searchIndex.filter((item) => normalizeSearch(`${item.title} ${item.meta}`).includes(term)).slice(0, 7)
  }, [query, searchIndex])

  useEffect(() => {
    if (!canEdit) {
      setEditMode(false)
      setLifted(null)
      setPending(null)
      setReview(false)
      setQuickMove(false)
      setDragId(null)
    }
  }, [canEdit])

  useEffect(() => {
    if (previousRole.current === role) return
    previousRole.current = role
    setLifted(null)
    setPending(null)
    setReview(false)
    setQuickMove(false)
    setDragId(null)
    if (drafts.length) {
      discard()
      showToast('Đã xoá bản nháp cũ khi chuyển vai trò để bảo vệ phạm vi quản lý.')
    }
  }, [discard, drafts.length, role, showToast])

  useEffect(() => {
    if (selected && !canViewNode(selected)) {
      setSelected(role === 'senior_manager' ? demoSeniorManagerId : 'emp-001')
    }
  }, [canViewNode, role, selected])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const isEditingField = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || Boolean(target?.closest('[contenteditable="true"]'))
      const modalOpen = Boolean(pending || review || quickMove)
      if (!effectiveEditMode || modalOpen || isEditingField || (!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== 'z') return
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    }
    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [effectiveEditMode, pending, quickMove, redo, review, undo])

  useEffect(() => {
    if (!revealRequest) return
    let attempts = 0
    let frame = 0
    const locateNode = () => {
      const node = document.querySelector<HTMLElement>(`[data-org-node-id="${revealRequest.id}"] > .org-node-row > .org-node-main`)
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        node.focus({ preventScroll: true })
        return
      }
      attempts += 1
      if (attempts < 12) frame = window.requestAnimationFrame(locateNode)
    }
    frame = window.requestAnimationFrame(locateNode)
    return () => window.cancelAnimationFrame(frame)
  }, [revealRequest])

  useEffect(() => {
    const targetId = lifted ? validTargets[targetIndex] : null
    if (!targetId) return
    document.querySelector<HTMLElement>(`[data-org-node-id="${targetId}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })
  }, [lifted, targetIndex, validTargets])

  const prepareMove = (sourceId: string, targetId: string) => {
    if (!canEdit) return
    const sourceType = nodeType(sourceId)
    const targetType = nodeType(targetId)
    const expected = parentTypeFor(sourceType)
    if (!canMoveNode(sourceId)) {
      showToast('Không thể điều chuyển node này trong phạm vi vai trò hiện tại.')
      setLive('Node này không được phép điều chuyển')
      return
    }
    if (!canUseTarget(targetId)) {
      showToast('Đích điều chuyển nằm ngoài phạm vi bạn quản lý.')
      setLive('Đích điều chuyển nằm ngoài phạm vi được phép')
      return
    }
    if (!expected || targetType !== expected) {
      const reason = sourceType === 'employee'
        ? 'Nhân viên cần được thả vào một Bộ phận'
        : sourceType === 'department'
          ? 'Bộ phận cần được thả vào một Vùng'
          : 'Vùng cần được thả vào một Quản lý cấp cao'
      showToast(`Chưa thể điều chuyển. ${reason}.`)
      setLive(reason)
      return
    }
    const fromParentId = parentOf(sourceId)
    if (fromParentId === targetId) {
      showToast(`${getNodeName(sourceId)} đã thuộc ${getNodeName(targetId)}`)
      return
    }
    setPending({
      nodeId: sourceId,
      nodeType: sourceType as OrgNodeType,
      nodeName: getNodeName(sourceId),
      fromParentId,
      fromParentName: getNodeName(fromParentId),
      toParentId: targetId,
      toParentName: getNodeName(targetId),
    })
    setLive(`Chọn ngày hiệu lực để chuyển ${getNodeName(sourceId)} sang ${getNodeName(targetId)}`)
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id)
    const expected = parentTypeFor(nodeType(id))
    setDragId(id)
    setSelected(id)
    setLive(`Đang di chuyển ${getNodeName(id)}. Thả vào ${targetTypeLabel[expected ?? 'employee'] ?? 'đơn vị phù hợp'}.`)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDragId(null)
    if (over) prepareMove(String(active.id), String(over.id))
    else {
      const expected = parentTypeFor(nodeType(String(active.id)))
      const message = `Đã huỷ. Hãy thả vào ${targetTypeLabel[expected ?? 'employee'] ?? 'đơn vị phù hợp'}.`
      showToast(message)
      setLive(message)
    }
  }

  const handleKeyboard = (id: string, event: React.KeyboardEvent) => {
    if (!effectiveEditMode) return
    if (event.key === 'Escape' && lifted) {
      event.preventDefault()
      setLifted(null)
      setLive('Đã huỷ thao tác di chuyển')
      return
    }
    if (event.key === ' ') {
      event.preventDefault()
      if (!lifted && parentTypeFor(nodeType(id)) && canMoveNode(id)) {
        setLifted(id)
        setTargetIndex(0)
        setLive(`Đã nhấc ${getNodeName(id)}. Dùng phím mũi tên để chọn đích, Space để thả, Escape để huỷ.`)
      } else if (lifted && validTargets[targetIndex]) {
        prepareMove(lifted, validTargets[targetIndex])
        setLifted(null)
      }
      return
    }
    if (lifted && validTargets.length && ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      const delta = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1
      const next = (targetIndex + delta + validTargets.length) % validTargets.length
      setTargetIndex(next)
      setLive(`Đích ${next + 1} trên ${validTargets.length}: ${getNodeName(validTargets[next])}`)
    }
  }

  const confirmMove = (details: Pick<DraftMove, 'effectiveDate' | 'note' | 'includeSubordinates'>) => {
    if (!pending || !isMoveAuthorized(pending)) {
      setPending(null)
      showToast('Điều chuyển không còn nằm trong phạm vi của vai trò hiện tại.')
      return
    }
    addDraft({ ...pending, ...details, id: `draft-${Date.now()}` })
    showToast(`Đã tạo bản nháp cho ${pending.nodeName}`)
    setPending(null)
  }

  const commit = () => {
    if (!drafts.length || !drafts.every(isMoveAuthorized)) {
      setReview(false)
      showToast('Không thể lưu vì bản nháp có thay đổi ngoài phạm vi vai trò hiện tại.')
      return
    }
    save()
    setReview(false)
    showToast('Đã lưu cơ cấu mới và cập nhật lịch sử')
  }

  const openQuickMove = (sourceId?: string) => {
    if (!canEdit) return
    setQuickMoveSource(sourceId && canMoveNode(sourceId) ? sourceId : null)
    setQuickMove(true)
  }

  const selectSearchResult = (result: OrgSearchResult) => {
    setQuery('')
    setSelected(result.id)
    setRevealRequest((current) => ({ id: result.id, requestId: (current?.requestId ?? 0) + 1 }))
    setLive(`Đã tìm thấy ${result.title}`)
  }

  const selectedType = selected ? nodeType(selected) : null
  const selectedParent = selected ? parentOf(selected) : ''
  const activeKeyboardTarget = lifted ? validTargets[targetIndex] ?? null : null
  const draftIds = new Set(drafts.map((item) => item.nodeId))
  const canManageCurrentDrafts = canEdit && drafts.every(isMoveAuthorized)
  const visibleManagers = managers.filter((item) => canViewNode(item.id))
  const quickMoveSources = employees
    .filter((item) => item.role !== 'ceo' && item.role !== 'senior_manager' && item.role !== 'leader' && item.status !== 'resigned' && canMoveNode(item.id))
    .map((item) => ({
      id: item.id,
      title: item.fullName,
      meta: item.positionTitle,
      parentId: parentOf(item.id),
    }))
  const quickMoveTargets = departments.filter((item) => canUseTarget(item.id)).map((item) => ({
    id: item.id,
    title: item.name,
    meta: getNodeName(parentOf(item.id)),
  }))

  return (
    <>
      <div className="page-heading org-page-heading">
        <div>
          <h1>Sơ đồ tổ chức</h1>
          <p>Cơ cấu Fun Agency · cập nhật theo ngày hiệu lực 17/08/2026</p>
        </div>
        <div className="org-edit-switch">
          <span>
            <strong>Chế độ chỉnh sửa</strong>
            <small>{effectiveEditMode ? 'Kéo-thả đang bật' : canEdit ? 'Đang xem an toàn' : 'Không có quyền chỉnh sửa'}</small>
          </span>
          <button
            type="button"
            role="switch"
            aria-label="Chế độ chỉnh sửa sơ đồ tổ chức"
            aria-checked={effectiveEditMode}
            disabled={!canEdit}
            className={effectiveEditMode ? 'on' : ''}
            onClick={() => {
              setEditMode((current) => !current)
              setLive(effectiveEditMode ? 'Đã tắt chế độ chỉnh sửa' : 'Đã bật chế độ chỉnh sửa')
            }}
          >
            <span className="org-switch-track"><i /></span>
          </button>
        </div>
      </div>

      <OrgChartToolbar
        view={view}
        onViewChange={setView}
        query={query}
        onQueryChange={setQuery}
        results={searchResults}
        onResultSelect={selectSearchResult}
        zoom={zoom}
        onZoomOut={() => setZoom((value) => Math.max(0.7, value - 0.1))}
        onZoomIn={() => setZoom((value) => Math.min(1.3, value + 0.1))}
        onZoomReset={() => setZoom(1)}
        draftCount={drafts.length}
        redoCount={redoStack.length}
        canManageDrafts={canManageCurrentDrafts}
        onUndo={() => { if (canManageCurrentDrafts) { undo(); showToast('Đã hoàn tác thay đổi gần nhất') } }}
        onRedo={() => { if (canManageCurrentDrafts) { redo(); showToast('Đã làm lại thay đổi gần nhất') } }}
        onReview={() => { if (canManageCurrentDrafts) setReview(true) }}
      />

      <div className={`org-guidance ${effectiveEditMode ? 'is-editing' : ''}`}>
        <div>
          {canEdit ? <CircleHelp size={18} aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}
          <span id="org-drag-instructions">
            <strong>{effectiveEditMode ? 'Kéo từ biểu tượng chấm và thả vào thẻ đang sáng' : canEdit ? 'Bật chỉnh sửa để sắp xếp cơ cấu' : 'Bạn đang ở chế độ chỉ xem'}</strong>
            <small>{effectiveEditMode ? 'Bàn phím: Space để nhấc · Mũi tên để chọn đích · Space để thả · Esc để huỷ' : canEdit ? 'Mọi thay đổi được giữ ở bản nháp cho tới khi bạn xác nhận lưu.' : 'Chuyển sang CEO, Vận hành hoặc Quản lý để thao tác.'}</small>
          </span>
        </div>
        {canEdit ? (
          <button type="button" className="btn btn-secondary quick-move-button" onClick={() => openQuickMove()}>
            <MoveRight size={16} aria-hidden="true" />
            Điều chuyển nhanh
          </button>
        ) : null}
      </div>

      <OrgChartMobile
        nodeName={getNodeName}
        parentOf={parentOf}
        canViewNode={canViewNode}
        onOpenEmployee={(id) => navigate(`/employees/${id}`)}
      />

      <div className={`org-workspace desktop-only ${selected ? 'with-panel' : ''} ${dragId ? 'has-active-drag' : ''}`}>
        <DndContext
          sensors={sensors}
          autoScroll
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setDragId(null); setLive('Đã huỷ thao tác kéo-thả') }}
        >
          <div className={`org-canvas view-${view}`}>
            <div className="org-scale" style={{ transform: `scale(${zoom})` }}>
              <OrgNode
                id="emp-001"
                type="ceo"
                title={employees[0].fullName}
                subtitle="CEO"
                selected={selected === 'emp-001'}
                dropEligible={false}
                dragActive={Boolean(dragId)}
                editMode={effectiveEditMode}
                onSelect={() => setSelected('emp-001')}
                onKeyboard={(event) => handleKeyboard('emp-001', event)}
              >
                <div className="manager-grid">
                  {visibleManagers.map((manager) => (
                    <OrgNode
                      key={manager.id}
                      id={manager.id}
                      type="senior_manager"
                      title={manager.fullName}
                      subtitle="Quản lý"
                      count={`${regions.filter((item) => parentOf(item.id) === manager.id && canViewNode(item.id)).length} vùng`}
                      selected={selected === manager.id}
                      activeTarget={activeKeyboardTarget === manager.id}
                      dropEligible={expectedTargetType === 'senior_manager' && canUseTarget(manager.id)}
                      dragActive={Boolean(dragId)}
                      editMode={effectiveEditMode}
                      onSelect={() => setSelected(manager.id)}
                      onKeyboard={(event) => handleKeyboard(manager.id, event)}
                    >
                      <div className="region-stack">
                        {regions.filter((item) => parentOf(item.id) === manager.id && canViewNode(item.id)).map((region) => (
                          <OrgChartBranch
                            key={region.id}
                            regionId={region.id}
                            parentOf={parentOf}
                            nodeName={getNodeName}
                            editMode={effectiveEditMode}
                            selected={selected}
                            lifted={lifted}
                            activeTarget={activeKeyboardTarget}
                            dragId={dragId}
                            expectedTargetType={expectedTargetType}
                            revealRequest={revealRequest}
                            draftIds={draftIds}
                            canMoveNode={canMoveNode}
                            canUseTarget={canUseTarget}
                            onSelect={setSelected}
                            onKey={handleKeyboard}
                          />
                        ))}
                      </div>
                    </OrgNode>
                  ))}
                </div>
              </OrgNode>
            </div>
            <div className="org-minimap" aria-hidden="true"><span /><i /></div>
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
            {dragId ? (
              <div className="drag-ghost">
                <GripVertical size={18} aria-hidden="true" />
                <span><small>Đang điều chuyển</small><strong>{getNodeName(dragId)}</strong></span>
                <b>Thả vào {targetTypeLabel[expectedTargetType ?? 'employee'] ?? 'đích phù hợp'}</b>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {selected && selectedType ? (
          <OrgChartInspector
            name={getNodeName(selected)}
            type={selectedType}
            parentName={getNodeName(selectedParent)}
            editMode={selectedType === 'employee' && canMoveNode(selected)}
            onClose={() => setSelected(null)}
            onViewDetails={() => {
              if (selectedType === 'region' || selectedType === 'department') navigate('/employees')
              else navigate(`/employees/${selected}`)
            }}
            onQuickMove={() => openQuickMove(selected)}
          />
        ) : null}
      </div>

      <div className="sr-chart-summary" aria-live="polite">{live}</div>

      {quickMove && canEdit ? (
        <MovePickerModal
          sources={quickMoveSources}
          targets={quickMoveTargets}
          initialSourceId={quickMoveSource}
          onCancel={() => setQuickMove(false)}
          onContinue={(sourceId, targetId) => {
            setQuickMove(false)
            prepareMove(sourceId, targetId)
          }}
        />
      ) : null}
      {pending && isMoveAuthorized(pending) ? <MoveConfirmModal move={pending} onCancel={() => setPending(null)} onConfirm={confirmMove} /> : null}
      {review && canManageCurrentDrafts ? <ReviewModal drafts={drafts} onCancel={() => setReview(false)} onSave={commit} /> : null}
    </>
  )
}
