import { m, useAppLanguage, t, tx } from '@/i18n'
import { useLayoutEffect, useMemo, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { BarChart3, Bookmark, Check, Clock, Gauge, Globe2, Layers, Megaphone, MessageCircle, Plus, Search, Settings, ThumbsUp, Video, X, type LucideIcon } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from '@/features/ads-check/ads-check-pro-modal-backdrop'
import { tkqcRowFixtures } from '@/features/ads-check/ads-check-pro-tkqc-data'
import {
  buildDemoTkqcAccount, createDefaultStep1Config, createDefaultStep2Config, createTimeSlot,
  isValidTkqcIdLine, parseTkqcIdLines, isStep1ConfigValid, isStep2ConfigValid, HOURS, MINUTES, DEMO_TKQC_STATUS,
  type AdsSaveAssetLoadMode, type AdsSaveConfiguration, type AdsSaveDownloadTarget,
  type AdsSaveMetricType, type AdsSaveStep1Config, type AdsSaveStep2Config,
} from './ads-save-create-config-data'

type AdsSaveCreateConfigModalProps = {
  // 'edit' prefills Step 1 + Step 2 from `initialConfiguration` and its
  // submit UPDATES that same configuration instead of creating a new one
  // — the SAME modal/workflow as 'create', never a second editor.
  mode: 'create' | 'edit'
  initialConfiguration?: AdsSaveConfiguration
  onClose: () => void
  onSubmit: (configuration: AdsSaveConfiguration) => void
}

const DOWNLOAD_TARGETS: { value: AdsSaveDownloadTarget; label: string; icon: LucideIcon }[] = [
  { value: 'campaign', label: m("ui.ebf5469ebd"), icon: Megaphone },
  { value: 'ad-set', label: m("ui.ef24a58a7e"), icon: Layers },
]

const METRIC_TYPES: { value: AdsSaveMetricType; label: string; icon: LucideIcon }[] = [
  { value: 'performance', label: m("ui.68d57674c5"), icon: Gauge },
  { value: 'engagement', label: m("ui.3e31e097a1"), icon: ThumbsUp },
  { value: 'traffic', label: m("ui.788f94d34e"), icon: Globe2 },
  { value: 'message-engagement', label: m("ui.e164590cc8"), icon: MessageCircle },
  { value: 'video', label: 'Video', icon: Video },
]

// Same "active/restricted/disabled/pending" status semantics + colors
// already established for TKQC rows in Ads Check Pro (see
// ads-check-adaccounts-tkqc-table.css's `.ads-pro-status` rules) — copied
// as plain color values here (not the shared class itself) so this new
// Ads Save panel never couples to / risks regressing that module's CSS.
const STATUS_DOT_COLOR: Record<string, string> = {
  active: '#10c12e',
  restricted: '#ec5161',
  disabled: '#b7c4b9',
  pending: '#e0a72f',
  // LOCAL DEMO FALLBACK rows use the same existing neutral/disabled color
  // — never a randomly-assigned Live/Die/restricted color, since there is
  // no real account health to report for a synthesized row.
  [DEMO_TKQC_STATUS]: '#b7c4b9',
}

// Step 1 ("Cài đặt cấu hình") and Step 2 ("Chọn tài sản") of the SAME
// modal/workflow — one component, one continuous state, switched by
// `step`, never two independent modals.
export const AdsSaveCreateConfigModal: FC<AdsSaveCreateConfigModalProps> = ({ mode, initialConfiguration, onClose, onSubmit }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const [step, setStep] = useState<1 | 2>(1)
  // `initialConfiguration` (a full AdsSaveConfiguration) structurally
  // satisfies both AdsSaveStep1Config and AdsSaveStep2Config, so it seeds
  // BOTH pieces of state directly — no separate "extract step 1/2 fields"
  // step needed.
  const [config, setConfig] = useState<AdsSaveStep1Config>(() => initialConfiguration ?? createDefaultStep1Config())
  const [step2, setStep2] = useState<AdsSaveStep2Config>(() => initialConfiguration ?? createDefaultStep2Config())
  const [search, setSearch] = useState('')

  // Correction — Step 2's content must never resize the modal based on
  // TKQC row count. Step 1's own naturally-rendered body height (measured
  // once, right after its first paint) becomes the fixed reference both
  // steps use from then on, rather than guessing a hardcoded px value —
  // Step 2 (and any later revisit of Step 1) locks to that exact height,
  // and only the account-list region inside Step 2 scrolls internally.
  const bodyRef = useRef<HTMLDivElement>(null)
  const [bodyHeight, setBodyHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (bodyHeight === null && bodyRef.current) setBodyHeight(bodyRef.current.getBoundingClientRect().height)
  }, [bodyHeight])
  const bodyStyle = bodyHeight !== null ? { height: bodyHeight, flex: 'none' as const } : undefined

  const update = <K extends keyof AdsSaveStep1Config>(key: K, value: AdsSaveStep1Config[K]) =>
    setConfig((current) => ({ ...current, [key]: value }))
  const updateSlot = (id: string, patch: Partial<Pick<AdsSaveStep1Config['timeSlots'][number], 'hour' | 'minute'>>) =>
    setConfig((current) => ({ ...current, timeSlots: current.timeSlots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)) }))
  const removeSlot = (id: string) =>
    setConfig((current) => ({ ...current, timeSlots: current.timeSlots.filter((slot) => slot.id !== id) }))
  const addSlot = () =>
    setConfig((current) => ({ ...current, timeSlots: [...current.timeSlots, createTimeSlot()] }))
  // Correction — checkbox/multi-select: toggles ONE target independently,
  // never clears the other (no radio-style mutual exclusion).
  const toggleDownloadTarget = (value: AdsSaveDownloadTarget) =>
    setConfig((current) => ({
      ...current,
      downloadTargets: current.downloadTargets.includes(value)
        ? current.downloadTargets.filter((target) => target !== value)
        : [...current.downloadTargets, value],
    }))

  const setAssetLoadMode = (mode: AdsSaveAssetLoadMode) => setStep2((current) => ({ ...current, assetLoadMode: mode }))
  const toggleAccount = (id: string) =>
    setStep2((current) => ({
      ...current,
      selectedAccountIds: current.selectedAccountIds.includes(id)
        ? current.selectedAccountIds.filter((accountId) => accountId !== id)
        : [...current.selectedAccountIds, id],
    }))
  // Same toggle-all semantics already used by every Ads Check Pro asset
  // table's header checkbox (see onToggleAll/toggleAll in
  // ads-check-adaccounts-workspace.tsx): if every currently-visible row is
  // already selected, deselect just those; otherwise select all of them
  // (existing selections outside the current filter are left untouched).
  const toggleSelectAllVisible = (ids: string[]) =>
    setStep2((current) => ({
      ...current,
      selectedAccountIds: ids.length > 0 && ids.every((id) => current.selectedAccountIds.includes(id))
        ? current.selectedAccountIds.filter((id) => !ids.includes(id))
        : [...new Set([...current.selectedAccountIds, ...ids])],
    }))

  // "Chọn tất cả" real underlying accounts come from the SAME TKQC demo
  // fixtures already powering the Ads Check Pro TKQC table — no second,
  // Ads-Save-only account dataset invented.
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tkqcRowFixtures
    return tkqcRowFixtures.filter((row) => row.name.toLowerCase().includes(query) || row.accountId.toLowerCase().includes(query))
  }, [search])

  // "Tải theo ID TKQC" — tries the SAME real data source first (match on
  // `accountId`, the production-visible TKQC ID); only IDs with no real
  // match fall back to a LOCAL DEMO row (Part 12: isolated in
  // buildDemoTkqcAccount, never a real Meta API response) so the full
  // Step-2 UI/selection flow stays manually testable even though this
  // clone has no real Meta account-lookup API. Invalid lines (fail
  // isValidTkqcIdLine) never become a row, real or demo.
  const parsedByIdCount = useMemo(() => parseTkqcIdLines(step2.byIdInput).length, [step2.byIdInput])
  const handleLoadByIdList = () => {
    const ids = parseTkqcIdLines(step2.byIdInput).filter(isValidTkqcIdLine)
    const resolved = ids.map((id, index) => {
      const realMatch = tkqcRowFixtures.find((row) => row.accountId === id)
      return realMatch
        ? { id: realMatch.id, name: realMatch.name, accountId: realMatch.accountId, status: realMatch.status as string }
        : buildDemoTkqcAccount(id, index)
    })
    // Replaces the previous result set entirely — never appended.
    setStep2((current) => ({ ...current, resolvedByIdAccounts: resolved }))
  }

  // Both modes share this exact result-row/selection block below — only
  // which underlying row list feeds it differs.
  const activeRows = step2.assetLoadMode === 'all' ? filteredRows : step2.resolvedByIdAccounts
  const activeTotal = step2.assetLoadMode === 'all' ? tkqcRowFixtures.length : step2.resolvedByIdAccounts.length
  const activeVisibleIds = activeRows.map((row) => row.id)
  const allVisibleSelected = activeVisibleIds.length > 0 && activeVisibleIds.every((id) => step2.selectedAccountIds.includes(id))

  const step1Valid = isStep1ConfigValid(config)
  const step2Valid = isStep2ConfigValid(step2)
  const handleContinue = () => { if (step1Valid) setStep(2) }
  const handleBack = () => setStep(1)
  // No real backend/save endpoint exists anywhere in this project for Ads
  // Save configurations yet — the combined Step 1 + Step 2 object is built
  // correctly here and handed to the caller, which is honest about there
  // being no remote persistence rather than claiming a successful save.
  // The caller (ads-save-page.tsx) decides whether this appends a new
  // configuration or updates the one being edited, based on `mode`.
  const handleSubmit = () => {
    if (!step1Valid || !step2Valid) return
    onSubmit({ ...config, ...step2 })
  }

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-save-create-modal" role="dialog" aria-modal="true" aria-labelledby="ads-save-create-title">
        <header className="ads-save-create-header">
          <span className="ads-save-create-header-icon" aria-hidden="true"><Bookmark size={15} /></span>
          <h2 id="ads-save-create-title">{tx(mode === 'edit' ? m("ui.76a77ec294") : m("ui.ae3f2f47f7"))}</h2>
          <button type="button" className="ads-save-create-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose} data-autofocus><X size={16} /></button>
        </header>

        <div className="ads-save-create-stepper">
          <div className={`ads-save-create-step${step === 1 ? ' is-active' : ' is-done'}`}>
            <span className="ads-save-create-step-circle">{step === 1 ? '1' : <Check size={12} />}</span>
            <span className="ads-save-create-step-label">{t("ui.e9a9be0a04")}</span>
          </div>
          <span className="ads-save-create-step-connector" aria-hidden="true">»</span>
          <div className={`ads-save-create-step${step === 2 ? ' is-active' : ''}`}>
            <span className="ads-save-create-step-circle">2</span>
            <span className="ads-save-create-step-label">{t("ui.abb0be6aa7")}</span>
          </div>
        </div>

        {tx(step === 1 ? (
          <div className="ads-save-create-body" ref={bodyRef} style={bodyStyle}>
            <section className="ads-save-create-card">
              <header><Settings size={15} aria-hidden="true" /><h3>{t("ui.b1a41a8183")}</h3></header>
              <label className="ads-save-create-field">
                <span>{t("ui.214b69bd4b")}</span>
                <input type="text" value={config.configurationName} onChange={(event) => update('configurationName', event.target.value)} placeholder={t("ui.c082aee84c")} />
              </label>
              <div className="ads-save-create-field">
                <span>{t("ui.849436b922")}</span>
                <div className="ads-save-create-toggle-row" role="radiogroup" aria-label={t("ui.849436b922")}>
                  <label className={config.accountDataRange === 'lifetime' ? 'is-selected' : ''}>
                    <input type="radio" name="ads-save-data-range" checked={config.accountDataRange === 'lifetime'} onChange={() => update('accountDataRange', 'lifetime')} />
                    <span>{t("ui.df69af403e")}</span>
                  </label>
                  <label className={config.accountDataRange === 'today' ? 'is-selected' : ''}>
                    <input type="radio" name="ads-save-data-range" checked={config.accountDataRange === 'today'} onChange={() => update('accountDataRange', 'today')} />
                    <span>{t("ui.0048b6a408")}</span>
                  </label>
                </div>
              </div>
            </section>

            <section className="ads-save-create-card">
              <header><BarChart3 size={15} aria-hidden="true" /><h3>{t("ui.8cc2f3b420")}</h3></header>
              <div className="ads-save-create-field">
                <span>{t("ui.e59767a8a3")}</span>
                <div className="ads-save-create-option-list" role="group" aria-label={t("ui.e59767a8a3")}>
                  {DOWNLOAD_TARGETS.map(({ value, label, icon: Icon }) => (
                    <label key={value} className={`ads-save-create-option${config.downloadTargets.includes(value) ? ' is-selected' : ''}`}>
                      <Icon size={15} aria-hidden="true" /><span>{tx(label)}</span>
                      <input type="checkbox" checked={config.downloadTargets.includes(value)} onChange={() => toggleDownloadTarget(value)} />
                    </label>
                  ))}
                </div>
              </div>
              <div className="ads-save-create-field">
                <span>{t("ui.5200ed317f")}</span>
                <div className="ads-save-create-metric-grid" role="radiogroup" aria-label={t("ui.5200ed317f")}>
                  {METRIC_TYPES.map(({ value, label, icon: Icon }) => (
                    <label key={value} className={`ads-save-create-option${config.metricType === value ? ' is-selected' : ''}`}>
                      <Icon size={15} aria-hidden="true" /><span>{tx(label)}</span>
                      <input type="radio" name="ads-save-metric-type" checked={config.metricType === value} onChange={() => update('metricType', value)} />
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="ads-save-create-card">
              <header><Clock size={15} aria-hidden="true" /><h3>{t("ui.165b940e09")}</h3></header>
              <div className="ads-save-create-toggle-row" role="radiogroup" aria-label={t("ui.ad2ac36036")}>
                <label className={config.scheduleMode === 'fixed' ? 'is-selected' : ''}>
                  <input type="radio" name="ads-save-schedule-mode" checked={config.scheduleMode === 'fixed'} onChange={() => update('scheduleMode', 'fixed')} />
                  <span>{t("ui.d7ab00811f")}</span>
                </label>
                <label className={config.scheduleMode === 'recurring' ? 'is-selected' : ''}>
                  <input type="radio" name="ads-save-schedule-mode" checked={config.scheduleMode === 'recurring'} onChange={() => update('scheduleMode', 'recurring')} />
                  <span>{t("ui.890254c2d2")}</span>
                </label>
              </div>

              {config.scheduleMode === 'fixed' ? (
                <div className="ads-save-create-schedule">
                  <p>{t("ui.3282262f42")}</p>
                  <div className="ads-save-create-slots">
                    {config.timeSlots.map((slot) => (
                      <div className="ads-save-create-slot" key={slot.id}>
                        <select aria-label={t("ui.75f92388b1")} value={slot.hour} onChange={(event) => updateSlot(slot.id, { hour: Number(event.target.value) })}>
                          {HOURS.map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>)}
                        </select>
                        <select aria-label={t("ui.34ca51a42a")} value={slot.minute} onChange={(event) => updateSlot(slot.id, { minute: Number(event.target.value) })}>
                          {MINUTES.map((minute) => <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>)}
                        </select>
                        <button type="button" className="ads-save-create-slot-remove" aria-label={t("ui.a4c6b1afd4")} onClick={() => removeSlot(slot.id)}><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="ads-save-create-add-slot" onClick={addSlot}><Plus size={13} />{t("ui.6eb5b6a119")}</button>
                </div>
              ) : (
                <div className="ads-save-create-schedule">
                  <p>{t("ui.0ea155b7ef")}</p>
                  <div className="ads-save-create-repeat">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      aria-label={t("ui.5a69f915a7")}
                      value={config.repeatIntervalMinutes}
                      onChange={(event) => update('repeatIntervalMinutes', event.target.value)}
                    />
                    <span>{t("ui.e5d923aa58")}</span>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="ads-save-create-body" style={bodyStyle}>
            <section className="ads-save-create-panel">
              <div className="ads-save-create-toggle-row">
                <label className={step2.assetLoadMode === 'all' ? 'is-selected' : ''}>
                  <input type="radio" name="ads-save-asset-load-mode" checked={step2.assetLoadMode === 'all'} onChange={() => setAssetLoadMode('all')} />
                  <span>{t("ui.407242238a")}</span>
                </label>
                <label className={step2.assetLoadMode === 'by-id' ? 'is-selected' : ''}>
                  <input type="radio" name="ads-save-asset-load-mode" checked={step2.assetLoadMode === 'by-id'} onChange={() => setAssetLoadMode('by-id')} />
                  <span>{t("ui.b3a06d4c4f")}</span>
                </label>
              </div>

              {step2.assetLoadMode === 'all' ? (
                <label className="ads-save-create-search">
                  <Search size={14} aria-hidden="true" />
                  <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("ui.6671928637")} aria-label={t("ui.9a66159d34")} />
                </label>
              ) : (
                <>
                  <textarea
                    className="ads-save-create-id-textarea"
                    value={step2.byIdInput}
                    onChange={(event) => setStep2((current) => ({ ...current, byIdInput: event.target.value }))}
                    placeholder={t("ui.7b63b23584")}
                    aria-label={t("ui.8845e99c0f")}
                    rows={4}
                  />
                  <button type="button" className="ads-save-create-load-list" disabled={parsedByIdCount === 0} onClick={handleLoadByIdList}>{t("ui.baa4ee607c")}</button>
                </>
              )}

              <div className="ads-save-create-result-row">
                <span>{t("ui.7249574ac5")}{" "}<b>{activeVisibleIds.length}/{activeTotal}</b></span>
                <button type="button" className="ads-save-create-select-all" onClick={() => toggleSelectAllVisible(activeVisibleIds)}>
                  {tx(allVisibleSelected ? m("ui.c1aecfa1f9") : m("ui.d14d3f05e9"))}
                </button>
              </div>

              <div className="ads-save-create-account-list">
                {tx(activeRows.map((row) => (
                  <label key={row.id} className={`ads-save-create-account-row${step2.selectedAccountIds.includes(row.id) ? ' is-selected' : ''}`}>
                    <i className="ads-save-create-account-dot" style={{ background: STATUS_DOT_COLOR[row.status] }} aria-hidden="true" />
                    <span className="ads-save-create-account-identity">
                      <strong>{row.name}</strong>
                      <small>{row.accountId}</small>
                    </span>
                    <input type="checkbox" aria-label={tx(m("ui.84da3235c3", { 0: row.name }))} checked={step2.selectedAccountIds.includes(row.id)} onChange={() => toggleAccount(row.id)} />
                  </label>
                )))}
                {tx(activeRows.length === 0 && (
                  <p className="ads-save-create-account-empty">{t("ui.6f7977db2a")}</p>
                ))}
              </div>
            </section>
          </div>
        ))}

        <footer className="ads-save-create-footer">
          {tx(step === 1 ? (
            <>
              <button type="button" className="is-secondary" onClick={onClose}>{t("ui.d2b73ab2ad")}</button>
              <button type="button" className="is-primary" disabled={!step1Valid} onClick={handleContinue}>{t("ui.5d92d0921f")}</button>
            </>
          ) : (
            <>
              <button type="button" className="is-secondary" onClick={handleBack}>{t("ui.b5362b9757")}</button>
              <button type="button" className="is-primary" disabled={!step2Valid} onClick={handleSubmit}>{tx(mode === 'edit' ? m("ui.c05f72bd8c") : m("ui.fb6ffddda1"))}</button>
            </>
          ))}
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsSaveCreateConfigModal
