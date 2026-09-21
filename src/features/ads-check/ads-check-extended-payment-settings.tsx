import { useAppLanguage, tx, m, t } from '@/i18n'
import { useEffect, useRef, useState, type FC } from 'react'
import {
  Bold,
  CaseSensitive,
  Check,
  CheckCheck,
  RotateCcw,
  Search,
  LayoutGrid,
  Italic,
  Link2,
  Palette,
  Pencil,
  Save,
  Settings,
  Sparkles,
  Strikethrough,
  Underline,
  UserRound,
  Wand2,
} from 'lucide-react'
import {
  extendedPaymentFields,
  parseExtendedPaymentRate,
  sanitizeSignatureHtml,
  type ExtendedPaymentCurrencyMode,
  type ExtendedPaymentSurface,
} from './ads-check-extended-payment-data'
import { ExtendedPaymentDropdown } from './ads-check-extended-payment-dropdown'
import { ExtendedPaymentRateModal } from './ads-check-extended-payment-rate-modal'

type ExtendedPaymentSettingsPanelProps = {
  onRestoreDefaults: () => void
  onSelectAllFields: () => void
  onResetFields: () => void
  bubbleEnabled: boolean
  surface: ExtendedPaymentSurface
  language: string
  currencyMode: ExtendedPaymentCurrencyMode
  displayCurrency: string
  customRates: Record<string, string>
  selectedFields: string[]
  signature: string
  savedMessage: string
  onBubbleEnabledChange: (enabled: boolean) => void
  onSurfaceChange: (surface: ExtendedPaymentSurface) => void
  onLanguageChange: (language: string) => void
  onCurrencyModeChange: (mode: ExtendedPaymentCurrencyMode) => void
  onDisplayCurrencyChange: (currency: string) => void
  onCustomRatesChange: (rates: Record<string, string>) => void
  onToggleField: (fieldId: string) => void
  onSignatureChange: (signature: string) => void
  onSave: () => void
}

type SegmentButtonProps = {
  active: boolean
  label: string
  ariaLabel?: string
  onClick: () => void
}

const SegmentButton: FC<SegmentButtonProps> = ({ active, label, ariaLabel, onClick }) => { useAppLanguage(); return (
  <button type="button" className={active ? 'is-selected' : ''} aria-label={tx(ariaLabel ?? label)} aria-pressed={active} onClick={onClick}>{tx(label)}</button>
) }

// Extended Payment Round 1 Part #5 — language flags: production shows
// real Vietnam/UK flags. No flag-icon asset/library exists in this
// project, so the actual national flag emoji is used here (a deliberate,
// correct representation of "Vietnam flag"/"UK flag" — not a decorative
// stand-in like the "no random emoji" rule for the data-card icons in
// Part #1, which are semantic line icons, not flags).
const LANGUAGE_OPTIONS = [
  { value: 'auto', label: m("ui.31dcad619d"), icon: <Wand2 size={15} aria-hidden="true" /> },
  { value: 'vi', label: m("ui.4993440c23"), icon: <span aria-hidden="true">🇻🇳</span> },
  { value: 'en', label: 'English', icon: <span aria-hidden="true">🇬🇧</span> },
]

const DISPLAY_CURRENCY_OPTIONS = [
  { value: 'auto', label: m("ui.31dcad619d") },
  { value: 'VND', label: 'VND' },
  { value: 'USD', label: 'USD' },
]

// Extended Payment Round 1 Part #2 — audited color palette (circular
// swatches), same production order: reset → black → dark gray → red →
// orange-red → orange → bright green → dark green → cyan → blue →
// blue-purple → purple → pink. "Reset" re-applies the editor's own
// default ink color (#121713) rather than a true style-removal, matching
// how lightweight signature editors commonly implement "no color".
const SIGNATURE_COLORS: { label: string; value: string }[] = [
  { label: m("ui.d75aa664cb"), value: '#121713' },
  { label: m("ui.4d0c0faffa"), value: '#000000' },
  { label: m("ui.01959534fd"), value: '#4b5563' },
  { label: m("ui.2eb7503e78"), value: '#dc2626' },
  { label: m("ui.08faf85fd6"), value: '#ea580c' },
  { label: 'Cam', value: '#f59e0b' },
  { label: m("ui.d194ce4d12"), value: '#22c55e' },
  { label: m("ui.14098b0cad"), value: '#0f7a34' },
  { label: m("ui.b140779526"), value: '#06b6d4' },
  { label: m("ui.95beb52003"), value: '#2563eb' },
  { label: m("ui.08e76f5726"), value: '#4f46e5' },
  { label: m("ui.684e596629"), value: '#9333ea' },
  { label: m("ui.5a43ba9e2d"), value: '#db2777' },
]

