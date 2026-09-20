import { useAppLanguage, t, tx, m } from '@/i18n'
import { useState } from 'react'
import { Check, FolderOpen, Pencil, Trash2, X } from 'lucide-react'
import type { WorkflowTemplate } from './ads-check-pro-template-store'

type TemplatePanelProps = {
  templates: WorkflowTemplate[]
  namingDraft: string | null
  onChangeNamingDraft: (value: string) => void
  showCreateNewOption: boolean
  createNewChecked: boolean
  onToggleCreateNew: (value: boolean) => void
  onConfirmSave: () => void
  onCancelSave: () => void
  onLoad: (template: WorkflowTemplate) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function TemplateRow({ template, onLoad, onRename, onDelete }: { template: WorkflowTemplate; onLoad: () => void; onRename: (name: string) => void; onDelete: () => void }) {
  useAppLanguage();
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [renameDraft, setRenameDraft] = useState<string | null>(null)

  if (renameDraft !== null) {
    return <li className="ads-template-row is-renaming">
      <label className="ads-template-rename-field">
        <span className="sr-only">{t("ui.b49ff44990")}</span>
        <input autoFocus aria-label={t("ui.b49ff44990")} value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && renameDraft.trim()) { onRename(renameDraft.trim()); setRenameDraft(null) } if (event.key === 'Escape') setRenameDraft(null) }} />
      </label>
      <button type="button" aria-label={t("ui.467483d2c2")} disabled={renameDraft.trim().length === 0} onClick={() => { onRename(renameDraft.trim()); setRenameDraft(null) }}><Check size={14} /></button>
      <button type="button" aria-label={t("ui.b76b351a66")} onClick={() => setRenameDraft(null)}><X size={14} /></button>
    </li>
  }

  // Correction Batch 3 Part A6: traced production row markup shows ONLY
  // name + step count, nothing else (no "currently loaded" indicator) — so
  // no badge/highlight is added here even though the app tracks provenance
  // internally (see loadedTemplateId in the workspace); that state only
  // drives the Save panel's prefilled name + "Tạo template mới" checkbox.
  return <li className="ads-template-row">
    <button type="button" className="ads-template-row-load" onClick={onLoad}>
      <strong>{template.name}</strong>
      <span>{template.steps.length} {" "}{t("ui.381cb564b6")}</span>
    </button>
    {tx(confirmingDelete
      ? <span className="ads-template-row-confirm">
          <span className="ads-template-row-confirm-text">{t("ui.3ec1ae061c")}{" "}{template.name} {" "}{t("ui.05680330b6")}</span>
          <span className="ads-template-row-confirm-actions">
            <button type="button" aria-label={tx(m("ui.02b9d099ba", { 0: template.name }))} onClick={onDelete}>{t("ui.aa1d94fc16")}</button>
            <button type="button" aria-label={t("ui.08600914dd")} onClick={() => setConfirmingDelete(false)}>{t("ui.34ca764caf")}</button>
          </span>
        </span>
      : <span className="ads-template-row-actions">
          <button type="button" className="ads-template-row-rename" aria-label={tx(m("ui.bca123ab8a", { 0: template.name }))} onClick={() => setRenameDraft(template.name)}><Pencil size={13} /></button>
          <button type="button" className="ads-template-row-delete" aria-label={tx(m("ui.a59b8b42bf", { 0: template.name }))} onClick={() => setConfirmingDelete(true)}><Trash2 size={14} /></button>
        </span>)}
  </li>
}

// Inline panel (NOT a full-screen modal) rendered directly below the
// Workflow header, in normal flow — pushes the canvas down instead of
// overlaying it (Batch Update Part A1). Lifecycle corrected in Correction
// Batch 3 Part A per traced production (see ads-check-pro-template-store.ts
// header): "Tạo template mới" checkbox only shown while a template is
// loaded (default unchecked = update it), plus rename + delete-with-
// description actions per row.
export function AdsCheckProTemplatePanel({ templates, namingDraft, onChangeNamingDraft, showCreateNewOption, createNewChecked, onToggleCreateNew, onConfirmSave, onCancelSave, onLoad, onRename, onDelete, onClose }: TemplatePanelProps) {
  useAppLanguage();
  const naming = namingDraft !== null
  return <section className="ads-template-panel" aria-label={tx(naming ? m("ui.4be5f12dfd") : m("ui.dda9e0e7c1"))}>
    {naming
      ? <>
          <header>
            <FolderOpen size={15} className="ads-template-panel-icon" aria-hidden="true" />
            <strong>{t("ui.4be5f12dfd")}</strong>
            <button type="button" className="ads-template-panel-close" aria-label={t("ui.5536a60cb6")} onClick={onCancelSave}><X size={14} /></button>
          </header>
          <label className="ads-template-name-field">
            <span className="sr-only">{t("ui.d0d9650e23")}</span>
            <input autoFocus aria-label={t("ui.d0d9650e23")} placeholder={t("ui.d0d9650e23")} value={namingDraft} onChange={(event) => onChangeNamingDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onConfirmSave() }} />
          </label>
          {tx(showCreateNewOption && <label className="ads-template-create-new">
            <input type="checkbox" checked={createNewChecked} onChange={(event) => onToggleCreateNew(event.target.checked)} />
            <span>{t("ui.7fb4047ec1")}</span>
          </label>)}
          <div className="ads-template-name-actions">
            <button type="button" className="is-secondary" onClick={onCancelSave}>{t("ui.34ca764caf")}</button>
            <button type="button" className="is-primary" disabled={namingDraft.trim().length === 0} onClick={onConfirmSave}>{t("ui.a306970e8b")}</button>
          </div>
        </>
      : <>
          <header>
            <FolderOpen size={15} className="ads-template-panel-icon" aria-hidden="true" />
            <strong>{t("ui.31dcecf369")}{templates.length})</strong>
            <button type="button" className="ads-template-panel-close" aria-label={t("ui.d65af7b446")} onClick={onClose}><X size={14} /></button>
          </header>
          {templates.length === 0
            ? <p className="ads-template-empty">{t("ui.70383939a0")}</p>
            : <ul className="ads-template-list">{templates.map((template) => <TemplateRow key={template.id} template={template} onLoad={() => onLoad(template)} onRename={(name) => onRename(template.id, name)} onDelete={() => onDelete(template.id)} />)}</ul>}
        </>}
  </section>
}
