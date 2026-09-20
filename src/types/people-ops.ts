export type OpsTaskCategory = 'onboarding' | 'contract' | 'attendance' | 'approval' | 'offboarding'
export type OpsTaskPriority = 'urgent' | 'high' | 'normal'
export type OpsTaskStatus = 'open' | 'blocked' | 'done'

export interface OpsTask {
  id: string
  employeeId: string
  title: string
  subject: string
  category: OpsTaskCategory
  owner: string
  dueDate: string
  priority: OpsTaskPriority
  status: OpsTaskStatus
  progress: number
  description: string
  sourcePath: string
}

export type PeopleDocumentStatus = 'draft' | 'waiting' | 'signed' | 'expiring'

export interface PeopleDocument {
  id: string
  employeeId: string
  code: string
  title: string
  employee: string
  type: string
  status: PeopleDocumentStatus
  updatedAt: string
  effectiveDate: string
  signers: number
  signed: number
  owner: string
}
