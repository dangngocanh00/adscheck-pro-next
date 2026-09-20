import { useAppLanguage, tx } from '@/i18n'
import type { MouseEvent, ReactNode } from 'react'

type ModalBackdropProps = {
  // Shared Resource/Modal UX correction — the ONE place that decides
  // whether clicking the dim backdrop dismisses the surface above it.
  // CATEGORY A (lightweight cell-detail panels/popovers) pass
  // `dismissOnBackdrop`; CATEGORY B (important task/config/history/
  // destructive modals) simply omit it (default false). The decision
  // lives here as an explicit prop set by the CALLER's own component
  // semantics — never inferred from a title string, so a future modal
  // can't accidentally end up backdrop-dismissible (or not) by omission.
  dismissOnBackdrop?: boolean
  onClose: () => void
  className?: string
  children: ReactNode
}

export function AdsProModalBackdrop({ dismissOnBackdrop = false, onClose, className = 'ads-advanced-filter-backdrop', children }: ModalBackdropProps) {
  useAppLanguage();
  // `target === currentTarget` means the mousedown landed on the backdrop
  // itself, never on a descendant — so this can never fire from clicks
  // inside the modal/panel (rows, inputs, dropdowns, nested portals all
  // live outside this element in the DOM they'd need to bubble through).
  // The backdrop itself still intercepts the click either way (it's a
  // real, opaque/dimmed element covering the workspace), so it always
  // blocks click-through regardless of `dismissOnBackdrop`.
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (dismissOnBackdrop && event.target === event.currentTarget) onClose()
  }
  return <div className={className} role="presentation" onMouseDown={handleMouseDown}>{tx(children)}</div>
}
