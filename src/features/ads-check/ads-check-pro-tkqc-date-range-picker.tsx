import { useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { computePresetRange, formatRangeDisplay, TKQC_DATE_RANGE_PRESETS, type TkqcDateRange, type TkqcDateRangePresetKey } from './ads-check-pro-tkqc-date-range'

type DateRangePickerProps = {
  anchorRect: DOMRect
  value: TkqcDateRange
  onApply: (range: TkqcDateRange) => void
  onClose: () => void
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const PANEL_WIDTH = 460

function pad(n: number) { return String(n).padStart(2, '0') }
function toIso(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` }
function fromIso(iso: string) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }

// Monday-first calendar grid (production label order T2..CN confirms
// Monday-start weeks, not the browser-default Sunday-start).
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7
  const cells: (Date | null)[] = Array.from({ length: mondayIndex }, () => null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function AdsProTkqcDateRangePicker({ anchorRect, value, onApply, onClose }: DateRangePickerProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos] = useState(() => {
    const left = Math.min(anchorRect.left, window.innerWidth - PANEL_WIDTH - 8)
    return { top: anchorRect.bottom + 6, left: Math.max(8, left) }
  })
  const [draftStart, setDraftStart] = useState<string | null>(value.start)
  const [draftEnd, setDraftEnd] = useState<string | null>(value.end)
  const [draftPreset, setDraftPreset] = useState<TkqcDateRangePresetKey>(value.presetKey)
  const initialMonth = value.start ? fromIso(value.start) : new Date()
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth())

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => { if (!panelRef.current?.contains(event.target as Node)) onClose() }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const selectPreset = (key: TkqcDateRangePresetKey) => {
    const range = computePresetRange(key)
    setDraftPreset(key)
    setDraftStart(range.start)
    setDraftEnd(range.end)
    if (range.start) { const d = fromIso(range.start); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()) }
  }

  const clickDay = (date: Date) => {
    const iso = toIso(date)
    setDraftPreset('custom')
    if (!draftStart || (draftStart && draftEnd)) { setDraftStart(iso); setDraftEnd(null); return }
    if (iso < draftStart) { setDraftEnd(draftStart); setDraftStart(iso) } else { setDraftEnd(iso) }
  }

  const changeMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const cells = buildMonthGrid(viewYear, viewMonth)
  const displayRange = formatRangeDisplay({ presetKey: draftPreset, start: draftStart, end: draftEnd })

  return createPortal(
    <div ref={panelRef} className="ads-pro-daterange-panel" role="dialog" aria-label={t("ui.89dc45d5b4")} style={{ top: pos.top, left: pos.left }}>
      <div className="ads-pro-daterange-body">
        <nav className="ads-pro-daterange-presets" aria-label={t("ui.8cf6fb154b")}>
          {tx(TKQC_DATE_RANGE_PRESETS.map((preset) => <button key={preset.key} type="button" className={`ads-pro-daterange-preset${draftPreset === preset.key ? ' is-selected' : ''}`} onClick={() => selectPreset(preset.key)}>{tx(preset.label)}</button>))}
        </nav>
        <div className="ads-pro-daterange-calendar">
          <header>
            <button type="button" aria-label={t("ui.0cfd503bec")} onClick={() => changeMonth(-1)}><ChevronLeft size={15} /></button>
            <strong>{t("ui.0e2b309955")}{" "}{viewMonth + 1}, {viewYear}</strong>
            <button type="button" aria-label={t("ui.9495e9380e")} onClick={() => changeMonth(1)}><ChevronRight size={15} /></button>
          </header>
          <div className="ads-pro-daterange-weekdays">{tx(WEEKDAY_LABELS.map((label) => <span key={label}>{tx(label)}</span>))}</div>
          <div className="ads-pro-daterange-grid">
            {tx(cells.map((date, index) => {
              if (!date) return <span key={index} className="ads-pro-daterange-cell is-empty" />
              const iso = toIso(date)
              const inRange = draftStart && draftEnd && iso >= draftStart && iso <= draftEnd
              const isEdge = iso === draftStart || iso === draftEnd
              return <button
                key={index}
                type="button"
                className={`ads-pro-daterange-cell${inRange ? ' is-in-range' : ''}${isEdge ? ' is-edge' : ''}`}
                onClick={() => clickDay(date)}
              >{tx(date.getDate())}</button>
            }))}
          </div>
        </div>
      </div>
      <footer>
        <span className="ads-pro-daterange-display">{displayRange}</span>
        <span className="ads-pro-daterange-actions">
          <button type="button" className="is-secondary" onClick={onClose}>{t("ui.247d4b1efe")}</button>
          <button type="button" className="is-primary" onClick={() => { onApply({ presetKey: draftPreset, start: draftStart, end: draftEnd }); onClose() }}>{t("ui.1e948c5913")}</button>
        </span>
      </footer>
    </div>,
    document.body,
  )
}

export function AdsProTkqcDateRangeTrigger({ range, onClick }: { range: TkqcDateRange; onClick: (rect: DOMRect) => void }) {
  useAppLanguage();
  const isFiltered = range.presetKey !== 'all-time'
  return <button type="button" className={`ads-pro-icon-button${isFiltered ? ' is-active' : ''}`} aria-label={t("ui.89dc45d5b4")} title={tx(formatRangeDisplay(range))} onClick={(event) => onClick(event.currentTarget.getBoundingClientRect())}><CalendarDays size={17} /></button>
}
