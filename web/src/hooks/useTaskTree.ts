import { useEffect, useState } from 'react'
import { fetchTaskTree } from '../lib/api'
import type { TaskNode } from '../lib/types'

interface UseTaskTreeResult {
  data: TaskNode | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useTaskTree(id: string | undefined): UseTaskTreeResult {
  const [result, setResult] = useState<Omit<UseTaskTreeResult, 'refetch'>>({
    data: null,
    isLoading: true,
    error: null,
  })
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (!id) {
      setResult({ data: null, isLoading: false, error: 'Id inválido' })
      return
    }

    const controller = new AbortController()
    setResult((prev) => ({ ...prev, isLoading: true, error: null }))

    fetchTaskTree(id, controller.signal)
      .then((data) => setResult({ data, isLoading: false, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Error al cargar la tarea'
        setResult({ data: null, isLoading: false, error: message })
      })

    return () => controller.abort()
  }, [id, refreshIndex])

  function refetch() {
    setRefreshIndex((i) => i + 1)
  }

  return { ...result, refetch }
}
