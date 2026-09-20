import { useAppLanguage, tx, m, t } from '@/i18n'
import { useEffect, useRef, useState, type ClipboardEvent, type FC, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, Eye, EyeOff, Loader2, Lock, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'
import { AdsControlHubAuthenticatorQr } from './ads-check-pro-control-hub-authenticator-qr'

type Props = {
  onClose: () => void
  onBack: () => void
  onContinue: () => void
  // Fires only once the isolated DEMO verify-attempt counter below reaches
  // success (2nd attempt) — never a real backend/TOTP confirmation.
  onSecuritySetupComplete: () => void
}

// 'authenticatorSetup' — reached when method === 'authenticator' and
// "Hoàn tất thiết lập mật khẩu" is clicked. Its own "Tiếp tục" does NOT
// advance to another step of THIS union — it opens a nested verify overlay
// (verifyModalOpen below) stacked ON TOP of this same step, per this task's
// explicit "modal chồng, không thay màn QR" requirement.
type CredentialsStep = 'password' | 'twoFactor' | 'authenticatorSetup'
type TwoFactorMethod = 'authenticator' | 'passkey'
type VerificationPolicy = 'every-command' | 'current-tab'
const OTP_LENGTH = 6

// No TOTP-issuing backend exists in this project — this is an explicit,
// clearly-named DEMO constant (never a value copied from any reference
// screenshot). `qrPayload` is derived FROM `secret` (not independently
// authored), so the QR and the displayed secret can never drift apart; a
// later real server response only needs to replace this one object.
const DEMO_CONTROL_HUB_TOTP_SECRET = 'KZ2XG5DBNRQWY3TFPERC6IX3'
const authenticatorSetup = {
  secret: DEMO_CONTROL_HUB_TOTP_SECRET,
  qrPayload: `otpauth://totp/Adscheck:ControlHub?secret=${DEMO_CONTROL_HUB_TOTP_SECRET}&issuer=Adscheck`,
}

type PasswordFieldProps = {
  id: string
  label: string
  placeholder: string
  value: string
  visible: boolean
  onToggleVisible: () => void
  onChange: (value: string) => void
}

// Each password field owns its OWN show/hide state (passed in) so toggling
// one never affects the other — no shared boolean.
function PasswordField({ id, label, placeholder, value, visible, onToggleVisible, onChange }: PasswordFieldProps) {
  useAppLanguage();
  return <label className="ads-cred-field" htmlFor={id}>
    <span className="ads-cred-field-label">{tx(label)}</span>
    <span className="ads-cred-field-control">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        placeholder={tx(placeholder)}
        value={value}
        autoComplete="new-password"
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" className="ads-cred-field-eye" aria-label={tx(visible ? m("ui.06cd6e7ccc", { 0: label.toLowerCase() }) : m("ui.46736b02e1", { 0: label.toLowerCase() }))} aria-pressed={visible} onClick={onToggleVisible}>
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </span>
  </label>
}

function RuleRow({ met, label }: { met: boolean; label: string }) {
  useAppLanguage();
  return <li className={met ? 'is-met' : 'is-unmet'}>
    {met ? <Check size={13} /> : <X size={13} />}
    <span>{tx(label)}</span>
  </li>
}

type RadioRowProps<T extends string> = { name: string; value: T; current: T; title: string; description?: string; onChange: (value: T) => void }
function RadioRow<T extends string>({ name, value, current, title, description, onChange }: RadioRowProps<T>) {
  useAppLanguage();
  const selected = current === value
  return <label className={`ads-cred-radio-row${selected ? ' is-selected' : ''}`}>
    <input type="radio" name={name} checked={selected} onChange={() => onChange(value)} />
    <span className="ads-cred-radio-copy"><strong>{tx(title)}</strong>{tx(description && <small>{tx(description)}</small>)}</span>
  </label>
}

type StepperProps = { step: CredentialsStep }
function CredentialsStepper({ step }: StepperProps) {
  useAppLanguage();
  // Every step past password creation (2FA method/policy, authenticator
  // setup) is the SAME "Thiết lập 2FA" stepper phase — only the password
  // step itself is step 1.
  const onStep2Phase = step !== 'password'
  return <ol className="ads-cred-stepper">
    <li className={onStep2Phase ? 'is-completed' : 'is-active'}>
      <span className="ads-cred-stepper-badge">{onStep2Phase ? <Check size={11} /> : '1'}</span>{t("ui.fdbe55dbe0")}{" "}</li>
    <li className="ads-cred-stepper-sep" aria-hidden="true">»</li>
    <li className={onStep2Phase ? 'is-active' : ''}><span className="ads-cred-stepper-badge">2</span>{t("ui.7a23271bd2")}</li>
  </ol>
}

type OtpVerifyOverlayProps = {
  onCancel: () => void
  // Called once the user submits 6 valid digits, AFTER the ~1s "checking"
  // delay this component itself owns. Returns whether this DEMO attempt
  // succeeds — the parent decides based purely on its own isolated attempt
  // counter, never on the digits themselves (this component doesn't even
  // pass them along). If it returns true, the parent has already torn down
  // this overlay (and the whole setup flow) as a side effect of the call;
  // if false, this component clears its cells and shows a failure state
  // while staying mounted/open.
  onSubmit: () => boolean
}
const CHECKING_DELAY_MS = 1000

// Nested modal stacked ON TOP of the (dimmed, non-interactive) Authenticator
// Setup screen — never replaces it. Owns its OWN OTP + verify-phase state,
// mounted only while open (see `verifyModalOpen` below), so every fresh
// open starts empty/idle and Hủy bỏ/close discards it for good — never
// lifted to a parent, never logged, never persisted anywhere.
function OtpVerifyOverlay({ onCancel, onSubmit }: OtpVerifyOverlayProps) {
  useAppLanguage();
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''))
  const [phase, setPhase] = useState<'idle' | 'checking' | 'failed'>('idle')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const checkingTimer = useRef<number | null>(null)

  useEffect(() => { inputRefs.current[0]?.focus() }, [])
  useEffect(() => () => { if (checkingTimer.current !== null) window.clearTimeout(checkingTimer.current) }, [])
  // Runs AFTER React has re-rendered the cells back to enabled — calling
  // .focus() synchronously inside the setTimeout below would target a DOM
  // node that (at that exact instant) still has `disabled` from the just-
  // ending 'checking' phase, and focusing a disabled input is a no-op.
  useEffect(() => { if (phase === 'failed') inputRefs.current[0]?.focus() }, [phase])

  const otp = digits.join('')
  const canSubmit = phase !== 'checking' && otp.length === OTP_LENGTH && /^\d{6}$/.test(otp)

  const setDigitAt = (index: number, value: string) => setDigits((current) => {
    const next = [...current]
    next[index] = value
    return next
  })

  // Always keeps exactly ONE digit per cell — typing over an already-filled
  // cell replaces it (never appends two digits into one box).
  const handleChange = (index: number, rawValue: string) => {
    if (phase === 'checking') return
    const onlyDigits = rawValue.replace(/\D/g, '')
    if (phase === 'failed') setPhase('idle')
    if (!onlyDigits) { setDigitAt(index, ''); return }
    setDigitAt(index, onlyDigits.slice(-1))
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const submit = () => {
    if (!canSubmit) return
    setPhase('checking')
    checkingTimer.current = window.setTimeout(() => {
      checkingTimer.current = null
      const success = onSubmit()
      if (!success) {
        setDigits(Array(OTP_LENGTH).fill(''))
        setPhase('failed')
        // Focus is handled by the phase==='failed' effect above, once the
        // cells are actually re-enabled in the DOM.
      }
    }, CHECKING_DELAY_MS)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    // Stop this from ever reaching the outer setup dialog's own global ESC/
    // Tab-trap listener (useOverlayFocus) — Escape here must close ONLY
    // this overlay, never the whole Control Hub setup flow.
    if (event.key === 'Escape') { event.stopPropagation(); if (phase !== 'checking') onCancel(); return }
    if (phase === 'checking') { event.preventDefault(); return }
    if (event.key === 'Backspace') {
      if (digits[index]) { setDigitAt(index, ''); return }
      if (index > 0) { inputRefs.current[index - 1]?.focus(); setDigitAt(index - 1, '') }
      return
    }
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); inputRefs.current[index - 1]?.focus(); return }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) { event.preventDefault(); inputRefs.current[index + 1]?.focus(); return }
    if (event.key === 'Enter' && canSubmit) submit()
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (phase === 'checking') { event.preventDefault(); return }
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    event.preventDefault()
    if (phase === 'failed') setPhase('idle')
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i]
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  return <div className="ads-otp-layer" role="presentation" onKeyDown={(event) => { if (event.key === 'Escape') event.stopPropagation() }}>
    <section className="ads-otp-modal" role="dialog" aria-modal="true" aria-labelledby="ads-otp-title">
      <div className="ads-otp-title-row">
        <ShieldCheck size={16} aria-hidden="true" />
        <h3 id="ads-otp-title">{t("ui.11c62b3de6")}</h3>
      </div>
      {phase === 'failed'
        ? <div className="ads-otp-error" role="alert">
            <p><TriangleAlert size={14} aria-hidden="true" /> {" "}{t("ui.6ae4ff8200")}</p>
            <p>{t("ui.4d06745e5b")}</p>
          </div>
        : <p className="ads-otp-warning" role="note">{t("ui.7b22fa1afc")}</p>}
      <div className="ads-otp-cells">
        {tx(digits.map((digit, index) => <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={phase === 'checking'}
          aria-label={tx(m("ui.a2c5115bea", { 0: index + 1 }))}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
        />))}
      </div>
      <footer className="ads-otp-footer">
        <button type="button" className="ads-otp-cancel" disabled={phase === 'checking'} onClick={onCancel}>{t("ui.247d4b1efe")}</button>
        <button type="button" className="ads-otp-confirm" disabled={!canSubmit} onClick={submit}>
          {tx(phase === 'checking' ? <><Loader2 size={14} className="is-spinning" aria-hidden="true" />{t("ui.fca4dbdff7")}</> : m("ui.d53daf2f46"))}
        </button>
      </footer>
    </section>
  </div>
}

