import { Bookmark, CreditCard, Home, Package } from 'lucide-react'
import { m } from '@/i18n'
import { AdsCheckProAppIcon } from './ads-check-pro-app-icon'

// The existing module order/routes, shared by rail, drawer and bottom navigation.
export const adsCheckShellNavigation = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, to: '/app/home' },
  { key: 'adscheck-pro', label: 'Toolmeta Pro', icon: AdsCheckProAppIcon, to: '/app/adscheck-pro/adaccounts' },
  { key: 'extended-payment', label: 'Extended Payment', icon: CreditCard, to: '/app/extended-payment' },
  { key: 'ads-save', label: 'Ads Save', icon: Bookmark, to: '/app/ads-save' },
  { key: 'billing', label: m('ui.b90857eb2c'), icon: Package, to: '/app/billing/payment' },
]
