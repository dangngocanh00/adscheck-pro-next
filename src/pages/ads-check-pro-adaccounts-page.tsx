import { useAppLanguage } from '@/i18n'
import AdsSavePage from '@/pages/ads-save-page'

export default function AdsCheckProAdAccountsPage() {
  useAppLanguage();
  return <AdsSavePage variant="ads-check-pro" />
}
