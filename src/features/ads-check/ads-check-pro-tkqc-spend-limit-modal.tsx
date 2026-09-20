import { useAppLanguage, t, tx, m } from '@/i18n'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Wallet, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { formatCurrency, type TkqcRow } from './ads-check-pro-tkqc-data'

type SpendLimitAction = 'change' | 'reset' | 'delete'

type TkqcSpendLimitModalProps = {
  row: TkqcRow
  onClose: () => void
  // Correction Batch 2 Part F/X: every mutation here is a LOCAL demo-state
  // change only — never a real Meta network call or fake "success" wording.
  onChangeLimit: (rowId: string, value: number) => void
  onResetLimit: (rowId: string) => void
  onDeleteLimit: (rowId: string) => void
}

// Correction Batch 2 Part F — "Đặt giới hạn chi tiêu" modal, replacing the
// old bare inline-editable spend-limit cell. Header/stat-card/action-pill
// layout follows the same centered-modal visual language as the Advanced
// Filter Builder (see ads-check-pro-column-menu.tsx's AdvancedFilterModal).
export function AdsProTkqcSpendLimitModal({ row, onClose, onChangeLimit, onResetLimit, onDeleteLimit }: TkqcSpendLimitModalProps) {
  useAppLanguage();
  const [action, setAction] = useState<SpendLimitAction>('change')
  const [value, setValue] = useState(() => row.spendLimit !== null ? String(row.spendLimit) : '')
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  const remaining = row.spendLimit === null ? null : Math.max(0, row.spendLimit - row.spentAgainstLimit)
  const parsedValue = Number(value.replace(/[^0-9]/g, ''))
  const canApply = action === 'change' ? value.trim() !== '' && Number.isFinite(parsedValue) && parsedValue >= 0 : true

  const handleApply = () => {
    if (action === 'change') onChangeLimit(row.id, parsedValue)
    else if (action === 'reset') onResetLimit(row.id)
    else onDeleteLimit(row.id)
    onClose()
  }

  return createPortal(
    <div className="ads-advanced-filter-backdrop" role="presentation">
      <section ref={panelRef} className="ads-spend-limit-modal" role="dialog" aria-modal="true" aria-labelledby="ads-spend-limit-title">
        <header className="ads-spend-limit-header">
          <span className="ads-spend-limit-icon" aria-hidden="true"><Wallet size={18} /></span>
          <h2 id="ads-spend-limit-title">{t("ui.10d440a968")}</h2>
          <button type="button" className="ads-spend-limit-close" aria-label={t("ui.d2b73ab2ad")} data-autofocus onClick={onClose}><X size={16} /></button>
        </header>

        <div className="ads-spend-limit-account-card">
          <strong>{row.name}</strong>
          <span>{t("ui.d789a1e992")}{" "}{row.accountId}</span>
        </div>

        <div className="ads-spend-limit-stats">
          <div className="ads-spend-limit-stat">
            <span>{t("ui.7c8a4dee58")}</span>
            <strong>{tx(row.spendLimit === null ? '-' : formatCurrency(row.spendLimit, row.currency))}</strong>
          </div>
          <div className="ads-spend-limit-stat">
            <span>{t("ui.25d7d2f7f5")}</span>
            <strong>{tx(formatCurrency(row.spentAgainstLimit, row.currency))}</strong>
          </div>
          <div className="ads-spend-limit-stat">
            <span>{t("ui.226a53fa2c")}</span>
            <strong>{tx(remaining === null ? '-' : formatCurrency(remaining, row.currency))}</strong>
          </div>
        </div>

        <div className="ads-spend-limit-action-group">
          <span className="ads-spend-limit-action-label">{t("ui.8e9fdd281d")}</span>
          <div className="ads-spend-limit-pills" role="radiogroup" aria-label={t("ui.8daffe0e3d")}>
            {tx((['change', 'reset', 'delete'] as const).map((option) => <button
              key={option}
              type="button"
              role="radio"
              aria-checked={action === option}
              className={`ads-spend-limit-pill${action === option ? ' is-active' : ''}`}
              onClick={() => setAction(option)}
            >{tx(option === 'change' ? m("ui.383daa9288") : option === 'reset' ? m("ui.a845d57f36") : m("ui.093b3aa2a7"))}</button>))}
          </div>
        </div>

        {action === 'change' && <div className="ads-spend-limit-form">
          <label className="ads-spend-limit-input-label">
            {t("ui.348411a52c")}{" "}<span className="ads-spend-limit-input-wrap">
              <input inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value)} aria-label={t("ui.348411a52c")} />
              <em>{row.currency}</em>
            </span>
          </label>
          <p className="ads-spend-limit-warning">{t("ui.e96a0a8618")}</p>
        </div>}
        {action === 'reset' && <p className="ads-spend-limit-warning">{t("ui.3415013267")}</p>}
        {action === 'delete' && <p className="ads-spend-limit-warning">{t("ui.e054589d4c")}</p>}

        <footer className="ads-spend-limit-footer">
          <button type="button" className="is-secondary" onClick={onClose}>{t("ui.34ca764caf")}</button>
          <button type="button" className={action === 'delete' ? 'is-destructive' : 'is-primary'} disabled={!canApply} onClick={handleApply}>
            {tx(action === 'change' ? m("ui.383daa9288") : action === 'reset' ? m("ui.a845d57f36") : m("ui.093b3aa2a7"))}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
