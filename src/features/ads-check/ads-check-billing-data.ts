import { m } from '@/i18n'
import {
  Bookmark,
  Boxes,
  BriefcaseBusiness,
  Layers3,
  PanelsTopLeft,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export type BillingTier = 'pro' | 'priority'

export type BillingOrderDraft = {
  tier: BillingTier
  paymentMethod: string
  months: number
  selectedFeatures: number
  coupon: string
  sessionPrice: number
  subtotal: number
  durationDiscount: number
  couponDiscount: number
  total: number
}

export type BillingFeature = {
  id: string
  title: string
  price: number
  originalPrice: number
  featureCount?: number
  note: string
  icon: LucideIcon
}

export const controlHubFeature: BillingFeature = {
  id: 'control-hub',
  title: 'Control Hub',
  price: 20,
  originalPrice: 20,
  note: m("ui.c8b13b0fd2"),
  icon: Sparkles,
}

export const assetManagementFeatures: BillingFeature[] = [
  { id: 'ads-account', title: m("ui.1713ea4c07"), price: 20, originalPrice: 20, featureCount: 23, note: m("ui.270aa00d7b"), icon: PanelsTopLeft },
  { id: 'businesses', title: m("ui.104708db37"), price: 16, originalPrice: 16, featureCount: 28, note: m("ui.2f9a760d9e"), icon: BriefcaseBusiness },
  { id: 'pages', title: m("ui.08a0727d1d"), price: 10, originalPrice: 10, featureCount: 17, note: m("ui.8b32084a23"), icon: Layers3 },
  { id: 'advance-toolkit', title: 'Advance Toolkit', price: 10, originalPrice: 10, note: m("ui.71c5f5fb04"), icon: Boxes },
]

export const otherBillingFeatures: BillingFeature[] = [
  { id: 'ads-save', title: 'Ads Save', price: 12, originalPrice: 12, featureCount: 12, note: m("ui.079518ff43"), icon: Bookmark },
]

export const allBillingFeatures = [controlHubFeature, ...assetManagementFeatures, ...otherBillingFeatures]
export const bundleDiscount = .2
// "Trọn bộ tính năng Ads Check" chỉ cộng giá các tính năng đang thực sự hiển thị/mua
// riêng lẻ trong Mua gói. Advance Toolkit không cộng thêm vì đã được tặng kèm khi có
// đủ TKQC + BM + Page (xem `note` của từng thẻ) nên sẽ trùng phí nếu tính lại ở đây.
const bundlePricedFeatures = [
  controlHubFeature,
  ...assetManagementFeatures.filter((feature) => feature.id !== 'advance-toolkit'),
  ...otherBillingFeatures.filter((feature) => feature.id === 'ads-save'),
]
export const bundleListPrice = bundlePricedFeatures.reduce((sum, feature) => sum + feature.price, 0)
export const roundUsd = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
export const bundlePrice = roundUsd(bundleListPrice * (1 - bundleDiscount))

export const sessionUpgradeOptions = [
  { id: 'none', label: m("ui.18506c8e9c"), sessions: 0, price: 0 },
  { id: 'plus50', label: m("ui.a6546aa83b"), sessions: 50, price: 20 },
  { id: 'plus30', label: m("ui.f88a97afb3"), sessions: 30, price: 15 },
  { id: 'plus10', label: m("ui.2fa95fee69"), sessions: 10, price: 6 },
] as const

export function formatUsd(value: number): string {
  const amount = roundUsd(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
