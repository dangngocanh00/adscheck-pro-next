import { useAppLanguage, t, tx, m } from '@/i18n'
import { useEffect, useRef, useState, type FC } from 'react'
import { Bookmark, Plus, TriangleAlert } from 'lucide-react'
import { AdsProConfirmDialog } from '@/features/ads-check/ads-check-pro-confirm-dialog'
import { AdsSaveIllustration } from './ads-save-workspace'
import { AdsSaveConfigurationCard } from './ads-save-configuration-card'
import { AdsSaveDownloadHistoryModal } from './ads-save-download-history-modal'
import { todayIsoDate, type AdsSaveStoredConfiguration } from './ads-save-configuration-store'

type AdsSaveConfiguredWorkspaceProps = {
  configurations: AdsSaveStoredConfiguration[]
  onAddConfig: () => void
  onEditConfig: (id: string) => void
  onToggleEnabled: (id: string) => void
  onRemoveConfig: (id: string) => void
  onDownloadNow: (id: string) => void
}

// Ads Save "Configured state" — renders once `configurations.length > 0`
// (see ads-save-page.tsx's own branch). Same shared shell/header pattern
// as the empty state (`AdsSaveWorkspace`); the page derives WHICH of the
// two to render from real configuration data, never a separate hardcoded
// demo page.
export const AdsSaveConfiguredWorkspace: FC<AdsSaveConfiguredWorkspaceProps> = ({
  configurations, onAddConfig, onEditConfig, onToggleEnabled, onRemoveConfig, onDownloadNow,
}) => {
  useAppLanguage();
  const [warningDismissed, setWarningDismissed] = useState(false)
  // Menu ownership — ONE config id at a time, never a per-card boolean
  // that could accidentally leave two cards' menus open together.
  const [openMenuConfigId, setOpenMenuConfigId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null)
  const [historyDate, setHistoryDate] = useState(todayIsoDate)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openMenuConfigId) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!gridRef.current?.contains(event.target as Node)) setOpenMenuConfigId(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openMenuConfigId])

  const deleteTarget = configurations.find((item) => item.id === deleteTargetId) ?? null
  const historyTarget = configurations.find((item) => item.id === historyTargetId) ?? null

  return (
    <div className="ads-save-workspace-panel">
      <header className="ads-save-workspace-header">
        <span className="ads-save-workspace-header-icon" aria-hidden="true"><Bookmark size={16} /></span>
        <h1>{t("ui.49758c4625")}</h1>
      </header>

      {/* Dismiss is UI-state only for this session — no backend flag to
          persist it against, so it isn't invented. */}
      {!warningDismissed && <div className="ads-save-warning-banner">
        <TriangleAlert size={16} aria-hidden="true" />
        <p>{t("ui.02023be2d6")}</p>
        <button type="button" onClick={() => setWarningDismissed(true)}>{t("ui.f46981ba81")}</button>
      </div>}

      <div className="ads-save-configured-body">
        <div className="ads-save-configured-grid" ref={gridRef}>
          <button type="button" className="ads-save-add-config-card" onClick={onAddConfig}>
            <AdsSaveIllustration />
            <span className="ads-save-add-config-cta"><Plus size={14} />{t("ui.9e9afc6514")}</span>
            <p>{t("ui.d5c1169c5e")}</p>
          </button>

          {configurations.map((stored) => (
            <AdsSaveConfigurationCard
              key={stored.id}
              stored={stored}
              menuOpen={openMenuConfigId === stored.id}
              onToggleMenu={() => setOpenMenuConfigId((current) => current === stored.id ? null : stored.id)}
              onCloseMenu={() => setOpenMenuConfigId(null)}
              onToggleEnabled={() => onToggleEnabled(stored.id)}
              onDownloadNow={() => onDownloadNow(stored.id)}
              onEdit={() => onEditConfig(stored.id)}
              onRequestDelete={() => setDeleteTargetId(stored.id)}
              onOpenHistory={() => { setHistoryDate(todayIsoDate()); setHistoryTargetId(stored.id) }}
            />
          ))}
        </div>
      </div>

      {tx(deleteTarget && <AdsProConfirmDialog
        title={t("ui.035cd7a31a")}
        description={tx(m("ui.e51d787535", { 0: deleteTarget.configuration.configurationName }))}
        confirmLabel="Xóa cấu hình"
        onConfirm={() => onRemoveConfig(deleteTarget.id)}
        onClose={() => setDeleteTargetId(null)}
      />)}

      {historyTarget && <AdsSaveDownloadHistoryModal
        configurationName={historyTarget.configuration.configurationName}
        records={historyTarget.downloadHistory}
        selectedDate={historyDate}
        onDateChange={setHistoryDate}
        onClose={() => setHistoryTargetId(null)}
      />}
    </div>
  )
}

export default AdsSaveConfiguredWorkspace
