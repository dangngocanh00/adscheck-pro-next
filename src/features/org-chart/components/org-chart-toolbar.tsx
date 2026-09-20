import {
  LocateFixed,
  Minus,
  Redo2,
  Save,
  Search,
  Undo2,
  ZoomIn,
} from 'lucide-react'
import { useEffect, useId, useState } from 'react'

export type OrgViewMode = 'tree' | 'horizontal' | 'region'

export interface OrgSearchResult {
  id: string
  title: string
  meta: string
}

interface Props {
  view: OrgViewMode
  onViewChange: (view: OrgViewMode) => void
  query: string
  onQueryChange: (query: string) => void
  results: OrgSearchResult[]
  onResultSelect: (result: OrgSearchResult) => void
  zoom: number
  onZoomOut: () => void
  onZoomIn: () => void
  onZoomReset: () => void
  draftCount: number
  redoCount: number
  canManageDrafts: boolean
  onUndo: () => void
  onRedo: () => void
  onReview: () => void
}

const viewOptions: { id: OrgViewMode; label: string }[] = [
  { id: 'tree', label: 'Sơ đồ cây' },
  { id: 'horizontal', label: 'Sơ đồ ngang' },
  { id: 'region', label: 'Theo vùng' },
]

export function OrgChartToolbar({
  view,
  onViewChange,
  query,
  onQueryChange,
  results,
  onResultSelect,
  zoom,
  onZoomOut,
  onZoomIn,
  onZoomReset,
  draftCount,
  redoCount,
  canManageDrafts,
  onUndo,
  onRedo,
  onReview,
}: Props) {
  const listboxId = useId()
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const listOpen = searchOpen && Boolean(query.trim())
  const activeResult = results[activeIndex]

  useEffect(() => setActiveIndex(0), [query, results.length])

  return (
    <div className="org-toolbar surface">
      <div className="segmented" role="group" aria-label="Kiểu hiển thị sơ đồ">
        {viewOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={view === option.id ? 'active' : ''}
            aria-pressed={view === option.id}
            onClick={() => onViewChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        className="org-search"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false)
        }}
      >
        <Search size={16} aria-hidden="true" />
        <label className="sr-only" htmlFor="org-node-search">Tìm người, vị trí hoặc đơn vị</label>
        <input
          id="org-node-search"
          value={query}
          autoComplete="off"
          placeholder="Tìm người, vị trí, đơn vị…"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listboxId}
          aria-activedescendant={listOpen && activeResult ? `${listboxId}-option-${activeIndex}` : undefined}
          onFocus={() => setSearchOpen(true)}
          onChange={(event) => {
            setSearchOpen(true)
            onQueryChange(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && results.length) {
              event.preventDefault()
              setActiveIndex((current) => (current + 1) % results.length)
            } else if (event.key === 'ArrowUp' && results.length) {
              event.preventDefault()
              setActiveIndex((current) => (current - 1 + results.length) % results.length)
            } else if (event.key === 'Home' && listOpen && results.length) {
              event.preventDefault()
              setActiveIndex(0)
            } else if (event.key === 'End' && listOpen && results.length) {
              event.preventDefault()
              setActiveIndex(results.length - 1)
            } else if (event.key === 'Escape') {
              setSearchOpen(false)
              onQueryChange('')
            } else if (event.key === 'Enter' && activeResult) {
              event.preventDefault()
              onResultSelect(activeResult)
            }
          }}
        />
        {listOpen ? (
          <div id={listboxId} className="org-search-results" role="listbox" aria-label="Kết quả tìm kiếm sơ đồ">
            {results.length ? results.map((result, index) => (
              <button
                key={result.id}
                id={`${listboxId}-option-${index}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={activeIndex === index}
                className={activeIndex === index ? 'active' : ''}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => onResultSelect(result)}
              >
                <span>{result.title}</span>
                <small>{result.meta}</small>
              </button>
            )) : <p>Không tìm thấy kết quả phù hợp</p>}
          </div>
        ) : null}
      </div>

      <div className="toolbar-group" aria-label="Thu phóng sơ đồ">
        <button type="button" className="icon-action" onClick={onZoomOut} aria-label="Thu nhỏ">
          <Minus size={17} />
        </button>
        <span aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" className="icon-action" onClick={onZoomIn} aria-label="Phóng to">
          <ZoomIn size={17} />
        </button>
        <button type="button" className="icon-action" onClick={onZoomReset} aria-label="Đặt lại 100%">
          <LocateFixed size={17} />
        </button>
      </div>

      <div className="toolbar-group" aria-label="Lịch sử thay đổi">
        <button type="button" className="icon-action" disabled={!canManageDrafts || !draftCount} onClick={onUndo} aria-label="Hoàn tác">
          <Undo2 size={17} />
        </button>
        <button type="button" className="icon-action" disabled={!canManageDrafts || !redoCount} onClick={onRedo} aria-label="Làm lại">
          <Redo2 size={17} />
        </button>
      </div>

      <button type="button" className="btn btn-primary save-org" disabled={!canManageDrafts || !draftCount} onClick={onReview}>
        <Save size={16} aria-hidden="true" />
        <span>Lưu thay đổi</span>
        {draftCount ? <b aria-label={`${draftCount} thay đổi`}>{draftCount}</b> : null}
      </button>
    </div>
  )
}
