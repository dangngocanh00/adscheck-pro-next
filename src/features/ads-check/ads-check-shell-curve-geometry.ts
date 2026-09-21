/**
 * Canonical, pixel-local geometry for the Classic Ads Check Pro shell.
 *
 * These values were extracted from the approved 1891 x 1215 shell, but are
 * deliberately no longer rendered in that scaled coordinate system. Curve A
 * uses these fixed bend values at every desktop size; only the
 * straight runs between them are allowed to change length.
 */

// Shell outline.
export const SHELL_EDGE = 2
export const SHELL_TOP_BOTTOM_INSET = 1.4
export const SHELL_CORNER_RADIUS = 21
export const SHELL_RIGHT_CORNER_RADIUS = 24

// Curve A: top bend -> flexible vertical spine -> bottom bend.
export const CURVE_A_TOP_ENTRY_Y = 212
export const CURVE_A_TOP_BEND_END_Y = 288
export const CURVE_A_TOP_OUTER_X = 11
export const CURVE_A_TOP_SHOULDER_X = 38
export const CURVE_A_INNER_X = 52
export const CURVE_A_DEEPEST_X = 54

export const CURVE_A_BOTTOM_SPINE_END_INSET = 234
export const CURVE_A_BOTTOM_SHOULDER_INSET = 196
export const CURVE_A_BOTTOM_OUTER_INSET = 174
export const CURVE_A_BOTTOM_EDGE_INSET = 154

// The reopen controls are real UI, so their size/placement is likewise
// pixel-local rather than derived from the shell's width.
export const RAIL_TOP_PX = 127.4
export const RAIL_RIGHT_INSET_PX = 1
export const RAIL_BUTTON_WIDTH_PX = 42

export type HostShellRect = {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export function resolveRailAnchor(shellRect: HostShellRect): { top: number; left: number } {
  return {
    top: shellRect.top + RAIL_TOP_PX,
    left: shellRect.right - RAIL_RIGHT_INSET_PX - RAIL_BUTTON_WIDTH_PX,
  }
}

