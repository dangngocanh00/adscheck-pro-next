import { useAppLanguage, m } from '@/i18n'
import '@/styles/ads-check-extended-payment-pa5.css'
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import {
  extendedPaymentStorageKey,
  defaultExtendedPaymentSettings,
  extendedPaymentFields,
  readExtendedPaymentSettings,
  type ExtendedPaymentCurrencyMode,
  type ExtendedPaymentSurface,
} from '@/features/ads-check/ads-check-extended-payment-data'
import { ExtendedPaymentPreview } from '@/features/ads-check/ads-check-extended-payment-preview'
import { ExtendedPaymentSettingsPanel } from '@/features/ads-check/ads-check-extended-payment-settings'
import { AdsCheckProductShell } from '@/features/ads-check/ads-check-product-shell'
import { useToolmetaSession } from '@/features/ads-check/toolmeta-session'

export const AdsCheckExtendedPaymentPage: FC = () => {
  useAppLanguage();
  const { email, openAuth } = useToolmetaSession()
  const initialSettings = useMemo(() => email ? readExtendedPaymentSettings() : defaultExtendedPaymentSettings, [email])
  const [bubbleEnabled, setBubbleEnabled] = useState(initialSettings.bubbleEnabled)
  const [surface, setSurface] = useState<ExtendedPaymentSurface>(initialSettings.surface)
  const [language, setLanguage] = useState(initialSettings.language)
  const [currencyMode, setCurrencyMode] = useState<ExtendedPaymentCurrencyMode>(initialSettings.currencyMode)
  const [displayCurrency, setDisplayCurrency] = useState(initialSettings.displayCurrency)
  const [customRates, setCustomRates] = useState<Record<string, string>>(initialSettings.customRates)
  const [selectedFields, setSelectedFields] = useState<string[]>(initialSettings.selectedFields)
  const [signature, setSignature] = useState(initialSettings.signature)
  const [savedMessage, setSavedMessage] = useState('')
  const [restoreVersion, setRestoreVersion] = useState(0)
  const restoreDefaults = () => {
    const defaults = defaultExtendedPaymentSettings
    setBubbleEnabled(defaults.bubbleEnabled)
    setSurface(defaults.surface)
    setLanguage(defaults.language)
    setCurrencyMode(defaults.currencyMode)
    setDisplayCurrency(defaults.displayCurrency)
    setCustomRates({ ...defaults.customRates })
    setSelectedFields([...defaults.selectedFields])
    setSignature(defaults.signature)
    // Reseed the uncontrolled editor only on an explicit restore, never while typing.
    setRestoreVersion(version => version + 1)
  }

  const currentSnapshot = useMemo(() => JSON.stringify({
    schemaVersion: 2,
    bubbleEnabled,
    surface,
    language,
    currencyMode,
    displayCurrency,
    customRates,
    selectedFields,
    signature,
  }), [bubbleEnabled, currencyMode, customRates, displayCurrency, language, selectedFields, signature, surface])
  const savedSnapshotRef = useRef(currentSnapshot)

  useEffect(() => {
    setSavedMessage((current) => {
      if (savedSnapshotRef.current !== currentSnapshot) return m("ui.85c77f4bb5")
      return current === m("ui.85c77f4bb5") ? m("ui.0d856e877a") : current
    })
  }, [currentSnapshot])

  const toggleField = useCallback((fieldId: string) => {
    setSelectedFields((current) => current.includes(fieldId)
      ? current.filter((candidate) => candidate !== fieldId)
      : [...current, fieldId])
  }, [])

  const saveConfiguration = useCallback(() => {
    if (!email) { openAuth(); return }
    try {
      window.localStorage.setItem(extendedPaymentStorageKey, currentSnapshot)
      savedSnapshotRef.current = currentSnapshot
      setSavedMessage(m("ui.51a452249a"))
    } catch {
      setSavedMessage(m("ui.8910ba559a"))
    }
  }, [currentSnapshot, email, openAuth])

  return (
    <AdsCheckProductShell activeNavigation="extended-payment">
      <div className="ads-payment-page ads-extended-payment-page" id="ads-payment-main">
        <div className="ads-extended-layout">
          <ExtendedPaymentSettingsPanel
            key={restoreVersion}
            onRestoreDefaults={restoreDefaults}
            onSelectAllFields={() => setSelectedFields(extendedPaymentFields.map(field => field.id))}
            onResetFields={() => setSelectedFields([...defaultExtendedPaymentSettings.selectedFields])}
            bubbleEnabled={bubbleEnabled}
            surface={surface}
            language={language}
            currencyMode={currencyMode}
            displayCurrency={displayCurrency}
            customRates={customRates}
            selectedFields={selectedFields}
            signature={signature}
            savedMessage={savedMessage}
            onBubbleEnabledChange={setBubbleEnabled}
            onSurfaceChange={setSurface}
            onLanguageChange={setLanguage}
            onCurrencyModeChange={setCurrencyMode}
            onDisplayCurrencyChange={setDisplayCurrency}
            onCustomRatesChange={setCustomRates}
            onToggleField={toggleField}
            onSignatureChange={setSignature}
            onSave={saveConfiguration}
          />
          <ExtendedPaymentPreview
            showDemoValues={Boolean(email)}
            bubbleEnabled={bubbleEnabled}
            surface={surface}
            language={language}
            currencyMode={currencyMode}
            displayCurrency={displayCurrency}
            customRates={customRates}
            selectedFields={selectedFields}
            signature={signature}
          />
        </div>
      </div>
    </AdsCheckProductShell>
  )
}

export default AdsCheckExtendedPaymentPage
