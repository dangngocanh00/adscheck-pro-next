// Curve D — Billing's LEFT panel surface (Mua gói / Quản lý gói cước /
// Lịch sử giao dịch). This is a THIN ADAPTATION of Curve B
// (ads-check-pro-workspace-surface.ts, untouched) — same algorithm, same
// locked curve-shape constants, same first/middle/last branching; the only
// things that differ are the DOM being measured (3 Billing tabs instead of
// 5 Ads Check Pro asset tabs) and the ONE constant Curve B itself documents
// as layout-position-dependent rather than curve-shape (RECOVERY_START_X,
// a fixed X calibrated for Ads Check Pro's specific 5-tab strip) — that one
// is replaced by `lastTabRight + RECOVERY_CLEARANCE`, a small clearance
// measured from the actual last Billing tab's own right edge, per explicit
// instruction (Curve B's own fixed-450 value has no meaning for a 3-tab,
// differently-sized strip).
//
// Two additive, structural-only differences from Curve B, neither of which
// touches the tab-notch curve language:
//  - RIGHT_CORNER_RADIUS is 16 (not Curve B's 12) to match the radius
//    already established on Billing's own panels/"Gói của bạn".
//  - the bottom-LEFT corner is also rounded (buildCorners, not just
//    buildRightCorners) — Curve B deliberately leaves it sharp because a
//    folder/table panel is drawn on top of it there; Billing has no such
//    covering panel, so it needs its own rounding to read as a real box.

export type BillingWorkspaceTabPosition = 'first' | 'middle' | 'last'

export type BillingWorkspaceSurfaceGeometry = {
  frameWidth: number
  frameHeight: number
  tabRowHeight: number
  /** Active tab's own button rect, frame-relative (left/right only — same as Curve B's buttonRect). */
  activeTabRect: { left: number; right: number }
  /** Last tab's own right edge, frame-relative — replaces Curve B's fixed RECOVERY_START_X. */
  lastTabRight: number
  tabPosition: BillingWorkspaceTabPosition
}

// Curve TEMPLATE — copied verbatim from Curve B (ads-check-pro-workspace-
// surface.ts). LOCKED: never scaled, stretched, clamped, or derived from
// button/content width. Only *where* it gets placed comes from runtime DOM
// measurement, exactly as in Curve B.
const RISE_WIDTH = 40
const FALL_WIDTH = 40
const RECOVERY_WIDTH = 48

const LEFT_ENTRY_EXTRA = 21
const LEFT_CORNER_MERGED_X = 41
const LEFT_CORNER_FLAT_X = 24

// PLACEMENT (not curvature) — identical derivation to Curve B: a fixed rim
// visible outside the active pill, independent of button width/content.
const ACTIVE_CUT_RIM = 40 - 56 / 3 // ≈ 21.33px, same as Curve B
const PLACEMENT_INSET = RISE_WIDTH - ACTIVE_CUT_RIM // ≈ 18.67px, same as Curve B

// Small measured clearance after the last tab's own right edge, replacing
// Curve B's fixed RECOVERY_START_X (a 5-tab/1440×900-calibrated constant
// with no meaning here) — see module comment above.
const RECOVERY_CLEARANCE = 10

// Billing's own established corner radius (matches .ads-purchase-summary /
// "Gói của bạn" at 16px) — the one deliberate, purely-structural deviation
// from Curve B's 12px (see module comment above).
const CORNER_RADIUS = 16

const n = (value: number) => Math.round(value * 100) / 100

/** Rounds the top-right and bottom-right corners — verbatim Curve B
 * (buildRightCorners), just renamed. */
function buildTopRightAndBottomRight(frameWidth: number, frameHeight: number, topY: number, radius: number) {
  return `H${n(frameWidth - radius)} Q${n(frameWidth)} ${n(topY)} ${n(frameWidth)} ${n(topY + radius)} `
    + `V${n(frameHeight - radius)} Q${n(frameWidth)} ${n(frameHeight)} ${n(frameWidth - radius)} ${n(frameHeight)} `
}

/** Also rounds the bottom-left corner, then closes — the one additive,
 * non-curve-language difference from Curve B (see module comment above).
 * Assumes the path started at `M0 ${frameHeight - radius}` (see caller). */
function closeBottomLeft(frameHeight: number, radius: number) {
  return `H${n(radius)} Q0 ${n(frameHeight)} 0 ${n(frameHeight - radius)} Z`
}

