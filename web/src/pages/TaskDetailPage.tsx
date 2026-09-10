import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTaskTree } from '../hooks/useTaskTree'
import { TaskTreeNode } from '../components/tree/TaskTreeNode'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'

// Una fila esqueleto, con la misma forma responsive (mobile compacto / fila de una línea en
// desktop) que TaskTreeNode — indent=true reusa la guía de nivel 1 (border-l-2) para insinuar
// jerarquía sin recursión real.
function TaskDetailSkeletonRow({ indent = false }: { indent?: boolean }) {
  const row = (
    <>
      <div className="flex items-center gap-3 border-b py-2 md:hidden">
        <span className="inline-block size-4" />
        <Skeleton className="h-4 flex-1" />
      </div>
      <div className="hidden items-center gap-3 border-b py-2 md:flex">
        <span className="inline-block size-4" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </>
  )

  return indent ? <div className="border-l-2 border-border pl-4">{row}</div> : row
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, refetch } = useTaskTree(id)
  const navigate = useNavigate()

  function handleDeleted(deletedId: string) {
    if (deletedId === id) {
      navigate('/')
    } else {
      refetch()
    }
  }

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

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading && (
        <div>
          <TaskDetailSkeletonRow />
          <TaskDetailSkeletonRow indent />
        </div>
      )}

      {data && (
        <div>
          <div className="hidden items-center gap-3 border-b pb-2 text-xs font-medium text-muted-foreground md:flex md:flex-wrap">
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
              <span className="inline-block size-6" />
            </span>
          </div>
          <TaskTreeNode node={data} depth={0} onChanged={refetch} onDeleted={handleDeleted} />
        </div>
      )}
    </main>
  )
}
