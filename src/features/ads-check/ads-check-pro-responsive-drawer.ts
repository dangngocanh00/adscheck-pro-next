import { useEffect, useRef, useState, type RefObject } from 'react'

// VIA Final Correction Part B — traced production (references/remotes/
// adaccounts/558.02b0004f.js, module 60754 `useIsMobile`): ONE real
// breakpoint, `matchMedia("(max-width: 767px)")`. Below it, Folder/Function/
// Workflow become bottom-sheet drawers/FABs; at 768px and above (our ENTIRE
// required 768-1920 target matrix), production keeps them as INLINE
// desktop panels (Folder pushes the table column, Function/Workflow are
// resizable side panels) — never absolute-positioned overlays. The
// previous 1180px value was an earlier round's own unevidenced guess, not
// traced from production; corrected here to the real value.
const drawerQuery = '(max-width: 767px)'

export function isAdsProDrawerViewport() {
  return typeof window !== 'undefined' && window.matchMedia(drawerQuery).matches
}

export function useAdsProDrawerViewport() {
  const [isDrawer, setIsDrawer] = useState(isAdsProDrawerViewport)

  useEffect(() => {
    const media = window.matchMedia(drawerQuery)
    const update = () => setIsDrawer(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isDrawer
}

export function useAdsProDrawerFocus(open: boolean, panelRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const initialFocus = panel?.querySelector<HTMLElement>('[data-autofocus]')
      ?? panel?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]')
    initialFocus?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const activeModal = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')
      if (activeModal && activeModal !== panel && !panel?.contains(activeModal)) return
      onCloseRef.current()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      if (panel?.contains(document.activeElement)) previous?.focus()
    }
  }, [open, panelRef])
}
