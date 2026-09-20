import { m, useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useLayoutEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { Filter } from 'lucide-react'

export type BillingFilterUsageStatus = 'active' | 'expired' | 'all'
export type BillingFilterSource = 'all' | 'purchase' | 'giftcode'

const USAGE_OPTIONS: Array<{ value: BillingFilterUsageStatus; label: string }> = [
  { value: 'active', label: m("ui.944ca8f2b1") },
  { value: 'expired', label: m("ui.c1897936b7") },
  { value: 'all', label: m("ui.872e04b463") },
]

const SOURCE_OPTIONS: Array<{ value: BillingFilterSource; label: string }> = [
  { value: 'all', label: m("ui.f7a578dcbd") },
  { value: 'purchase', label: m("ui.b90857eb2c") },
  { value: 'giftcode', label: m("ui.1a41fef8a2") },
]

const MENU_WIDTH = 296

type BillingFilterMenuProps = {
  usageStatus: BillingFilterUsageStatus
  onUsageStatusChange: (value: BillingFilterUsageStatus) => void
  source: BillingFilterSource
  onSourceChange: (value: BillingFilterSource) => void
}

// Anchored popover — same recipe as AdsProColumnMenu (self-owned open
// state, useLayoutEffect position off the trigger's own rect, portal to
// document.body so the LEFT panel's own overflow/Curve D radius never
// clips it, manual outside-click/Escape close). No Apply/Cancel/Reset —
// each option updates its own local-lifted state immediately, matching the
// reference popover exactly.
export const AdsCheckBillingFilterMenu: FC<BillingFilterMenuProps> = ({ usageStatus, onUsageStatusChange, source, onSourceChange }) => {
  useAppLanguage();
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const recompute = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      // Right edge aligned with the trigger (per reference), clamped so it
      // never runs past the viewport — and, since the toolbar itself never
      // extends past the LEFT panel's own width, this naturally never
      // reaches into the RIGHT "Phiên đăng nhập Pro" panel either.
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
    <button ref={triggerRef} type="button" className="ads-billing-plan-filter" aria-label={t("ui.75051abc1e")} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
      <Filter size={14} />
    </button>
    {open && createPortal(
      <div ref={menuRef} className="ads-billing-filter-menu" role="menu" aria-label={t("ui.40cb1e0466")} style={{ top: pos.top, left: pos.left }}>
        <div className="ads-billing-filter-group">
          <h3>{t("ui.75a48e2397")}</h3>
          {USAGE_OPTIONS.map((option) => (
            <button key={option.value} type="button" role="menuitemradio" aria-checked={usageStatus === option.value} className={usageStatus === option.value ? 'is-selected' : ''} onClick={() => onUsageStatusChange(option.value)}>
              <span>{tx(option.label)}</span>
              <i className="ads-billing-filter-radio" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="ads-billing-filter-group">
          <h3>{t("ui.232accbd80")}</h3>
          {SOURCE_OPTIONS.map((option) => (
            <button key={option.value} type="button" role="menuitemradio" aria-checked={source === option.value} className={source === option.value ? 'is-selected' : ''} onClick={() => onSourceChange(option.value)}>
              <span>{tx(option.label)}</span>
              <i className="ads-billing-filter-radio" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>,
      document.body,
    )}
  </>
}

export default AdsCheckBillingFilterMenu
