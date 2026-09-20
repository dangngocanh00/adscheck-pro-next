import { useEffect, useState } from 'react'

// VIA Audit Batch 1 Part D — traced production (references/remotes/
// adaccounts/436.e5c83aa9.js): ONE shared reactive settings object used by
// every asset tab's table (a single module-level ref, `useDisplaySettings()`
// called from 7+ places, all sharing the same instance) — never a per-tab
// copy. Same localStorage key confirmed: "adaccounts.display-settings.v1",
// deep-persisted on every change, applied live with no Save/Cancel step
// (production's own settings panel has no save button either).
export type UiSurface = 'default' | 'white'
export type UiGridLines = 'default' | 'bordered'
export type UiFontSize = 'default' | '14' | '16'
export type UiFontWeight = 'default' | 'medium'
export type UiRowSpacing = 'default' | '54' | '58'
export type UiDecimalSeparator = 'default' | 'dot'

export type UiSettings = {
  surface: UiSurface
  gridLines: UiGridLines
  fontSize: UiFontSize
  fontWeight: UiFontWeight
  rowSpacing: UiRowSpacing
  decimalSeparator: UiDecimalSeparator
}

// Traced production's OWN literal defaults are surface:"default" (dark
// aurora showing through) and gridLines:"default" (NO border at all). This
// clone deliberately keeps `gridLines: 'bordered'` as its OWN starting
// default instead — every screen already built and approved across every
// prior round assumed the always-visible subtle row border, and silently
// switching the baseline to borderless would visually regress dozens of
// already-signed-off screenshots with no request to do so. Both options
// remain fully toggleable either way; only the clone's initial pick
// diverges from the traced production default. Documented explicitly here
// and in the batch report.
export const DEFAULT_UI_SETTINGS: UiSettings = {
  surface: 'default',
  gridLines: 'bordered',
  fontSize: 'default',
  fontWeight: 'default',
  rowSpacing: 'default',
  decimalSeparator: 'default',
}

const STORAGE_KEY = 'adaccounts.display-settings.v1'
const VALID: { [K in keyof UiSettings]: UiSettings[K][] } = {
  surface: ['default', 'white'],
  gridLines: ['default', 'bordered'],
  fontSize: ['default', '14', '16'],
  fontWeight: ['default', 'medium'],
  rowSpacing: ['default', '54', '58'],
  decimalSeparator: ['default', 'dot'],
}

function loadUiSettings(): UiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_UI_SETTINGS
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return DEFAULT_UI_SETTINGS
    const candidate = parsed as Partial<UiSettings>
    const result = { ...DEFAULT_UI_SETTINGS }
    for (const key of Object.keys(VALID) as (keyof UiSettings)[]) {
      const value = candidate[key]
      if (value !== undefined && (VALID[key] as string[]).includes(value)) (result as Record<string, string>)[key] = value
    }
    return result
  } catch {
    return DEFAULT_UI_SETTINGS
  }
}

export function useUiSettings() {
  const [settings, setSettings] = useState<UiSettings>(loadUiSettings)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch { /* storage unavailable */ }
  }, [settings])
  const setSetting = <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => setSettings((current) => ({ ...current, [key]: value }))
  return { settings, setSetting }
}

// Font size / row height literal px values (Part D7/D9) — the clone applies
// these directly rather than reproducing production's Tailwind
// utility-class + --ac-font-scale multiplier mechanism, since this
// codebase has no equivalent utility-class layer; the OUTPUT numbers are
// identical either way (13/14/16, 50/54/58).
export const FONT_SIZE_PX: Record<UiFontSize, number> = { default: 13, '14': 14, '16': 16 }
export const ROW_HEIGHT_PX: Record<UiRowSpacing, number> = { default: 50, '54': 54, '58': 58 }
// Traced exact production values (--ac-weight-400/500/600, "medium" shifts
// each by +100).
export const FONT_WEIGHT_NORMAL: Record<UiFontWeight, number> = { default: 400, medium: 500 }
export const FONT_WEIGHT_MEDIUM: Record<UiFontWeight, number> = { default: 500, medium: 600 }
export const FONT_WEIGHT_SEMIBOLD: Record<UiFontWeight, number> = { default: 600, medium: 700 }

// VIA Audit Batch 1 Part D5/D6/D7/D9 — one small set of data-attributes on
// the table's OWN shell (never `<html>`/the app root, unlike production's
// broader document-level attributes) so the effect stays scoped to just
// the data table surface, per this batch's explicit constraint.
export function uiSettingsDataAttrs(settings: UiSettings): Record<string, string> {
  return {
    'data-ac-surface': settings.surface,
    'data-ac-grid-lines': settings.gridLines,
    'data-ac-font-size': settings.fontSize,
    'data-ac-font-weight': settings.fontWeight,
    'data-ac-row-spacing': settings.rowSpacing,
  }
}

// Part D10 — only ever called on confirmed numeric BUSINESS values
// (dataType 'number'/'currency'), never id-like fields, matching traced
// production's explicit `field !== idField && field !== "id"` guard (this
// clone's equivalent guard is simply: callers only ever pass a value for a
// column already typed 'number'/'currency', which excludes every id/UID/
// string column by construction — see each table's columnDataType()).
export function formatUiNumber(value: number, mode: UiDecimalSeparator): string {
  // Ground truth = the user's own screenshot examples (production's code
  // had a confirmed label/behavior inversion — see VIA Audit Batch 1 report
  // Part 30): "Dấu phẩy (1,234.56)" = comma thousands + dot decimal (US
  // style) is the DEFAULT; "Dấu chấm (1.234,56)" = dot thousands + comma
  // decimal (VN/EU style, native Intl("vi-VN") output) is "dot".
  if (mode === 'dot') return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
