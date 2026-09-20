import { useAppLanguage, t, tx, m } from '@/i18n'
import { useEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BILLING_DATE_RANGE_PRESETS,
  computeBillingPresetRange,
  formatBillingRangeDisplay,
  type BillingDateRange,
  type BillingDateRangePresetKey,
} from './ads-check-billing-history-date-range'

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const PANEL_WIDTH = 460

function pad(n: number) { return String(n).padStart(2, '0') }
function toIso(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` }
function fromIso(iso: string) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
function formatDayLabel(iso: string) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }

// Monday-first grid — same algorithm as the TKQC original this is ported
// from (see module comment in ads-check-billing-history-date-range.ts).
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7
  const cells: (Date | null)[] = Array.from({ length: mondayIndex }, () => null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

type BillingDateRangePickerProps = {
  anchorRect: DOMRect
  value: BillingDateRange
  onApply: (range: BillingDateRange) => void
  onClose: () => void
}

export const AdsCheckBillingDateRangePicker: FC<BillingDateRangePickerProps> = ({ anchorRect, value, onApply, onClose }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos] = useState(() => {
    const left = Math.min(anchorRect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8)
    return { top: anchorRect.bottom + 6, left: Math.max(8, left) }
  })
  const [draftStart, setDraftStart] = useState<string | null>(value.start)
  const [draftEnd, setDraftEnd] = useState<string | null>(value.end)
  const [draftPreset, setDraftPreset] = useState<BillingDateRangePresetKey>(value.presetKey)
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

  const selectPreset = (key: BillingDateRangePresetKey) => {
    if (key === 'custom') { setDraftPreset('custom'); return }
    const range = computeBillingPresetRange(key)
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
  const today = toIso(new Date())

  return createPortal(
    <div ref={panelRef} className="ads-billing-daterange-panel" role="dialog" aria-label={t("ui.9e7dd2d459")} style={{ top: pos.top, left: pos.left }}>
      <div className="ads-billing-daterange-body">
        <nav className="ads-billing-daterange-presets" aria-label={t("ui.8cf6fb154b")}>
          {tx(BILLING_DATE_RANGE_PRESETS.map((preset) => <button key={preset.key} type="button" className={`ads-billing-daterange-preset${draftPreset === preset.key ? ' is-selected' : ''}`} onClick={() => selectPreset(preset.key)}>{tx(preset.label)}</button>))}
        </nav>
        <div className="ads-billing-daterange-calendar">
          <header>
            <button type="button" aria-label={t("ui.0cfd503bec")} onClick={() => changeMonth(-1)}><ChevronLeft size={15} /></button>
            <strong>{t("ui.6929e765f6")}{viewMonth + 1} {viewYear}</strong>
            <button type="button" aria-label={t("ui.9495e9380e")} onClick={() => changeMonth(1)}><ChevronRight size={15} /></button>
          </header>
          <div className="ads-billing-daterange-weekdays">{tx(WEEKDAY_LABELS.map((label) => <span key={label}>{tx(label)}</span>))}</div>
          <div className="ads-billing-daterange-grid">
            {tx(cells.map((date, index) => {
              if (!date) return <span key={index} className="ads-billing-daterange-cell is-empty" />
              const iso = toIso(date)
              const inRange = !!(draftStart && draftEnd && iso >= draftStart && iso <= draftEnd)
              const isEdge = iso === draftStart || iso === draftEnd
              const isToday = iso === today
              return <button
                key={index}
                type="button"
                className={`ads-billing-daterange-cell${inRange ? ' is-in-range' : ''}${isEdge ? ' is-edge' : ''}${isToday ? ' is-today' : ''}`}
                onClick={() => clickDay(date)}
              >{tx(date.getDate())}</button>
            }))}
          </div>
        </div>
      </div>
      <div className="ads-billing-daterange-fields">
        <span className="ads-billing-daterange-field">{tx(draftStart ? formatDayLabel(draftStart) : m("ui.ea7c92c61e"))}</span>
        <span className="ads-billing-daterange-field-arrow">→</span>
        <span className="ads-billing-daterange-field">{tx(draftEnd ? formatDayLabel(draftEnd) : m("ui.fe67ba88ff"))}</span>
      </div>
      <footer>
        <button type="button" className="is-secondary" onClick={onClose}>{t("ui.34ca764caf")}</button>
        <button type="button" className="is-primary" onClick={() => { onApply({ presetKey: draftPreset, start: draftStart, end: draftEnd }); onClose() }}>{t("ui.1e948c5913")}</button>
      </footer>
    </div>,
    document.body,
  )
}

export const AdsCheckBillingDateRangeTrigger: FC<{ range: BillingDateRange; onClick: (rect: DOMRect) => void }> = ({ range, onClick }) => {
  useAppLanguage();
  const isFiltered = range.presetKey !== 'all-time'
  return (
    <button type="button" className={`ads-billing-daterange-trigger${isFiltered ? ' is-active' : ''}`} aria-haspopup="dialog" onClick={(event) => onClick(event.currentTarget.getBoundingClientRect())}>
      <CalendarDays size={13} />
      <span>{tx(formatBillingRangeDisplay(range))}</span>
      <ChevronDown size={13} />
    </button>
  )
}
