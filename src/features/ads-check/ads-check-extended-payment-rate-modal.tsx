import { useAppLanguage, t, tx, m } from '@/i18n'
import { useMemo, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { CircleDollarSign, Search, X } from 'lucide-react'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'
import { EXTENDED_PAYMENT_CURRENCIES, parseExtendedPaymentRate } from './ads-check-extended-payment-data'

type ExtendedPaymentRateModalProps = {
  customRates: Record<string, string>
  onSave: (customRates: Record<string, string>) => void
  onClose: () => void
}

function formatRateDisplay(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value)
}

// Extended Payment Round 1 Part #6 — reuses the same shared modal
// backdrop/Category-B (important, non-backdrop-dismissible) semantics
// already established for Ads Check Pro's own load-config/history modals,
// rather than a parallel modal framework.
export const ExtendedPaymentRateModal: FC<ExtendedPaymentRateModalProps> = ({ customRates, onSave, onClose }) => {
  useAppLanguage();
  const [draft, setDraft] = useState<Record<string, string>>(customRates)
  const [search, setSearch] = useState('')
  const [activeCode, setActiveCode] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('vi')
    if (!needle) return EXTENDED_PAYMENT_CURRENCIES
    return EXTENDED_PAYMENT_CURRENCIES.filter((currency) => currency.code.toLocaleLowerCase('vi').includes(needle) || currency.name.toLocaleLowerCase('vi').includes(needle))
  }, [search])

  const rateFor = (code: string, defaultRate: number): string => draft[code] ?? String(defaultRate)

  const handleRateChange = (code: string, value: string) => {
    setDraft((current) => ({ ...current, [code]: value }))
  }

  const resetDefaults = () => {
    setDraft({})
    setActiveCode(null)
  }

  const handleSave = () => {
    const cleaned: Record<string, string> = {}
    for (const currency of EXTENDED_PAYMENT_CURRENCIES) {
      const value = draft[currency.code]
      if (value != null && parseExtendedPaymentRate(value) != null && Number(value.replace(/\./g, '').replace(',', '.')) !== currency.defaultRate) {
        cleaned[currency.code] = value
      }
    }
    onSave(cleaned)
  }

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section className="ads-extended-rate-modal" role="dialog" aria-modal="true" aria-labelledby="extended-rate-modal-title">
        <header>
          <span className="ads-extended-rate-modal-icon"><CircleDollarSign size={17} /></span>
          <h2 id="extended-rate-modal-title">{t("ui.9f9994e24d")}</h2>
          <button type="button" className="ads-extended-rate-reset" onClick={resetDefaults}>{t("ui.447701d64f")}</button>
          <button type="button" className="ads-extended-rate-close" aria-label={t("ui.d2b73ab2ad")} data-autofocus onClick={onClose}><X size={16} /></button>
        </header>

        <div className="ads-extended-rate-search">
          <Search size={15} aria-hidden="true" />
          <input aria-label={t("ui.2588bc840b")} placeholder={t("ui.2588bc840b")} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <p className="ads-extended-rate-context">{t("ui.4fd3e3e674")}{" "}{tx(formatRateDisplay(parseExtendedPaymentRate(rateFor('VND', 24_680)) ?? 24_680))} {" "}{t("ui.4c88009f63")}</p>

        <ul className="ads-extended-rate-list" role="listbox" aria-label={t("ui.5ee2848e7c")}>
          {tx(filtered.map((currency) => {
            const value = rateFor(currency.code, currency.defaultRate)
            const invalid = parseExtendedPaymentRate(value) == null
            const active = activeCode === currency.code
            return (
              <li key={currency.code} className={active ? 'is-active' : ''}>
                <button type="button" className="ads-extended-rate-code" onClick={() => setActiveCode(currency.code)}>
                  <b>{currency.code}</b>
                  <small>{currency.name}</small>
                </button>
                <span className="ads-extended-rate-input">
                  <input
                    aria-label={tx(m("ui.8aec859bd7", { 0: currency.code }))}
                    aria-invalid={invalid}
                    inputMode="decimal"
                    value={value}
                    onFocus={() => setActiveCode(currency.code)}
                    onChange={(event) => handleRateChange(currency.code, event.target.value)}
                    disabled={currency.code === 'USD'}
                  />
                </span>
              </li>
            )
          }))}
          {tx(filtered.length === 0 && <li className="ads-extended-rate-empty">{t("ui.7ba8de8f31")}</li>)}
        </ul>

        <footer>
          <button type="button" className="ads-extended-rate-cancel" onClick={onClose}>{t("ui.d2b73ab2ad")}</button>
          <button type="button" className="ads-extended-rate-save" onClick={handleSave}>{t("ui.c1ae93631e")}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default ExtendedPaymentRateModal
