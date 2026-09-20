import { m, useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useRef, useState } from 'react'
import { Settings, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import type { WorkflowMode } from './ads-check-pro-workspace-data'

// Exact production copy (references/remotes/adaccounts/97.fdaad52b.js,
// adaccounts.workspace.workflowMode.*) — not translated/invented.
const MODE_OPTIONS: { value: WorkflowMode; title: string; description: string }[] = [
  {
    value: 'single',
    title: m("ui.7da165f440"),
    description: m("ui.e3a6a05b6d"),
  },
  {
    value: 'workflow',
    title: m("ui.e23b72c97b"),
    description: m("ui.ce229a7904"),
  },
]

type WorkflowModeDialogProps = {
  open: boolean
  mode: WorkflowMode
  onClose: () => void
  onSave: (mode: WorkflowMode) => void
}

export function AdsCheckProWorkflowModeDialog({ open, mode, onClose, onSave }: WorkflowModeDialogProps) {
  useAppLanguage();
  const dialogRef = useRef<HTMLElement>(null)
  const [draft, setDraft] = useState<WorkflowMode>(mode)
  // Production's own dialog: the radio selection is a LOCAL draft — only
  // "Lưu thay đổi" commits it (setMode). Cancel/close/Escape/backdrop all
  // discard the draft, matching the Dialog's own onUpdate:open wiring
  // (no save path other than the explicit button).
  useEffect(() => { if (open) setDraft(mode) }, [open, mode])
  useOverlayFocus(open, dialogRef, onClose)
  if (!open) return null

  return <div className="ads-pro-local-dialog-layer">
    <section ref={dialogRef} className="ads-workflow-mode-dialog" role="dialog" aria-modal="true" aria-labelledby="ads-workflow-mode-dialog-title">
      <header>
        <Settings size={16} aria-hidden="true" />
        <h2 id="ads-workflow-mode-dialog-title">{t("ui.c6a325e61b")}</h2>
        <button type="button" className="ads-workflow-mode-dialog-close" aria-label={t("ui.34ca764caf")} onClick={onClose}><X size={16} /></button>
      </header>
      <div className="ads-workflow-mode-body">
        <div className="ads-workflow-mode-options" role="radiogroup" aria-label={t("ui.c6a325e61b")}>
          {MODE_OPTIONS.map((option) => {
            const selected = draft === option.value
            return <label key={option.value} className={`ads-workflow-mode-option${selected ? ' is-selected' : ''}`}>
              <div>
                <p className="ads-workflow-mode-option-title">{tx(option.title)}</p>
                <input type="radio" name="ads-workflow-mode" value={option.value} checked={selected} onChange={() => setDraft(option.value)} data-autofocus={option.value === mode ? true : undefined} />
              </div>
              <p className="ads-workflow-mode-option-desc">{tx(option.description)}</p>
            </label>
          })}
        </div>
        {/* Production shows a live illustrated preview of each mode here
            (a distinct component per mode, not traceable to reusable
            assets) — reproduced as a simple non-interactive schematic
            instead of guessing its exact artwork. */}
        <div className="ads-workflow-mode-preview" aria-hidden="true">
          {draft === 'single'
            ? <div className="ads-workflow-mode-preview-row is-single" />
            : <>
                <div className="ads-workflow-mode-preview-row" />
                <div className="ads-workflow-mode-preview-row" />
                <div className="ads-workflow-mode-preview-row" />
              </>}
        </div>
      </div>
      <footer>
        <button type="button" className="is-secondary" onClick={onClose}>{t("ui.34ca764caf")}</button>
        <button type="button" className="is-primary" onClick={() => onSave(draft)}>{t("ui.c05f72bd8c")}</button>
      </footer>
    </section>
  </div>
}

export default AdsCheckProWorkflowModeDialog
