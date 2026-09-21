import { Bookmark, Box, ChartNoAxesColumnIncreasing, House, WalletCards } from 'lucide-react'

// Shared desktop module rail; other navigation surfaces keep their own icons.
const moduleIcons = {
  '/app/home': House,
  '/app/adscheck-pro/adaccounts': ChartNoAxesColumnIncreasing,
  '/app/extended-payment': WalletCards,
  '/app/ads-save': Bookmark,
  '/app/billing/payment': Box,
}

export function AdsCheckModuleIcon({ route }: { route: string }) {
  const Icon = moduleIcons[route as keyof typeof moduleIcons] ?? Box
  return <Icon size={20} strokeWidth={2.05} aria-hidden="true" />
}
