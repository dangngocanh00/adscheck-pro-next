import { ArrowLeft, ChevronRight, Eye, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { departments, employees, regions } from '@/mocks/hrm-data'

interface Props {
  nodeName: (id: string) => string
  parentOf: (id: string) => string
  canViewNode: (id: string) => boolean
  onOpenEmployee: (id: string) => void
}

export function OrgChartMobile({ nodeName, parentOf, canViewNode, onOpenEmployee }: Props) {
  const [regionId, setRegionId] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const visibleRegions = regions.filter((item) => canViewNode(item.id))
  const currentRegion = visibleRegions.find((item) => item.id === regionId) ?? null
  const visibleDepartments = departments.filter((item) => (
    currentRegion && parentOf(item.id) === currentRegion.id && canViewNode(item.id)
  ))
  const currentDepartment = visibleDepartments.find((item) => item.id === departmentId) ?? null
  const visiblePeople = employees.filter((item) => (
    currentDepartment && parentOf(item.id) === currentDepartment.id && canViewNode(item.id)
  ))

  useEffect(() => {
    if (regionId && !currentRegion) {
      setRegionId(null)
      setDepartmentId(null)
    } else if (departmentId && !currentDepartment) {
      setDepartmentId(null)
    }
  }, [currentDepartment, currentRegion, departmentId, regionId])

  const goToRoot = () => {
    setRegionId(null)
    setDepartmentId(null)
  }

  return (
    <div className="mobile-org-browser mobile-only">
      <div className="mobile-edit-note">
        <div>
          <Eye size={18} aria-hidden="true" />
          <span>
            <strong>Duyệt cơ cấu trên điện thoại</strong>
            <small>Chọn từng cấp để xem vùng, bộ phận và nhân sự.</small>
          </span>
        </div>
      </div>

      {currentRegion ? (
        <nav className="mobile-org-breadcrumb" aria-label="Vị trí trong sơ đồ tổ chức">
          <button type="button" onClick={goToRoot}>Fun Agency</button>
          <ChevronRight size={14} aria-hidden="true" />
          {currentDepartment ? (
            <>
              <button type="button" onClick={() => setDepartmentId(null)}>{currentRegion.name}</button>
              <ChevronRight size={14} aria-hidden="true" />
              <span aria-current="page">{currentDepartment.name}</span>
            </>
          ) : <span aria-current="page">{currentRegion.name}</span>}
        </nav>
      ) : null}

      <div className="mobile-org-list">
        {!currentRegion ? visibleRegions.map((region) => {
          const regionDepartments = departments.filter((item) => parentOf(item.id) === region.id && canViewNode(item.id))
          return (
            <button
              type="button"
              key={region.id}
              className="mobile-region-card surface-flat"
              onClick={() => setRegionId(region.id)}
            >
              <span>
                <strong>{region.name}</strong>
                <small>{regionDepartments.length} bộ phận · {nodeName(parentOf(region.id))}</small>
              </span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          )
        }) : null}

        {currentRegion && !currentDepartment ? (
          <section className="mobile-region surface-flat" aria-labelledby="mobile-region-title">
            <div className="mobile-level-heading">
              <button type="button" className="icon-action" aria-label="Quay lại danh sách vùng" onClick={goToRoot}>
                <ArrowLeft size={17} />
              </button>
              <span>
                <strong id="mobile-region-title">{currentRegion.name}</strong>
                <small>{visibleDepartments.length} bộ phận · {nodeName(parentOf(currentRegion.id))}</small>
              </span>
            </div>
            <div className="mobile-region-departments">
              {visibleDepartments.map((department) => {
                const peopleCount = employees.filter((item) => parentOf(item.id) === department.id && canViewNode(item.id)).length
                return (
                  <button
                    type="button"
                    className="mobile-org-row"
                    key={department.id}
                    onClick={() => setDepartmentId(department.id)}
                  >
                    <span>
                      <strong>{department.name}</strong>
                      <small>{peopleCount} nhân sự · {nodeName(department.leaderId ?? '')}</small>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}

        {currentDepartment ? (
          <section className="mobile-region surface-flat" aria-labelledby="mobile-department-title">
            <div className="mobile-level-heading">
              <button type="button" className="icon-action" aria-label={`Quay lại ${currentRegion?.name}`} onClick={() => setDepartmentId(null)}>
                <ArrowLeft size={17} />
              </button>
              <span>
                <strong id="mobile-department-title">{currentDepartment.name}</strong>
                <small>{visiblePeople.length} nhân sự · Leader {nodeName(currentDepartment.leaderId ?? '')}</small>
              </span>
            </div>
            <div className="mobile-region-departments">
              {visiblePeople.map((person) => (
                <button
                  type="button"
                  className="mobile-org-row mobile-person-row"
                  key={person.id}
                  onClick={() => onOpenEmployee(person.id)}
                >
                  <span className="mobile-person-icon" aria-hidden="true"><UserRound size={16} /></span>
                  <span>
                    <strong>{person.fullName}</strong>
                    <small>{person.positionTitle}</small>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
