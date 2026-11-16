import { AdsCheckProductShell } from '@/features/ads-check/ads-check-product-shell'
import { AdsCheckHomeContent } from '@/features/ads-check/ads-check-home-content'
import '@/styles/ads-check-home.css'

export default function AdsCheckDashboardPage() {
  return <AdsCheckProductShell activeNavigation="dashboard">
    <AdsCheckHomeContent />
  </AdsCheckProductShell>
}
