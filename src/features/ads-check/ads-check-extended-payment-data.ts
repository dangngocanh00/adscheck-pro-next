import { m } from '@/i18n'
import {
  Activity,
  Building,
  Building2,
  CalendarClock,
  CalendarPlus,
  Camera,
  CreditCard,
  EyeOff,
  Fingerprint,
  Gauge,
  Globe2,
  KeyRound,
  Receipt,
  TrendingUp,
  UserRound,
  UserX,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type ExtendedPaymentSurface = 'bubble' | 'action-bar'
export type ExtendedPaymentCurrencyMode = 'auto' | 'custom'

export type ExtendedPaymentField = {
  id: string
  label: string
  previewValue: string
  icon: LucideIcon
}

export type ExtendedPaymentSettings = {
  schemaVersion: 2
  bubbleEnabled: boolean
  surface: ExtendedPaymentSurface
  language: string
  currencyMode: ExtendedPaymentCurrencyMode
  displayCurrency: string
  // Extended Payment Round 1 Part #6 — per-currency custom exchange
  // rates (code → "1 USD ~ X [code]", same free-text decimal format as
  // the legacy single `customRate`), keyed by ISO code. Only entries the
  // user has actually edited are stored; every other code falls back to
  // its own `defaultRate` in EXTENDED_PAYMENT_CURRENCIES.
  customRates: Record<string, string>
  selectedFields: string[]
  // Extended Payment Round 1 Part #2/#3 — a sanitized HTML fragment
  // authored via the rich-text signature editor (execCommand), not plain
  // text; per-range bold/italic/underline/strike/color/link formatting is
  // encoded directly in this markup rather than a separate whole-field
  // boolean-flags object (the old `formatting` field this replaces).
  signature: string
}

export const extendedPaymentStorageKey = 'ads-check-extended-payment-settings'
export const extendedPaymentDemoAmount = 86_500_000

export function parseExtendedPaymentRate(value: string): number | null {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

// Extended Payment Round 1 Part #6 — the project has no live/backend
// exchange-rate feed (traced: only a single hardcoded VND rate + a THB
// constant existed before this round). This is a real ISO 4217 code/name
// list (not just the handful of screenshot examples) with plausible
// static "1 USD ~ X" reference defaults — explicitly a LOCAL config
// dataset, not a live-market source; editing/saving here only changes
// this local configuration, reported as a limitation in the batch report.
export type ExtendedPaymentCurrencyDef = { code: string; name: string; defaultRate: number }
export const EXTENDED_PAYMENT_CURRENCIES: ExtendedPaymentCurrencyDef[] = [
  { code: 'USD', name: m("ui.7ba1116ae4"), defaultRate: 1 },
  { code: 'VND', name: m("ui.6b01bdef29"), defaultRate: 24_680 },
  { code: 'AED', name: 'Dirham UAE', defaultRate: 3.6725 },
  { code: 'AFN', name: 'Afghani Afghanistan', defaultRate: 70.5 },
  { code: 'ALL', name: 'Lek Albania', defaultRate: 92.4 },
  { code: 'AMD', name: 'Dram Armenia', defaultRate: 387.5 },
  { code: 'ANG', name: m("ui.4c1c1afae4"), defaultRate: 1.79 },
  { code: 'AOA', name: 'Kwanza Angola', defaultRate: 912 },
  { code: 'ARS', name: 'Peso Argentina', defaultRate: 985 },
  { code: 'AUD', name: m("ui.4135e6e144"), defaultRate: 1.52 },
  { code: 'BAM', name: 'Mark Bosnia', defaultRate: 1.8 },
  { code: 'BDT', name: 'Taka Bangladesh', defaultRate: 119.5 },
  { code: 'BGN', name: 'Lev Bulgaria', defaultRate: 1.8 },
  { code: 'BHD', name: 'Dinar Bahrain', defaultRate: 0.376 },
  { code: 'BND', name: m("ui.80b64d4f8d"), defaultRate: 1.34 },
  { code: 'BOB', name: 'Boliviano Bolivia', defaultRate: 6.91 },
  { code: 'BRL', name: 'Real Brazil', defaultRate: 5.42 },
  { code: 'BWP', name: 'Pula Botswana', defaultRate: 13.6 },
  { code: 'BYN', name: 'Ruble Belarus', defaultRate: 3.27 },
  { code: 'BZD', name: m("ui.eb4ace34bd"), defaultRate: 2.02 },
  { code: 'CAD', name: m("ui.e18429259b"), defaultRate: 1.37 },
  { code: 'CHF', name: m("ui.defde288a2"), defaultRate: 0.88 },
  { code: 'CLP', name: 'Peso Chile', defaultRate: 945 },
  { code: 'CNY', name: m("ui.6833a990e6"), defaultRate: 7.13 },
  { code: 'COP', name: 'Peso Colombia', defaultRate: 4_050 },
  { code: 'CRC', name: m("ui.878c8b0afe"), defaultRate: 508 },
  { code: 'CZK', name: m("ui.9a1a6c9a6b"), defaultRate: 22.9 },
  { code: 'DKK', name: m("ui.b26e6cfc90"), defaultRate: 6.88 },
  { code: 'DOP', name: 'Peso Dominica', defaultRate: 60.2 },
  { code: 'DZD', name: 'Dinar Algeria', defaultRate: 134.5 },
  { code: 'EGP', name: m("ui.1083c2495d"), defaultRate: 49.6 },
  { code: 'ETB', name: 'Birr Ethiopia', defaultRate: 123.8 },
  { code: 'EUR', name: 'Euro', defaultRate: 0.92 },
  { code: 'GBP', name: m("ui.b41983193a"), defaultRate: 0.79 },
  { code: 'GEL', name: 'Lari Georgia', defaultRate: 2.71 },
  { code: 'GHS', name: 'Cedi Ghana', defaultRate: 14.9 },
  { code: 'HKD', name: m("ui.677702f17f"), defaultRate: 7.79 },
  { code: 'HRK', name: 'Kuna Croatia', defaultRate: 6.94 },
  { code: 'HUF', name: 'Forint Hungary', defaultRate: 358 },
  { code: 'IDR', name: 'Rupiah Indonesia', defaultRate: 15_850 },
  { code: 'ILS', name: 'Shekel Israel', defaultRate: 3.72 },
  { code: 'INR', name: m("ui.9efce93b13"), defaultRate: 83.9 },
  { code: 'JPY', name: m("ui.571af114e5"), defaultRate: 149.5 },
  { code: 'JOD', name: 'Dinar Jordan', defaultRate: 0.709 },
  { code: 'KES', name: 'Shilling Kenya', defaultRate: 129 },
  { code: 'KRW', name: m("ui.0f2568a3c8"), defaultRate: 1_365 },
  { code: 'KWD', name: 'Dinar Kuwait', defaultRate: 0.307 },
  { code: 'KZT', name: 'Tenge Kazakhstan', defaultRate: 480 },
  { code: 'LKR', name: 'Rupee Sri Lanka', defaultRate: 296 },
  { code: 'MAD', name: 'Dirham Morocco', defaultRate: 9.95 },
  { code: 'MDL', name: 'Leu Moldova', defaultRate: 17.8 },
  { code: 'MXN', name: 'Peso Mexico', defaultRate: 17.1 },
  { code: 'MYR', name: 'Ringgit Malaysia', defaultRate: 4.47 },
  { code: 'NGN', name: 'Naira Nigeria', defaultRate: 1_540 },
  { code: 'NOK', name: 'Krone Na Uy', defaultRate: 10.7 },
  { code: 'NZD', name: m("ui.8985587991"), defaultRate: 1.66 },
  { code: 'PEN', name: 'Sol Peru', defaultRate: 3.75 },
  { code: 'PHP', name: 'Peso Philippines', defaultRate: 56.9 },
  { code: 'PKR', name: 'Rupee Pakistan', defaultRate: 278 },
  { code: 'PLN', name: 'Zloty Ba Lan', defaultRate: 3.98 },
  { code: 'QAR', name: 'Riyal Qatar', defaultRate: 3.64 },
  { code: 'RON', name: 'Leu Romania', defaultRate: 4.58 },
  { code: 'RSD', name: 'Dinar Serbia', defaultRate: 107.5 },
  { code: 'RUB', name: 'Ruble Nga', defaultRate: 96.5 },
  { code: 'SAR', name: 'Riyal Saudi Arabia', defaultRate: 3.75 },
  { code: 'SEK', name: m("ui.022c0f4f0d"), defaultRate: 10.6 },
  { code: 'SGD', name: m("ui.e37b39c58b"), defaultRate: 1.34 },
  { code: 'THB', name: m("ui.25902c617e"), defaultRate: 34.9 },
  { code: 'TRY', name: m("ui.71ff6fb756"), defaultRate: 34.2 },
  { code: 'TWD', name: m("ui.765c13820e"), defaultRate: 32.4 },
  { code: 'TZS', name: 'Shilling Tanzania', defaultRate: 2_565 },
  { code: 'UAH', name: 'Hryvnia Ukraine', defaultRate: 41.2 },
  { code: 'UYU', name: 'Peso Uruguay', defaultRate: 40.5 },
  { code: 'UZS', name: 'Som Uzbekistan', defaultRate: 12_650 },
  { code: 'ZAR', name: 'Rand Nam Phi', defaultRate: 18.2 },
]

export function findExtendedPaymentCurrency(code: string): ExtendedPaymentCurrencyDef | undefined {
  return EXTENDED_PAYMENT_CURRENCIES.find((currency) => currency.code === code)
}

// Effective "1 USD ~ X [code]" rate: the user's own saved custom value
// when custom mode is active and a valid override exists, else the
// currency's own static local default.
export function effectiveExtendedPaymentRate(code: string, currencyMode: ExtendedPaymentCurrencyMode, customRates: Record<string, string>): number | null {
  const definition = findExtendedPaymentCurrency(code)
  if (currencyMode === 'custom') {
    const override = customRates[code]
    const parsed = override != null ? parseExtendedPaymentRate(override) : null
    if (parsed != null) return parsed
  }
  return definition?.defaultRate ?? null
}

// Extended Payment Round 1 Part #3 — the signature is authored via a
// contentEditable rich-text surface (document.execCommand), so its saved
// value is now a small HTML fragment rather than plain text. Rendered
// with dangerouslySetInnerHTML in the Bubble preview, so it MUST be
// sanitized first: an explicit tag/attribute allowlist (bold/italic/
// underline/strike wrappers, a color-only inline style, and http(s)/
// mailto links) — anything else (script, event handlers, iframes, other
// protocols) is stripped rather than rendered.
const SIGNATURE_ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'A', 'BR', 'DIV', 'FONT'])
function sanitizeSignatureNode(node: Node, out: HTMLElement) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out.appendChild(document.createTextNode(child.textContent ?? ''))
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const element = child as HTMLElement
    if (!SIGNATURE_ALLOWED_TAGS.has(element.tagName)) {
      sanitizeSignatureNode(element, out)
      continue
    }
    const clean = document.createElement(element.tagName === 'FONT' ? 'span' : element.tagName.toLowerCase())
    const color = element.style?.color || (element.tagName === 'FONT' ? element.getAttribute('color') ?? '' : '')
    if (color) clean.style.color = color
    if (element.tagName === 'A') {
      const href = element.getAttribute('href') ?? ''
      if (/^(https?:|mailto:)/i.test(href)) {
        clean.setAttribute('href', href)
        clean.setAttribute('target', '_blank')
        clean.setAttribute('rel', 'noreferrer')
      }
    }
    sanitizeSignatureNode(element, clean)
    out.appendChild(clean)
  }
}
export function sanitizeSignatureHtml(html: string): string {
  if (typeof document === 'undefined') return ''
  const source = document.createElement('div')
  source.innerHTML = html
  const clean = document.createElement('div')
  sanitizeSignatureNode(source, clean)
  return clean.innerHTML
}

