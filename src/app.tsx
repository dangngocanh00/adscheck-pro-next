import { useAppLanguage, t } from '@/i18n'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { AdsCheckV8LoadingScreen } from '@/features/ads-check/ads-check-v8-loading-screen'

const Dashboard = lazy(() => import('@/pages/dashboard-page'))
const Login = lazy(() => import('@/pages/login-page'))
const ProductLanding = lazy(() => import('@/pages/product-landing-page'))
const AdsSave = lazy(() => import('@/pages/ads-save-page'))
const AdsCheckProAdAccounts = lazy(() => import('@/pages/ads-check-pro-adaccounts-page'))
const AdsCheckDashboard = lazy(() => import('@/pages/ads-check-dashboard-page'))
const AdsCheckExtendedPayment = lazy(() => import('@/pages/ads-check-extended-payment-page'))
const AdsCheckBilling = lazy(() => import('@/pages/ads-check-billing-page'))
const AdsCheckNotification = lazy(() => import('@/pages/ads-check-notification-page'))
const AdsCheckAccount = lazy(() => import('@/pages/ads-check-account-page'))
const HrCenter = lazy(() => import('@/pages/hr-center-page'))
const OperationsInbox = lazy(() => import('@/pages/operations-inbox-page'))
const Documents = lazy(() => import('@/pages/documents-page'))
const OrgChart = lazy(() => import('@/pages/org-chart-page'))
const Employees = lazy(() => import('@/pages/employees-page'))
const EmployeeProfile = lazy(() => import('@/pages/employee-profile-page'))
const EmployeeForm = lazy(() => import('@/pages/employee-form-page'))
const Departments = lazy(() => import('@/pages/departments-page'))
const Approvals = lazy(() => import('@/pages/approvals-page'))
const Attendance = lazy(() => import('@/pages/attendance-page'))
const Payroll = lazy(() => import('@/pages/payroll-page'))
const Settings = lazy(() => import('@/pages/settings-page'))
const Styleguide = lazy(() => import('@/pages/styleguide-page'))
const NotFound = lazy(() => import('@/pages/not-found-page'))

function RouteSkeleton() {
  useAppLanguage();
  return <div className="route-skeleton" role="status"><span className="sr-only">{t("ui.f774f2161e")}</span><i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" /></div>
}

export default function App() {
  useAppLanguage();
  return <Suspense fallback={<RouteSkeleton />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/product" element={<ProductLanding />} />
      <Route path="/ads-save" element={<AdsSave />} />
      <Route path="/app/ads-save" element={<AdsSave />} />
      <Route path="/app/adscheck-pro/adaccounts" element={<Suspense fallback={<AdsCheckV8LoadingScreen />}><AdsCheckProAdAccounts /></Suspense>} />
      <Route path="/app/home" element={<AdsCheckDashboard />} />
      <Route path="/app/extended-payment" element={<AdsCheckExtendedPayment />} />
      <Route path="/app/billing/payment" element={<AdsCheckBilling />} />
      <Route path="/app/notification" element={<AdsCheckNotification />} />
      <Route path="/app/account" element={<AdsCheckAccount />} />
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="hr-center" element={<HrCenter />} />
        <Route path="work-inbox" element={<OperationsInbox />} />
        <Route path="documents" element={<Documents />} />
        <Route path="org-chart" element={<OrgChart />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeProfile />} />
        <Route path="departments" element={<Departments />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="settings" element={<Settings />} />
        <Route path="styleguide" element={<Styleguide />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  </Suspense>
}
