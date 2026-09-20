import { useAppLanguage, tx, m, t } from '@/i18n'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ChevronDown, ChevronsRight, FolderOpen, GripVertical, Play, Save, Settings, X } from 'lucide-react'
import { useAdsProDrawerFocus, useAdsProDrawerViewport } from './ads-check-pro-responsive-drawer'
import { functionIcons } from './ads-check-pro-function-icons'
import { AdsCheckProTemplatePanel } from './ads-check-pro-template-panel'
import { defaultTemplateName, type WorkflowTemplate } from './ads-check-pro-template-store'
import { buildStepCardNotchPath } from './ads-check-pro-workflow-step-geometry'
import {
  clampRunnerDelayMs, clampRunnerThreads, getStepConfigFields, RUNNER_THREADS_MAX, RUNNER_THREADS_MIN,
  type StepFieldDefinition, type WorkflowMode,
} from './ads-check-pro-workspace-data'

export type WorkflowStep = {
  instanceId: string
  itemId: string
  functionId: string
  icon: string
  label: string
  groupLabel: string
}

type WorkflowPanelProps = {
  assetLabel: string
  steps: WorkflowStep[]
  workflowMode: WorkflowMode
  expandedStepIds: Set<string>
  stepConfigValues: Record<string, Record<string, string>>
  threads: number
  delayMs: number
  selectedAccountCount: number
  open: boolean
  onClose: () => void
  onToggleExpand: (itemId: string) => void
  onRemove: (instanceId: string, itemId: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onConfigChange: (itemId: string, fieldKey: string, value: string) => void
  onThreadsChange: (value: number) => void
  onDelayMsChange: (value: number) => void
  templates: WorkflowTemplate[]
  loadedTemplateId: string | null
  onSaveTemplate: (name: string, createNew: boolean) => void
  onRenameTemplate: (id: string, name: string) => void
  onLoadTemplate: (template: WorkflowTemplate) => void
  onDeleteTemplate: (id: string) => void
  onStart: () => void
}

function StepConfigFieldView({ field, value, onChange }: { field: StepFieldDefinition; value: string; onChange: (value: string) => void }) {
  useAppLanguage();
  const invalid = !!field.required && value.trim().length === 0
  const inputId = `ads-workflow-step-field-${field.key}`
  return <label className="ads-workflow-step-field" htmlFor={inputId}>
    <span className="ads-workflow-step-field-label">{tx(field.label)}{field.required && <span className="ads-workflow-step-field-required" aria-hidden="true"> *</span>}</span>
    {tx(field.type === 'select'
      ? <select id={inputId} value={value} aria-invalid={invalid} aria-required={field.required} onChange={(event) => onChange(event.target.value)}>
          <option value="" disabled>{tx(field.placeholder ?? m("ui.3d5b557d62"))}</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{tx(option.label)}</option>)}
        </select>
      : field.type === 'textarea'
        ? <textarea id={inputId} value={value} placeholder={tx(field.placeholder)} aria-invalid={invalid} aria-required={field.required} onChange={(event) => onChange(event.target.value)} />
        : <input id={inputId} type="text" value={value} placeholder={tx(field.placeholder)} aria-invalid={invalid} aria-required={field.required} onChange={(event) => onChange(event.target.value)} />)}
    {tx(field.hint && <span className="ads-workflow-step-field-hint">{tx(field.hint)}</span>)}
  </label>
}

type StepCardViewProps = {
  step: WorkflowStep
  index: number
  mode: WorkflowMode
  expanded: boolean
  configValues: Record<string, string>
  onToggleExpand: () => void
  onRemove: () => void
  onConfigChange: (fieldKey: string, value: string) => void
  rowRef?: (node: HTMLLIElement | null) => void
  rowStyle?: CSSProperties
  isDragging?: boolean
  handleProps?: Record<string, unknown>
}

