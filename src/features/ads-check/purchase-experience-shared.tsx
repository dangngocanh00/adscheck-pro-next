import { Boxes, Check, Headphones, SlidersHorizontal, TrendingUp, Zap } from 'lucide-react'
import { PurchasePlanVisual } from './purchase-plan-visual'
import { t, useAppLanguage } from '@/i18n'
import type { BillingTier } from './ads-check-billing-data'

export type PurchaseExperienceProps = {
  selectedFeatureIds: string[]
  bundleSelected: boolean
  toggleBundle: () => void
  toggleFeature: (id: string) => void
}

export function PurchasePlanSwitch({ tier, onChange }: { tier: BillingTier; onChange: (tier: BillingTier) => void }) {
  useAppLanguage()
  return <div className="purchase-plan-switch" role="radiogroup" aria-label={t('ui.6109cb170c')}>
    {(['pro', 'priority'] as const).map(plan => {
      return <button type="button" role="radio" key={plan} data-plan-choice={plan} aria-checked={tier === plan} tabIndex={tier === plan ? 0 : -1} onClick={() => onChange(plan)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'pro' : event.key === 'End' ? 'priority' : plan === 'pro' ? 'priority' : 'pro'
        onChange(next)
        event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-plan-choice="${next}"]`)?.focus()
      }}>
        <span className="purchase-plan-icon" aria-hidden="true"><PurchasePlanVisual plan={plan} variant="compact" /></span>
        <span className="purchase-plan-label"><strong>{t('purchase.' + plan + '.name')}</strong><small>{t('purchase.' + plan + '.choice')}</small></span>
        <i className="purchase-selection-mark" aria-hidden="true"><Check size={20} strokeWidth={2.5} /></i>
      </button>
    })}
  </div>
}

export function PurchasePlanHero({ tier }: { tier: BillingTier }) {
  return <header className="purchase-plan-hero">
    <div className="purchase-hero-copy"><span className="purchase-plan-badge">{t('purchase.' + tier + '.name')}</span>
      <h2>{t('purchase.' + tier + '.headline')}</h2>
      <p>{t('purchase.' + tier + '.intro')}</p>
      <div className="purchase-hero-chips">{[0, 1, 2].map(index => <span key={index}><Check size={12} />{t('purchase.' + tier + '.value' + index)}</span>)}</div>
    </div>
    <div className="purchase-hero-art"><PurchasePlanVisual plan={tier} /></div>
  </header>
}

export function PurchaseValueStrip({ tier }: { tier: BillingTier }) {
  const icons = tier === 'pro' ? [SlidersHorizontal, TrendingUp, Zap] : [Headphones, Boxes, TrendingUp]
  return <section className="purchase-value-section">
    <h3>{t('purchase.' + tier + '.benefits')}</h3>
    <div className="purchase-value-grid">{icons.map((Icon, index) => <article key={index}>
      <Icon size={21} /><strong>{t('purchase.' + tier + '.value' + index)}</strong><p>{t('purchase.' + tier + '.detail' + index)}</p>
    </article>)}</div>
  </section>
}
