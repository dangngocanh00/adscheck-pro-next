import { useLayoutEffect, useRef, useState } from 'react'
import { useAppLanguage } from '@/i18n'
import { contentAccentPaths, shellAccentConfig, type ContentBounds } from './ads-check-shell-accents'
import { AdsCheckCurveNeon } from './ads-check-curve-neon'
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
  SHELL_CORNER_RADIUS,
  SHELL_EDGE,
  SHELL_RIGHT_CORNER_RADIUS,
  SHELL_TOP_BOTTOM_INSET,
} from './ads-check-shell-curve-geometry'

type AdsCheckShellCurveProps = {
  enableLeftCornerAccents?: boolean
  enableBottomLeftAccent?: boolean
  showLeftCurve?: boolean
  neon?: boolean
}

type ShellSize = { width: number; height: number; contentLeft: number }

const FALLBACK_SIZE: ShellSize = { width: 1891, height: 1215, contentLeft: 57 }
const n = (value: number) => Math.round(value * 100) / 100

/**
 * Builds the shared shell with a continuous right edge and fixed corner accents.
 * Horizontal growth happens only in H commands between the fixed bends.
 * Vertical growth happens only in Curve A's V spine between its fixed bends.
 */
function buildShellPath({ width, height, contentLeft }: ShellSize, showLeftCurve: boolean) {
  const left = showLeftCurve ? SHELL_EDGE : contentLeft
  const right = width - SHELL_EDGE
  const bottom = height - SHELL_TOP_BOTTOM_INSET
  const lowerCornerStart = height - SHELL_RIGHT_CORNER_RADIUS
  const curveABottomSpineY = Math.max(CURVE_A_TOP_BEND_END_Y, height - CURVE_A_BOTTOM_SPINE_END_INSET)
  const curveABottomShoulderY = Math.max(CURVE_A_TOP_BEND_END_Y, height - CURVE_A_BOTTOM_SHOULDER_INSET)
  const curveABottomOuterY = Math.max(CURVE_A_TOP_BEND_END_Y, height - CURVE_A_BOTTOM_OUTER_INSET)
  const curveABottomEdgeY = Math.max(CURVE_A_TOP_BEND_END_Y, height - CURVE_A_BOTTOM_EDGE_INSET)

  let path = `M${n(left + SHELL_CORNER_RADIUS)} ${SHELL_TOP_BOTTOM_INSET} H${n(right - SHELL_RIGHT_CORNER_RADIUS)}`
  path += ` Q${n(right)} ${SHELL_TOP_BOTTOM_INSET} ${n(right)} ${SHELL_RIGHT_CORNER_RADIUS}`

  path += ` V${n(lowerCornerStart)} Q${n(right)} ${n(bottom)} ${n(right - SHELL_RIGHT_CORNER_RADIUS)} ${n(bottom)}`
  path += ` H${n(left + SHELL_CORNER_RADIUS)} Q${n(left)} ${n(bottom)} ${n(left)} ${n(lowerCornerStart)}`
  let curveAPath = ''
  if (showLeftCurve) {
    path += ` V${n(curveABottomEdgeY)}`
    const curveAStart = path.length
    path += ` Q${n(left)} ${n(height - 165)} ${CURVE_A_TOP_OUTER_X} ${n(curveABottomOuterY)}`
    path += ` L${CURVE_A_TOP_SHOULDER_X} ${n(curveABottomShoulderY)}`
    path += ` Q${CURVE_A_DEEPEST_X} ${n(height - 208)} ${CURVE_A_INNER_X} ${n(curveABottomSpineY)}`
    path += ` V${CURVE_A_TOP_BEND_END_Y}`
    path += ` Q${CURVE_A_INNER_X} 273 ${CURVE_A_TOP_SHOULDER_X} 259`
    path += ` L${CURVE_A_TOP_OUTER_X} 232 Q${n(left)} 224 ${n(left)} ${CURVE_A_TOP_ENTRY_Y}`
    curveAPath = `M${n(left)} ${n(curveABottomEdgeY)}` + path.slice(curveAStart)
  }
  path += ` V${SHELL_RIGHT_CORNER_RADIUS} Q${n(left)} ${SHELL_TOP_BOTTOM_INSET} ${n(left + SHELL_CORNER_RADIUS)} ${SHELL_TOP_BOTTOM_INSET} Z`
  // Share balanced corner coverage, measured from the actual shell bounds.
  const accentHorizontal = (right - left) * .22
  const accentVertical = Math.min(140, (bottom - SHELL_TOP_BOTTOM_INSET) * .12)
  const topRightPath = `M${n(right - accentHorizontal)} ${SHELL_TOP_BOTTOM_INSET} H${n(right - SHELL_RIGHT_CORNER_RADIUS)} Q${n(right)} ${SHELL_TOP_BOTTOM_INSET} ${n(right)} ${SHELL_RIGHT_CORNER_RADIUS} V${n(SHELL_TOP_BOTTOM_INSET + accentVertical)}`
  const bottomRightPath = `M${n(right)} ${n(bottom - accentVertical)} V${n(lowerCornerStart)} Q${n(right)} ${n(bottom)} ${n(right - SHELL_RIGHT_CORNER_RADIUS)} ${n(bottom)} H${n(right - accentHorizontal)}`
  const topLeftPath = `M${n(left + accentHorizontal)} ${SHELL_TOP_BOTTOM_INSET} H${n(left + SHELL_CORNER_RADIUS)} Q${n(left)} ${SHELL_TOP_BOTTOM_INSET} ${n(left)} ${SHELL_RIGHT_CORNER_RADIUS} V${n(SHELL_TOP_BOTTOM_INSET + accentVertical)}`
  const bottomLeftPath = `M${n(left + accentHorizontal)} ${n(bottom)} H${n(left + SHELL_CORNER_RADIUS)} Q${n(left)} ${n(bottom)} ${n(left)} ${n(lowerCornerStart)} V${n(bottom - accentVertical)}`
  return { path, curveAPath, topRightPath, bottomRightPath, topLeftPath, bottomLeftPath }
}

