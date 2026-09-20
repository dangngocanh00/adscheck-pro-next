import { useSyncExternalStore } from 'react'
import vi from './vi'
import en from './en.json'
import ru from './ru.json'
import th from './th.json'
import zh from './zh.json'

export type AppLanguage = 'vi' | 'en' | 'ru' | 'th' | 'zh'
const languages = new Set<AppLanguage>(['vi', 'en', 'ru', 'th', 'zh'])
export const appLanguageOptions = [
  { code: 'vi', label: vi['ui.4993440c23'], flag: 'vn' },
  { code: 'en', label: 'English', flag: 'england' },
  { code: 'ru', label: vi['ui.5537fc8e69'], flag: 'ru' },
  { code: 'th', label: vi['ui.7160c86e70'], flag: 'th' },
  { code: 'zh', label: '中文', flag: 'cn' },
] as const satisfies readonly { code: AppLanguage; label: string; flag: string }[]
export function getAppLanguageLabel(language: AppLanguage) {
  return appLanguageOptions.find((item) => item.code === language)?.label ?? vi['ui.4993440c23']
}
const storageKey = 'adscheck-language'
const legacyStorageKey = 'ads-check-session-language'
const listeners = new Set<() => void>()
const valid = (value: string | null): value is AppLanguage => languages.has(value as AppLanguage)
function readLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(storageKey) ?? sessionStorage.getItem(legacyStorageKey)
    return valid(stored) ? stored : 'vi'
  } catch { return 'vi' }
}
let language: AppLanguage = typeof window === 'undefined' ? 'vi' : readLanguage()
const dictionaries: Record<AppLanguage, Record<string, string>> = { vi, en, ru, th, zh }
const missingWarnings = new Set<string>()
const originals: Record<string, string> = vi
const reverse = new Map(Object.entries(originals).map(([key, value]) => [value, key]))
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const templates = Object.entries(originals).filter(([, value]) => /\{\d+\}/.test(value)).map(([key, value]) => {
  const slots: string[] = []
  const chunks = value.split(/(\{\d+\})/g).map(chunk => {
    if (/^\{\d+\}$/.test(chunk)) { slots.push(chunk.slice(1, -1)); return '(.*?)' }
    return escapeRegex(chunk)
  })
  return { key, slots, pattern: new RegExp(`^${chunks.join('')}$`, 's'), specificity: value.replace(/\{\d+\}/g, '').length }
}).sort((a, b) => b.specificity - a.specificity)

export function getAppLanguage() { return language }
export function getAppLocale() { return ({ vi: 'vi-VN', en: 'en-US', ru: 'ru-RU', th: 'th-TH', zh: 'zh-CN' } as const)[language] }
export function subscribeLanguage(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
function publish() {
  if (typeof document !== 'undefined') document.documentElement.lang = language
  listeners.forEach(listener => listener())
}
export function setAppLanguage(next: AppLanguage) {
  if (!languages.has(next)) return
  try { localStorage.setItem(storageKey, next); sessionStorage.setItem(legacyStorageKey, next) } catch { /* In-memory switching still works. */ }
  if (language !== next) { language = next; publish() }
}
if (typeof window !== 'undefined') {
  document.documentElement.lang = language
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return
    const next = readLanguage()
    if (next !== language) { language = next; publish() }
  })
}
export function useAppLanguage() { return useSyncExternalStore(subscribeLanguage, getAppLanguage, () => 'vi' as const) }
type Parameters = Record<string | number, string | number | null | undefined>
function interpolate(text: string, params: Parameters) {
  return text.replace(/\{(\d+)\}/g, (match, slot: string) => params[slot] == null ? match : String(params[slot]))
}
/** Canonical source messages for existing state, enums and module-level metadata.
 * Keeping these stable prevents a language change from changing IDs, filters,
 * keys, selections or text already stored in a toast. Translate at presentation. */
export function m<K extends keyof typeof vi>(key: K): (typeof vi)[K]
export function m(key: string, params: Parameters): string
export function m(key: string, params: Parameters = {}): string { return interpolate(originals[key] ?? '', params) }
/** Missing messages fall back safely, with one development warning per key. */
export function t(key: string, params: Parameters = {}): string {
  return translate(key, params, language)
}
export function translate(key: string, params: Parameters = {}, target: AppLanguage = language): string {
  if (import.meta.env.DEV && dictionaries[target][key] === undefined && !missingWarnings.has(`${target}:${key}`)) {
    missingWarnings.add(`${target}:${key}`)
    console.warn(`[i18n] Missing translation: ${target}:${key}`)
  }
  return interpolate(dictionaries[target][key] ?? originals[key] ?? '', params)
    .replace(/&nbsp;/g, '\u00a0').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}
/** Explicit presentation boundary for existing label/message data. Never use
 * on user-entered values, identifiers, emails, IPs or raw backend fields. */
export function tx<T>(value: T, target: AppLanguage = language): T {
  if (typeof value !== 'string' || target === 'vi') return value
  const key = reverse.get(value)
  if (key) return translate(key, {}, target) as T
  for (const template of templates) {
    const match = template.pattern.exec(value)
    if (match) return translate(template.key, Object.fromEntries(template.slots.map((slot, i) => [slot, match[i + 1]])), target) as T
  }
  return value
}
