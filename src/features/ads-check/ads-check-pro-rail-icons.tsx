import { useAppLanguage } from '@/i18n'
import { useId } from 'react'

// Right-rail reopen-button icons — EXACT production assets, extracted from
// references/remotes/adaccounts/436.e5c83aa9.js's embedded base64 SVGs
// ("menu-square-gradient" for Function Store, "folder-gradient" for
// Workflow — both `<img>`-rendered gradient glyphs, distinct from the
// monochrome sprite icons used elsewhere in production). Both are a plain
// mint-green linear gradient (#14FF89 → #8EFF77), consistent with this
// panel's light theme. Gradient ids are namespaced via useId() so multiple
// instances on the same page never collide.

export function FunctionStoreRailIcon({ size = 14 }: { size?: number }) {
  useAppLanguage();
  const uid = useId()
  const ids = [0, 1, 2, 3].map((n) => `${uid}-menu-sq-${n}`)
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1.16675 10.5003C1.16675 9.60174 1.16675 9.15244 1.36901 8.82239C1.48218 8.6377 1.63746 8.48243 1.82214 8.36925C2.1522 8.16699 2.60149 8.16699 3.50008 8.16699C4.39867 8.16699 4.84796 8.16699 5.17802 8.36925C5.3627 8.48243 5.51798 8.6377 5.63116 8.82239C5.83341 9.15244 5.83341 9.60174 5.83341 10.5003C5.83341 11.3989 5.83341 11.8482 5.63116 12.1783C5.51798 12.3629 5.3627 12.5182 5.17802 12.6314C4.84796 12.8337 4.39867 12.8337 3.50008 12.8337C2.60149 12.8337 2.1522 12.8337 1.82214 12.6314C1.63746 12.5182 1.48218 12.3629 1.36901 12.1783C1.16675 11.8482 1.16675 11.3989 1.16675 10.5003Z" stroke={`url(#${ids[0]})`} strokeWidth="0.9" />
    <path d="M8.16675 10.5003C8.16675 9.60174 8.16675 9.15244 8.36901 8.82239C8.48218 8.6377 8.63746 8.48243 8.82214 8.36925C9.1522 8.16699 9.60149 8.16699 10.5001 8.16699C11.3987 8.16699 11.848 8.16699 12.178 8.36925C12.3627 8.48243 12.518 8.6377 12.6312 8.82239C12.8334 9.15244 12.8334 9.60174 12.8334 10.5003C12.8334 11.3989 12.8334 11.8482 12.6312 12.1783C12.518 12.3629 12.3627 12.5182 12.178 12.6314C11.848 12.8337 11.3987 12.8337 10.5001 12.8337C9.60149 12.8337 9.1522 12.8337 8.82214 12.6314C8.63746 12.5182 8.48218 12.3629 8.36901 12.1783C8.16675 11.8482 8.16675 11.3989 8.16675 10.5003Z" stroke={`url(#${ids[1]})`} strokeWidth="0.9" />
    <path d="M1.16675 3.50033C1.16675 2.60174 1.16675 2.15244 1.36901 1.82239C1.48218 1.6377 1.63746 1.48243 1.82214 1.36925C2.1522 1.16699 2.60149 1.16699 3.50008 1.16699C4.39867 1.16699 4.84796 1.16699 5.17802 1.36925C5.3627 1.48243 5.51798 1.6377 5.63116 1.82239C5.83341 2.15244 5.83341 2.60174 5.83341 3.50033C5.83341 4.39891 5.83341 4.84821 5.63116 5.17826C5.51798 5.36295 5.3627 5.51823 5.17802 5.6314C4.84796 5.83366 4.39867 5.83366 3.50008 5.83366C2.60149 5.83366 2.1522 5.83366 1.82214 5.6314C1.63746 5.51823 1.48218 5.36295 1.36901 5.17826C1.16675 4.84821 1.16675 4.39891 1.16675 3.50033Z" stroke={`url(#${ids[2]})`} strokeWidth="0.9" />
    <path d="M8.16675 3.50033C8.16675 2.60174 8.16675 2.15244 8.36901 1.82239C8.48218 1.6377 8.63746 1.48243 8.82214 1.36925C9.1522 1.16699 9.60149 1.16699 10.5001 1.16699C11.3987 1.16699 11.848 1.16699 12.178 1.36925C12.3627 1.48243 12.518 1.6377 12.6312 1.82239C12.8334 2.15244 12.8334 2.60174 12.8334 3.50033C12.8334 4.39891 12.8334 4.84821 12.6312 5.17826C12.518 5.36295 12.3627 5.51823 12.178 5.6314C11.848 5.83366 11.3987 5.83366 10.5001 5.83366C9.60149 5.83366 9.1522 5.83366 8.82214 5.6314C8.63746 5.51823 8.48218 5.36295 8.36901 5.17826C8.16675 4.84821 8.16675 4.39891 8.16675 3.50033Z" stroke={`url(#${ids[3]})`} strokeWidth="0.9" />
    <defs>
      <linearGradient id={ids[0]} x1="3.62971" y1="8.16699" x2="3.62971" y2="12.8337" gradientUnits="userSpaceOnUse"><stop stopColor="var(--cv-rail-icon-gradient-start, #14FF89)" /><stop offset="1" stopColor="var(--cv-rail-icon-gradient-end, #8EFF77)" /></linearGradient>
      <linearGradient id={ids[1]} x1="10.6297" y1="8.16699" x2="10.6297" y2="12.8337" gradientUnits="userSpaceOnUse"><stop stopColor="var(--cv-rail-icon-gradient-start, #14FF89)" /><stop offset="1" stopColor="var(--cv-rail-icon-gradient-end, #8EFF77)" /></linearGradient>
      <linearGradient id={ids[2]} x1="3.62971" y1="1.16699" x2="3.62971" y2="5.83366" gradientUnits="userSpaceOnUse"><stop stopColor="var(--cv-rail-icon-gradient-start, #14FF89)" /><stop offset="1" stopColor="var(--cv-rail-icon-gradient-end, #8EFF77)" /></linearGradient>
      <linearGradient id={ids[3]} x1="10.6297" y1="1.16699" x2="10.6297" y2="5.83366" gradientUnits="userSpaceOnUse"><stop stopColor="var(--cv-rail-icon-gradient-start, #14FF89)" /><stop offset="1" stopColor="var(--cv-rail-icon-gradient-end, #8EFF77)" /></linearGradient>
    </defs>
  </svg>
}

export function WorkflowRailIcon({ size = 14 }: { size?: number }) {
  useAppLanguage();
  const uid = useId()
  const gradId = `${uid}-folder-grad`
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4.66675 4.0801H7.01053M7.01053 4.0801H10.8334C11.938 4.0801 12.8334 4.97553 12.8334 6.0801V10.25C12.8334 11.3546 11.938 12.25 10.8334 12.25H3.16675C2.06218 12.25 1.16675 11.3546 1.16675 10.25V2.75C1.16675 2.19772 1.61446 1.75 2.16675 1.75H4.75228C5.0658 1.75 5.36117 1.89703 5.55016 2.14718L7.01053 4.0801Z" stroke={`url(#${gradId})`} strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id={gradId} x1="7.32416" y1="1.75" x2="7.32416" y2="12.25" gradientUnits="userSpaceOnUse"><stop stopColor="var(--cv-rail-icon-gradient-start, #14FF89)" /><stop offset="1" stopColor="var(--cv-rail-icon-gradient-end, #8EFF77)" /></linearGradient>
    </defs>
  </svg>
}
