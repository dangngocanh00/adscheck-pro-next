import { createContext, useContext } from 'react'

export const toolmetaDemoAccount = {
  id: 'ADSCHECK-DEMO',
  email: 'demo@toolmeta.example',
  licenseKey: 'TM-DEMO-ADSCHECK-2026',
  expiresAt: '2026-12-18T23:59:59.999+07:00',
} as const

type ToolmetaSession = {
  email: string | null
  openAuth: () => void
  signOut: () => void
}

export const ToolmetaSessionContext = createContext<ToolmetaSession | null>(null)

export function useToolmetaSession() {
  const session = useContext(ToolmetaSessionContext)
  if (!session) throw new Error('ToolmetaSessionProvider is required')
  return session
}
