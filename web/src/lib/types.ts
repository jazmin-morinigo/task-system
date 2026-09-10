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

// GET /tasks/:id devuelve este nodo directamente, sin envoltorio. notStartedEffort/
// inProgressEffort/totalEffort están calculados sobre el subárbol propio de CADA nodo, no
// heredados de la raíz — un hijo profundo tiene sus propios agregados.
export interface TaskNode extends Task {
  children: TaskNode[]
}

// POST /tasks (api/src/routes/tasks.ts, createTaskSchema). estimatedEffort no acepta null acá
// — vacío en el form significa omitir el campo, no mandarlo en null.
export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  estimatedEffort?: number
  parentId?: string
}

// PATCH /tasks/:id (updateTaskSchema). parentId no existe acá — es z.never() en el backend, ni
// siquiera se manda. estimatedEffort SÍ acepta null (a diferencia de create) para poder borrar
// una estimación ya puesta — se manda siempre en modo edición, nunca se omite.
export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  estimatedEffort?: number | null
}
