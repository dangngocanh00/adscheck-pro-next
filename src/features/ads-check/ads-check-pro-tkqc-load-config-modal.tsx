import { useAppLanguage, tx, t, m } from '@/i18n'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

export type TkqcLoadSource = 'all' | 'by-tkqc-id' | 'by-bm-id'
export type TkqcLoadAccountType = 'all' | 'personal' | 'bm'
export type TkqcLoadCacheMode = 'custom' | 'unlimited'
export type TkqcLoadConfig = {
  source: TkqcLoadSource
  accountType: TkqcLoadAccountType
  ids: string
  cacheEnabled: boolean
  cacheMode: TkqcLoadCacheMode
  cacheMinutes: number
}

export const DEFAULT_TKQC_LOAD_CONFIG: TkqcLoadConfig = {
  source: 'all', accountType: 'all', ids: '', cacheEnabled: true, cacheMode: 'custom', cacheMinutes: 30,
}

// BM Round 1 Shared Rule #18/#19/#20 — BM's own "Tải BM" config is a
// SIMPLER instance of this same shape (no accountType section, only 2
// source options), not a separate type/component. `accountType` stays
// unused for BM ('all' default, never surfaced in the UI).
export type BmLoadSource = 'all' | 'by-bm-id'
export type BmLoadConfig = {
  source: BmLoadSource
  ids: string
  cacheEnabled: boolean
  cacheMode: TkqcLoadCacheMode
  cacheMinutes: number
}
export const DEFAULT_BM_LOAD_CONFIG: BmLoadConfig = {
  source: 'all', ids: '', cacheEnabled: true, cacheMode: 'custom', cacheMinutes: 30,
}

type SourceOption<S extends string> = { value: S; label: string; idListLabel?: string }

type LoadConfigModalProps<S extends string, T extends { source: S; ids: string; cacheEnabled: boolean; cacheMode: TkqcLoadCacheMode; cacheMinutes: number }> = {
  titleId: string
  title: string
  subtitle: string
  sourceOptions: SourceOption<S>[]
  // Omitted entirely for BM (Shared Rule #19: "No textarea section for
  // BM" beyond the ID-list one below) — TKQC is the only caller that
  // passes this.
  accountTypeOptions?: { value: TkqcLoadAccountType; label: string }[]
  initial: T
  onStart: (config: T) => void
  onClose: () => void
}

