import { getAppLanguage, setAppLanguage, subscribeLanguage } from '@/i18n'
export type AdsCheckVersion = 'v6' | 'v8'
export type AdsCheckLanguage = 'vi' | 'en' | 'ru' | 'th' | 'zh'
export type AdsCheckLoginSessionPreference = 'pro' | 'regular'

const versionPreferenceKey = 'ads-check-version-preference'
const versionSessionKey = 'ads-check-session-version'
const loginSessionKey = 'ads-check-selected-login-session'
const extensionReadyKey = 'ads-check-extension-ready'
const stateChangeEvent = 'ads-check-session-state-change'

const versions = new Set<AdsCheckVersion>(['v6', 'v8'])
const loginSessions = new Set<AdsCheckLoginSessionPreference>(['pro', 'regular'])

function notifySessionStateChanged() {
  window.dispatchEvent(new Event(stateChangeEvent))
}

export function subscribeAdsCheckSessionState(listener: () => void) {
  const unsubscribeLanguage = subscribeLanguage(listener)
  window.addEventListener(stateChangeEvent, listener)
  window.addEventListener('storage', listener)
  return () => {
    unsubscribeLanguage()
    window.removeEventListener(stateChangeEvent, listener)
    window.removeEventListener('storage', listener)
  }
}

export function readAdsCheckVersion(): AdsCheckVersion | null {
  try {
    const sessionValue = window.sessionStorage.getItem(versionSessionKey) as AdsCheckVersion | null
    if (sessionValue && versions.has(sessionValue)) return sessionValue
    const savedDefault = window.localStorage.getItem(versionPreferenceKey) as AdsCheckVersion | null
    return savedDefault && versions.has(savedDefault) ? savedDefault : null
  } catch {
    return null
  }
}

export function writeAdsCheckVersion(version: AdsCheckVersion, remember?: boolean) {
  try {
    window.sessionStorage.setItem(versionSessionKey, version)
    if (remember === true) window.localStorage.setItem(versionPreferenceKey, version)
    if (remember === false) window.localStorage.removeItem(versionPreferenceKey)
    notifySessionStateChanged()
    return true
  } catch {
    return false
  }
}

export function readAdsCheckDefaultV6() {
  try {
    return window.localStorage.getItem(versionPreferenceKey) === 'v6'
  } catch {
    return false
  }
}

export function writeAdsCheckDefaultV6(enabled: boolean) {
  try {
    window.localStorage.setItem(versionPreferenceKey, enabled ? 'v6' : 'v8')
    notifySessionStateChanged()
    return true
  } catch {
    return false
  }
}

export function readAdsCheckLanguage(): AdsCheckLanguage {
  return getAppLanguage()
}

export function writeAdsCheckLanguage(language: AdsCheckLanguage) {
  setAppLanguage(language)
  return true
}

export function readAdsCheckLoginSession(): AdsCheckLoginSessionPreference | null {
  try {
    const value = window.sessionStorage.getItem(loginSessionKey) as AdsCheckLoginSessionPreference | null
    return value && loginSessions.has(value) ? value : null
  } catch {
    return null
  }
}

export function writeAdsCheckLoginSession(session: AdsCheckLoginSessionPreference) {
  try {
    window.sessionStorage.setItem(loginSessionKey, session)
    notifySessionStateChanged()
    return true
  } catch {
    return false
  }
}

export function readAdsCheckExtensionReady() {
  try {
    return window.sessionStorage.getItem(extensionReadyKey) === 'true'
  } catch {
    return false
  }
}

export function writeAdsCheckExtensionReady(ready: boolean) {
  try {
    window.sessionStorage.setItem(extensionReadyKey, String(ready))
    notifySessionStateChanged()
    return true
  } catch {
    return false
  }
}
