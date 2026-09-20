import { useAppLanguage, t, tx } from '@/i18n'
import { useRef, type FC } from 'react'
import { createPortal } from 'react-dom'
import { History, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { AdsProModalBackdrop } from '@/features/ads-check/ads-check-pro-modal-backdrop'
import { AdsSaveDatePicker } from './ads-save-date-picker'
import { formatTimestampVi, toIsoDate, type AdsSaveDownloadRecord } from './ads-save-configuration-store'

type AdsSaveDownloadHistoryModalProps = {
  configurationName: string
  records: AdsSaveDownloadRecord[]
  selectedDate: string
  onDateChange: (iso: string) => void
  onClose: () => void
}

// One configuration's own download history — the caller (workspace) is
// the one that already scopes `records` to a single configuration id, so
// this component never needs/handles a cross-configuration list.
export const AdsSaveDownloadHistoryModal: FC<AdsSaveDownloadHistoryModalProps> = ({ configurationName, records, selectedDate, onDateChange, onClose }) => {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  const rowsForDate = records.filter((record) => toIsoDate(new Date(record.timestamp)) === selectedDate)

  return createPortal(
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-save-history-modal" role="dialog" aria-modal="true" aria-labelledby="ads-save-history-title">
        <header className="ads-save-history-header">
          <span className="ads-save-history-header-icon" aria-hidden="true"><History size={16} /></span>
          <h2 id="ads-save-history-title">{t("ui.ca7178a22a")}</h2>
          <span className="ads-save-history-subtitle">{configurationName}</span>
          <AdsSaveDatePicker value={selectedDate} onChange={onDateChange} />
          <button type="button" className="ads-save-history-close" aria-label={t("ui.d2b73ab2ad")} onClick={onClose} data-autofocus><X size={16} /></button>
        </header>

        <div className="ads-save-history-content">
          <table className="ads-save-history-table">
            <thead><tr><th>{t("ui.91bbd3c017")}</th><th>{t("ui.83cf094454")}</th><th>{t("ui.efab781962")}</th></tr></thead>
            <tbody>
              {rowsForDate.map((record, index) => (
                <tr key={record.id}>
                  <td>{index + 1}</td>
                  <td>{tx(formatTimestampVi(record.timestamp))}</td>
                  <td>{record.fileName}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tx(rowsForDate.length === 0 && <p className="ads-save-history-empty">{t("ui.e73fafb9d8")}</p>)}
        </div>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}

export default AdsSaveDownloadHistoryModal
