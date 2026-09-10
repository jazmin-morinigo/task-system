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

// Antes duplicado en TaskListPage.tsx y TaskTreeNode.tsx — AppHeader.tsx lo necesita también.
export const STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  TODO: 'bg-status-todo text-status-todo-foreground',
  IN_PROGRESS: 'bg-status-in-progress text-status-in-progress-foreground',
  IN_REVIEW: 'bg-status-in-review text-status-in-review-foreground',
  DONE: 'bg-status-done text-status-done-foreground',
}
