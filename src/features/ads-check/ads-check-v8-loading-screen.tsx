import { useAppLanguage, m, tx, t } from '@/i18n'
import type { CSSProperties } from 'react'
import loadingBackground from '../../../assets/new-background.png'

type LoadingCanvasStyle = CSSProperties & {
  '--ads-v8-loading-bg': string
}

const canvasStyle: LoadingCanvasStyle = {
  '--ads-v8-loading-bg': `url(${loadingBackground})`,
}

type Props = {
  // 'splash' (default) — the full-shell route-entry splash, unchanged.
  // 'data' — the CORRECTION variant: same background/progress treatment,
  // but meant to be mounted inside a table/content panel that already
  // supplies its own sizing + border-radius + overflow:hidden (see
  // .ads-pro-refresh-overlay/.ads-pro-asset-panel), so it skips the rail
  // spacer and fills 100% of its container instead of the viewport.
  variant?: 'splash' | 'data'
}

export function AdsCheckV8LoadingScreen({ variant = 'splash' }: Props = {}) {
  useAppLanguage();
  const isData = variant === 'data'
  return <div className={`ads-v8-loading-shell is-${variant}`} role="status" aria-live="polite">
    <span className="sr-only">{tx(isData ? m("ui.1ceaaced27") : m("ui.39a9f2518b"))}</span>
    {!isData && <div className="ads-v8-loading-rail" aria-hidden="true" />}
    <div className="ads-v8-loading-canvas" style={canvasStyle}>
      <div className="ads-v8-loading-center">
        {tx(isData && <span className="ads-v8-loading-text" aria-hidden="true">{t("ui.de68491680")}</span>)}
        <span className="ads-v8-loading-progress" aria-hidden="true"><i /></span>
      </div>
    </div>
  </div>
}

export default AdsCheckV8LoadingScreen
