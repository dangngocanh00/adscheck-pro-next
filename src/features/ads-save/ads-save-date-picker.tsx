import { useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useRef, useState, type FC } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatIsoDateVi, toIsoDate } from './ads-save-configuration-store'

type AdsSaveDatePickerProps = {
  value: string
  onChange: (iso: string) => void
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function fromIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Same Monday-first month-grid technique already used by
// AdsProTkqcDateRangePicker — a real, functional calendar (not a fake
// static dropdown), scoped down to single-date selection since the
// download-history filter needs one day, not a range.
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const mondayIndex = (firstOfMonth.getDay() + 6) % 7
  const cells: (Date | null)[] = Array.from({ length: mondayIndex }, () => null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export const AdsSaveDatePicker: FC<AdsSaveDatePickerProps> = ({ value, onChange }) => {
  useAppLanguage();
  const [open, setOpen] = useState(false)
  const selected = fromIso(value)
  const [viewYear, setViewYear] = useState(selected.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getMonth())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const toggleOpen = () => {
    if (!open) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()) }
    setOpen((current) => !current)
  }
  const changeMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }
  const pickDay = (date: Date) => { onChange(toIsoDate(date)); setOpen(false) }

  return (
    <div className="ads-save-date-picker" ref={rootRef}>
      <button type="button" className="ads-save-date-picker-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={toggleOpen}>
        <CalendarDays size={14} aria-hidden="true" />
        <span>{formatIsoDateVi(value)}</span>
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      {open && <div className="ads-save-date-picker-panel" role="dialog" aria-label={t("ui.a4d14e6bfb")}>
        <header>
          <button type="button" aria-label={t("ui.0cfd503bec")} onClick={() => changeMonth(-1)}><ChevronLeft size={14} /></button>
          <span>{t("ui.0e2b309955")}{" "}{viewMonth + 1}/{viewYear}</span>
          <button type="button" aria-label={t("ui.9495e9380e")} onClick={() => changeMonth(1)}><ChevronRight size={14} /></button>
        </header>
        <div className="ads-save-date-picker-weekdays">{tx(WEEKDAY_LABELS.map((label) => <span key={label}>{tx(label)}</span>))}</div>
        <div className="ads-save-date-picker-grid">
          {buildMonthGrid(viewYear, viewMonth).map((date, index) => {
            if (!date) return <span key={index} />
            const iso = toIsoDate(date)
            return (
              <button
                key={index}
                type="button"
                className={iso === value ? 'is-selected' : ''}
                onClick={() => pickDay(date)}
              >
                {tx(date.getDate())}
              </button>
            )
          })}
        </div>
      </div>}
    </div>
  )
}

export default AdsSaveDatePicker
