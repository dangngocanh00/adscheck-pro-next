import { useEffect, type Dispatch, type SetStateAction } from 'react'

export function useShellDrawerMode(setOpen: Dispatch<SetStateAction<boolean>>) {
  useEffect(() => {
    const railMode = window.matchMedia('(min-width: 1280px), (min-width: 768px) and (orientation: landscape)')
    const update = () => { if (railMode.matches) setOpen(false) }
    railMode.addEventListener('change', update)
    return () => railMode.removeEventListener('change', update)
  }, [setOpen])
}
