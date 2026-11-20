import { useId, useState } from 'react'
import { Eye, EyeOff, Save, Trash2 } from 'lucide-react'
import { appLanguageOptions, setAppLanguage, translate, useAppLanguage, type AppLanguage } from '@/i18n'
import { toolmetaDemoAccount } from '@/features/ads-check/toolmeta-session'
import '@/styles/toolmeta-account-settings.css'

function readLicense(storageKey: string) {
  try { return sessionStorage.getItem(storageKey) ?? '' } catch { return '' }
}

export function ToolmetaAccountSettings({ email }: { email: string }) {
  const language = useAppLanguage()
  const t = (key: string) => translate(key, {}, language === 'vi' ? 'vi' : 'en')
  const id = useId()
  const issuedAccount = email === toolmetaDemoAccount.email ? toolmetaDemoAccount : null
  const expiresAt = issuedAccount ? new Date(issuedAccount.expiresAt) : null
  const licenseActive = expiresAt !== null && Date.now() <= expiresAt.getTime()
  const storageKey = `toolmeta-preview-license:${email}`
  const [license, setLicense] = useState(() => readLicense(storageKey))
  const [showLicense, setShowLicense] = useState(Boolean(issuedAccount))
  const [pendingLanguage, setPendingLanguage] = useState<AppLanguage>(language)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const saveLicense = () => {
    const value = license.trim()
    if (!value) {
      setNotice('accountSettings.enterKey')
      return
    }
    try {
      sessionStorage.setItem(storageKey, value)
      setLicense(value)
      setShowLicense(false)
      setNotice('accountSettings.keySaved')
    } catch {
      setNotice('accountSettings.storageUnavailable')
    }
  }

  const removeLicense = () => {
    try {
      sessionStorage.removeItem(storageKey)
      setLicense('')
      setShowLicense(false)
      setNotice('accountSettings.dataCleared')
    } catch {
      setNotice('accountSettings.storageUnavailable')
    }
    setConfirmDelete(false)
  }

  const copyIssuedLicense = async () => {
    if (!issuedAccount) return
    try {
      await navigator.clipboard.writeText(issuedAccount.licenseKey)
      setNotice('accountSettings.keyCopied')
    } catch {
      setShowLicense(true)
      setNotice('accountSettings.copyFailed')
    }
  }

  return (
    <div className="toolmeta-account-settings">
      <div className="toolmeta-account-settings-field">
        <label htmlFor={`${id}-account`}>{t('accountSettings.accountId')}</label>
        <input id={`${id}-account`} value={toolmetaDemoAccount.id} readOnly />
      </div>
      <div className="toolmeta-account-settings-field">
        <div className="toolmeta-account-settings-label">
          <label htmlFor={`${id}-license`}>License Key</label>
          <small id={`${id}-license-status`} className={licenseActive ? 'is-active' : undefined}>
            {t(issuedAccount ? licenseActive ? 'accountSettings.active' : 'accountSettings.expired' : 'accountSettings.inactive')}
          </small>
        </div>
        <div className="toolmeta-account-key-row">
          <div className="toolmeta-account-key-input">
            <input id={`${id}-license`} type={showLicense ? 'text' : 'password'} autoComplete="off" aria-describedby={`${id}-license-status${expiresAt ? ` ${id}-license-expiry` : ''}`} placeholder="License key" readOnly={Boolean(issuedAccount)} value={issuedAccount?.licenseKey ?? license} onChange={event => setLicense(event.target.value)} />
            <button type="button" aria-label={t(showLicense ? 'accountSettings.hideKey' : 'accountSettings.showKey')} aria-pressed={showLicense} onClick={() => setShowLicense(value => !value)}>
              {showLicense ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            </button>
          </div>
          {issuedAccount ? <button type="button" onClick={copyIssuedLicense}>{t('accountSettings.copyKey')}</button>
            : <button type="button" onClick={saveLicense}>{t('accountSettings.saveKey')}</button>}
        </div>
        {expiresAt && <p id={`${id}-license-expiry`} className="toolmeta-account-license-expiry">
          {t('accountSettings.sharedExpiry')} <time dateTime={issuedAccount?.expiresAt}>
            {new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(expiresAt)}
          </time>
        </p>}
      </div>
      <div className="toolmeta-account-settings-field">
        <label htmlFor={`${id}-language`}>Language — Ngôn ngữ</label>
        <select id={`${id}-language`} value={pendingLanguage} onChange={event => setPendingLanguage(event.target.value as AppLanguage)}>
          {appLanguageOptions.map(option => (
            <option value={option.code} key={option.code}>{option.code === 'vi' ? 'Vietnamese — Tiếng Việt' : option.label}</option>
          ))}
        </select>
      </div>
      <div className="toolmeta-account-settings-actions">
        <button type="button" onClick={() => { setAppLanguage(pendingLanguage); setNotice('accountSettings.settingsSaved') }}><Save size={14} aria-hidden="true" />{t('accountSettings.saveSettings')}</button>
        {(!issuedAccount || license) && <button type="button" className="is-danger" aria-expanded={confirmDelete} aria-controls={confirmDelete ? `${id}-delete` : undefined} onClick={() => setConfirmDelete(value => !value)}><Trash2 size={14} aria-hidden="true" />{t('accountSettings.deleteData')}</button>}
      </div>
      {confirmDelete && (
        <div id={`${id}-delete`} className="toolmeta-account-delete">
          <p>{t('accountSettings.deletePrompt')}</p>
          <div className="toolmeta-account-settings-actions">
            <button type="button" className="is-danger" onClick={removeLicense}>{t('accountSettings.confirmDelete')}</button>
            <button type="button" onClick={() => setConfirmDelete(false)}>{t('accountSettings.cancel')}</button>
          </div>
        </div>
      )}
      {notice && <p className="toolmeta-account-settings-notice" role="status">{t(notice)}</p>}
    </div>
  )
}
