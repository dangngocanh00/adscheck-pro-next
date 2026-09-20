import { useAppLanguage, tx, t } from '@/i18n'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Settings, X } from 'lucide-react'
import type { UiSettings } from './ads-check-pro-ui-settings'

type UiSettingsPanelProps = {
  anchorRect: DOMRect
  settings: UiSettings
  onChange: <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => void
  onClose: () => void
}

const PANEL_WIDTH = 300

function OptionRow<V extends string>({ label, value, current, onSelect }: { label: string; value: V; current: V; onSelect: (value: V) => void }) {
  useAppLanguage();
  const selected = value === current
  return <button type="button" className={`ads-ui-settings-row${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => onSelect(value)}>
    <span>{tx(label)}</span>
    {selected && <Check size={14} aria-hidden="true" />}
  </button>
}

// VIA Audit Batch 1 Part D — "Cài đặt giao diện" panel, an inline/floating
// popover under the "Aa" toolbar trigger (never a centered modal), applying
// LIVE on every click (traced: no Save/Cancel step — matches the
// screenshot's own lack of a save button). ONE shared settings object
// across all 5 asset tabs (Part D2/D12), persisted the same way the real
// app does (see ads-check-pro-ui-settings.ts header). Exact Vietnamese
// group/option labels are the user's own production screenshot text — the
// bundle only reveals i18n key paths for this panel, not their values.
export function AdsProUiSettingsPanel({ anchorRect, settings, onChange, onClose }: UiSettingsPanelProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos] = useState(() => {
    const left = Math.min(anchorRect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8)
    return { top: anchorRect.bottom + 6, left: Math.max(8, left) }
  })

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return
      onClose()
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return createPortal(
    <div ref={panelRef} className="ads-ui-settings-panel" role="dialog" aria-label={t("ui.46d56c26ae")} style={{ top: pos.top, left: pos.left }}>
      <header>
        <Settings size={16} className="ads-ui-settings-icon" aria-hidden="true" />
        <h2>{t("ui.46d56c26ae")}</h2>
        <button type="button" className="ads-ui-settings-close" aria-label={t("ui.f018c9faa0")} onClick={onClose}><X size={16} /></button>
      </header>
      <div className="ads-ui-settings-groups">
        <section>
          <h3>{t("ui.37a647ec3a")}</h3>
          <OptionRow label={t("ui.00de672594")} value="default" current={settings.surface} onSelect={(value) => onChange('surface', value)} />
          <OptionRow label={t("ui.8d2ecb4e31")} value="white" current={settings.surface} onSelect={(value) => onChange('surface', value)} />
        </section>
        <section>
          <h3>{t("ui.d68b33f50c")}</h3>
          <OptionRow label={t("ui.5cd96b2262")} value="default" current={settings.gridLines} onSelect={(value) => onChange('gridLines', value)} />
          <OptionRow label={t("ui.05b9dd0eb2")} value="bordered" current={settings.gridLines} onSelect={(value) => onChange('gridLines', value)} />
        </section>
        <section>
          <h3>{t("ui.f64b9653a0")}</h3>
          <OptionRow label={t("ui.6b34606ff1")} value="default" current={settings.fontSize} onSelect={(value) => onChange('fontSize', value)} />
          <OptionRow label={t("ui.a688c75697")} value="14" current={settings.fontSize} onSelect={(value) => onChange('fontSize', value)} />
          <OptionRow label={t("ui.13ceafe37e")} value="16" current={settings.fontSize} onSelect={(value) => onChange('fontSize', value)} />
        </section>
        <section>
          <h3>{t("ui.7be6cab0ad")}</h3>
          <OptionRow label={t("ui.c144d582b3")} value="default" current={settings.fontWeight} onSelect={(value) => onChange('fontWeight', value)} />
          <OptionRow label={t("ui.b6aae9a163")} value="medium" current={settings.fontWeight} onSelect={(value) => onChange('fontWeight', value)} />
        </section>
        <section>
          <h3>{t("ui.7dc1efb636")}</h3>
          <OptionRow label={t("ui.5d14e47bc4")} value="default" current={settings.rowSpacing} onSelect={(value) => onChange('rowSpacing', value)} />
          <OptionRow label={t("ui.17d943d848")} value="54" current={settings.rowSpacing} onSelect={(value) => onChange('rowSpacing', value)} />
          <OptionRow label={t("ui.be603b7854")} value="58" current={settings.rowSpacing} onSelect={(value) => onChange('rowSpacing', value)} />
        </section>
        <section>
          <h3>{t("ui.10a56b3615")}</h3>
          <OptionRow label={t("ui.ba4e271a47")} value="default" current={settings.decimalSeparator} onSelect={(value) => onChange('decimalSeparator', value)} />
          <OptionRow label={t("ui.023b03d2fd")} value="dot" current={settings.decimalSeparator} onSelect={(value) => onChange('decimalSeparator', value)} />
        </section>
      </div>
    </div>,
    document.body,
  )
}
