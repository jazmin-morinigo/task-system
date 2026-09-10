import type { TaskListResponse } from './types'

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
