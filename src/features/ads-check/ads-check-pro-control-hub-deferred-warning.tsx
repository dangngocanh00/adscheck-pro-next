import { useAppLanguage, t } from '@/i18n'
import type { FC } from 'react'
import { createPortal } from 'react-dom'
import { TriangleAlert, X } from 'lucide-react'

type Props = { onClose: () => void }

// Shown after "Thiết lập sau" defers Control Hub security setup (Step 2).
// Deliberately NOT a centered Dialog/backdrop — a small anchored/floating
// warning, semantic yellow/orange (never AdsMeta blue), dismissible only by
// its own close X. Closing it never re-opens the setup flow; clicking "Cài
// đặt Control Hub" again does that independently.
export const AdsCheckProControlHubDeferredWarning: FC<Props> = ({ onClose }) => {
  useAppLanguage();
  return createPortal(
    <div className="ads-security-deferred-warning" role="status">
      <TriangleAlert size={18} className="ads-security-deferred-warning-icon" aria-hidden="true" />
      <div className="ads-security-deferred-warning-copy">
        <strong>{t("ui.7a5f63591b")}</strong>
        <p>{t("ui.64b4e78c6d")}</p>
      </div>
      <button type="button" aria-label={t("ui.d2b73ab2ad")} onClick={onClose}><X size={13} /></button>
    </div>,
    document.body,
  )
}

export default AdsCheckProControlHubDeferredWarning
