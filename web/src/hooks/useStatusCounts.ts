import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchTaskStatusCounts, TASKS_CHANGED_EVENT } from '../lib/api'
import type { TaskStatus } from '../lib/types'

// Desglose de tareas raíz por estado, para el header. Se refetchea al navegar (useLocation) y
// al recibir el evento "tasks-changed" que emiten createTask/updateTask/deleteTask — así el
// header no queda desactualizado tras crear/editar/borrar sin navegar, sin que este hook
// necesite importar useTasks/useTaskTree ni ningún estado compartido.
export function useStatusCounts(): Record<TaskStatus, number> | null {
  const location = useLocation()
  const [counts, setCounts] = useState<Record<TaskStatus, number> | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    function load() {
      fetchTaskStatusCounts(controller.signal)
        .then(setCounts)
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          // Adorno del header, no bloquea ninguna página — si falla, simplemente no se muestra.
        })
    }

    load()
    window.addEventListener(TASKS_CHANGED_EVENT, load)

    return () => {
      controller.abort()
      window.removeEventListener(TASKS_CHANGED_EVENT, load)
    }
  }, [location])

  return counts
}