function useShellSize() {
  const ref = useRef<SVGSVGElement>(null)
  const [inner, setInner] = useState<ContentBounds>({ left: 0, top: 0, width: 1, height: 1, radii: [0, 0, 0, 0] })
  const [size, setSize] = useState<ShellSize>(FALLBACK_SIZE)

  useLayoutEffect(() => {
    const svg = ref.current
    if (!svg) return
    const content = svg.parentElement?.querySelector<HTMLElement>('.ads-main-panel, .ads-product-main')
    const updateSize = () => {
      const rect = svg.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      if (content) {
        const bounds = content.getBoundingClientRect()
        const css = getComputedStyle(content)
        const next = { left: bounds.left - rect.left, top: bounds.top - rect.top,
          width: bounds.width, height: bounds.height,
          radii: [css.borderTopLeftRadius, css.borderTopRightRadius, css.borderBottomRightRadius, css.borderBottomLeftRadius].map(value => Number.parseFloat(value) || 0) }
        setInner(current => JSON.stringify(current) === JSON.stringify(next) ? current : next)
      }
      const overhang = Number.parseFloat(getComputedStyle(svg).getPropertyValue('--content-backplate-overhang')) || 10
      const contentLeft = content ? Math.max(SHELL_EDGE, content.getBoundingClientRect().left - rect.left - overhang) : 57
      setSize((current) => current.width === rect.width && current.height === rect.height && current.contentLeft === contentLeft
        ? current
        : { width: rect.width, height: rect.height, contentLeft })
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(svg)
    if (content) observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return { ref, size, inner }
}

export function AdsCheckShellCurve({ showLeftCurve = false, neon = true, enableLeftCornerAccents = false, enableBottomLeftAccent = false }: AdsCheckShellCurveProps) {
  useAppLanguage()
  const { ref, size, inner } = useShellSize()
  const { path, curveAPath, topRightPath, bottomRightPath, topLeftPath, bottomLeftPath } = buildShellPath(size, showLeftCurve)

  const config = shellAccentConfig(enableLeftCornerAccents, enableBottomLeftAccent)
  const outerPaths = { 'top-right': topRightPath, 'bottom-right': bottomRightPath, 'top-left': topLeftPath, 'bottom-left': bottomLeftPath }
  const innerPaths = contentAccentPaths(inner)
  return <><svg ref={ref} className="ads-pro-workspace-shape" aria-hidden="true" focusable="false" viewBox={`0 0 ${size.width} ${size.height}`}>
    <path d={path} fill="rgb(255 255 255 / 14%)" stroke="rgb(164 201 235 / 12%)" strokeWidth={1} />
    {neon && showLeftCurve && <AdsCheckCurveNeon path={curveAPath} curve="a" reverse />}
    {neon && config.map(({ corner, ...motion }) => <AdsCheckCurveNeon key={corner} path={outerPaths[corner]} curve={corner} {...motion} runnerLength={16} coreWidth={1.2} runnerWidth={1.8} />)}

  </svg>
    <svg className="ads-content-corner-accents" aria-hidden="true" focusable="false" viewBox={`0 0 ${inner.width} ${inner.height}`}
      style={{ left: inner.left, top: inner.top, width: inner.width, height: inner.height }}>
      {neon && config.map(({ corner, ...motion }) => <AdsCheckCurveNeon key={corner} path={innerPaths[corner]} curve={corner} {...motion} inner runnerLength={16} coreWidth={1} runnerWidth={1.6} color="#0284C7" />)}
    </svg>
  </>
}

export default AdsCheckShellCurve