// Control Hub setup — the "Thiết lập bảo mật" sub-flow, reached from the
// security-mechanism step's "Bắt đầu thiết lập bảo mật" CTA. Password
// creation and 2FA setup are TWO INTERNAL STEPS of this ONE modal/component
// (credentialsStep), not two separate mounted modals — so password/confirm
// survive navigating twoFactor -> "Quay lại" -> password within the same
// open flow (only Eye visibility resets, for safety), while the outer
// controlHubSetupStep in ads-check-adaccounts-workspace.tsx still only
// mounts this component once per genuine (re)entry into the flow — closing
// the WHOLE flow (X) unmounts everything, clearing password/confirm for
// good. Nothing here is sent anywhere, logged, or persisted to any
// storage — this is a UI-only demo flow, no invented backend/2FA/WebAuthn.
export const AdsCheckProControlHubPasswordModal: FC<Props> = ({ onClose, onBack, onContinue, onSecuritySetupComplete }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)
  const [credentialsStep, setCredentialsStep] = useState<CredentialsStep>('password')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>('authenticator')
  const [verificationPolicy, setVerificationPolicy] = useState<VerificationPolicy>('every-command')
  const [secretCopied, setSecretCopied] = useState(false)
  // Nested on top of 'authenticatorSetup' — never replaces it (see
  // OtpVerifyOverlay above). Mounted only while true, so its own OTP state
  // always starts fresh on every open.
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  // ISOLATED DEMO/MOCK verify-attempt counter — this is the ENTIRE "backend"
  // for the 2FA demo: attempt #1 always fails, attempt #2 always succeeds.
  // It never inspects the OTP digits, never calls any API, never persists
  // anywhere. Lives here (not inside OtpVerifyOverlay) specifically so it
  // SURVIVES "Hủy bỏ" -> reopen within the same setup session (closing just
  // the overlay does not reset it), while still resetting to 0 whenever
  // this whole component unmounts (the entire Control Hub setup closes).
  const [demoVerifyAttempt, setDemoVerifyAttempt] = useState(0)

  const hasMinLength = password.length >= 12
  const hasUppercase = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const passwordValid = hasMinLength && hasUppercase && hasDigit
  const confirmTouched = confirmPassword.length > 0
  const confirmMismatch = confirmTouched && confirmPassword !== password
  const canContinue = passwordValid && confirmTouched && !confirmMismatch

  const goToTwoFactor = () => { setShowPassword(false); setShowConfirmPassword(false); setCredentialsStep('twoFactor') }
  const backToPassword = () => { setShowPassword(false); setShowConfirmPassword(false); setCredentialsStep('password') }
  // Only the 'authenticator' method has a designed next screen (the QR/
  // secret setup below); 'passkey' has none yet, so it keeps the same
  // "close whole flow + demo toast" placeholder this button used before
  // authenticator-setup existed — never invented WebAuthn/passkey UI.
  const handleCompleteSecuritySetup = () => {
    if (twoFactorMethod === 'authenticator') { setCredentialsStep('authenticatorSetup'); return }
    onContinue()
  }
  const backToTwoFactor = () => setCredentialsStep('twoFactor')
  const openVerifyModal = () => setVerifyModalOpen(true)
  const closeVerifyModal = () => setVerifyModalOpen(false)
  // DEMO decision only — see demoVerifyAttempt above. No real TOTP-
  // verification backend exists in this project; this never inspects the
  // OTP value, never calls an API, never logs/persists anything. On
  // success it tears down both the verify overlay and the whole
  // Authenticator Setup screen and hands off to the parent's success
  // screen/toast; on failure it just reports `false` back to
  // OtpVerifyOverlay, which stays open and shows its own failure state.
  const resolveDemoVerifyAttempt = (): boolean => {
    const nextAttempt = demoVerifyAttempt + 1
    setDemoVerifyAttempt(nextAttempt)
    const success = nextAttempt >= 2
    if (success) {
      setVerifyModalOpen(false)
      onSecuritySetupComplete()
    }
    return success
  }
  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(authenticatorSetup.secret)
      setSecretCopied(true)
      window.setTimeout(() => setSecretCopied(false), 1400)
    } catch {
      // Clipboard permission denied/unavailable — no UI to invent beyond
      // simply not showing the "copied" feedback.
    }
  }

  let body: ReactNode
  let footer: ReactNode
  if (credentialsStep === 'password') {
    body = <>
      <h2 id="ads-cred-title" className="ads-cred-title">{t("ui.cfdabed9b3")}</h2>
      <CredentialsStepper step="password" />
      <div className="ads-cred-body">
        <div className="ads-cred-info-card">
          <p><span className="ads-cred-info-badge">1</span>{t("ui.2f8a4073a4")}</p>
          <p><span className="ads-cred-info-badge">2</span>{t("ui.7c87821308")}</p>
        </div>

        <div className="ads-cred-form">
          <PasswordField id="ads-cred-password" label={t("ui.fdbe55dbe0")} placeholder={t("ui.0dd48e7bd2")} value={password} visible={showPassword} onToggleVisible={() => setShowPassword((value) => !value)} onChange={setPassword} />
          <ul className="ads-cred-rules">
            <RuleRow met={hasMinLength} label={t("ui.d3326cb3db")} />
            <RuleRow met={hasUppercase} label={t("ui.c8caec8e97")} />
            <RuleRow met={hasDigit} label={t("ui.a1cd4dfba0")} />
          </ul>
          <PasswordField id="ads-cred-confirm" label={t("ui.f0bd304b80")} placeholder={t("ui.f0bd304b80")} value={confirmPassword} visible={showConfirmPassword} onToggleVisible={() => setShowConfirmPassword((value) => !value)} onChange={setConfirmPassword} />
          {confirmMismatch && <p className="ads-cred-mismatch">{t("ui.c11fd53756")}</p>}
        </div>

        <div className="ads-cred-info-card">
          <h3>{t("ui.e46f10d30a")}</h3>
          <ul>
            <li>{t("ui.cb5f0f5976")}</li>
            <li>{t("ui.080d708455")}</li>
            <li>{t("ui.e60268bcb0")}</li>
            <li>{t("ui.16cb939eb4")}</li>
          </ul>
          <p className="ads-cred-info-note">{t("ui.46075828da")}</p>
        </div>

        <div className="ads-cred-warning" role="note">
          <h3>{t("ui.4f9b64f762")}</h3>
          <p>{t("ui.218b6ec737")}</p>
        </div>
      </div>
    </>
    footer = <>
      <button type="button" className="ads-cred-back" onClick={onBack}>{t("ui.8a09e03d20")}</button>
      <button type="button" className="ads-cred-cta" disabled={!canContinue} onClick={goToTwoFactor}>{t("ui.5d92d0921f")}</button>
    </>
  } else if (credentialsStep === 'twoFactor') {
    body = <>
      <div className="ads-cred-title-row">
        <Lock size={18} aria-hidden="true" />
        <h2 id="ads-cred-title" className="ads-cred-title-inline">{t("ui.3066a874a3")}</h2>
      </div>
      <CredentialsStepper step="twoFactor" />
      <div className="ads-cred-body">
        <div className="ads-cred-info-card">
          <p><span className="ads-cred-info-badge">1</span>{t("ui.f2560103f5")}</p>
          <p><span className="ads-cred-info-badge">2</span>{t("ui.9062f48a22")}</p>
        </div>

        <div className="ads-cred-radio-card">
          <h3>{t("ui.4a133a9839")}</h3>
          <RadioRow name="ads-cred-2fa-method" value="authenticator" current={twoFactorMethod} title={t("ui.459a5249ca")} onChange={setTwoFactorMethod} />
          <RadioRow name="ads-cred-2fa-method" value="passkey" current={twoFactorMethod} title={t("ui.629b68a427")} onChange={setTwoFactorMethod} />
        </div>

        <div className="ads-cred-radio-card">
          <h3>{t("ui.0653a6865c")}</h3>
          <RadioRow
            name="ads-cred-2fa-policy" value="every-command" current={verificationPolicy} onChange={setVerificationPolicy}
            title={t("ui.c91f15d444")}
            description={t("ui.3a4aa7714d")}
          />
          <RadioRow
            name="ads-cred-2fa-policy" value="current-tab" current={verificationPolicy} onChange={setVerificationPolicy}
            title={t("ui.36d07156b8")}
            description={t("ui.68ac21283d")}
          />
        </div>
      </div>
    </>
    footer = <>
      <button type="button" className="ads-cred-back" onClick={backToPassword}>{t("ui.8a09e03d20")}</button>
      <button type="button" className="ads-cred-cta" onClick={handleCompleteSecuritySetup}>{t("ui.7ae4af82a9")}</button>
    </>
  } else if (credentialsStep === 'authenticatorSetup') {
    body = <>
      <div className="ads-cred-title-row">
        <Lock size={18} aria-hidden="true" />
        <h2 id="ads-cred-title" className="ads-cred-title-inline">{t("ui.3066a874a3")}</h2>
      </div>
      <CredentialsStepper step="authenticatorSetup" />
      <div className="ads-cred-body">
        <div className="ads-cred-auth-card">
          <span className="ads-cred-auth-icon"><ShieldCheck size={22} /></span>
          <h3>{t("ui.ac83d95ac9")}</h3>

          <div className="ads-cred-auth-step">
            <span className="ads-cred-auth-step-badge">1</span>
            <div>
              <strong>{t("ui.f5c96600de")}</strong>
              <p>{t("ui.cac57d32de")}</p>
            </div>
          </div>

          <div className="ads-cred-auth-step">
            <span className="ads-cred-auth-step-badge">2</span>
            <div>
              <strong>{t("ui.2e96a82b4a")}</strong>
              <p>{t("ui.799c52c7a3")}</p>
              <div className="ads-cred-qr-wrap">
                <AdsControlHubAuthenticatorQr seed={authenticatorSetup.qrPayload} />
              </div>
              <p>{t("ui.18796e244d")}</p>
              <div className="ads-cred-secret-row">
                <span className="ads-cred-secret-value">{authenticatorSetup.secret}</span>
                <button type="button" className="ads-cred-secret-copy" aria-label={tx(secretCopied ? m("ui.09b0d27ccc") : m("ui.1d8cf6d8d8"))} onClick={copySecret}>
                  {secretCopied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="ads-cred-auth-step">
            <span className="ads-cred-auth-step-badge">3</span>
            <div>
              <strong>{t("ui.a44dcd7a15")}</strong>
              <p>{t("ui.40493e2871")}</p>
            </div>
          </div>
        </div>
      </div>
    </>
    footer = <>
      <button type="button" className="ads-cred-back" onClick={backToTwoFactor}>{t("ui.34ca764caf")}</button>
      <button type="button" className="ads-cred-cta" onClick={openVerifyModal}>{t("ui.5d92d0921f")}</button>
    </>
  } else {
    // Unreachable — the 3 branches above already cover every CredentialsStep
    // value; kept only so TypeScript can prove body/footer are assigned.
    body = null
    footer = null
  }

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-cred-modal" role="dialog" aria-modal="true" aria-labelledby="ads-cred-title">
        {/* Nested modal (verifyModalOpen) stacks ON TOP of this same
            section rather than unmounting it, so it stays a descendant of
            panelRef — keeping it inside useOverlayFocus's own Tab-trap
            container instead of fighting a second, separate focus trap.
            This wrapper is what actually dims/blurs/disables the
            Authenticator Setup screen underneath; the overlay itself is a
            SIBLING, never touched by this wrapper's filter. */}
        <div className={`ads-cred-modal-content${verifyModalOpen ? ' is-dimmed' : ''}`} aria-hidden={verifyModalOpen || undefined} inert={verifyModalOpen}>
          <button type="button" className="ads-cred-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose}><X size={16} /></button>
          {body}
          <footer className="ads-cred-footer">{footer}</footer>
        </div>
        {verifyModalOpen && <OtpVerifyOverlay onCancel={closeVerifyModal} onSubmit={resolveDemoVerifyAttempt} />}
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsCheckProControlHubPasswordModal
