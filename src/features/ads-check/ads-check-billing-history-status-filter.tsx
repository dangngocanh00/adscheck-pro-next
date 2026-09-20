import { useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useLayoutEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { Filter } from 'lucide-react'

export type HistoryStatusOption = { key: string; label: string; color: string; background: string }

const MENU_WIDTH = 270

type Props = {
  options: HistoryStatusOption[]
  selected: Set<string>
  onToggle: (key: string) => void
}

// Same anchored-popover recipe as AdsCheckBillingFilterMenu (Quản lý gói
// cước) — self-owned open state, useLayoutEffect position off the trigger's
// own rect, portal to document.body, manual outside-click/Escape close. The
// OUTER border/checkbox accent are brand (V1–V5); the status PILL colors
// inside are semantic and never change with version (see STATUS_META in
// ads-check-billing-history-panel.tsx).
export const AdsCheckBillingHistoryStatusFilter: FC<Props> = ({ options, selected, onToggle }) => {
  useAppLanguage();
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const recompute = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8)
      setPos({ top: rect.bottom + 6, left })
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [open])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return <>
    <button ref={triggerRef} type="button" className="ads-billing-plan-filter" aria-label={t("ui.fa369313d3")} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
      <Filter size={14} />
    </button>
    {tx(open && createPortal(
      <div ref={menuRef} className="ads-billing-history-status-menu" role="menu" aria-label={t("ui.2e54ddfe30")} style={{ top: pos.top, left: pos.left }}>
        <h3>{t("ui.e03c1401e3")}</h3>
        {tx(options.map((option) => (
          <label key={option.key} className="ads-billing-history-status-row">
            <span className="ads-billing-history-status-pill" style={{ color: option.color, background: option.background }}>{tx(option.label)}</span>
            <input type="checkbox" checked={selected.has(option.key)} onChange={() => onToggle(option.key)} />
          </label>
        )))}
      </div>,
      document.body,
    ))}
  </>
}