/** RISE template: H(start) then the two verbatim production cubics, ending at (start+40, 0). Verbatim Curve B. */
function buildRise(start: number, cut: number, mid: number) {
  const shoulderX = start + 16
  const topStart = start + RISE_WIDTH
  const segment = `H${n(start)} C${n(start + 8)} ${n(cut)} ${n(shoulderX)} ${n(cut - 6)} ${n(shoulderX)} ${n(mid)} `
    + `C${n(shoulderX)} ${n(mid - 10)} ${n(shoulderX - 1)} ${n(mid - 26)} ${n(topStart)} 0 `
  return { topStart, segment }
}

/** FALL template: H(topEnd) then the two verbatim production cubics, ending at (topEnd+40, cut). Verbatim Curve B. */
function buildFall(topEnd: number, cut: number, mid: number) {
  const shoulderX = topEnd + 24
  const end = topEnd + FALL_WIDTH
  const segment = `H${n(topEnd)} C${n(topEnd + 25)} ${n(mid - 26)} ${n(shoulderX)} ${n(mid - 10)} ${n(shoulderX)} ${n(mid)} `
    + `C${n(shoulderX)} ${n(cut - 6)} ${n(shoulderX + 8)} ${n(cut)} ${n(end)} ${n(cut)} `
  return { end, segment }
}

/** RECOVERY template: production's separate single-cubic step back up to y=0. Verbatim Curve B. */
function buildRecovery(start: number, cut: number) {
  const end = start + RECOVERY_WIDTH
  const segment = `H${n(start)} C${n(start + 24)} ${n(cut)} ${n(start + 16.8)} 0 ${n(end)} 0 `
  return { end, segment }
}

/** Plateau edge anchors (frame-relative), derived purely from the active button's own rect. Verbatim Curve B (resolveAnchor). */
function resolveAnchor(buttonRect: { left: number; right: number }) {
  const inset = Math.min(PLACEMENT_INSET, (buttonRect.right - buttonRect.left) / 2)
  return { topStart: buttonRect.left + inset, topEnd: buttonRect.right - inset }
}

/**
 * Builds the Curve D `d` path — same algorithm as buildWorkspaceSurfacePath
 * (Curve B), fed with Billing's own 3-tab DOM measurements. See module
 * comment above for the two deliberate, purely-structural deviations
 * (RECOVERY_START replaced by lastTabRight + clearance; corners rounded on
 * all 4 sides instead of 3).
 */
export function buildBillingWorkspacePath(geometry: BillingWorkspaceSurfaceGeometry): string {
  const { frameWidth, frameHeight, tabRowHeight, activeTabRect, lastTabRight, tabPosition } = geometry
  const isFirstActive = tabPosition === 'first'
  const isLastActive = tabPosition === 'last'
  const cut = tabRowHeight
  const mid = cut * (28 / 44)
  const entry = cut + LEFT_ENTRY_EXTRA
  const activePlacement = resolveAnchor(activeTabRect)

  // Starts CORNER_RADIUS above the true bottom-left corner (see
  // closeBottomLeft) instead of Curve B's plain `M0 frameHeight` — the
  // bottom-left rounding this enables is Billing's one additive difference.
  let d = `M0 ${n(frameHeight - CORNER_RADIUS)} `
  let topStart: number
  let topEnd: number

  if (isFirstActive) {
    d += `V${n(mid)} C0 0 10 0 ${LEFT_CORNER_MERGED_X} 0 `
    topStart = LEFT_CORNER_MERGED_X
    topEnd = Math.max(topStart, activePlacement.topEnd)
  } else {
    d += `V${n(entry)} Q5 ${n(cut)} ${LEFT_CORNER_FLAT_X} ${n(cut)} `
    topStart = activePlacement.topStart
    const riseStart = topStart - RISE_WIDTH
    d += buildRise(riseStart, cut, mid).segment
    topEnd = Math.max(topStart, activePlacement.topEnd)
  }

  const recoveryStart = lastTabRight + RECOVERY_CLEARANCE
  if (isLastActive) {
    d += buildTopRightAndBottomRight(frameWidth, frameHeight, 0, CORNER_RADIUS)
  } else {
    const fall = buildFall(topEnd, cut, mid)
    d += fall.segment

    let topY = cut
    if (recoveryStart >= fall.end) {
      d += buildRecovery(recoveryStart, cut).segment
      topY = 0
    }
    d += buildTopRightAndBottomRight(frameWidth, frameHeight, topY, CORNER_RADIUS)
  }

  d += closeBottomLeft(frameHeight, CORNER_RADIUS)
  return d
}
