import type { TaskPriority, TaskStatus } from './types'

// Único lugar para estas etiquetas — antes estaban duplicadas en TaskListPage.tsx y
// TaskTreeNode.tsx; TaskFormDialog.tsx las necesita también, así que se consolidan acá.
export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revisión',
  DONE: 'Hecha',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}