// Traced step card structure (references/remotes/adaccounts/436.e5c83aa9.js
// "tool-step-frame"): step-number pill + remove button (top-right, both
// stop propagation), a title row with a drag handle (own tooltip, inert
// click) and a big label button that ALSO toggles expand, then the
// expanded config area. The card's own scalloped SVG-notch outline (see
// buildStepCardNotchPath) is production's exact path generator, re-run here
// against this card's own live-measured box — the pill sits recessed into
// the top-left cutout, everything else is the plain rounded body.
function StepCardView({ step, index, mode, expanded, configValues, onToggleExpand, onRemove, onConfigChange, rowRef, rowStyle, isDragging, handleProps }: StepCardViewProps) {
  useAppLanguage();
  const Icon = functionIcons[step.icon] ?? Settings
  const fields = getStepConfigFields(step.functionId)
  const removeLabel = mode === 'single' ? m("ui.2aff6dd328", { 0: step.label }) : m("ui.6983f7117a", { 0: index + 1, 1: step.label })
  const measureRef = useRef<HTMLLIElement | null>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const node = measureRef.current
    if (!node) return
    const update = () => {
      const rect = node.getBoundingClientRect()
      setBox({ width: rect.width, height: rect.height })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [expanded])
  const setRefs = (node: HTMLLIElement | null) => {
    measureRef.current = node
    rowRef?.(node)
  }
  const notchPath = buildStepCardNotchPath(box.width, box.height, index + 1)
  return <li ref={setRefs} style={rowStyle} className={`ads-workflow-step${expanded ? ' is-expanded' : ''}${isDragging ? ' is-dragging' : ''}`}>
    {notchPath && <svg className="ads-workflow-step-notch-bg" viewBox={`0 0 ${box.width} ${box.height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={notchPath} />
    </svg>}
    <div className="ads-workflow-step-body">
      <div className="ads-workflow-step-top">
        <button type="button" className="ads-workflow-step-pill" aria-label={tx(expanded ? m("ui.cea1fa10ad", { 0: index + 1 }) : m("ui.ad136715a1", { 0: index + 1 }))} onClick={onToggleExpand}>
          <ChevronDown size={12} className="ads-workflow-step-pill-chevron" aria-hidden="true" />
          <span>{t("ui.ddd5582fc6")}{" "}{index + 1}</span>
        </button>
        <button type="button" className="ads-workflow-step-remove" aria-label={tx(removeLabel)} onClick={onRemove}>
          <X size={12} />
        </button>
      </div>
      <div className="ads-workflow-step-title-row">
        <button type="button" className="ads-workflow-step-handle" title={t("ui.ac65479992")} aria-label={tx(m("ui.f3f4aa56f6", { 0: index + 1 }))} onClick={(event) => event.stopPropagation()} {...handleProps}>
          <GripVertical size={14} />
        </button>
        <button type="button" className="ads-workflow-step-label" aria-expanded={expanded} onClick={onToggleExpand}>
          <Icon size={14} aria-hidden="true" />
          <span>{tx(step.label)}</span>
        </button>
      </div>
      {expanded && <div className="ads-workflow-step-config">
        {fields.length > 0
          ? fields.map((field) => <StepConfigFieldView key={field.key} field={field} value={configValues[field.key] ?? ''} onChange={(value) => onConfigChange(field.key, value)} />)
          : <p className="ads-workflow-step-no-config">{t("ui.93b048b512")}</p>}
      </div>}
    </div>
  </li>
}

function SortableStepCard(props: Omit<StepCardViewProps, 'rowRef' | 'rowStyle' | 'isDragging' | 'handleProps'>) {
  useAppLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.step.instanceId })
  return <StepCardView {...props} rowRef={setNodeRef} rowStyle={{ transform: CSS.Transform.toString(transform), transition }} isDragging={isDragging} handleProps={{ ...attributes, ...listeners }} />
}

export function AdsCheckProWorkflowPanel({
  assetLabel, steps, workflowMode, expandedStepIds, stepConfigValues, threads, delayMs, selectedAccountCount,
  open, onClose, onToggleExpand, onRemove, onReorder, onConfigChange, onThreadsChange, onDelayMsChange,
  templates, loadedTemplateId, onSaveTemplate, onRenameTemplate, onLoadTemplate, onDeleteTemplate, onStart,
}: WorkflowPanelProps) {
  useAppLanguage();
  const panelRef = useRef<HTMLElement>(null)
  const isDrawer = useAdsProDrawerViewport()
  useAdsProDrawerFocus(open && isDrawer, panelRef, onClose)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Template panel (Batch Update Part A, lifecycle corrected in Correction
  // Batch 3 Part A) — an inline panel in normal flow (pushes the canvas
  // down), not a full-screen modal. `namingDraft` !== null switches it into
  // the save-naming screen; header "Template" toggles the panel, footer
  // "Lưu Template" opens it straight into naming.
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false)
  const [namingDraft, setNamingDraft] = useState<string | null>(null)
  // Traced production: the "Tạo template mới" checkbox only exists (and is
  // unchecked by default) once a template is currently loaded — its
  // ABSENCE for a fresh/never-loaded workflow means save unconditionally
  // creates new, matching the loadedTemplateId === null branch below.
  const [createNewChecked, setCreateNewChecked] = useState(false)
  const loadedTemplate = loadedTemplateId ? templates.find((template) => template.id === loadedTemplateId) ?? null : null
  const startSaveTemplate = () => {
    setNamingDraft(loadedTemplate ? loadedTemplate.name : defaultTemplateName(templates.length))
    setCreateNewChecked(false)
    setTemplatePanelOpen(true)
  }
  const confirmSaveTemplate = () => {
    const name = namingDraft?.trim()
    if (!name) return
    onSaveTemplate(name, loadedTemplate === null || createNewChecked)
    setNamingDraft(null)
  }
  const cancelSaveTemplate = () => setNamingDraft(null)

  // Start readiness — traced production gates (references/remotes/
  // adaccounts/436.e5c83aa9.js): 0 steps and 0 selected accounts each block
  // Start with their own exact warning toast. The 3rd gate (required config
  // fields on the small modeled subset of functions) is this clone's own
  // client-side addition — production's deeper readiness chain also
  // involves entitlement/locked-function/remote-account checks this clone
  // has no real backend for (see Round 5 report), so only these 3 confirmed-
  // reachable gates are enforced here.
  const missingConfig = steps.some((step) => {
    const fields = getStepConfigFields(step.functionId)
    if (fields.length === 0) return false
    const values = stepConfigValues[step.itemId] ?? {}
    return fields.some((field) => field.required && (values[field.key]?.trim().length ?? 0) === 0)
  })
  const canStart = steps.length > 0 && selectedAccountCount > 0 && !missingConfig
  // Exact traced toast strings (adaccounts.tkqc.toolWorkflowPanel.
  // warnNoFunction/warnNoAccount) surfaced as the disabled button's own
  // title instead of a toast — a disabled DOM button never dispatches
  // click, so a toast wired to onClick would be unreachable through it;
  // this keeps the real production copy visible without inventing a click
  // path that can't exist. The 3rd reason (required config) has no traced
  // string — it's this clone's own client-side addition, worded plainly.
  const startDisabledReason = steps.length === 0
    ? m("ui.8f08a96c03")
    : selectedAccountCount === 0
      ? m("ui.79446372b8", { 0: assetLabel })
      : missingConfig
        ? m("ui.64c8bf708f")
        : undefined

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = steps.findIndex((step) => step.instanceId === active.id)
    const newIndex = steps.findIndex((step) => step.instanceId === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(oldIndex, newIndex)
  }

  const stepIds = steps.map((step) => step.instanceId)

  return <aside ref={panelRef} id="ads-pro-workflow" className={`ads-workflow-panel${open ? ' is-open' : ''}`} role={isDrawer && open ? 'dialog' : undefined} aria-labelledby="ads-workflow-title">
    <header className="ads-panel-heading ads-workflow-heading">
      <h2 id="ads-workflow-title">{t("ui.4e8bce41f2")}{" "}<span>– {steps.length} {" "}{t("ui.381cb564b6")}</span></h2>
      <button className="ads-workflow-template" type="button" aria-label="Template" aria-expanded={templatePanelOpen} onClick={() => setTemplatePanelOpen((value) => !value)}><FolderOpen size={15} />{t("ui.3ec1ae061c")}</button>
      <button className="ads-workflow-close" type="button" aria-label={t("ui.33165c0f9f")} data-autofocus={isDrawer ? true : undefined} onClick={onClose}><ChevronsRight size={18} /></button>
    </header>
    {templatePanelOpen && <AdsCheckProTemplatePanel
      templates={templates}
      namingDraft={namingDraft}
      onChangeNamingDraft={setNamingDraft}
      showCreateNewOption={loadedTemplate !== null}
      createNewChecked={createNewChecked}
      onToggleCreateNew={setCreateNewChecked}
      onConfirmSave={confirmSaveTemplate}
      onCancelSave={cancelSaveTemplate}
      onLoad={onLoadTemplate}
      onRename={onRenameTemplate}
      onDelete={onDeleteTemplate}
      onClose={() => setTemplatePanelOpen(false)}
    />}
    <div className="ads-workflow-canvas">
      {steps.length === 0
        ? <div className="ads-workflow-empty"><span aria-hidden="true"><GripVertical size={22} /></span><p>{t("ui.7569ef2a91")}</p></div>
        : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
              <ol aria-label={t("ui.3da7bfb60c")}>{steps.map((step, index) => <SortableStepCard
                key={step.instanceId}
                step={step}
                index={index}
                mode={workflowMode}
                expanded={expandedStepIds.has(step.itemId)}
                configValues={stepConfigValues[step.itemId] ?? {}}
                onToggleExpand={() => onToggleExpand(step.itemId)}
                onRemove={() => onRemove(step.instanceId, step.itemId)}
                onConfigChange={(fieldKey, value) => onConfigChange(step.itemId, fieldKey, value)}
              />)}</ol>
            </SortableContext>
          </DndContext>}
    </div>
    <footer className="ads-workflow-footer">
      <div className="ads-workflow-fields">
        <div className="ads-runner-pill">
          <span className="ads-runner-pill-label">{t("ui.179e732196")}</span>
          <input aria-label={t("ui.179e732196")} type="number" min={RUNNER_THREADS_MIN} max={RUNNER_THREADS_MAX} value={threads} onChange={(event) => onThreadsChange(clampRunnerThreads(Number(event.target.value)))} />
          <span className="ads-runner-pill-stepper">
            <button type="button" aria-label={t("ui.a4fd615336")} onClick={() => onThreadsChange(clampRunnerThreads(threads + 1))}><ChevronDown size={9} className="is-up" /></button>
            <button type="button" aria-label={t("ui.cfb39a0f95")} onClick={() => onThreadsChange(clampRunnerThreads(threads - 1))}><ChevronDown size={9} /></button>
          </span>
        </div>
        <div className="ads-runner-pill">
          <span className="ads-runner-pill-label">{t("ui.18c4bd3373")}</span>
          <input aria-label="Delay(ms)" type="number" min={0} value={delayMs} onChange={(event) => onDelayMsChange(clampRunnerDelayMs(Number(event.target.value)))} />
          <span className="ads-runner-pill-stepper">
            <button type="button" aria-label={t("ui.75081f6101")} onClick={() => onDelayMsChange(clampRunnerDelayMs(delayMs + 50))}><ChevronDown size={9} className="is-up" /></button>
            <button type="button" aria-label={t("ui.f931a4a6c8")} onClick={() => onDelayMsChange(clampRunnerDelayMs(delayMs - 50))}><ChevronDown size={9} /></button>
          </span>
        </div>
      </div>
      <div className="ads-workflow-actions">
        <button type="button" disabled={steps.length === 0} title={tx(steps.length === 0 ? m("ui.6477fa3c50") : undefined)} onClick={startSaveTemplate}><Save size={15} />{t("ui.b5f044af16")}</button>
        <button className="is-primary" type="button" aria-label={t("ui.3b6985ef3d")} title={tx(startDisabledReason)} disabled={!canStart} onClick={onStart}><Play size={15} fill="currentColor" />{t("ui.95c3f9f596")}</button>
      </div>
    </footer>
  </aside>
}
