import { tx, useAppLanguage, t, m } from '@/i18n'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Edit3, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'

// Minimal shape — satisfied structurally by both ViaConnection and TkqcRow,
// so this one dialog is reused for both tables' note editor (Batch Update
// Part D4) instead of a second bespoke implementation. `onDelete` only ever
// fires in 'delete' mode, which TKQC never opens.
type LocalDialogRow = { id: string; name: string; note?: string | null }

type LocalDialogProps = {
  mode: 'note' | 'delete' | null
  row: LocalDialogRow | null
  onClose: () => void
  onSaveNote: (rowId: string, note: string) => void
  onDelete: (rowId: string) => void
}

export function AdsCheckProLocalDialog({ mode, row, onClose, onSaveNote, onDelete }: LocalDialogProps) {
  useAppLanguage();
  const dialogRef = useRef<HTMLElement>(null)
  const [note, setNote] = useState('')
  const open = mode !== null && row !== null
  useOverlayFocus(open, dialogRef, onClose)
  useEffect(() => { setNote(row?.note ?? '') }, [row])
  if (!open || !row || !mode) return null

  const isDelete = mode === 'delete'
  return <div className="ads-pro-local-dialog-layer">
    <section ref={dialogRef} className="ads-pro-local-dialog" role="dialog" aria-modal="true" aria-labelledby="ads-pro-local-dialog-title">
      <button className="ads-pro-local-dialog-close" type="button" aria-label={t("ui.d2b73ab2ad")} onClick={onClose}><X size={18} /></button>
      <span className={isDelete ? 'is-danger' : ''} aria-hidden="true">{isDelete ? <AlertTriangle size={23} /> : <Edit3 size={23} />}</span>
      <h2 id="ads-pro-local-dialog-title">{tx(isDelete ? m("ui.4bf868843b") : m("ui.1a0b537ed8", { 0: row.name }))}</h2>
      {isDelete ? <p>{t("ui.1c7afd10c1")}</p> : <label><span>{t("ui.33a9e62033")}</span><textarea data-autofocus value={note} maxLength={120} onChange={(event) => setNote(event.target.value)} placeholder={t("ui.3858170549")} /></label>}
      <footer>
        <button type="button" onClick={onClose}>{t("ui.34ca764caf")}</button>
        <button className={isDelete ? 'is-danger' : 'is-primary'} type="button" data-autofocus={isDelete ? true : undefined} onClick={() => { if (isDelete) onDelete(row.id); else onSaveNote(row.id, note.trim()); onClose() }}>{tx(isDelete ? m("ui.6a0d9b7a44") : m("ui.a35bf89448"))}</button>
      </footer>
    </section>
  </div>
}
