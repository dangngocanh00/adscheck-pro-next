import { m, useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useMemo, useState, type FC } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import {
  assetManagementFeatures,
  controlHubFeature,
  formatUsd,
  bundlePrice,
  otherBillingFeatures,
  type BillingFeature,
} from './ads-check-billing-data'
import { featureAccent } from './ads-check-billing-feature-accent'
import {
  DEFAULT_BILLING_DATE_RANGE,
  computeBillingPresetRange,
  type BillingDateRange,
} from './ads-check-billing-history-date-range'
import { AdsCheckBillingDateRangePicker, AdsCheckBillingDateRangeTrigger } from './ads-check-billing-history-date-picker'
import { AdsCheckBillingHistoryStatusFilter, type HistoryStatusOption } from './ads-check-billing-history-status-filter'

export type TransactionStatus = 'success' | 'completed' | 'pending' | 'cancelled' | 'expired' | 'overpaid' | 'underpaid'

export type BillingTransaction = {
  id: string
  date: string // ISO 'YYYY-MM-DD', local calendar day of the transaction
  time: string // 'HH:MM:SS'
  features: BillingFeature[] // first entry is the main purchased feature
  durationLabel: string
  amount: number
  status: TransactionStatus
}

// Semantic status colors — NEVER theme-tokenized (V1–V5 must not change
// these; see AK in the task spec). Success/warning/error/neutral/info
// families, independent of the active brand version.
const STATUS_META: Record<TransactionStatus, { label: string; color: string; background: string }> = {
  success: { label: m("ui.9a7d703709"), color: '#0f7a3c', background: '#e4f6e8' },
  completed: { label: m("ui.58f8d6d2c4"), color: '#0f7a3c', background: '#e4f6e8' },
  pending: { label: m("ui.f25fe5b23d"), color: '#8a5a06', background: '#fff6e8' },
  cancelled: { label: m("ui.fe90dc3bca"), color: '#b3261e', background: '#fdf2f1' },
  expired: { label: m("ui.2fec540596"), color: '#4b5563', background: '#f1f2f4' },
  overpaid: { label: m("ui.3bf028c6eb"), color: '#1d4ed8', background: '#e8f0fe' },
  underpaid: { label: m("ui.b6e629f252"), color: '#b3261e', background: '#fdf2f1' },
}

const STATUS_FILTER_OPTIONS: HistoryStatusOption[] = (Object.keys(STATUS_META) as TransactionStatus[]).map((key) => ({ key, ...STATUS_META[key] }))

const tkqcFeature = assetManagementFeatures.find((feature) => feature.id === 'ads-account')!
const bmFeature = assetManagementFeatures.find((feature) => feature.id === 'businesses')!
const pageFeature = assetManagementFeatures.find((feature) => feature.id === 'pages')!
const advanceToolkitFeature = assetManagementFeatures.find((feature) => feature.id === 'advance-toolkit')!
const adsSaveFeature = otherBillingFeatures.find((feature) => feature.id === 'ads-save')!

// Demo-only transaction history — reuses the SAME real feature/pricing data
// as Mua gói/Quản lý gói cước (no invented package names/prices). Overpaid/
// underpaid rows apply a small, clearly-labeled illustrative delta on top
// of the real price, since no such real payment-discrepancy record exists
// anywhere in the app; every other row's amount is the exact real price.
export const demoTransactions: BillingTransaction[] = [
  { id: 'GD-3051', date: '2026-09-01', time: '23:59:06', features: [tkqcFeature, bmFeature, pageFeature], durationLabel: m("ui.48a1439d4b"), amount: bundlePrice, status: 'success' },
  { id: 'GD-3042', date: '2026-08-24', time: '14:12:40', features: [adsSaveFeature], durationLabel: '-', amount: adsSaveFeature.price, status: 'completed' },
  { id: 'GD-3033', date: '2026-08-15', time: '09:03:11', features: [tkqcFeature], durationLabel: m("ui.d468d58326"), amount: tkqcFeature.price, status: 'pending' },
  { id: 'GD-3024', date: '2026-08-05', time: '19:47:22', features: [pageFeature], durationLabel: m("ui.d468d58326"), amount: pageFeature.price, status: 'cancelled' },
  { id: 'GD-3015', date: '2026-07-20', time: '11:30:00', features: [bmFeature], durationLabel: m("ui.d468d58326"), amount: bmFeature.price, status: 'expired' },
  { id: 'GD-3006', date: '2026-07-10', time: '08:15:47', features: [controlHubFeature], durationLabel: m("ui.48a1439d4b"), amount: controlHubFeature.price + 2, status: 'overpaid' },
  { id: 'GD-2997', date: '2026-06-28', time: '16:52:03', features: [advanceToolkitFeature], durationLabel: m("ui.d468d58326"), amount: advanceToolkitFeature.price - 2, status: 'underpaid' },
  { id: 'GD-2988', date: '2026-06-14', time: '21:05:59', features: [tkqcFeature, bmFeature], durationLabel: m("ui.48a1439d4b"), amount: tkqcFeature.price + bmFeature.price, status: 'completed' },
]

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

