import { useAppLanguage, tx } from '@/i18n'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

// Extended Payment Round 1 Part #5/#7 — ONE shared dropdown implementation
// for both "Ngôn ngữ hiển thị" and "Đổi hiển thị tiền tệ thành" (explicitly
// required: do not duplicate nearly-identical dropdowns). Outside click /
// Escape closes it (lightweight popover semantics — this is a plain field
// control, not an important modal), selection shows the green check
// indicator, and the caller supplies options/icons/labels only.
export type ExtendedPaymentDropdownOption = { value: string; label: string; icon?: ReactNode }

type ExtendedPaymentDropdownProps = {
  ariaLabel: string
  value: string
  options: ExtendedPaymentDropdownOption[]
  onChange: (value: string) => void
}

export function ExtendedPaymentDropdown({ ariaLabel, value, options, onChange }: ExtendedPaymentDropdownProps) {
  useAppLanguage();
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const current = options.find((option) => option.value === value) ?? options[0]

  return (
    <div className="ads-extended-dropdown" ref={rootRef}>
      <button type="button" className="ads-extended-select ads-extended-dropdown-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={tx(ariaLabel)} onClick={() => setOpen((currentOpen) => !currentOpen)}>
        {current?.icon}
        <span>{tx(current?.label)}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && <ul className="ads-extended-dropdown-menu" role="listbox" aria-label={tx(ariaLabel)}>
        {options.map((option) => {
          const selected = option.value === value
          return <li key={option.value}>
            <button type="button" role="option" aria-selected={selected} className={selected ? 'is-selected' : ''} onClick={() => { onChange(option.value); setOpen(false) }}>
              {option.icon}
              <span>{tx(option.label)}</span>
              {selected && <Check size={14} className="ads-extended-dropdown-check" aria-hidden="true" />}
            </button>
          </li>
        })}
      </ul>}
    </div>
  )
}

export default ExtendedPaymentDropdown
