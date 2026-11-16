import { Check } from 'lucide-react'
import { PurchasePlanVisual } from './purchase-plan-visual'
import { t, tx, m, useAppLanguage } from '@/i18n'
import { allBillingFeatures, bundlePrice, formatUsd } from './ads-check-billing-data'
import { PurchasePlanHero, PurchaseValueStrip, type PurchaseExperienceProps } from './purchase-experience-shared'

export function PriorityPurchaseExperience({ selectedFeatureIds, bundleSelected, toggleBundle, toggleFeature }: PurchaseExperienceProps) {
  useAppLanguage()
  return <div className="purchase-experience purchase-priority-experience">
    <PurchasePlanHero tier="priority" />
    <label className="purchase-priority-bundle">
      <input type="checkbox" checked={bundleSelected} onChange={toggleBundle} aria-label={t('ui.4fe64e8209')} />
      <PurchasePlanVisual plan="priority" variant="compact" /><span><small>{t('ui.94dffe47a1')}</small><strong>{t('purchase.included')}</strong><p>{t('purchase.bundleIntro')}</p></span>
      <span className="purchase-bundle-price"><b>{formatUsd(bundlePrice)}</b><small>{t('ui.03be1e7c75')}</small></span>
      <i className="purchase-selection-mark" aria-hidden="true"><Check size={14} /></i>
    </label>
    <section className="purchase-priority-deck-section">
      <div className="purchase-section-heading"><h3>{t('purchase.included')}</h3><span>{allBillingFeatures.length} {t('ui.c8afce04f5')}</span></div>
      <p className="purchase-customize-note">{t('purchase.customizeNote')}</p>
      <div className="purchase-priority-deck">{allBillingFeatures.map(feature => {
        const Icon = feature.icon
        return <label key={feature.id} className="purchase-priority-tile">
          <input type="checkbox" checked={selectedFeatureIds.includes(feature.id)} onChange={() => toggleFeature(feature.id)} aria-label={tx(m('ui.84da3235c3', { 0: feature.title }))} />
          <i className="purchase-selection-mark" aria-hidden="true"><Check size={12} /></i>
          <Icon size={26} /><strong>{tx(feature.title)}</strong><small>{feature.featureCount ? `${feature.featureCount} ${t('ui.c8afce04f5')}` : t('purchase.inBundle')}</small>
        </label>
      })}</div>
    </section>
    <PurchaseValueStrip tier="priority" />
    <section className="purchase-comparison">
      <h3>{t('purchase.compare')}</h3>
      <p>{t('purchase.compareNote')}</p>
      <table><thead><tr><th scope="col">{t('purchase.category.all')}</th><th scope="col">{t('purchase.pro.name')}</th><th scope="col">{t('purchase.priority.name')}</th></tr></thead>
        <tbody>{allBillingFeatures.map(feature => <tr key={feature.id}><th scope="row">{tx(feature.title)}</th>
          <td><Check size={15} aria-hidden="true" /><span className="ads-visually-hidden">{t('purchase.available')}</span></td>
          <td><Check size={15} aria-hidden="true" /><span className="ads-visually-hidden">{t('purchase.inBundle')}</span></td>
        </tr>)}</tbody>
      </table>
    </section>
  </div>
}
