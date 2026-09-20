import { useAppLanguage, t, tx, m } from '@/i18n'
import { useEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { Eye, EyeOff, Check, Settings, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

type Props = {
  onClose: () => void
  twoFactorEnabled: boolean
  passkeyEnabled: boolean
  onSave: (next: { twoFactorEnabled: boolean; passkeyEnabled: boolean }) => void
  // No email-verification screen has been provided yet — see the effect
  // inside the password card below. The caller (workspace) surfaces a demo
  // toast; this component never fakes sending an email or a password change.
  onRequestPasswordChangeVerification: () => void
}

// Deliberately DUPLICATED (not imported) from
// ads-check-pro-control-hub-password-modal.tsx — same 12-char/uppercase/
// digit rule, kept as an independent copy so this settings modal never
// risks regressing the already-verified onboarding flow by sharing code
// with it.
function checkPasswordRules(password: string) {
  const hasMinLength = password.length >= 12
  const hasUppercase = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  return { hasMinLength, hasUppercase, hasDigit, valid: hasMinLength && hasUppercase && hasDigit }
}

type ChangePasswordFormProps = { onCancel: () => void; onSubmitVerification: () => void }

// Mounted only while the "Đổi mật khẩu" card is expanded (see
// passwordCardStep below) — so every fresh expand starts both fields
// empty/hidden, and collapsing (Hủy bỏ) discards them for good. Never
// lifted to a parent, never logged, never written to any storage.
function ChangePasswordForm({ onCancel, onSubmitVerification }: ChangePasswordFormProps) {
  useAppLanguage();
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const rules = checkPasswordRules(newPassword)
  const confirmTouched = confirmPassword.length > 0
  const confirmMismatch = confirmTouched && confirmPassword !== newPassword
  const canVerify = rules.valid && confirmTouched && !confirmMismatch

  return <>
    <p className="ads-security-settings-divider">{t("ui.a444a1d13c")}</p>
    <label className="ads-cred-field" htmlFor="ads-settings-new-password">
      <span className="ads-cred-field-label">{t("ui.4267a600ce")}</span>
      <span className="ads-cred-field-control">
        <input id="ads-settings-new-password" type={showNew ? 'text' : 'password'} placeholder={t("ui.62b7034694")} value={newPassword} autoComplete="new-password" onChange={(event) => setNewPassword(event.target.value)} />
        <button type="button" className="ads-cred-field-eye" aria-label={tx(showNew ? m("ui.c4cf4992b5") : m("ui.ca667bafe6"))} aria-pressed={showNew} onClick={() => setShowNew((value) => !value)}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </span>
    </label>
    <ul className="ads-cred-rules">
      <li className={rules.hasMinLength ? 'is-met' : 'is-unmet'}>{rules.hasMinLength ? <Check size={13} /> : <X size={13} />}<span>{t("ui.d3326cb3db")}</span></li>
      <li className={rules.hasUppercase ? 'is-met' : 'is-unmet'}>{rules.hasUppercase ? <Check size={13} /> : <X size={13} />}<span>{t("ui.c8caec8e97")}</span></li>
      <li className={rules.hasDigit ? 'is-met' : 'is-unmet'}>{rules.hasDigit ? <Check size={13} /> : <X size={13} />}<span>{t("ui.a1cd4dfba0")}</span></li>
    </ul>
    <label className="ads-cred-field" htmlFor="ads-settings-confirm-password">
      <span className="ads-cred-field-label">{t("ui.2766fdd4ce")}</span>
      <span className="ads-cred-field-control">
        <input id="ads-settings-confirm-password" type={showConfirm ? 'text' : 'password'} placeholder={t("ui.62b7034694")} value={confirmPassword} autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} />
        <button type="button" className="ads-cred-field-eye" aria-label={tx(showConfirm ? m("ui.451f150825") : m("ui.793f0cab4c"))} aria-pressed={showConfirm} onClick={() => setShowConfirm((value) => !value)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </span>
    </label>
    {confirmMismatch && <p className="ads-cred-mismatch">{t("ui.c11fd53756")}</p>}
    <div className="ads-security-settings-card-actions">
      <button type="button" className="ads-security-defer" onClick={onCancel}>{t("ui.247d4b1efe")}</button>
      <button type="button" className="ads-security-cta" disabled={!canVerify} onClick={onSubmitVerification}>{t("ui.3fa9741c80")}</button>
    </div>
  </>
}

type PasswordCardStep = 'default' | 'changePassword' | 'emailVerification'

// Control Hub POST-SETUP settings — opened instead of the onboarding flow
// once controlHubSecurityConfigured is true (see
// ads-check-adaccounts-workspace.tsx). Everything here is DEMO/LOCAL UI
// state: no backend call, no real password storage/verification. The
// masked "********" is a fixed display string, never a reconstruction of
// any real password (which was already discarded when the onboarding
// modal unmounted).
export const AdsCheckProControlHubSettingsModal: FC<Props> = ({ onClose, twoFactorEnabled, passkeyEnabled, onSave, onRequestPasswordChangeVerification }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const [passwordCardStep, setPasswordCardStep] = useState<PasswordCardStep>('default')
  const [draftTwoFactorEnabled, setDraftTwoFactorEnabled] = useState(twoFactorEnabled)
  const [draftPasskeyEnabled, setDraftPasskeyEnabled] = useState(passkeyEnabled)

  // 'emailVerification' has no designed UI yet — same honest "hand off to
  // caller's demo toast, don't render a fake screen" pattern used
  // throughout this Control Hub flow. Falls back to the collapsed default
  // card rather than showing nothing.
  useEffect(() => {
    if (passwordCardStep !== 'emailVerification') return
    onRequestPasswordChangeVerification()
    setPasswordCardStep('default')
  }, [passwordCardStep, onRequestPasswordChangeVerification])

  const twoFactorConfigured = draftTwoFactorEnabled || draftPasskeyEnabled

  const handleSave = () => {
    onSave({ twoFactorEnabled: draftTwoFactorEnabled, passkeyEnabled: draftPasskeyEnabled })
    onClose()
  }

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-security-settings-modal" role="dialog" aria-modal="true" aria-labelledby="ads-security-settings-title">
        <header className="ads-security-settings-header">
          <Settings size={17} aria-hidden="true" />
          <h2 id="ads-security-settings-title">{t("ui.90ae2f89a4")}</h2>
          <button type="button" className="ads-security-settings-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose}><X size={16} /></button>
        </header>

        <div className="ads-security-settings-body">
          <article className="ads-security-settings-card">
            <div className="ads-security-settings-card-title">
              <h3>{t("ui.fdbe55dbe0")}</h3>
              <span className="ads-security-badge-done">{t("ui.eb5aadf1b8")}</span>
            </div>
            <p>{t("ui.8a1491f42d")}</p>
            <p>{t("ui.94c9132e46")}</p>

            {passwordCardStep === 'default' && <>
              <span className="ads-security-settings-field-label">{t("ui.888c9c47cf")}</span>
              <div className="ads-security-settings-password-row">
                <span className="ads-security-settings-masked">********</span>
                <button type="button" className="ads-security-settings-change-btn" onClick={() => setPasswordCardStep('changePassword')}>{t("ui.d4e1de2330")}</button>
              </div>
            </>}

            {passwordCardStep === 'changePassword' && <ChangePasswordForm
              onCancel={() => setPasswordCardStep('default')}
              onSubmitVerification={() => setPasswordCardStep('emailVerification')}
            />}
          </article>

          <article className="ads-security-settings-card">
            <div className="ads-security-settings-card-title">
              <h3>{t("ui.41d1d3130f")}</h3>
              {tx(twoFactorConfigured
                ? <span className="ads-security-badge-done">{t("ui.eb5aadf1b8")}</span>
                : <span className="ads-security-badge-pending">{t("ui.51036b5d1a")}</span>)}
            </div>
            <p>{t("ui.8066ac6be0")}</p>

            <label className="ads-security-toggle-row">
              <span>{t("ui.e8442a3a9e")}</span>
              <input type="checkbox" checked={draftTwoFactorEnabled} onChange={(event) => setDraftTwoFactorEnabled(event.target.checked)} />
              <i><span /></i>
            </label>
            <div className="ads-security-settings-toggle-sep" />
            <label className="ads-security-toggle-row">
              <span>{t("ui.e35828da74")}</span>
              <input type="checkbox" checked={draftPasskeyEnabled} onChange={(event) => setDraftPasskeyEnabled(event.target.checked)} />
              <i><span /></i>
            </label>
          </article>
        </div>

        <footer className="ads-cred-footer">
          <button type="button" className="ads-cred-back" onClick={onClose}>{t("ui.34ca764caf")}</button>
          <button type="button" className="ads-cred-cta" onClick={handleSave}>{t("ui.a65799a0b7")}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckProControlHubSettingsModal
