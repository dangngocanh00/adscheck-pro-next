import { create } from 'zustand'
import { departments, employees, regions } from '@/mocks/hrm-data'
import type { OrgNodeType } from '@/types/hrm'

export interface DraftMove {
  id: string
  nodeId: string
  nodeType: OrgNodeType
  nodeName: string
  fromParentId: string
  fromParentName: string
  toParentId: string
  toParentName: string
  effectiveDate: string
  note: string
  includeSubordinates: boolean
}

const baseParents: Record<string, string> = {
  ...Object.fromEntries(regions.map((item) => [item.id, item.seniorManagerId])),
  ...Object.fromEntries(departments.map((item) => [item.id, item.regionId])),
  ...Object.fromEntries(employees.filter((item) => item.departmentId).map((item) => [item.id, item.departmentId!])),
}

interface OrgState {
  savedParents: Record<string, string>
  savedHistory: DraftMove[]
  drafts: DraftMove[]
  undoStack: DraftMove[][]
  redoStack: DraftMove[][]
  addDraft: (move: DraftMove) => void
  undo: () => void
  redo: () => void
  save: () => void
  discard: () => void
}

export const useOrgChartStore = create<OrgState>((set) => ({
  savedParents: baseParents,
  savedHistory: [],
  drafts: [],
  undoStack: [],
  redoStack: [],
  addDraft: (move) => set((state) => ({
    undoStack: [...state.undoStack, state.drafts],
    drafts: [...state.drafts.filter((item) => item.nodeId !== move.nodeId), move],
    redoStack: [],
  })),
  undo: () => set((state) => {
    const previous = state.undoStack.at(-1)
    if (!previous) return state
    return {
      drafts: previous,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [state.drafts, ...state.redoStack],
    }
  }),
  redo: () => set((state) => {
    const [next, ...rest] = state.redoStack
    if (!next) return state
    return {
      drafts: next,
      undoStack: [...state.undoStack, state.drafts],
      redoStack: rest,
    }
  }),
  save: () => set((state) => ({
    savedParents: {
      ...state.savedParents,
      ...Object.fromEntries(state.drafts.map((item) => [item.nodeId, item.toParentId])),
    },
    savedHistory: [...state.savedHistory, ...state.drafts],
    drafts: [],
    undoStack: [],
    redoStack: [],
  })),
  discard: () => set({ drafts: [], undoStack: [], redoStack: [] }),
}))

export const projectedParent = (id: string, saved: Record<string, string>, drafts: DraftMove[]) =>
  drafts.find((item) => item.nodeId === id)?.toParentId ?? saved[id]
