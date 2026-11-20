import { useState, type FormEvent, type ReactNode } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { translate, useAppLanguage } from '@/i18n'
import { toolmetaDemoAccount, ToolmetaSessionContext } from './toolmeta-session'
import '@/styles/toolmeta-auth.css'

type AuthMode = 'login' | 'forgot'

const messages = {
  login: { title: 'auth.login', subtitle: 'auth.welcome', submit: 'auth.login' },
  forgot: { title: 'auth.forgot', subtitle: 'auth.resetInstructions', submit: 'auth.sendLink' },
} as const

const previewSessionKey = 'toolmeta-demo-email'
const demoPassword = 'ToolmetaDemo123!'

function readPreviewEmail() {
  try { return sessionStorage.getItem(previewSessionKey) ?? localStorage.getItem(previewSessionKey) } catch { return null }
}

export function ToolmetaSessionProvider({ children }: { children: ReactNode }) {
  const language = useAppLanguage()
  const t = (key: string) => translate(key, {}, language === 'vi' ? 'vi' : 'en')
  const [email, setEmail] = useState(readPreviewEmail)
  const [mode, setMode] = useState<AuthMode | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function showMode(next: AuthMode | null) {
    setMode(next)
    setShowPassword(false)
    setNotice(null)
  }

  const openAuth = () => showMode('login')
  const closeAuth = () => showMode(null)
  const signOut = () => {
    for (const storage of [sessionStorage, localStorage]) {
      try { storage.removeItem(previewSessionKey) } catch { /* Storage can be unavailable. */ }
    }
    setEmail(null)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mode !== 'login') {
      setNotice('auth.preview')
      return
    }
    const fields = new FormData(event.currentTarget)
    const address = String(fields.get('email') ?? '').trim().toLowerCase()
    if (address !== toolmetaDemoAccount.email || fields.get('password') !== demoPassword) {
      setNotice('auth.invalidDemo')
      return
    }

    const storage = fields.has('remember') ? localStorage : sessionStorage
    try { storage.setItem(previewSessionKey, toolmetaDemoAccount.email) } catch { /* The current tab can still sign in. */ }
    setEmail(toolmetaDemoAccount.email)
    closeAuth()
  }

  const copy = messages[mode ?? 'login']
  return (
    <ToolmetaSessionContext.Provider value={{ email, openAuth, signOut }}>
      {children}
      <Modal open={mode !== null} onClose={closeAuth} title={t(copy.title)} description={t(copy.subtitle)} size="sm" className="toolmeta-auth">
        <form key={mode} className="toolmeta-auth-form" onSubmit={submit}>
          <div className="toolmeta-auth-group">
            <label htmlFor="toolmeta-login-email">{t('auth.email')}</label>
            <span className="toolmeta-auth-field">
              <Mail size={18} aria-hidden="true" />
              <input id="toolmeta-login-email" name="email" type="email" autoComplete="email" placeholder="email@example.com" required data-autofocus />
            </span>
          </div>
          {mode !== 'forgot' && (
            <div className="toolmeta-auth-group">
              <label htmlFor="toolmeta-login-password">{t('auth.password')}</label>
              <span className="toolmeta-auth-field">
                <LockKeyhole size={18} aria-hidden="true" />
                <input id="toolmeta-login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required />
                <button type="button" aria-label={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
            </div>
          )}
          {mode === 'login' && (
            <div className="toolmeta-auth-options">
              <label><input type="checkbox" name="remember" />{t('auth.remember')}</label>
              <button type="button" onClick={() => showMode('forgot')}>{t('auth.forgot')}</button>
            </div>
          )}
          {notice && <p className="toolmeta-auth-status" role="status">{t(notice)}</p>}
          <button className="toolmeta-auth-submit" type="submit">{t(copy.submit)}</button>
        </form>
        {mode === 'login' && (
          <>
            <div className="toolmeta-auth-divider">{t('auth.or')}</div>
            <button className="toolmeta-auth-google" type="button" onClick={() => setNotice('auth.preview')}>
              <span aria-hidden="true">G</span>{t('auth.google')}
            </button>
            <p className="toolmeta-auth-google-note">{t('auth.googleNewAccount')}</p>
          </>
        )}
        {mode === 'forgot' && <button className="toolmeta-auth-switch-mode" type="button" onClick={openAuth}>{t('auth.back')}</button>}
      </Modal>
    </ToolmetaSessionContext.Provider>
  )
}