// SHARED — one config-modal component drives both TKQC's "Tải TK" (richer:
// has an account-type section) and BM's "Tải BM" (simpler: source + cache
// only) instead of two near-identical modals with strings swapped. Exact
// copy/flow for TKQC is the user's own verbatim spec text (no production
// trace needed for the strings/structure themselves); BM's copy is the
// user's own supplied production screenshot text. Only the "Vừa xong"
// reset timing (see the toolbar's load-state wiring) had no recoverable
// evidence for either asset.
function AdsProLoadConfigModal<S extends string, T extends { source: S; ids: string; cacheEnabled: boolean; cacheMode: TkqcLoadCacheMode; cacheMinutes: number }>({
  titleId, title, subtitle, sourceOptions, accountTypeOptions, initial, onStart, onClose,
}: LoadConfigModalProps<S, T>) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const [source, setSource] = useState<S>(initial.source)
  const [accountType, setAccountType] = useState<TkqcLoadAccountType>('all')
  const [ids, setIds] = useState(initial.ids)
  const [cacheEnabled, setCacheEnabled] = useState(initial.cacheEnabled)
  const [cacheMode, setCacheMode] = useState<TkqcLoadCacheMode>(initial.cacheMode)
  const [cacheMinutes, setCacheMinutes] = useState(initial.cacheMinutes)

  const idListLabel = sourceOptions.find((option) => option.value === source)?.idListLabel ?? null

  const handleStart = () => onStart({
    ...initial,
    source,
    ...(accountTypeOptions ? { accountType } : {}),
    ids, cacheEnabled, cacheMode, cacheMinutes,
  } as T)

  return createPortal(
    // CATEGORY B important modal (shared by BOTH TKQC's and BM's "Tải …"
    // config) — backdrop click must NOT dismiss and lose the in-progress
    // source/ID-list/cache selections (Shared Resource/Modal UX
    // correction); dismissOnBackdrop intentionally omitted.
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-tkqc-load-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header>
          <Download size={16} className="ads-advanced-filter-icon" aria-hidden="true" />
          <h2 id={titleId}>{tx(title)}</h2>
          <button type="button" className="ads-advanced-filter-close" aria-label={t("ui.f11143b04a")} onClick={onClose} data-autofocus><X size={16} /></button>
        </header>
        <p className="ads-tkqc-load-subtitle">{tx(subtitle)}</p>

        <label className="ads-tkqc-load-field">
          <span>{t("ui.eb65372c39")}</span>
          <select aria-label={t("ui.eb65372c39")} value={source} onChange={(event) => setSource(event.target.value as S)}>
            {sourceOptions.map((option) => <option key={option.value} value={option.value}>{tx(option.label)}</option>)}
          </select>
        </label>

        {accountTypeOptions && <label className="ads-tkqc-load-field">
          <span>{t("ui.1d038b4e10")}</span>
          <select aria-label={t("ui.1d038b4e10")} value={accountType} onChange={(event) => setAccountType(event.target.value as TkqcLoadAccountType)}>
            {accountTypeOptions.map((option) => <option key={option.value} value={option.value}>{tx(option.label)}</option>)}
          </select>
        </label>}

        {idListLabel && <label className="ads-tkqc-load-field">
          <span>{tx(idListLabel)}</span>
          <textarea aria-label={tx(idListLabel)} value={ids} onChange={(event) => setIds(event.target.value)} placeholder={t("ui.db464544e3")} rows={4} />
        </label>}

        <div className="ads-tkqc-load-cache">
          <div className="ads-tkqc-load-cache-head">
            <div>
              <strong>{t("ui.16c826f1e0")}</strong>
              <p>{t("ui.4c732485e0")}</p>
            </div>
            <label className="ads-tkqc-load-switch">
              <input type="checkbox" checked={cacheEnabled} onChange={(event) => setCacheEnabled(event.target.checked)} aria-label={t("ui.b4e17bcd18")} />
              <span />
            </label>
          </div>
          <div className={`ads-tkqc-load-cache-options${cacheEnabled ? '' : ' is-disabled'}`}>
            <label className="ads-tkqc-load-radio">
              <input type="radio" name={`${titleId}-cache-mode`} checked={cacheMode === 'custom'} disabled={!cacheEnabled} onChange={() => setCacheMode('custom')} />
              <span>{t("ui.60e46f4585")}</span>
              <span className="ads-tkqc-load-cache-input">
                <input type="number" min={1} value={cacheMinutes} disabled={!cacheEnabled || cacheMode !== 'custom'} onChange={(event) => setCacheMinutes(Math.max(1, Number(event.target.value) || 1))} aria-label={t("ui.40d999f76f")} />
                <span>{t("ui.e5d923aa58")}</span>
              </span>
            </label>
            <label className="ads-tkqc-load-radio">
              <input type="radio" name={`${titleId}-cache-mode`} checked={cacheMode === 'unlimited'} disabled={!cacheEnabled} onChange={() => setCacheMode('unlimited')} />
              <span>{t("ui.dee99493be")}</span>
            </label>
          </div>
        </div>

        <footer>
          <button type="button" className="is-secondary" onClick={onClose}>{t("ui.34ca764caf")}</button>
          <button type="button" className="is-primary" onClick={handleStart}>{t("ui.e4523dcdf5")}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

const TKQC_SOURCE_OPTIONS: SourceOption<TkqcLoadSource>[] = [
  { value: 'all', label: m("ui.bee7832170") },
  { value: 'by-tkqc-id', label: 'Theo ID TKQC', idListLabel: m("ui.64433706b7") },
  { value: 'by-bm-id', label: 'Theo ID BM', idListLabel: m("ui.4a42964a02") },
]
const TKQC_ACCOUNT_TYPE_OPTIONS = [
  { value: 'all' as const, label: m("ui.f7a578dcbd") },
  { value: 'personal' as const, label: m("ui.b8a7951b65") },
  { value: 'bm' as const, label: 'BM' },
]

type TkqcLoadConfigModalProps = { initial: TkqcLoadConfig; onStart: (config: TkqcLoadConfig) => void; onClose: () => void }

export function AdsProTkqcLoadConfigModal({ initial, onStart, onClose }: TkqcLoadConfigModalProps) {
  useAppLanguage();
  return <AdsProLoadConfigModal
    titleId="ads-tkqc-load-title"
    title={t("ui.39e560b1c5")}
    subtitle="Chọn nguồn tải và các nhóm dữ liệu cần thiết để lấy thông tin danh sách tài khoản."
    sourceOptions={TKQC_SOURCE_OPTIONS}
    accountTypeOptions={TKQC_ACCOUNT_TYPE_OPTIONS}
    initial={initial}
    onStart={onStart}
    onClose={onClose}
  />
}

// BM Round 1 Part 19 — exact copy from the user's supplied production
// screenshot: no accountType section, only 2 source options, ID-list label
// reads "Danh sách BM ID" (note: different word order from TKQC's own
// pre-existing "Danh sách ID BM" — both are kept verbatim as given, not
// unified into one string).
const BM_SOURCE_OPTIONS: SourceOption<BmLoadSource>[] = [
  { value: 'all', label: m("ui.bb5096f152") },
  { value: 'by-bm-id', label: m("ui.82e22d3471"), idListLabel: m("ui.3aa3ed0045") },
]

type BmLoadConfigModalProps = { initial: BmLoadConfig; onStart: (config: BmLoadConfig) => void; onClose: () => void }

export function AdsProBmLoadConfigModal({ initial, onStart, onClose }: BmLoadConfigModalProps) {
  useAppLanguage();
  return <AdsProLoadConfigModal
    titleId="ads-bm-load-title"
    title={t("ui.6314470c2c")}
    subtitle="Chọn nguồn BM và nhóm dữ liệu cần thiết để lấy thông tin danh sách tài khoản."
    sourceOptions={BM_SOURCE_OPTIONS}
    initial={initial}
    onStart={onStart}
    onClose={onClose}
  />
}

// Page Round 1 Part #9 — 4 source options (traced production i18n key
// paths: sourceOptions.all/mine/byBmId/byPageId), distinct id-list labels
// per ID-based mode ("Danh sách ID BM" vs "Danh sách ID Page" — NOT reused
// across modes). Reuses the exact same shared modal/cache architecture as
// TKQC/BM instead of a bespoke Page modal.
export type PageLoadSource = 'all' | 'mine' | 'by-bm-id' | 'by-page-id'
export type PageLoadConfig = {
  source: PageLoadSource
  ids: string
  cacheEnabled: boolean
  cacheMode: TkqcLoadCacheMode
  cacheMinutes: number
}
// Page #9 Cache — traced production screenshot shows "Không thời hạn"
// selected by default (unlike TKQC/BM's own already-approved 'custom'
// default, which this does not retroactively change).
export const DEFAULT_PAGE_LOAD_CONFIG: PageLoadConfig = {
  source: 'all', ids: '', cacheEnabled: true, cacheMode: 'unlimited', cacheMinutes: 30,
}

const PAGE_SOURCE_OPTIONS: SourceOption<PageLoadSource>[] = [
  { value: 'all', label: m("ui.bee7832170") },
  { value: 'mine', label: m("ui.51d289eec3") },
  { value: 'by-bm-id', label: 'Theo ID BM', idListLabel: m("ui.4a42964a02") },
  { value: 'by-page-id', label: 'Theo ID Page', idListLabel: m("ui.9e7c1b61eb") },
]

type PageLoadConfigModalProps = { initial: PageLoadConfig; onStart: (config: PageLoadConfig) => void; onClose: () => void }

export function AdsProPageLoadConfigModal({ initial, onStart, onClose }: PageLoadConfigModalProps) {
  useAppLanguage();
  return <AdsProLoadConfigModal
    titleId="ads-page-load-title"
    title={t("ui.f81be9b86e")}
    subtitle="Chọn nguồn Page và nhóm dữ liệu cần thiết để lấy thông tin danh sách page."
    sourceOptions={PAGE_SOURCE_OPTIONS}
    initial={initial}
    onStart={onStart}
    onClose={onClose}
  />
}

// Pixel #4 — 2 source options, own distinct ID-list wording ("Nhập danh
// sách BM ID" — NOT BM's own "Danh sách BM ID"), cache defaults to
// "Không thời hạn" like Page's own (independent constant, not shared/
// mutated with TKQC/BM/Page's own defaults). Reuses the exact same shared
// modal/cache architecture — no independent Pixel-only modal framework.
export type PixelLoadSource = 'all' | 'by-bm-id'
export type PixelLoadConfig = {
  source: PixelLoadSource
  ids: string
  cacheEnabled: boolean
  cacheMode: TkqcLoadCacheMode
  cacheMinutes: number
}
export const DEFAULT_PIXEL_LOAD_CONFIG: PixelLoadConfig = {
  source: 'all', ids: '', cacheEnabled: true, cacheMode: 'unlimited', cacheMinutes: 30,
}

const PIXEL_SOURCE_OPTIONS: SourceOption<PixelLoadSource>[] = [
  { value: 'all', label: m("ui.2121adb912") },
  { value: 'by-bm-id', label: m("ui.3aa3ed0045"), idListLabel: m("ui.d3871104b0") },
]

type PixelLoadConfigModalProps = { initial: PixelLoadConfig; onStart: (config: PixelLoadConfig) => void; onClose: () => void }

export function AdsProPixelLoadConfigModal({ initial, onStart, onClose }: PixelLoadConfigModalProps) {
  useAppLanguage();
  return <AdsProLoadConfigModal
    titleId="ads-pixel-load-title"
    title={t("ui.a1d88934eb")}
    subtitle="Chọn nguồn BM để tải pixel."
    sourceOptions={PIXEL_SOURCE_OPTIONS}
    initial={initial}
    onStart={onStart}
    onClose={onClose}
  />
}
