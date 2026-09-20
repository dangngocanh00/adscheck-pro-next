import { useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Search } from 'lucide-react'

// TKQC Round 1 Part 8 — replaces the earlier round's "Chế độ tải" (Sở
// hữu/Được chia sẻ) stub in this exact toolbar slot, which had no
// production evidence behind it (a plain onAnnounce placeholder, same as
// the Calendar/History icons before this round).
//
// Traced production (references/remotes/adaccounts/897.0e915523.js,
// CurrencyMenu): there is NO static hardcoded currency list at all — the
// option set is [null ("MIX"), ...pinned "VND"/"USD" (if present in the
// loaded data), ...every other currency actually present, alphabetically
// sorted]. Reproduced exactly: `buildCurrencyOptions` derives its list
// from the currencies actually present in the CURRENT TKQC dataset
// (ads-check-pro-tkqc-data.ts only ever generates VND/USD/AUD), not an
// invented big ISO list — "use actual supported/current currency options
// from data" per the batch spec.
export type TkqcCurrencyFilterValue = 'mix' | string

const PINNED_ORDER = ['VND', 'USD']

export function buildCurrencyOptions(datasetCurrencies: readonly string[]): TkqcCurrencyFilterValue[] {
  const present = new Set(datasetCurrencies)
  const pinned = PINNED_ORDER.filter((code) => present.has(code))
  const rest = [...present].filter((code) => !PINNED_ORDER.includes(code)).sort()
  return ['mix', ...pinned, ...rest]
}

type CurrencyFilterProps = {
  anchorRect: DOMRect
  value: TkqcCurrencyFilterValue
  options: TkqcCurrencyFilterValue[]
  onChange: (value: TkqcCurrencyFilterValue) => void
  onClose: () => void
}

const PANEL_WIDTH = 200

export function AdsProCurrencyFilterButton({ value, onClick }: { value: TkqcCurrencyFilterValue; onClick: (rect: DOMRect) => void }) {
  useAppLanguage();
  const isFiltered = value !== 'mix'
  return <button type="button" className={`ads-pro-currency-trigger${isFiltered ? ' is-active' : ''}`} aria-label={t("ui.0f36906228")} onClick={(event) => onClick(event.currentTarget.getBoundingClientRect())}>{value === 'mix' ? 'MIX' : value}</button>
}

export function AdsProCurrencyFilterPanel({ anchorRect, value, options, onChange, onClose }: CurrencyFilterProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [pos] = useState(() => {
    const left = Math.min(anchorRect.left, window.innerWidth - PANEL_WIDTH - 8)
    return { top: anchorRect.bottom + 6, left: Math.max(8, left) }
  })

  useEffect(() => { inputRef.current?.focus() }, [])

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

  const normalizedQuery = query.trim().toLocaleLowerCase('vi')
  const visibleOptions = useMemo(() => {
    if (!normalizedQuery) return options
    return options.filter((option) => (option === 'mix' ? 'mix' : option.toLowerCase()).includes(normalizedQuery))
  }, [options, normalizedQuery])

  return createPortal(
    <div ref={panelRef} className="ads-pro-currency-panel" role="dialog" aria-label={t("ui.0f36906228")} style={{ top: pos.top, left: pos.left }}>
      <label className="ads-pro-currency-search">
        <Search size={14} aria-hidden="true" />
        <input ref={inputRef} aria-label={t("ui.3a62c1e463")} placeholder={t("ui.cf4d1f4f71")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <ul className="ads-pro-currency-list">
        {visibleOptions.map((option) => <li key={option}>
          <button type="button" className={`ads-pro-currency-option${value === option ? ' is-selected' : ''}`} aria-pressed={value === option} onClick={() => { onChange(option); onClose() }}>
            <span>{option === 'mix' ? 'MIX' : option}</span>
            {value === option && <Check size={14} aria-hidden="true" />}
          </button>
        </li>)}
        {tx(visibleOptions.length === 0 && <li className="ads-pro-currency-empty">{t("ui.2a15152ac7")}</li>)}
      </ul>
    </div>,
    document.body,
  )
}
