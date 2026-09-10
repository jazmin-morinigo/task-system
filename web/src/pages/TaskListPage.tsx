import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import {
  DEFAULT_ORDER,
  DEFAULT_SORT_BY,
  ORDER_VALUES,
  SORT_BY_VALUES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Order,
  type SortBy,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '../lib/types'
import { Badge } from '../components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revisión',
  DONE: 'Hecha',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
}

const STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  TODO: 'bg-status-todo text-status-todo-foreground',
  IN_PROGRESS: 'bg-status-in-progress text-status-in-progress-foreground',
  IN_REVIEW: 'bg-status-in-review text-status-in-review-foreground',
  DONE: 'bg-status-done text-status-done-foreground',
}

const PRIORITY_DOT_CLASSES: Record<TaskPriority, string> = {
  LOW: 'bg-priority-low',
  MEDIUM: 'bg-priority-medium',
  HIGH: 'bg-priority-high',
}

const SORT_BY_LABELS: Record<SortBy, string> = {
  createdAt: 'Fecha de creación',
  updatedAt: 'Última actualización',
  priority: 'Prioridad',
  title: 'Título',
}

const ORDER_LABELS: Record<Order, string> = {
  asc: 'Ascendente',
  desc: 'Descendente',
}

const ALL_VALUE = 'all'

export function TaskListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useTasks(searchParams)

  const page = Number(searchParams.get('page') ?? '1')
  const sortBy = (searchParams.get('sortBy') as SortBy | null) ?? DEFAULT_SORT_BY
  const order = (searchParams.get('order') as Order | null) ?? DEFAULT_ORDER
  const status = searchParams.get('status') ?? ALL_VALUE
  const priority = searchParams.get('priority') ?? ALL_VALUE

  function updateParams(patch: Record<string, string | undefined>, resetPage = true) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === ALL_VALUE) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    if (resetPage) next.delete('page')
    setSearchParams(next)
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  function pageHref(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    return `?${next.toString()}`
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-xl font-semibold">Tareas</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={status} onValueChange={(value) => updateParams({ status: value ?? undefined })}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos los estados</SelectItem>
            {TASK_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={(value) => updateParams({ priority: value ?? undefined })}>
          <SelectTrigger>
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas las prioridades</SelectItem>
            {TASK_PRIORITIES.map((value) => (
              <SelectItem key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => updateParams({ sortBy: value ?? undefined })}>
          <SelectTrigger>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_BY_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {SORT_BY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={order} onValueChange={(value) => updateParams({ order: value ?? undefined })}>
          <SelectTrigger>
            <SelectValue placeholder="Orden" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {ORDER_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {!error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead className="text-right">Sin empezar</TableHead>
              <TableHead className="text-right">En progreso</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay tareas.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              data?.data.map((task: Task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <TableCell>{task.title}</TableCell>
                  <TableCell>
                    <Badge className={`border-transparent ${STATUS_BADGE_CLASSES[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className={`size-2 rounded-full ${PRIORITY_DOT_CLASSES[task.priority]}`}
                      />
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {task.notStartedEffort}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {task.inProgressEffort}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{task.totalEffort}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}

      {data && data.totalPages > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {data.page} de {data.totalPages} — {data.total} tareas
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text="Anterior"
                  href={pageHref(Math.max(1, page - 1))}
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) goToPage(page - 1)
                  }}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  text="Siguiente"
                  href={pageHref(Math.min(data.totalPages, page + 1))}
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < data.totalPages) goToPage(page + 1)
                  }}
                  aria-disabled={page >= data.totalPages}
                  className={page >= data.totalPages ? 'pointer-events-none opacity-50' : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </main>
  )
}
