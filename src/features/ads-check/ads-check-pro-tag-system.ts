// Reusable Tag system (Batch Update Part B) — shared by VIA (Part B) and
// TKQC (Part D6). Two distinct concerns, kept separate per the spec:
//   1. TAG DEFINITION — global catalog (id/name/color), one list for the
//      whole workspace, not per-asset.
//   2. ASSOCIATION — which tag ids are attached to a given row, keyed by
//      `${asset}:${rowId}` so ids never collide across asset tables.
// Deleting a tag definition cleans every association that referenced it;
// removing an association from a row never touches the global definition.
//
// CLONE DEMO PERSISTENCE — production has no visible Tag REST endpoint in
// the fetched bundle chunks (unlike Template, which IS traced to a real
// `/ads-check/templates` API); this is a plain localStorage-backed demo
// store under its own `adaccounts.tags.*` namespace, not a simulation of
// any specific production storage key.

import { useEffect, useState } from 'react'

export type TagDefinition = { id: string; name: string; colorHex: string }

// Exact production swatch palette, traced from references/remotes/
// adaccounts/436.e5c83aa9.js (the `a8` array next to the tag-create form
// markup) — not invented/random.
export const TAG_COLOR_PALETTE: string[] = [
  '#F0524A', '#F5883C', '#E5E200', '#A3D63F', '#35B94B',
  '#33C7D4', '#5B8DEF', '#9B7BE8', '#E27AE0', '#D5DAE0',
]

const TAGS_STORAGE_KEY = 'adaccounts.tags.v1'
const TAG_ASSOCIATIONS_STORAGE_KEY = 'adaccounts.tag-associations.v1'

function isTagDefinition(value: unknown): value is TagDefinition {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.colorHex === 'string'
}

export function loadTags(): TagDefinition[] {
  try {
    const stored = localStorage.getItem(TAGS_STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTagDefinition)
  } catch {
    return []
  }
}

export function saveTags(tags: TagDefinition[]) {
  try {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags))
  } catch {
    // demo store only — a failed write (private mode, quota) just means the
    // next reload starts from an empty catalog, never a crash.
  }
}

export function loadTagAssociations(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(TAG_ASSOCIATIONS_STORAGE_KEY)
    if (!stored) return {}
    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return {}
    const result: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(value)) result[key] = value.filter((id): id is string => typeof id === 'string')
    }
    return result
  } catch {
    return {}
  }
}

export function saveTagAssociations(associations: Record<string, string[]>) {
  try {
    localStorage.setItem(TAG_ASSOCIATIONS_STORAGE_KEY, JSON.stringify(associations))
  } catch {
    // demo store only, see saveTags.
  }
}

export function tagScopeKey(asset: string, rowId: string): string {
  return `${asset}:${rowId}`
}

export function createTagId(): string {
  return `tag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// Lifted to the workspace root (same pattern as Pin/Workflow Mode/catalog
// order) and passed down — one instance, shared by every asset table's Tag
// column so the global catalog and its per-row associations always agree.
export function useTagSystem() {
  const [tags, setTags] = useState<TagDefinition[]>(() => loadTags())
  const [associations, setAssociations] = useState<Record<string, string[]>>(() => loadTagAssociations())

  useEffect(() => { saveTags(tags) }, [tags])
  useEffect(() => { saveTagAssociations(associations) }, [associations])

  const getRowTagIds = (asset: string, rowId: string): string[] => associations[tagScopeKey(asset, rowId)] ?? []

  const toggleAssign = (asset: string, rowId: string, tagId: string) => {
    const key = tagScopeKey(asset, rowId)
    setAssociations((current) => {
      const existing = current[key] ?? []
      const next = existing.includes(tagId) ? existing.filter((id) => id !== tagId) : [...existing, tagId]
      return { ...current, [key]: next }
    })
  }

  const removeAssign = (asset: string, rowId: string, tagId: string) => {
    const key = tagScopeKey(asset, rowId)
    setAssociations((current) => {
      const existing = current[key]
      if (!existing || !existing.includes(tagId)) return current
      return { ...current, [key]: existing.filter((id) => id !== tagId) }
    })
  }

  const setAssignMany = (asset: string, rowIds: string[], tagId: string, assigned: boolean) => {
    setAssociations((current) => {
      const next = { ...current }
      for (const rowId of rowIds) {
        const key = tagScopeKey(asset, rowId)
        const existing = next[key] ?? []
        next[key] = assigned
          ? (existing.includes(tagId) ? existing : [...existing, tagId])
          : existing.filter((id) => id !== tagId)
      }
      return next
    })
  }

  const createTag = (name: string, colorHex: string): TagDefinition => {
    const tag: TagDefinition = { id: createTagId(), name, colorHex }
    setTags((current) => [...current, tag])
    return tag
  }

  const deleteTag = (tagId: string) => {
    setTags((current) => current.filter((tag) => tag.id !== tagId))
    setAssociations((current) => {
      const next: Record<string, string[]> = {}
      for (const [key, ids] of Object.entries(current)) next[key] = ids.filter((id) => id !== tagId)
      return next
    })
  }

  const reorderTags = (fromIndex: number, toIndex: number) => {
    setTags((current) => {
      const next = current.slice()
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  return { tags, getRowTagIds, toggleAssign, removeAssign, setAssignMany, createTag, deleteTag, reorderTags }
}
