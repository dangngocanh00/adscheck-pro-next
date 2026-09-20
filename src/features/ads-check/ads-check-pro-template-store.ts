import { useEffect, useState } from 'react'
import type { AdsAssetKey, WorkflowMode } from './ads-check-pro-workspace-data'
import type { WorkflowStep } from './ads-check-pro-workflow-panel'

// Workflow Template (Batch Update Part A, lifecycle corrected in
// Correction Batch 3 Part A) — production's own flow is a real backend API
// (references/remotes/adaccounts/436.e5c83aa9.js):
//   GET    /ads-check/templates            -> list (one global array, each
//                                              row carries a `target` field:
//                                              "AD"/"BM"/"PAGE"/"PIXEL" —
//                                              filtered client-side per
//                                              asset tool, no "VIA" target
//                                              exists there)
//   POST   /ads-check/templates {target,name,config} -> {template_id}
//   PUT    /ads-check/templates {template_id,name,config?} -> update
//                                              (config OMITTED = rename-only)
//   DELETE /ads-check/templates {template_id}
// A `selectedTemplate` ref tracks whichever template was last applied or
// saved; saving while one is selected updates it in place UNLESS a
// "Tạo template mới" checkbox is checked, in which case it creates a new
// one instead (see AdsCheckProWorkflowPanel's naming screen). This clone
// has no real auth/backend, so per this batch's instructions:
//
// CLONE DEMO PERSISTENCE — a plain localStorage-backed demo store under its
// own `adaccounts.workflow-templates.v1` namespace. This is NOT a
// simulation of the production `/ads-check/templates` API or its storage;
// it exists purely so Save/List/Load/Update/Rename/Delete can be exercised
// end-to-end in the clone, reproducing the exact UX lifecycle traced above.
// The exact production name-input step IS reproduced (traced: nameTitle
// "Tên Template" / namePlaceholder "Nhập tên Template").

export type WorkflowTemplateStep = {
  itemId: string
  functionId: string
  icon: string
  label: string
  groupLabel: string
  config: Record<string, string>
}

export type WorkflowTemplate = {
  id: string
  name: string
  asset: AdsAssetKey
  workflowMode: WorkflowMode
  steps: WorkflowTemplateStep[]
  threads: number
  delayMs: number
  createdAt: number
}

const TEMPLATES_STORAGE_KEY = 'adaccounts.workflow-templates.v1'

function isTemplateStep(value: unknown): value is WorkflowTemplateStep {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.itemId === 'string' && typeof candidate.functionId === 'string'
    && typeof candidate.icon === 'string' && typeof candidate.label === 'string' && typeof candidate.groupLabel === 'string'
    && typeof candidate.config === 'object' && candidate.config !== null
}

function isTemplate(value: unknown): value is WorkflowTemplate {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.asset === 'string'
    && (candidate.workflowMode === 'single' || candidate.workflowMode === 'workflow')
    && Array.isArray(candidate.steps) && candidate.steps.every(isTemplateStep)
    && typeof candidate.threads === 'number' && typeof candidate.delayMs === 'number' && typeof candidate.createdAt === 'number'
}

export function loadTemplates(): WorkflowTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    // Sanitize malformed/old data (Part A7) — a template with an unknown
    // functionId is still safe to keep: rename-on-load only cares about
    // known functions when reconstructing icons/config UI, and an unknown
    // one already degrades gracefully via functionIcons' Settings fallback.
    return parsed.filter(isTemplate)
  } catch {
    return []
  }
}

function saveTemplates(templates: WorkflowTemplate[]) {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // demo store only — a failed write never crashes the UI.
  }
}

function createTemplateId(): string {
  return `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function defaultTemplateName(existingCount: number): string {
  return `Template ${existingCount + 1}`
}

export function useTemplateStore() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(() => loadTemplates())
  useEffect(() => { saveTemplates(templates) }, [templates])

  const saveTemplate = (
    name: string,
    asset: AdsAssetKey,
    workflowMode: WorkflowMode,
    steps: WorkflowStep[],
    stepConfigValues: Record<string, Record<string, string>>,
    threads: number,
    delayMs: number,
  ): WorkflowTemplate => {
    const template: WorkflowTemplate = {
      id: createTemplateId(),
      name,
      asset,
      workflowMode,
      // Deliberately NOT captured: instanceId (regenerated fresh on load)
      // and expanded/collapsed visual state (not part of workflow meaning).
      steps: steps.map((step) => ({
        itemId: step.itemId,
        functionId: step.functionId,
        icon: step.icon,
        label: step.label,
        groupLabel: step.groupLabel,
        config: { ...(stepConfigValues[step.itemId] ?? {}) },
      })),
      threads,
      delayMs,
      createdAt: Date.now(),
    }
    setTemplates((current) => [...current, template])
    return template
  }

  const deleteTemplate = (id: string) => setTemplates((current) => current.filter((template) => template.id !== id))

  // Correction Batch 3 Part A — traced production (references/remotes/
  // adaccounts/436.e5c83aa9.js): saving while a template is loaded and the
  // "Tạo template mới" checkbox is OFF calls PUT (update-by-id) instead of
  // POST (create) — this is the update counterpart of that path, replacing
  // the loaded template's full definition in place, never mutating any
  // OTHER saved template.
  const updateTemplate = (
    id: string,
    name: string,
    asset: AdsAssetKey,
    workflowMode: WorkflowMode,
    steps: WorkflowStep[],
    stepConfigValues: Record<string, Record<string, string>>,
    threads: number,
    delayMs: number,
  ) => {
    setTemplates((current) => current.map((template) => template.id !== id ? template : {
      ...template,
      name,
      asset,
      workflowMode,
      steps: steps.map((step) => ({
        itemId: step.itemId,
        functionId: step.functionId,
        icon: step.icon,
        label: step.label,
        groupLabel: step.groupLabel,
        config: { ...(stepConfigValues[step.itemId] ?? {}) },
      })),
      threads,
      delayMs,
    }))
  }

  // Traced production: rename is the SAME PUT endpoint but sent with only
  // {template_id, name} — no `config` key — so it never touches the saved
  // step/config definition, only the display name.
  const renameTemplate = (id: string, name: string) => setTemplates((current) => current.map((template) => template.id === id ? { ...template, name } : template))

  return { templates, saveTemplate, updateTemplate, renameTemplate, deleteTemplate }
}
