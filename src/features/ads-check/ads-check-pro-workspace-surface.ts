export type WorkspaceSurfaceRect = { left: number; right: number }

export type WorkspaceSurfaceAnchor = {
  buttonRect: WorkspaceSurfaceRect
  /** Raw visible-content rect (label text ∪ count badge), frame-relative — measurement only, reported for debug; not consumed by placement (see PLACEMENT_RATIO below for why). */
  contentRect: WorkspaceSurfaceRect
}

export type WorkspaceSurfaceGeometry = {
  frameWidth: number
  frameHeight: number
  tabRowHeight: number
  /** Action-group start, frame-relative; this drives Curve B's recovery. */
  recoveryStart: number
  activeAnchor: WorkspaceSurfaceAnchor
  isFirstActive: boolean
  isLastActive: boolean
}

export type WorkspaceSurfaceDebug = {
  buttonLeft: number
  buttonRight: number
  buttonWidth: number
  contentLeft: number
  contentRight: number
  contentWidth: number
  leftContentGap: number
  rightContentGap: number
  placementInsetLeft: number
  placementInsetRight: number
  riseStart: number
  topStart: number
  topEnd: number
  fallEnd: number
  plateauWidth: number
  leftTransitionWidth: number
  rightTransitionWidth: number
  totalIslandWidth: number
  recoveryStart: number | null
  recoveryEnd: number
  recoveryDrawn: boolean
}

export type WorkspaceSurfaceResult = { path: string; debug: WorkspaceSurfaceDebug }

// Curve TEMPLATE — verbatim relative offsets read off production's own Bézier
// (Console-captured). LOCKED: never scaled, stretched, clamped, or derived
// from button/content width. Only *where* (which X) it gets placed comes from
// runtime DOM measurement (see WorkspaceSurfaceAnchor / the component).
const RISE_WIDTH = 40 // start -> topStart, production-verified, always exactly this
const FALL_WIDTH = 40 // topEnd -> end, production-verified, always exactly this
const RECOVERY_WIDTH = 48 // production's separate single-cubic recovery step

const LEFT_ENTRY_EXTRA = 21
const LEFT_CORNER_MERGED_X = 41
const LEFT_CORNER_FLAT_X = 24

// PLACEMENT (not curvature) — how far topStart/topEnd sit inside the active
// button's own edges. This used to be a fraction of the button's own width
// (buttonWidth/3, capped): that made the visible rim change whenever the
// button grew (e.g. a count badge going 1 -> 1000+), which is wrong — a
// count is data, not a design input. The rim the curve leaves visible
// outside the pill (ACTIVE_CUT_RIM) is now a single FIXED constant, entirely
// independent of button width/content/count, applied identically to every
// tab and every side. It's calibrated so the already-approved BM/Page look
// is reproduced exactly (BM/Page's prior inset was 18.67 on their DOM, i.e.
// a visible rim of CURVE_WIDTH - 18.67 = 21.33) — that pairing is the only
// one that can hold "one shared rim for every tab" and "BM/Page unchanged"
// at the same time, so it's what every tab (including VIA's right and
// Pixel's left) now targets too.
const ACTIVE_CUT_RIM = 40 - 56 / 3 // ≈ 21.33px, visible curve outside the pill
const PLACEMENT_INSET = RISE_WIDTH - ACTIVE_CUT_RIM // ≈ 18.67px, constant — NOT a function of buttonWidth

// RIGHT RECOVERY — a fixed workspace design zone, deliberately decoupled
// from every tab's own rect (button width, count, active margin cascade).
// It used to be derived from the last tab's (Pixel's) position, which meant
// it moved whenever any tab's content width changed — wrong, since a count
// badge is data, not a design input. Calibrated at 1440x900 against Page
// (the active tab closest to it, i.e. the worst case) and re-nudged after
// the 5 tabs became equal-width (81px each), which widened the whole strip:
// 380 -> 390 -> 420 -> 450. Not derived from any rect at runtime — a plain
// constant, same as LEFT_CORNER_FLAT_X etc.

// Curve B's right edge is a flat vertical run (see the width-ownership fix —
// it stops at the Curve B region's own right edge, before Function/Workflow/
// Curve C). Its top-right and bottom-right corners round off with the same
// 12px "surface" radius already used everywhere else in this UI (.ads-pro-
// asset-panel, .ads-pro-folders' non-tab corners) — the bottom-left corner
// stays a sharp path point (LOCKED, untouched) since that corner's rounded
// look on screen already comes from the folder/table panel drawn on top.
const RIGHT_CORNER_RADIUS = 12

const n = (value: number) => Math.round(value * 100) / 100

/** Rounds the top-right and bottom-right corners of the surface, given the y the path is at when it reaches the right edge (0 after a drawn recovery/rise, `cut` otherwise). LOCKED bottom-left is untouched — this only replaces the old `H(frameWidth) V(frameHeight)` straight corner. */
function buildRightCorners(frameWidth: number, frameHeight: number, topY: number, radius: number) {
  return `H${n(frameWidth - radius)} Q${n(frameWidth)} ${n(topY)} ${n(frameWidth)} ${n(topY + radius)} `
    + `V${n(frameHeight - radius)} Q${n(frameWidth)} ${n(frameHeight)} ${n(frameWidth - radius)} ${n(frameHeight)} `
}

