import { useLayoutEffect, useRef, useState } from 'react'
import { useAppLanguage } from '@/i18n'
import {
  CURVE_A_BOTTOM_EDGE_INSET,
  CURVE_A_BOTTOM_OUTER_INSET,
  CURVE_A_BOTTOM_SHOULDER_INSET,
  CURVE_A_BOTTOM_SPINE_END_INSET,
  CURVE_A_DEEPEST_X,
  CURVE_A_INNER_X,
  CURVE_A_TOP_BEND_END_Y,
  CURVE_A_TOP_ENTRY_Y,
  CURVE_A_TOP_OUTER_X,
  CURVE_A_TOP_SHOULDER_X,
  CURVE_C_COMPACT_DEEP_END_Y,
  CURVE_C_COMPACT_RECOVERY_END_Y,
  CURVE_C_DEEP_END_Y,
  CURVE_C_DEEP_START_Y,
  CURVE_C_DEPTH,
  CURVE_C_RECOVERY_END_Y,
  CURVE_C_UPPER_START_Y,
  SHELL_CORNER_RADIUS,
  SHELL_EDGE,
  SHELL_RIGHT_CORNER_RADIUS,
  SHELL_TOP_BOTTOM_INSET,
} from './ads-check-shell-curve-geometry'

type AdsCheckShellCurveProps = {
  showRightCurve?: boolean
  reserveRailSpace?: boolean
  compactRightCurve?: boolean
}

type ShellSize = { width: number; height: number }

const FALLBACK_SIZE: ShellSize = { width: 1891, height: 1215 }
const n = (value: number) => Math.round(value * 100) / 100

/**
 * Builds the Classic outer shell from edge-local Curve A/C templates.
 * Horizontal growth happens only in H commands between the fixed bends.
 * Vertical growth happens only in Curve A's V spine between its fixed bends.
 */
function buildShellPath({ width, height }: ShellSize, showRightCurve: boolean, compactRightCurve: boolean) {
  const left = SHELL_EDGE
  const right = width - SHELL_EDGE
  const bottom = height - SHELL_TOP_BOTTOM_INSET
  const lowerCornerStart = height - SHELL_RIGHT_CORNER_RADIUS
  const curveABottomSpineY = Math.max(CURVE_A_TOP_BEND_END_Y, height - CURVE_A_BOTTOM_SPINE_END_INSET)
  const curveABottomShoulderY = Math.max(CURVE_A_TOP_BEND_END_Y, height - CURVE_A_BOTTOM_SHOULDER_INSET)
  const curveABottomOuterY = Math.max(CURVE_A_TOP_BEND_END_Y, height - CURVE_A_BOTTOM_OUTER_INSET)
  const curveABottomEdgeY = Math.max(CURVE_A_TOP_BEND_END_Y, height - CURVE_A_BOTTOM_EDGE_INSET)
  const curveCInnerX = right - CURVE_C_DEPTH
  const curveCDeepEndY = compactRightCurve ? CURVE_C_COMPACT_DEEP_END_Y : CURVE_C_DEEP_END_Y
  const curveCRecoveryEndY = compactRightCurve ? CURVE_C_COMPACT_RECOVERY_END_Y : CURVE_C_RECOVERY_END_Y

  let path = `M${n(left + SHELL_CORNER_RADIUS)} ${SHELL_TOP_BOTTOM_INSET} H${n(right - SHELL_RIGHT_CORNER_RADIUS)}`
  path += ` Q${n(right)} ${SHELL_TOP_BOTTOM_INSET} ${n(right)} ${SHELL_RIGHT_CORNER_RADIUS}`

  if (showRightCurve) {
    path += ` V${CURVE_C_UPPER_START_Y}`
    path += ` C${n(right)} 127.6 ${n(curveCInnerX)} 104.4 ${n(curveCInnerX)} ${CURVE_C_DEEP_START_Y}`
    path += ` V${curveCDeepEndY}`
    path += ` C${n(curveCInnerX)} ${n(curveCDeepEndY + 40.6)} ${n(right)} ${n(curveCRecoveryEndY - 40.6)} ${n(right)} ${curveCRecoveryEndY}`
  }

  path += ` V${n(lowerCornerStart)} Q${n(right)} ${n(bottom)} ${n(right - SHELL_RIGHT_CORNER_RADIUS)} ${n(bottom)}`
  path += ` H${n(left + SHELL_CORNER_RADIUS)} Q${n(left)} ${n(bottom)} ${n(left)} ${n(lowerCornerStart)}`
  path += ` V${n(curveABottomEdgeY)}`
  path += ` Q${n(left)} ${n(height - 165)} ${CURVE_A_TOP_OUTER_X} ${n(curveABottomOuterY)}`
  path += ` L${CURVE_A_TOP_SHOULDER_X} ${n(curveABottomShoulderY)}`
  path += ` Q${CURVE_A_DEEPEST_X} ${n(height - 208)} ${CURVE_A_INNER_X} ${n(curveABottomSpineY)}`
  path += ` V${CURVE_A_TOP_BEND_END_Y}`
  path += ` Q${CURVE_A_INNER_X} 273 ${CURVE_A_TOP_SHOULDER_X} 259`
  path += ` L${CURVE_A_TOP_OUTER_X} 232 Q${n(left)} 224 ${n(left)} ${CURVE_A_TOP_ENTRY_Y}`
  path += ` V${SHELL_RIGHT_CORNER_RADIUS} Q${n(left)} ${SHELL_TOP_BOTTOM_INSET} ${n(left + SHELL_CORNER_RADIUS)} ${SHELL_TOP_BOTTOM_INSET} Z`
  return path
}

function useShellSize() {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState<ShellSize>(FALLBACK_SIZE)

  useLayoutEffect(() => {
    const svg = ref.current
    if (!svg) return
    const updateSize = () => {
      const rect = svg.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      setSize((current) => current.width === rect.width && current.height === rect.height
        ? current
        : { width: rect.width, height: rect.height })
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}

export function AdsCheckShellCurve({ showRightCurve = true, reserveRailSpace = showRightCurve, compactRightCurve = false }: AdsCheckShellCurveProps) {
  useAppLanguage()
  const { ref, size } = useShellSize()
  const curveSize = showRightCurve ? (compactRightCurve ? 'small' : 'large') : 'none'
  const className = `ads-pro-workspace-shape${showRightCurve ? ' has-curve-c' : ''}${compactRightCurve && showRightCurve ? ' has-small-curve-c' : ''}${reserveRailSpace ? ' has-rail-reservation' : ''}`
  const path = buildShellPath(size, showRightCurve, compactRightCurve)

  return <svg ref={ref} className={className} data-curve-c-size={curveSize} aria-hidden="true" focusable="false" viewBox={`0 0 ${size.width} ${size.height}`}>
    <path d={path} fill="rgb(255 255 255 / 14%)" />
  </svg>
}

export default AdsCheckShellCurve
