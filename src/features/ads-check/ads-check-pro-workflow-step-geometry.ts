// Workflow step-card "notch" outline — EXACT production evidence, traced
// from references/remotes/adaccounts/436.e5c83aa9.js's own computed SVG
// path generator for "tool-step-frame". Production recesses the step-number
// pill into a cutout at the top-left of the card instead of floating it
// above a plain rounded rect; everything else is a standard rounded card.
// Driven by the card's own live-measured box (ResizeObserver, see
// StepCardView) — width/height are never assumed, only stepNumber crossing
// the double-digit threshold changes the cutout's reserved width.
export function buildStepCardNotchPath(width: number, height: number, stepNumber: number): string {
  if (width < 60 || height < 60) return ''
  const l = width
  const n = height
  const reserved = l < 180 ? 84 : stepNumber >= 10 ? 114 : 110
  const curveW = Math.min(48, Math.max(0, l - reserved - 20))
  const notchRight = Math.max(20, l - reserved - curveW)
  const s = curveW / 41.666
  const rightInset = l - 20
  return `M20 36 H${notchRight} C${notchRight + 7.102 * s} 36 ${notchRight + 13.672 * s} 31.879953125 ${notchRight + 17.26 * s} 25.175703125 L${notchRight + 24.405 * s} ${36 - 24.175703125} C${notchRight + 27.993 * s} 5.120046875 ${notchRight + 34.563 * s} 1 ${notchRight + curveW} 1 H${rightInset} C${rightInset + 11.046} 1 ${l} 9.954 ${l} 21 V${n - 20} C${l} ${n - 20 + 11.046} ${rightInset + 11.046} ${n} ${rightInset} ${n} H20 C8.954 ${n} 0 ${n - 20 + 11.046} 0 ${n - 20} V56 C0 44.954 8.954 36 20 36 Z`
}
