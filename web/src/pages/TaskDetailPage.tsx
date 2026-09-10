import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTaskTree } from '../hooks/useTaskTree'
import { TaskTreeNode } from '../components/tree/TaskTreeNode'
import { Button } from '../components/ui/button'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, refetch } = useTaskTree(id)
  const navigate = useNavigate()

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft />
        Volver
      </Button>
      <h1 className="mb-6 text-xl font-semibold">Detalle de tarea</h1>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <div>
          <div className="flex flex-wrap items-center gap-3 border-b pb-2 text-xs font-medium text-muted-foreground">
            <span className="inline-block size-4" />
            <span className="flex-1">Título</span>
            <span>Estado</span>
            <span>Prioridad</span>
            <span className="w-24 text-right">Estimado</span>
            <span className="w-20 text-right">Sin empezar</span>
            <span className="w-20 text-right">En progreso</span>
            <span className="w-20 text-right">Total</span>
            <span className="inline-flex gap-1">
              <span className="inline-block size-6" />
              <span className="inline-block size-6" />
            </span>
          </div>
          <TaskTreeNode node={data} depth={0} onChanged={refetch} />
        </div>
      )}
    </main>
  )
}
