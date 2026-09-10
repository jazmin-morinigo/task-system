import type { CreateTaskInput, Task, TaskListResponse, TaskNode, UpdateTaskInput } from './types'

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

  return res.json()
}

export async function deleteTask(id: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`/tasks/${id}`, { method: 'DELETE', signal })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? 'Error al eliminar la tarea')
  }
}