export const ExtendedPaymentSettingsPanel: FC<ExtendedPaymentSettingsPanelProps> = ({
  onRestoreDefaults,
  onSelectAllFields,
  onResetFields,
  bubbleEnabled,
  surface,
  language,
  currencyMode,
  displayCurrency,
  customRates,
  selectedFields,
  signature,
  savedMessage,
  onBubbleEnabledChange,
  onSurfaceChange,
  onLanguageChange,
  onCurrencyModeChange,
  onDisplayCurrencyChange,
  onCustomRatesChange,
  onToggleField,
  onSignatureChange,
  onSave,
}) => {
  useAppLanguage();
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const initializedRef = useRef(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [rateModalOpen, setRateModalOpen] = useState(false)
  const [fieldSearch, setFieldSearch] = useState('')
  const visibleFields = extendedPaymentFields.filter(field => tx(field.label).toLocaleLowerCase().includes(fieldSearch.trim().toLocaleLowerCase()))

  // Uncontrolled contentEditable: the DOM is the source of truth while
  // typing (React re-rendering `innerHTML` on every keystroke would fight
  // the caret position), seeded once from the persisted signature.
  useEffect(() => {
    if (initializedRef.current || !editorRef.current) return
    editorRef.current.innerHTML = sanitizeSignatureHtml(signature)
    initializedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emitSignature = () => {
    if (editorRef.current) onSignatureChange(editorRef.current.innerHTML)
  }

  const captureSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }
  }
  const restoreSelection = (): boolean => {
    if (!savedRangeRef.current || !editorRef.current) return false
    editorRef.current.focus()
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(savedRangeRef.current)
    return true
  }

  // Every toolbar button uses onMouseDown+preventDefault so clicking it
  // never steals focus/selection away from the signature editor first —
  // execCommand needs the ORIGINAL selection still live in the DOM.
  const preventBlur = (event: React.MouseEvent) => event.preventDefault()

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    emitSignature()
  }

  const openColorPopover = () => {
    captureSelection()
    setLinkOpen(false)
    setColorOpen((current) => !current)
  }
  const applyColor = (hex: string) => {
    if (!restoreSelection()) editorRef.current?.focus()
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand('foreColor', false, hex)
    emitSignature()
    setColorOpen(false)
  }

  const openLinkPopover = () => {
    captureSelection()
    // Prefill from an existing link at the caret/selection, if any.
    const anchor = savedRangeRef.current?.commonAncestorContainer
    const anchorEl = anchor instanceof Element ? anchor : anchor?.parentElement
    const existingLink = anchorEl?.closest?.('a[href]')
    setLinkValue(existingLink?.getAttribute('href') ?? '')
    setColorOpen(false)
    setLinkOpen((current) => !current)
  }
  const saveLink = () => {
    const url = linkValue.trim()
    if (!url) { setLinkOpen(false); return }
    restoreSelection()
    document.execCommand('createLink', false, url)
    if (editorRef.current) {
      for (const anchorNode of editorRef.current.querySelectorAll(`a[href="${CSS.escape(url)}"]`)) {
        anchorNode.setAttribute('target', '_blank')
        anchorNode.setAttribute('rel', 'noreferrer')
      }
    }
    emitSignature()
    setLinkOpen(false)
  }
  const removeLink = () => {
    restoreSelection()
    document.execCommand('unlink')
    emitSignature()
    setLinkOpen(false)
  }

  const customRateInvalid = currencyMode === 'custom' && Object.keys(customRates).length > 0 && Object.values(customRates).some((value) => parseExtendedPaymentRate(value) == null)

  return (
    <section className="ads-extended-settings-panel" aria-labelledby="extended-payment-title">
    <header className="ads-extended-page-heading">
      <span className="ads-extended-heading-icon"><Sparkles size={17} /></span>
      <h1 id="extended-payment-title">{t("ui.4d95467c53")}</h1>
      <button className="ads-extended-restore" type="button" onClick={onRestoreDefaults}><RotateCcw size={15} />{t('extended.restoreDefaults')}</button>
    </header>

    <div className="ads-extended-settings-scroll">
      <section className="ads-extended-card ads-extended-general" aria-labelledby="extended-general-title">
        <h2 id="extended-general-title"><Settings size={18} />{t("ui.b1a41a8183")}</h2>
        <div className="ads-extended-general-grid">
          <div className="ads-extended-control-group">
            <span>{t("ui.17c85e43c9")}</span>
            <label className="ads-extended-switch-row">
              <b>{tx(bubbleEnabled ? m("ui.9ee3f8028f") : m("ui.9e1f613d13"))}</b>
              <input type="checkbox" role="switch" aria-label={t("ui.17c85e43c9")} checked={bubbleEnabled} onChange={(event) => onBubbleEnabledChange(event.target.checked)} />
              <i aria-hidden="true"><span /></i>
            </label>
          </div>

          <div className="ads-extended-control-group">
            <span>{t("ui.b44e528ecb")}</span>
            <div className="ads-extended-segment" role="group" aria-label={t("ui.610b23c44f")}>
              <SegmentButton active={surface === 'bubble'} label="Bubble" onClick={() => onSurfaceChange('bubble')} />
              <SegmentButton active={surface === 'action-bar'} label={t("ui.a9b8c7d606")} onClick={() => onSurfaceChange('action-bar')} />
            </div>
          </div>

          <div className="ads-extended-control-group">
            <span>{t("ui.4f91f7abc7")}</span>
            <ExtendedPaymentDropdown ariaLabel={t("ui.4f91f7abc7")} value={language} options={LANGUAGE_OPTIONS} onChange={onLanguageChange} />
          </div>

          <div className="ads-extended-control-group">
            <span className="ads-extended-control-label-row">
              {t("ui.72ff540957")}{" "}{currencyMode === 'custom' && <button type="button" className="ads-extended-edit-link" onClick={() => setRateModalOpen(true)}><Pencil size={12} aria-hidden="true" />{t("ui.0963749f2c")}</button>}
            </span>
            <div className="ads-extended-segment ads-extended-currency-segment" role="group" aria-label={t("ui.72ff540957")}>
              <SegmentButton active={currencyMode === 'auto'} label={t("ui.31dcad619d")} ariaLabel="Tự động tỉ giá" onClick={() => onCurrencyModeChange('auto')} />
              <SegmentButton active={currencyMode === 'custom'} label={t("ui.66c5f1a28b")} ariaLabel={t("ui.9253f7ee34")} onClick={() => onCurrencyModeChange('custom')} />
            </div>
            {tx(customRateInvalid && <small className="ads-extended-rate-error" role="alert">{t("ui.6c61323b95")}</small>)}
          </div>

          <div className="ads-extended-control-group">
            <span>{t("ui.16e68a0f37")}</span>
            <ExtendedPaymentDropdown ariaLabel={t("ui.16e68a0f37")} value={displayCurrency} options={DISPLAY_CURRENCY_OPTIONS} onChange={onDisplayCurrencyChange} />
          </div>
        </div>
      </section>

      <section className="ads-extended-card ads-extended-fields" aria-labelledby="extended-fields-title">
        <div className="ads-extended-board-heading">
          <h2 id="extended-fields-title"><LayoutGrid size={18} aria-hidden="true" />{t("ui.637800698d")}</h2>
          <div className="ads-extended-board-actions">
            <label className="ads-extended-field-search"><Search size={15} aria-hidden="true" /><input type="search" value={fieldSearch} onChange={event => setFieldSearch(event.target.value)} aria-label={t('extended.searchFields')} placeholder={t('extended.searchFields')} /></label>
            <button type="button" onClick={onSelectAllFields}><CheckCheck size={15} />{t('extended.selectAll')}</button>
            <button type="button" className="is-neutral" onClick={onResetFields}><RotateCcw size={15} />{t('extended.resetFields')}</button>
          </div>
        </div>
        <div className="ads-extended-fields-grid" role="group" aria-label={t("ui.8f69965be0")}>
          {visibleFields.map((field) => {
            const Icon = field.icon
            const selected = selectedFields.includes(field.id)
            return (
              <button
                key={field.id}
                type="button"
                className={`ads-extended-field-option${selected ? ' is-selected' : ''}`}
                aria-label={tx(field.label)}
                aria-pressed={selected}
                onClick={() => onToggleField(field.id)}
              >
                <span className="ads-extended-field-icon"><Icon size={17} /></span>
                <b>{tx(field.label)}</b>
                <span className="ads-extended-selection-badge" aria-hidden="true"><Check size={13} strokeWidth={2.3} /></span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="ads-extended-card ads-extended-signature" aria-labelledby="extended-signature-title">
        <div className="ads-extended-section-heading">
          <h2 id="extended-signature-title"><UserRound size={17} />{t("ui.2b42a67457")}</h2>
          <button className="ads-extended-save-button" type="button" aria-label={t("ui.8029c9eb86")} onClick={onSave}><Save size={14} />{t("ui.a306970e8b")}</button>
        </div>
        {visibleFields.length === 0 && <p className="ads-extended-board-empty">{t('extended.noFields')}</p>}
        <div className="ads-extended-editor">
          <div className="ads-extended-editor-toolbar" role="group" aria-label={t("ui.3a13c2fa77")}>
            <button type="button" aria-label={t("ui.c192d78ef8")} onMouseDown={preventBlur} onClick={() => runCommand('underline')}><Underline size={16} /></button>
            <button type="button" aria-label={t("ui.27c080055f")} onMouseDown={preventBlur} onClick={() => runCommand('italic')}><Italic size={16} /></button>
            <button type="button" aria-label={t("ui.4533ffa0ed")} onMouseDown={preventBlur} onClick={() => runCommand('bold')}><Bold size={16} /></button>
            <button type="button" aria-label={t("ui.8e924944d9")} onMouseDown={preventBlur} onClick={() => runCommand('strikeThrough')}><Strikethrough size={16} /></button>
            <button type="button" aria-label={t("ui.215ac0b130")} onMouseDown={preventBlur} onClick={() => runCommand('removeFormat')}><CaseSensitive size={16} /></button>
            <span className="ads-extended-toolbar-popover-anchor">
              <button type="button" aria-label={t("ui.cd445847f5")} aria-expanded={colorOpen} onMouseDown={preventBlur} onClick={openColorPopover}><Palette size={16} /></button>
              {colorOpen && <div className="ads-extended-color-popover" role="dialog" aria-label={t("ui.dbca990c0a")}>
                {SIGNATURE_COLORS.map((color) => (
                  <button key={color.value} type="button" className="ads-extended-color-swatch" style={{ background: color.value }} aria-label={tx(color.label)} title={tx(color.label)} onMouseDown={preventBlur} onClick={() => applyColor(color.value)} />
                ))}
              </div>}
            </span>
            <span className="ads-extended-toolbar-popover-anchor">
              <button type="button" aria-label={t("ui.82e106032f")} aria-expanded={linkOpen} onMouseDown={preventBlur} onClick={openLinkPopover}><Link2 size={16} /></button>
              {linkOpen && <div className="ads-extended-link-popover" role="dialog" aria-label={t("ui.82e106032f")}>
                <label htmlFor="extended-signature-link-input">{t("ui.42507c940a")}</label>
                <input id="extended-signature-link-input" type="text" placeholder="https://" value={linkValue} onChange={(event) => setLinkValue(event.target.value)} onMouseDown={(event) => event.stopPropagation()} />
                <div className="ads-extended-link-actions">
                  <button type="button" className="ads-extended-link-remove" onMouseDown={preventBlur} onClick={removeLink}>{t("ui.e963907dac")}</button>
                  <button type="button" className="ads-extended-link-save" onMouseDown={preventBlur} onClick={saveLink}>{t("ui.a306970e8b")}</button>
                </div>
              </div>}
            </span>
            <span className="ads-extended-save-status" role="status" aria-live="polite">{tx(savedMessage)}</span>
          </div>
          <div
            ref={editorRef}
            id="extended-signature-copy"
            className="ads-extended-editor-surface"
            role="textbox"
            aria-multiline="true"
            aria-label={t("ui.e3b7ff770a")}
            contentEditable
            suppressContentEditableWarning
            onInput={emitSignature}
            onBlur={emitSignature}
          />
        </div>
      </section>
    </div>

    {rateModalOpen && <ExtendedPaymentRateModal
      customRates={customRates}
      onSave={(rates) => { onCustomRatesChange(rates); setRateModalOpen(false) }}
      onClose={() => setRateModalOpen(false)}
    />}
    </section>
  )
}

export default ExtendedPaymentSettingsPanel
