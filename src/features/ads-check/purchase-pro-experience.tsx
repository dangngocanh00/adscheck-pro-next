import { useState, type FC } from 'react'
import { Check, Gift, LayoutGrid, Smartphone, Sparkles } from 'lucide-react'
import { useAppLanguage, tx, m, t } from '@/i18n'
import { assetManagementFeatures, otherBillingFeatures, controlHubFeature, bundlePrice, formatUsd, type BillingFeature } from './ads-check-billing-data'
import { PurchasePlanHero, PurchaseValueStrip, type PurchaseExperienceProps } from './purchase-experience-shared'
type BillingFeatureCardProps = {
  feature: BillingFeature
  checked: boolean
  onToggle: (featureId: string) => void
}

const BillingFeatureCard: FC<BillingFeatureCardProps> = ({ feature, checked, onToggle }) => {
  useAppLanguage();
  const Icon = feature.icon
  return (
    <label className={`ads-purchase-feature-card${checked ? ' is-selected' : ''}`}>
      <input type="checkbox" aria-label={tx(m("ui.84da3235c3", { 0: feature.title }))} checked={checked} onChange={() => onToggle(feature.id)} />
      <i className="ads-purchase-checkbox" aria-hidden="true"><Check size={12} /></i>
      <span className="ads-purchase-feature-icon"><Icon size={17} /></span>
      <strong>{tx(feature.title)}</strong>
      <div><b>{tx(formatUsd(feature.price))}</b><small>{t("ui.03be1e7c75")}</small></div>
      {feature.featureCount && <span className="ads-purchase-feature-count">{feature.featureCount} {" "}{t("ui.c8afce04f5")}</span>}
      <p><Gift size={13} />{tx(feature.note)}</p>
    </label>
  )
}

const BillingFeatureRow: FC<BillingFeatureCardProps> = ({ feature, checked, onToggle }) => {
  useAppLanguage();
  const Icon = feature.icon
  return (
    <label className={`ads-purchase-feature-row${checked ? ' is-selected' : ''}`}>
      <input type="checkbox" aria-label={tx(m("ui.84da3235c3", { 0: feature.title }))} checked={checked} onChange={() => onToggle(feature.id)} />
      <span className="ads-purchase-feature-row-icon"><Icon size={16} /></span>
      <strong>{tx(feature.title)}</strong>
      <span className="ads-purchase-feature-row-price"><b>{tx(formatUsd(feature.price))}</b><small>{t("ui.03be1e7c75")}</small></span>
      <i className="ads-purchase-checkbox" aria-hidden="true"><Check size={12} /></i>
    </label>
  )
}

export function ProPurchaseExperience({ selectedFeatureIds, bundleSelected, toggleBundle, toggleFeature }: PurchaseExperienceProps) {
  useAppLanguage()
  const [category, setCategory] = useState('all')
  const adsSaveFeature = otherBillingFeatures.find(feature => feature.id === 'ads-save')
  return <div className="purchase-experience purchase-pro-experience">
    <PurchasePlanHero tier="pro" />
    <nav className="purchase-category-nav" aria-label={t('purchase.categories')}>
      {['all', 'assets', 'other'].map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{t('purchase.category.' + value)}</button>)}
    </nav>
          {category === 'all' && <><label className={`ads-purchase-bundle${bundleSelected ? ' is-selected' : ''}`}>
            <span><strong>{t("ui.8ed4abee74")}</strong><b>{t("ui.94dffe47a1")}</b></span>
            <span><strong>{tx(formatUsd(bundlePrice))}</strong><small>{t("ui.03be1e7c75")}</small></span>
            <input type="checkbox" aria-label={t("ui.4fe64e8209")} checked={bundleSelected} onChange={toggleBundle} />
            <i className="ads-purchase-checkbox" aria-hidden="true"><Check size={12} /></i>
          </label>

          <label className={`ads-purchase-control-hub${selectedFeatureIds.includes(controlHubFeature.id) ? ' is-selected' : ''}`}>
            <span className="ads-purchase-phone-art" aria-hidden="true"><i /><i /><i /></span>
            <span className="ads-purchase-control-copy"><strong><Smartphone size={17} />{t("ui.83612f5980")}{" "}<b>{t("ui.2cc668ec65")}</b></strong><small><Smartphone size={13} />{t("ui.980d0958da")}</small></span>
            <span className="ads-purchase-control-price"><strong>{tx(formatUsd(controlHubFeature.price))}</strong><small>{t("ui.03be1e7c75")}</small></span>
            <input type="checkbox" aria-label={t("ui.20941760ce")} checked={selectedFeatureIds.includes(controlHubFeature.id)} onChange={() => toggleFeature(controlHubFeature.id)} />
            <i className="ads-purchase-checkbox" aria-hidden="true"><Check size={12} /></i>
          </label>

          </>}
          {category !== 'other' && <section className="ads-purchase-feature-section" aria-labelledby="asset-features-title">
            <h2 id="asset-features-title"><LayoutGrid size={17} />{t("ui.33f94ab6d6")}</h2>
            <div className="ads-purchase-asset-grid">
              {assetManagementFeatures.map((feature) => <BillingFeatureCard key={feature.id} feature={feature} checked={selectedFeatureIds.includes(feature.id)} onToggle={toggleFeature} />)}
            </div>
          </section>

          }
          {category !== 'assets' && <section className="ads-purchase-feature-section ads-purchase-other-section" aria-labelledby="other-features-title">
            <h2 id="other-features-title"><Sparkles size={17} />{t("ui.b6e118962b")}</h2>
            <div className="ads-purchase-feature-rows">
              {adsSaveFeature && <BillingFeatureRow feature={adsSaveFeature} checked={selectedFeatureIds.includes(adsSaveFeature.id)} onToggle={toggleFeature} />}
            </div>
          </section>}
    <PurchaseValueStrip tier="pro" />
  </div>
}
