import { useParams } from 'react-router-dom'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <main className="p-8">
      <p className="text-sm text-muted-foreground">Detalle de tarea {id} — próximamente.</p>
    </main>
  )
}
