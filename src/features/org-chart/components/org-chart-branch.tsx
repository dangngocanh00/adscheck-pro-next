import { useEffect, useState } from 'react'
import { departments, employees, regions } from '@/mocks/hrm-data'
import type { OrgNodeType } from '@/types/hrm'
import { OrgNode } from './org-node'

interface Props {
  regionId: string
  parentOf: (id: string) => string
  nodeName: (id: string) => string
  editMode: boolean
  selected: string | null
  lifted: string | null
  activeTarget: string | null
  dragId: string | null
  expectedTargetType: OrgNodeType | null
  revealRequest: { id: string; requestId: number } | null
  draftIds: Set<string>
  canMoveNode: (id: string) => boolean
  canUseTarget: (id: string) => boolean
  onSelect: (id: string) => void
  onKey: (id: string, event: React.KeyboardEvent) => void
}

export function OrgChartBranch({
  regionId,
  parentOf,
  nodeName,
  editMode,
  selected,
  lifted,
  activeTarget,
  dragId,
  expectedTargetType,
  revealRequest,
  draftIds,
  canMoveNode,
  canUseTarget,
  onSelect,
  onKey,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const region = regions.find((item) => item.id === regionId)!
  const regionDepartments = departments.filter((item) => parentOf(item.id) === regionId)
  const dragActive = Boolean(dragId)
  const revealDepartmentId = revealRequest?.id.startsWith('emp-') ? parentOf(revealRequest.id) : null
  const revealsInRegion = Boolean(
    revealDepartmentId && regionDepartments.some((item) => item.id === revealDepartmentId),
  )

  useEffect(() => {
    if (!revealDepartmentId || !revealsInRegion) return
    setExpanded((current) => new Set(current).add(revealDepartmentId))
  }, [revealDepartmentId, revealRequest?.requestId, revealsInRegion])

  return (
    <OrgNode
      id={region.id}
      type="region"
      title={region.name}
      subtitle="Vùng"
      count={`${regionDepartments.length} bộ phận`}
      draft={draftIds.has(region.id)}
      selected={selected === region.id}
      lifted={lifted === region.id}
      activeTarget={activeTarget === region.id}
      dropEligible={expectedTargetType === 'region' && canUseTarget(region.id)}
      dragActive={dragActive}
      movable={canMoveNode(region.id)}
      editMode={editMode}
      onSelect={() => onSelect(region.id)}
      onKeyboard={(event) => onKey(region.id, event)}
    >
      <div className="department-grid">
        {regionDepartments.map((department) => {
          const allStaff = employees.filter((item) => parentOf(item.id) === department.id)
          const isExpanded = expanded.has(department.id)
          const visibleStaff = isExpanded ? allStaff : allStaff.slice(0, 2)
          const toggle = () => setExpanded((current) => {
            const next = new Set(current)
            if (next.has(department.id)) next.delete(department.id)
            else next.add(department.id)
            return next
          })

          return (
            <OrgNode
              key={department.id}
              id={department.id}
              type="department"
              title={department.name}
              subtitle={department.leaderId ? nodeName(department.leaderId) : 'Thiếu leader'}
              count={`${allStaff.length} người`}
              draft={draftIds.has(department.id)}
              selected={selected === department.id}
              lifted={lifted === department.id}
              activeTarget={activeTarget === department.id}
              dropEligible={expectedTargetType === 'department' && canUseTarget(department.id)}
              dragActive={dragActive}
              movable={canMoveNode(department.id)}
              editMode={editMode}
              onSelect={() => onSelect(department.id)}
              onKeyboard={(event) => onKey(department.id, event)}
            >
              {visibleStaff.map((person) => (
                <OrgNode
                  key={person.id}
                  id={person.id}
                  type="employee"
                  title={person.fullName}
                  subtitle={person.positionTitle}
                  draft={draftIds.has(person.id)}
                  selected={selected === person.id}
                  lifted={lifted === person.id}
                  activeTarget={activeTarget === person.id}
                  dropEligible={false}
                  dragActive={dragActive}
                  movable={canMoveNode(person.id)}
                  editMode={editMode}
                  onSelect={() => onSelect(person.id)}
                  onKeyboard={(event) => onKey(person.id, event)}
                />
              ))}
              {allStaff.length > 2 ? (
                <button
                  type="button"
                  className="org-expand-people"
                  aria-expanded={isExpanded}
                  onClick={toggle}
                >
                  {isExpanded ? 'Thu gọn' : `Xem thêm ${allStaff.length - 2} người`}
                </button>
              ) : null}
            </OrgNode>
          )
        })}
      </div>
    </OrgNode>
  )
}
