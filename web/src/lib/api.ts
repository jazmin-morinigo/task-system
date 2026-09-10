import type {
  CreateTaskInput,
  Task,
  TaskListResponse,
  TaskNode,
  TaskStatus,
  UpdateTaskInput,
} from './types'
import { TASK_STATUSES } from './types'

// Señal global liviana: cualquier mutación exitosa la dispara. AppHeader (useStatusCounts) la
// escucha para refrescar el desglose de estados sin que este módulo o las páginas que llaman a
// estas funciones sepan que el header existe — desacoplado en los dos sentidos, sin Context.
export const TASKS_CHANGED_EVENT = 'tasks-changed'

export async function fetchTasks(
  params: URLSearchParams,
  signal?: AbortSignal
): Promise<TaskListResponse> {
  const query = params.toString()
  const res = await fetch(query ? `/tasks?${query}` : '/tasks', { signal })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Error al cargar las tareas')
  }

  return res.json()
}

export async function fetchTaskTree(id: string, signal?: AbortSignal): Promise<TaskNode> {
  const res = await fetch(`/tasks/${id}`, { signal })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Error al cargar la tarea')
  }

  return res.json()
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Error al crear la tarea')
  }

  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT))
  return res.json()
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const res = await fetch(`/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Error al editar la tarea')
  }

  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT))
  return res.json()
}

export async function deleteTask(id: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`/tasks/${id}`, { method: 'DELETE', signal })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Error al eliminar la tarea')
  }

  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT))
}

export async function fetchTaskStatusCounts(
  signal?: AbortSignal
): Promise<Record<TaskStatus, number>> {
  const results = await Promise.all(
    TASK_STATUSES.map((status) =>
      fetchTasks(new URLSearchParams({ status, limit: '1' }), signal)
    )
  )

  return TASK_STATUSES.reduce(
    (counts, status, i) => {
      counts[status] = results[i]!.total
      return counts
    },
    {} as Record<TaskStatus, number>
  )
}
