export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const SORT_BY_VALUES = ['createdAt', 'updatedAt', 'priority', 'title'] as const
export type SortBy = (typeof SORT_BY_VALUES)[number]

export const ORDER_VALUES = ['asc', 'desc'] as const
export type Order = (typeof ORDER_VALUES)[number]

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const DEFAULT_SORT_BY: SortBy = 'createdAt'
export const DEFAULT_ORDER: Order = 'desc'

// id, parentId, title, description, status, priority, estimatedEffort, createdAt, updatedAt:
// api/src/lib/taskTypes.ts. notStartedEffort, inProgressEffort, totalEffort:
// api/src/services/aggregate.ts. createdAt/updatedAt son Date del lado del server pero viajan
// como string ISO en el JSON.
export interface Task {
  id: string
  parentId: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  estimatedEffort: number | null
  createdAt: string
  updatedAt: string
  notStartedEffort: number
  inProgressEffort: number
  totalEffort: number
}

export interface TaskListResponse {
  data: Task[]
  page: number
  limit: number
  total: number
  totalPages: number
}
