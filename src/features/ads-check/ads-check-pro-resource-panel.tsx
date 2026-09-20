import { useAppLanguage, tx, t, m } from '@/i18n'
import { useRef, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

export type ResourcePanelProps = {
  icon: ReactNode
  title: string
  subtitle: string
  searchPlaceholder: string
  onSearch: (query: string) => void
  emptyText?: string
  isEmpty: boolean
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

// Shared shell (Correction Batch 2 Part M/T) — every BM resource panel
// (Partner/Admin/Ad Account/Page/IG/WABA) and the TKQC Admin panel reuse
// this SAME primitive instead of six-plus copy-pasted modals. Fixed overall
// dimensions (Part M1): header/subtitle/search/footer never scroll, only
// the list region does, regardless of item count (1 or 100).
export function AdsProResourcePanel({ icon, title, subtitle, searchPlaceholder, onSearch, emptyText, isEmpty, children, footer, onClose }: ResourcePanelProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const [query, setQuery] = useState('')

  // CATEGORY A lightweight cell-detail panel (Shared Resource/Modal UX
  // correction) — click ANYWHERE outside the panel closes it (not just the
  // X); clicks inside (rows, search, buttons, scrollbar, nested portals
  // like the destructive confirm dialog) never trigger this, since they
  // never bubble through this specific backdrop element's own DOM subtree.
  return <AdsProModalBackdrop dismissOnBackdrop className="ads-pro-local-dialog-layer" onClose={onClose}>
    <section ref={panelRef} className="ads-resource-panel" role="dialog" aria-modal="true" aria-labelledby="ads-resource-panel-title">
      <header className="ads-resource-panel-header">
        <span className="ads-resource-panel-icon" aria-hidden="true">{icon}</span>
        <h2 id="ads-resource-panel-title">{tx(title)}</h2>
        <button type="button" className="ads-resource-panel-close" aria-label={t("ui.d2b73ab2ad")} data-autofocus onClick={onClose}><X size={16} /></button>
      </header>
      <p className="ads-resource-panel-subtitle">{tx(subtitle)}</p>
      <label className="ads-resource-panel-search">
        <Search size={14} aria-hidden="true" />
        <input aria-label={tx(searchPlaceholder)} placeholder={tx(searchPlaceholder)} value={query} onChange={(event) => { setQuery(event.target.value); onSearch(event.target.value) }} />
      </label>
      <div className="ads-resource-panel-list">
        {tx(isEmpty ? <p className="ads-resource-panel-empty">{tx(emptyText ?? m("ui.01d461ee2b"))}</p> : children)}
      </div>
      {footer && <footer className="ads-resource-panel-footer">{footer}</footer>}
    </section>
  </AdsProModalBackdrop>
}