/** RISE template: H(start) then the two verbatim production cubics, ending at (start+40, 0). LOCKED. */
function buildRise(start: number, cut: number, mid: number) {
  const shoulderX = start + 16
  const topStart = start + RISE_WIDTH
  const segment = `H${n(start)} C${n(start + 8)} ${n(cut)} ${n(shoulderX)} ${n(cut - 6)} ${n(shoulderX)} ${n(mid)} `
    + `C${n(shoulderX)} ${n(mid - 10)} ${n(shoulderX - 1)} ${n(mid - 26)} ${n(topStart)} 0 `
  return { topStart, segment }
}

/** FALL template: H(topEnd) then the two verbatim production cubics, ending at (topEnd+40, cut). LOCKED. */
function buildFall(topEnd: number, cut: number, mid: number) {
  const shoulderX = topEnd + 24
  const end = topEnd + FALL_WIDTH
  const segment = `H${n(topEnd)} C${n(topEnd + 25)} ${n(mid - 26)} ${n(shoulderX)} ${n(mid - 10)} ${n(shoulderX)} ${n(mid)} `
    + `C${n(shoulderX)} ${n(cut - 6)} ${n(shoulderX + 8)} ${n(cut)} ${n(end)} ${n(cut)} `
  return { end, segment }
}

/** RECOVERY template: production's separate single-cubic step back up to y=0 (its own fixed 48px shape). LOCKED. */
function buildRecovery(start: number, cut: number) {
  const end = start + RECOVERY_WIDTH
  const segment = `H${n(start)} C${n(start + 24)} ${n(cut)} ${n(start + 16.8)} 0 ${n(end)} 0 `
  return { end, segment }
}

/** Plateau edge anchors (frame-relative), derived purely from the button's own rect. */
function resolveAnchor(buttonRect: WorkspaceSurfaceRect) {
  const inset = Math.min(PLACEMENT_INSET, (buttonRect.right - buttonRect.left) / 2)
  return { topStart: buttonRect.left + inset, topEnd: buttonRect.right - inset }
}

/**
 * Builds the workspace "Curve B" surface path. Curvature is the fixed
 * production template above (buildRise/buildFall/buildRecovery); the only
 * dynamic input is WHERE the plateau sits (resolveAnchor, from the active
 * button's own rect), so the rise/fall move in closer without touching the
 * Bézier itself.
 */
export function buildWorkspaceSurfacePath(geometry: WorkspaceSurfaceGeometry): WorkspaceSurfaceResult {
  const { frameWidth, frameHeight, tabRowHeight, recoveryStart: recoveryAnchor, activeAnchor, isFirstActive, isLastActive } = geometry
  const cut = tabRowHeight
  const mid = cut * (28 / 44)
  const entry = cut + LEFT_ENTRY_EXTRA
  const activePlacement = resolveAnchor(activeAnchor.buttonRect)

  let d = `M0 ${n(frameHeight)} `
  let topStart: number
  let topEnd: number
  let riseStart: number

  if (isFirstActive) {
    d += `V${n(mid)} C0 0 10 0 ${LEFT_CORNER_MERGED_X} 0 `
    topStart = LEFT_CORNER_MERGED_X
    riseStart = topStart
    topEnd = Math.max(topStart, activePlacement.topEnd)
  } else {
    d += `V${n(entry)} Q5 ${n(cut)} ${LEFT_CORNER_FLAT_X} ${n(cut)} `
    topStart = activePlacement.topStart
    riseStart = topStart - RISE_WIDTH
    d += buildRise(riseStart, cut, mid).segment
    topEnd = Math.max(topStart, activePlacement.topEnd)
  }

  let fallEnd: number
  let recoveryStart = 0
  let recoveryEnd = 0
  let recoveryDrawn = false
  if (isLastActive) {
    d += buildRightCorners(frameWidth, frameHeight, 0, RIGHT_CORNER_RADIUS)
    fallEnd = topEnd
  } else {
    const fall = buildFall(topEnd, cut, mid)
    d += fall.segment
    fallEnd = fall.end

    // Never recover before the active tab's fall has completed; otherwise
    // follow the actual compact action group instead of a monitor-specific X.
    recoveryStart = Math.min(frameWidth - RECOVERY_WIDTH, Math.max(fallEnd, recoveryAnchor))
    recoveryEnd = recoveryStart + RECOVERY_WIDTH

    let topY = cut
    if (recoveryStart >= fallEnd) {
      d += buildRecovery(recoveryStart, cut).segment
      recoveryDrawn = true
      topY = 0
    }
    d += buildRightCorners(frameWidth, frameHeight, topY, RIGHT_CORNER_RADIUS)
  }

  d += `Z`

  const { buttonRect, contentRect } = activeAnchor
  const debug: WorkspaceSurfaceDebug = {
    buttonLeft: n(buttonRect.left),
    buttonRight: n(buttonRect.right),
    buttonWidth: n(buttonRect.right - buttonRect.left),
    contentLeft: n(contentRect.left),
    contentRight: n(contentRect.right),
    contentWidth: n(contentRect.right - contentRect.left),
    leftContentGap: n(contentRect.left - buttonRect.left),
    rightContentGap: n(buttonRect.right - contentRect.right),
    placementInsetLeft: n(topStart - buttonRect.left),
    placementInsetRight: n(buttonRect.right - topEnd),
    riseStart: n(riseStart),
    topStart: n(topStart),
    topEnd: n(topEnd),
    fallEnd: n(fallEnd),
    plateauWidth: n(topEnd - topStart),
    leftTransitionWidth: n(topStart - riseStart),
    rightTransitionWidth: n(fallEnd - topEnd),
    totalIslandWidth: n(fallEnd - riseStart),
    recoveryStart: recoveryDrawn ? n(recoveryStart) : null,
    recoveryEnd: n(recoveryEnd),
    recoveryDrawn,
  }

  return { path: d, debug }
}
