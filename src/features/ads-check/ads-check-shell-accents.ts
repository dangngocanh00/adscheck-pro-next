export const INNER_RUNNER_DELAY = .45
export const CORNER_TIMING = {
  'top-right': [4.2, -.8], 'bottom-right': [4.2, -2.9],
  'top-left': [4.2, -1.85], 'bottom-left': [4.2, -3.95],
} as const
export type ShellCorner = keyof typeof CORNER_TIMING
export function shellAccentConfig(fourCorners: boolean, bottomLeft: boolean) {
  const corners: ShellCorner[] = ['top-right', 'bottom-right']
  if (fourCorners) corners.push('top-left')
  if (fourCorners || bottomLeft) corners.push('bottom-left')
  const stagger = { 'top-left': 0, 'top-right': .4, 'bottom-right': .8, 'bottom-left': 1.2 }
  return corners.map(corner => ({ corner, reverse: corner === 'top-left',
    duration: fourCorners ? 3.6 : CORNER_TIMING[corner][0],
    delay: fourCorners ? stagger[corner] : CORNER_TIMING[corner][1] }))
}
export type ContentBounds = { left: number; top: number; width: number; height: number; radii: number[] }
/** Measured CSS panel contour, inset to keep the runner within the surface. */
export function contentAccentPaths({ width, height, radii }: ContentBounds): Record<ShellCorner, string> {
  const l = 1, t = 1, r = Math.max(1, width - 1), b = Math.max(1, height - 1)
  const [tl, tr, br, bl] = radii.map(radius => Math.max(.01, Math.min(radius - 1, (r-l)/2, (b-t)/2)))
  const h = (r-l)*.22, v = Math.min(140, (b-t)*.12)
  return {
    'top-left': `M${l+h} ${t} H${l+tl} A${tl} ${tl} 0 0 0 ${l} ${t+tl} V${t+v}`,
    'top-right': `M${r-h} ${t} H${r-tr} A${tr} ${tr} 0 0 1 ${r} ${t+tr} V${t+v}`,
    'bottom-right': `M${r} ${b-v} V${b-br} A${br} ${br} 0 0 1 ${r-br} ${b} H${r-h}`,
    'bottom-left': `M${l+h} ${b} H${l+bl} A${bl} ${bl} 0 0 1 ${l} ${b-bl} V${b-v}`,
  }
}