// Extended Payment Round 1 Part #1 — refined, semantically distinct icon
// per field (one shared line-icon family/weight, lucide-react, matching
// the rest of the Extended Payment visual language) replacing the
// previous generic/weak set. Field ids/labels/preview values unchanged.
export const extendedPaymentFields: ExtendedPaymentField[] = [
  { id: 'account-name', label: m("ui.3f742a8a3f"), previewValue: m("ui.31df314e33"), icon: UserRound },
  { id: 'account-id', label: m("ui.fdadd76200"), previewValue: '9191••••1212', icon: Fingerprint },
  { id: 'account-status', label: m("ui.12f09dcb21"), previewValue: m("ui.ad939f0450"), icon: Activity },
  { id: 'spend-limit', label: m("ui.d01f008352"), previewValue: m("ui.fb85e487ae"), icon: Gauge },
  { id: 'hidden-limit', label: m("ui.9242f2e450"), previewValue: m("ui.bc7ca23a45"), icon: EyeOff },
  { id: 'current-threshold', label: m("ui.6cb79c9bfe"), previewValue: m("ui.fb85e487ae"), icon: TrendingUp },
  { id: 'balance', label: m("ui.b0c0338188"), previewValue: m("ui.fb85e487ae"), icon: Wallet },
  { id: 'total-spend', label: m("ui.7817b94196"), previewValue: m("ui.fb85e487ae"), icon: Receipt },
  { id: 'created-at', label: m("ui.a37faa96bc"), previewValue: '25-08-2026', icon: CalendarPlus },
  { id: 'billing-date', label: m("ui.7ed998b6bc"), previewValue: '25-08-2026', icon: CalendarClock },
  { id: 'hidden-admins', label: m("ui.c6a693e5e4"), previewValue: '0', icon: UserX },
  { id: 'account-type', label: m("ui.1d038b4e10"), previewValue: m("ui.410af61745"), icon: Building2 },
  { id: 'timezone', label: m("ui.4a92729dad"), previewValue: 'Asia/Ho_Chi_Minh | +7', icon: Globe2 },
  { id: 'capture-time', label: m("ui.2bdc07ed74"), previewValue: '09:42 · 26-08-2026', icon: Camera },
  { id: 'business-owner', label: m("ui.857465c89d"), previewValue: 'BM Demo 08', icon: Building },
  { id: 'payment-method', label: m("ui.51c593f044"), previewValue: '90-***-1232', icon: CreditCard },
  { id: 'ownership', label: m("ui.9de3c34836"), previewValue: m("ui.410af61745"), icon: KeyRound },
]

