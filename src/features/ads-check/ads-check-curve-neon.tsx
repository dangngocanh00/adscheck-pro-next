import { useId, type CSSProperties } from 'react'
import { CORNER_TIMING, INNER_RUNNER_DELAY } from './ads-check-shell-accents'
import '../../styles/ads-check-curve-neon.css'

type CurveNeonProps = {
  inner?: boolean
  path: string
  curve: 'a' | 'b' | 'd' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  reverse?: boolean
  duration?: number
  delay?: number
  runnerLength?: number
  coreWidth?: number
  runnerWidth?: number
  color?: string
}
const timing = { ...CORNER_TIMING, a: [3.4, 0], b: [3.7, -.4], d: [3.9, -1.2] } as const

/** Shared visual layers only. The caller owns the exact runtime contour. */
export function AdsCheckCurveNeon({ path, curve, inner = false, reverse = false, duration, delay, runnerLength = 12, coreWidth = 1.3, runnerWidth = 2.8, color = '#B9FF39' }: CurveNeonProps) {
  const id = useId()
  const gradientId = id + '-color'
  const fadeId = id + '-fade'
  const maskId = id + '-mask'
  const vertical = curve === 'a'
  const corner = curve.includes('-')
  const descendingGradient = curve === 'bottom-right' || curve === 'top-left'
  const length = Math.min(20, Math.max(8, runnerLength))
  const style = {
    '--neon-duration': String(duration ?? timing[curve][0]) + 's',
    '--neon-delay': String(delay ?? timing[curve][1]) + 's',
    '--runner-inner-delay': String(inner ? INNER_RUNNER_DELAY : 0) + 's',
    '--neon-core-width': coreWidth,
    '--neon-runner-width': runnerWidth,
  } as CSSProperties
  return <g className={'ads-curve-neon is-' + curve + (reverse ? ' is-reversed' : '') + (inner ? ' is-inner' : '')} fill="none" pointerEvents="none" style={style}>
    <defs>
      <linearGradient id={gradientId} x1={descendingGradient ? '1' : '0'} y1="0" x2={vertical || descendingGradient ? '0' : '1'} y2={vertical || corner ? '1' : '0'}>
        <stop stopColor={color} />
        <stop offset=".5" stopColor="#67C780" />
        <stop offset="1" stopColor="#287151" />
      </linearGradient>
      <linearGradient id={fadeId} x1={descendingGradient ? '1' : '0'} y1="0" x2={vertical || descendingGradient ? '0' : '1'} y2={vertical || corner ? '1' : '0'}>
        <stop stopColor="white" stopOpacity="0" />
        <stop offset=".1" stopColor="white" />
        <stop offset=".9" stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <mask id={maskId} x="-20%" y="-20%" width="140%" height="140%">
        <path d={path} stroke={'url(#' + fadeId + ')'} strokeWidth="20" vectorEffect="non-scaling-stroke" />
      </mask>
    </defs>
    <g mask={'url(#' + maskId + ')'}>
      <path d={path} pathLength={100} className="ads-curve-neon-glow" stroke={color} />
      <path d={path} pathLength={100} className="ads-curve-neon-base" stroke={'url(#' + gradientId + ')'} />
      <g className="ads-curve-neon-pulse">
        {/* Centered nested dashes create soft cyan ends and a bright white core.
            Direct paths normalize every animated stroke, not only a use target. */}
        {Array.from({ length: 12 }, (_, index) => {
          const inset = index * length / 24
          const dash = length - inset * 2
          return <path key={index} d={path} pathLength={100} className="ads-curve-neon-runner"
            stroke={inner ? (index < 4 ? '#B9FF39' : '#E5FAF1') : (index < 4 ? '#CAFF4D' : '#F3FCF8')}
            strokeDasharray={String(dash) + ' ' + String(100 + length - dash)}
            style={{ '--runner-start': length - inset, '--runner-end': -100 - inset } as CSSProperties} />
        })}
      </g>
    </g>
  </g>
}
