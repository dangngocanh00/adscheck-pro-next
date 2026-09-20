import { useAppLanguage, m, t, tx } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Folder, Plus, Search, X } from 'lucide-react'

type Props = {
  folders: string[]
  counts: Record<string, number>
  selectedCount: number
  onClose: () => void
  onConfirm: (folder: string) => void
  onCreate: (name: string) => string | null
}

export function AdsProMoveFolderDialog({ folders, counts, selectedCount, onClose, onConfirm, onCreate }: Props) {
  useAppLanguage();
  const [query, setQuery] = useState('')
  const [destination, setDestination] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const createInputRef = useRef<HTMLInputElement>(null)
  const visibleFolders = useMemo(() => folders.filter((folder) => folder !== m("ui.f7a578dcbd") && (folder === destination || folder.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))), [destination, folders, query])
  const nextDefaultFolderName = useMemo(() => {
    let maxSequence = 0
    for (const folder of folders) {
      const match = /^Thư mục (\d+)$/.exec(folder.trim())
      if (match) maxSequence = Math.max(maxSequence, Number(match[1]))
    }
    return m("ui.d81a268fd7", { 0: maxSequence + 1 })
  }, [folders])
  useEffect(() => {
    if (!creating) return
    createInputRef.current?.focus()
    createInputRef.current?.select()
  }, [creating])
  const cancelCreate = () => { setCreating(false); setDraftName('') }
  const submitCreate = () => {
    const name = draftName.trim()
    if (!name) return
    const created = onCreate(name)
    if (!created) return
    setDestination(created)
    setCreating(false)
    setDraftName('')
  }
  return <div className="ads-move-folder-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="ads-move-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="ads-move-folder-title">
      <header><span><Folder size={19} /></span><h2 id="ads-move-folder-title">{t("ui.0c68ca0741")}</h2><button type="button" aria-label={t("ui.45fe766780")} onClick={onClose}><X size={17} /></button></header>
      <label className="ads-move-folder-search"><Search size={16} /><input autoFocus aria-label={t("ui.8a49244869")} placeholder={t("ui.8a49244869")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="ads-move-folder-list" role="radiogroup" aria-label={t("ui.fcdbf6c810")}>
        {visibleFolders.map((folder) => <button key={folder} type="button" role="radio" aria-checked={destination === folder} className={destination === folder ? 'is-selected' : ''} onClick={() => setDestination(folder)}><Folder size={17} /><span>{tx(folder)}</span><small>{counts[folder] ?? 0}</small></button>)}
        {visibleFolders.length === 0 && <p>{t("ui.3db362b59d")}</p>}
      </div>
      {creating
        ? <div className="ads-move-folder-create-inline"><Folder size={17} /><input ref={createInputRef} aria-label={t("ui.583bbf0719")} placeholder={t("ui.1856045c20")} value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitCreate(); if (event.key === 'Escape') { event.stopPropagation(); cancelCreate() } }} /><button type="button" aria-label={t("ui.4738de4bc7")} disabled={!draftName.trim()} onClick={submitCreate}><Check size={16} /></button><button type="button" aria-label={t("ui.f1c74bfc55")} onClick={cancelCreate}><X size={16} /></button></div>
        : <button type="button" className="ads-move-folder-create" onClick={() => { setDraftName(nextDefaultFolderName); setCreating(true) }}><Plus size={16} />{t("ui.04d928c29f")}</button>}
      <footer><button type="button" onClick={onClose}>{t("ui.34ca764caf")}</button><button type="button" className="is-primary" disabled={!destination || selectedCount === 0} onClick={() => destination && onConfirm(destination)}>{t("ui.97247a78e4")}</button></footer>
    </section>
  </div>
}
