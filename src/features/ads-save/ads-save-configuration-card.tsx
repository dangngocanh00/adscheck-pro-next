import { useAppLanguage, m, tx, t } from '@/i18n'
import type { FC } from 'react'
import { Clock, Download, Gauge, MoreVertical, Pause, Pencil, Play, Target, Trash2, Users } from 'lucide-react'
import {
  formatDownloadTargets, formatMetricType, formatScheduleSummary, formatSelectedAccountCount,
  type AdsSaveStoredConfiguration,
} from './ads-save-configuration-store'

type AdsSaveConfigurationCardProps = {
  stored: AdsSaveStoredConfiguration
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onToggleEnabled: () => void
  onDownloadNow: () => void
  onEdit: () => void
  onRequestDelete: () => void
  onOpenHistory: () => void
}

// One configuration's summary card. All 4 info-grid values and the name
// come straight from the real Step 1 + Step 2 state produced by the
// create-config modal — nothing here is a hardcoded reference example.
export const AdsSaveConfigurationCard: FC<AdsSaveConfigurationCardProps> = ({
  stored, menuOpen, onToggleMenu, onCloseMenu, onToggleEnabled, onDownloadNow, onEdit, onRequestDelete, onOpenHistory,
}) => {
  useAppLanguage();
  const { configuration, enabled, downloadHistory } = stored
  const lastDownload = downloadHistory[downloadHistory.length - 1]

  const runMenuAction = (action: () => void) => { onCloseMenu(); action() }

  return (
    <article className="ads-save-config-card">
      <header className="ads-save-config-card-head">
        <span className={`ads-save-config-status${enabled ? '' : ' is-off'}`}><i aria-hidden="true" />{tx(enabled ? m("ui.b091a3002a") : m("ui.47fd4e621b"))}</span>
        <div className="ads-save-config-card-actions">
          <label className="ads-save-config-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={onToggleEnabled}
              aria-label={tx(m("ui.3d4e58d064", { 0: enabled ? 'Tắt' : 'Bật', 1: configuration.configurationName }))}
            />
            <span />
          </label>
          <div className="ads-save-config-menu">
            <button type="button" className="ads-save-config-menu-trigger" aria-haspopup="menu" aria-expanded={menuOpen} aria-label={t("ui.ec86162163")} onClick={onToggleMenu}>
              <MoreVertical size={15} />
            </button>
            {tx(menuOpen && <ul className="ads-save-config-menu-dropdown" role="menu">
              <li><button type="button" role="menuitem" onClick={() => runMenuAction(onDownloadNow)}><Download size={14} aria-hidden="true" />{t("ui.1bdc752170")}</button></li>
              <li><button type="button" role="menuitem" onClick={() => runMenuAction(onToggleEnabled)}>{enabled ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{tx(enabled ? m("ui.b8d3bf3110") : m("ui.5d92d0921f"))}</button></li>
              <li><button type="button" role="menuitem" onClick={() => runMenuAction(onEdit)}><Pencil size={14} aria-hidden="true" />{t("ui.76a77ec294")}</button></li>
              <li><button type="button" role="menuitem" className="is-danger" onClick={() => runMenuAction(onRequestDelete)}><Trash2 size={14} aria-hidden="true" />{t("ui.6e1f2bf286")}</button></li>
            </ul>)}
          </div>
        </div>
      </header>

      <h3 className="ads-save-config-card-name">{configuration.configurationName}</h3>

      <div className="ads-save-config-info-grid">
        <div className="ads-save-config-info-block">
          <span className="ads-save-config-info-icon" aria-hidden="true"><Target size={14} /></span>
          <small>{t("ui.e59767a8a3")}</small>
          <strong>{tx(formatDownloadTargets(configuration.downloadTargets))}</strong>
        </div>
        <div className="ads-save-config-info-block">
          <span className="ads-save-config-info-icon" aria-hidden="true"><Gauge size={14} /></span>
          <small>{t("ui.1af33790cc")}</small>
          <strong>{tx(formatMetricType(configuration.metricType))}</strong>
        </div>
        <div className="ads-save-config-info-block">
          <span className="ads-save-config-info-icon" aria-hidden="true"><Clock size={14} /></span>
          <small>{t("ui.165b940e09")}</small>
          <strong>{tx(formatScheduleSummary(configuration))}</strong>
        </div>
        <div className="ads-save-config-info-block">
          <span className="ads-save-config-info-icon" aria-hidden="true"><Users size={14} /></span>
          <small>{t("ui.1f6576d006")}</small>
          <strong>{tx(formatSelectedAccountCount(configuration))}</strong>
        </div>
      </div>

      <footer className="ads-save-config-card-footer">
        <span>{t("ui.37bfc69632")}{" "}{tx(lastDownload ? new Date(lastDownload.timestamp).toLocaleString('vi-VN') : m("ui.5bd30d3e98"))}</span>
        <button type="button" className="ads-save-config-history-link" onClick={onOpenHistory}>{t("ui.4711ccb08e")}</button>
      </footer>
    </article>
  )
}

export default AdsSaveConfigurationCard
