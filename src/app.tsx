import { useAppLanguage, t } from '@/i18n'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdsCheckV8LoadingScreen } from '@/features/ads-check/ads-check-v8-loading-screen'

const AdsSave = lazy(() => import('@/pages/ads-save-page'))
const AdsCheckProAdAccounts = lazy(() => import('@/pages/ads-check-pro-adaccounts-page'))
const AdsCheckDashboard = lazy(() => import('@/pages/ads-check-dashboard-page'))
const AdsCheckExtendedPayment = lazy(() => import('@/pages/ads-check-extended-payment-page'))
const AdsCheckBilling = lazy(() => import('@/pages/ads-check-billing-page'))
const AdsCheckNotification = lazy(() => import('@/pages/ads-check-notification-page'))
const AdsCheckAccount = lazy(() => import('@/pages/ads-check-account-page'))

function RouteSkeleton() {
  useAppLanguage();
  return <div className="route-skeleton" role="status"><span className="sr-only">{t("ui.f774f2161e")}</span><i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" /></div>
}

export default function App() {
  useAppLanguage();
  return <Suspense fallback={<RouteSkeleton />}>
    <Routes>
      <Route path="/ads-save" element={<AdsSave />} />
      <Route path="/app/ads-save" element={<AdsSave />} />
      <Route path="/app/adscheck-pro/adaccounts" element={<Suspense fallback={<AdsCheckV8LoadingScreen />}><AdsCheckProAdAccounts /></Suspense>} />
      <Route path="/app/home" element={<AdsCheckDashboard />} />
      <Route path="/app/extended-payment" element={<AdsCheckExtendedPayment />} />
      <Route path="/app/billing/payment" element={<AdsCheckBilling />} />
      <Route path="/app/notification" element={<AdsCheckNotification />} />
      <Route path="/app/account" element={<AdsCheckAccount />} />
      <Route path="/" element={<Navigate to="/app/adscheck-pro/adaccounts" replace />} />
      <Route path="*" element={<Navigate to="/app/adscheck-pro/adaccounts" replace />} />
    </Routes>
  </Suspense>
}