export const defaultExtendedPaymentSettings: ExtendedPaymentSettings = {
  schemaVersion: 2,
  bubbleEnabled: true,
  surface: 'bubble',
  language: 'auto',
  currencyMode: 'auto',
  displayCurrency: 'auto',
  customRates: {},
  selectedFields: extendedPaymentFields.map((field) => field.id),
  signature: '',
}

function migrateSelectedFields(candidate: unknown): string[] {
  if (!Array.isArray(candidate)) return defaultExtendedPaymentSettings.selectedFields
  if (candidate.length === 0) return []

  const ids = new Set(extendedPaymentFields.map((field) => field.id))
  const labels = new Map([
    ...extendedPaymentFields.map((field) => [field.label, field.id] as const),
    [m("ui.2c912a8164"), 'account-id'],
    [m("ui.43f8d684b1"), 'total-spend'],
    [m("ui.e3dbec7ba0"), 'payment-method'],
    [m("ui.e03c1401e3"), 'account-status'],
  ])
  const migrated = candidate.flatMap((item) => {
    if (typeof item !== 'string') return []
    if (ids.has(item)) return [item]
    const id = labels.get(item)
    return id ? [id] : []
  })
  return Array.from(new Set(migrated))
}

export function readExtendedPaymentSettings(): ExtendedPaymentSettings {
  try {
    const candidate = JSON.parse(window.localStorage.getItem(extendedPaymentStorageKey) ?? 'null') as (Partial<ExtendedPaymentSettings> & {
      currency?: unknown
      exchangeRate?: unknown
      // Legacy single free-text rate field, replaced by `customRates`.
      customRate?: unknown
    }) | null
    if (!candidate || typeof candidate !== 'object') return defaultExtendedPaymentSettings
    const legacyCurrency = typeof candidate.currency === 'string' ? candidate.currency : undefined
    const legacyExchangeRate = typeof candidate.exchangeRate === 'string' ? candidate.exchangeRate : undefined
    const displayCurrency = candidate.displayCurrency ?? legacyCurrency
    const currencyMode = candidate.currencyMode === 'custom' || (legacyExchangeRate != null && legacyExchangeRate !== '1') ? 'custom' : 'auto'
    // Extended Payment Round 1 Part #6 — per-currency overrides, keyed by
    // a real ISO code we actually know about; anything else (stale/
    // unknown code) is dropped rather than carried forward silently.
    const customRatesCandidate = candidate.customRates
    const customRates: Record<string, string> = {}
    if (customRatesCandidate && typeof customRatesCandidate === 'object') {
      for (const [code, rate] of Object.entries(customRatesCandidate)) {
        if (typeof rate === 'string' && parseExtendedPaymentRate(rate) != null && findExtendedPaymentCurrency(code)) customRates[code] = rate
      }
    }
    // Round 1 Part #6/#7 legacy carry-over — the old single free-text
    // `customRate` meant "1 [displayCurrency] ~ X VND"; if the prior
    // saved displayCurrency was USD (the only paid target besides VND),
    // fold it into the new per-currency table as VND's own override so a
    // previously-configured custom rate isn't silently lost.
    if (customRates.VND === undefined) {
      const legacyRate = typeof candidate.customRate === 'string' ? candidate.customRate : legacyExchangeRate
      if (legacyRate && parseExtendedPaymentRate(legacyRate) != null) customRates.VND = legacyRate
    }
    return {
      schemaVersion: 2,
      bubbleEnabled: typeof candidate.bubbleEnabled === 'boolean' ? candidate.bubbleEnabled : true,
      surface: candidate.surface === 'action-bar' ? 'action-bar' : 'bubble',
      language: ['auto', 'vi', 'en'].includes(candidate.language ?? '') ? candidate.language as string : 'auto',
      currencyMode,
      displayCurrency: ['auto', 'VND', 'USD'].includes(typeof displayCurrency === 'string' ? displayCurrency : '') ? displayCurrency as string : 'auto',
      customRates,
      selectedFields: migrateSelectedFields(candidate.selectedFields),
      signature: typeof candidate.signature === 'string' ? candidate.signature : '',
    }
  } catch {
    return defaultExtendedPaymentSettings
  }
}