// LEFT panel toolbar — Filter (status, multi-select) / Toàn thời gian (date
// range) / Tìm theo chức năng (search). Renders on the SAME row as the 3
// billing tabs (via BillingTabs' `trailing` slot), same as Quản lý gói
// cước's own toolbar. Owns all 3 filter states and reports the combined,
// filtered row set up via onFilteredChange so the table (rendered
// separately, below Curve D) can stay a plain presentational component.
type HistoryToolbarProps = {
  onFilteredChange: (rows: BillingTransaction[]) => void
}

export const AdsCheckBillingHistoryToolbar: FC<HistoryToolbarProps> = ({ onFilteredChange }) => {
  useAppLanguage();
  const [dateRange, setDateRange] = useState<BillingDateRange>(DEFAULT_BILLING_DATE_RANGE)
  const [datePickerRect, setDatePickerRect] = useState<DOMRect | null>(null)
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const toggleStatus = (key: string) => {
    setStatusFilter((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return demoTransactions.filter((transaction) => {
      if (dateRange.start && transaction.date < dateRange.start) return false
      if (dateRange.end && transaction.date > dateRange.end) return false
      if (statusFilter.size > 0 && !statusFilter.has(transaction.status)) return false
      if (query && !transaction.features.some((feature) => feature.title.toLowerCase().includes(query))) return false
      return true
    })
  }, [dateRange, statusFilter, searchQuery])

  useEffect(() => { onFilteredChange(filtered) }, [filtered, onFilteredChange])

  return (
    <div className="ads-billing-plan-toolbar">
      <AdsCheckBillingHistoryStatusFilter options={STATUS_FILTER_OPTIONS} selected={statusFilter} onToggle={toggleStatus} />
      <AdsCheckBillingDateRangeTrigger range={dateRange} onClick={(rect) => setDatePickerRect(rect)} />
      <label className="ads-billing-plan-search">
        <Search size={13} />
        <input type="text" placeholder={t("ui.ab12a5f679")} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
      </label>
      {datePickerRect && (
        <AdsCheckBillingDateRangePicker
          anchorRect={datePickerRect}
          value={dateRange}
          onApply={(range) => setDateRange(range.presetKey === 'custom' && !range.start ? computeBillingPresetRange('all-time') : range)}
          onClose={() => setDatePickerRect(null)}
        />
      )}
    </div>
  )
}

type HistoryPanelProps = {
  rows: BillingTransaction[]
  onNavigateToPurchase: () => void
}

// Main content — the large transaction table + 90-day footer note +
// pagination. Presentational only; all filter state lives in
// AdsCheckBillingHistoryToolbar above (see module comment).
export const AdsCheckBillingHistoryPanel: FC<HistoryPanelProps> = ({ rows, onNavigateToPurchase }) => { useAppLanguage(); return (
  <section className="ads-billing-panel ads-billing-history-panel" id="billing-history-panel" role="tabpanel" aria-labelledby="billing-history-tab">
    <div className="ads-billing-history-table-wrap">
      <table className="ads-billing-history-table">
        <thead>
          <tr>
            <th className="col-stt">{t("ui.91bbd3c017")}</th>
            <th className="col-date">{t("ui.328db6066a")}</th>
            <th className="col-feature">{t("ui.92a7afaa18")}</th>
            <th className="col-duration">{t("ui.c34c242453")}</th>
            <th className="col-amount">{t("ui.d5261b2d21")}</th>
            <th className="col-status">{t("ui.e03c1401e3")}</th>
            <th className="col-action">{t("ui.8e9fdd281d")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((transaction, index) => {
            const main = transaction.features[0]
            const extraCount = transaction.features.length - 1
            const Icon = main.icon
            const accent = featureAccent[main.id]
            const status = STATUS_META[transaction.status]
            return (
              <tr key={transaction.id}>
                <td className="col-stt">{index + 1}</td>
                <td className="col-date"><strong>{tx(formatShortDate(transaction.date))}</strong><small> · {tx(transaction.time)}</small></td>
                <td className="col-feature">
                  <span className="ads-billing-history-feature-icon" style={accent}><Icon size={14} /></span>
                  <span>{tx(main.title)}</span>
                  {extraCount > 0 && <span className="ads-billing-history-feature-more">{t("ui.cc88682f18")}{" "}{extraCount}</span>}
                </td>
                <td className="col-duration">{tx(transaction.durationLabel)}</td>
                <td className="col-amount"><strong>{tx(formatUsd(transaction.amount))}</strong></td>
                <td className="col-status"><span className="ads-billing-history-status-pill" style={{ color: status.color, background: status.background }}>{tx(status.label)}</span></td>
                <td className="col-action">
                  <button type="button" className="ads-billing-history-action" aria-label={t("ui.74d2399461")} title={t("ui.74d2399461")} onClick={onNavigateToPurchase}><ArrowUpRight size={14} /></button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {tx(rows.length === 0 && <div className="ads-billing-empty"><Search size={24} /><p>{t("ui.1417f6917b")}</p></div>)}
    </div>
    <footer className="ads-billing-history-footer">
      <span>{t("ui.f79bd81e9a")}</span>
      <span className="ads-billing-history-pagination">
        <button type="button" aria-label={t("ui.d676ae2541")} disabled><ChevronLeft size={14} /></button>
        <b>1/1</b>
        <button type="button" aria-label="Trang sau" disabled><ChevronRight size={14} /></button>
      </span>
    </footer>
  </section>
) }
