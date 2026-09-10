import { useEffect, useState } from 'react'
import { fetchTasks } from '../lib/api'
import type { TaskListResponse } from '../lib/types'

interface UseTasksResult {
  data: TaskListResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useTasks(params: URLSearchParams): UseTasksResult {
  const [result, setResult] = useState<Omit<UseTasksResult, 'refetch'>>({
    data: null,
    isLoading: true,
    error: null,
  })
  const [refreshIndex, setRefreshIndex] = useState(0)
  const query = params.toString()

  useEffect(() => {
    const controller = new AbortController()
    setResult((prev) => ({ ...prev, isLoading: true, error: null }))

    fetchTasks(new URLSearchParams(query), controller.signal)
      .then((data) => setResult({ data, isLoading: false, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Error al cargar las tareas'
        setResult({ data: null, isLoading: false, error: message })
      })

    return () => controller.abort()
  }, [query, refreshIndex])

  function refetch() {
    setRefreshIndex((i) => i + 1)
  }

  return { ...result, refetch }
}
