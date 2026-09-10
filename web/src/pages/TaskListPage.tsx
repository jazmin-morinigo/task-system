import { useState } from 'react'
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
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_BADGE_CLASSES } from '../lib/labels'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { TaskFormDialog } from '../components/TaskFormDialog'
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

const SKELETON_ROWS = [0, 1, 2, 3, 4]
const SKELETON_CARDS = [0, 1, 2]

export function TaskListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useTasks(searchParams)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

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

  const showList = isLoading || (data && data.data.length > 0)

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tareas</h1>
        <Button onClick={() => setIsCreateOpen(true)}>+ Nueva tarea</Button>
      </div>

      <TaskFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
        onSuccess={refetch}
      />

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-filter-panel-border bg-filter-panel p-3 sm:flex sm:flex-row sm:flex-wrap sm:gap-3">
        <Select value={status} onValueChange={(value) => updateParams({ status: value ?? undefined })}>
          <SelectTrigger className="w-full min-w-0 sm:w-auto">
            <SelectValue placeholder="Estado">
              {(value: string) =>
                value === ALL_VALUE ? 'Todos los estados' : STATUS_LABELS[value as TaskStatus]
              }
            </SelectValue>
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
          <SelectTrigger className="w-full min-w-0 sm:w-auto">
            <SelectValue placeholder="Prioridad">
              {(value: string) =>
                value === ALL_VALUE
                  ? 'Todas las prioridades'
                  : PRIORITY_LABELS[value as TaskPriority]
              }
            </SelectValue>
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
          <SelectTrigger className="w-full min-w-0 sm:w-auto">
            <SelectValue placeholder="Ordenar por">
              {(value: string) => SORT_BY_LABELS[value as SortBy]}
            </SelectValue>
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
          <SelectTrigger className="w-full min-w-0 sm:w-auto">
            <SelectValue placeholder="Orden">
              {(value: string) => ORDER_LABELS[value as Order]}
            </SelectValue>
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

      {!error && !isLoading && data?.data.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No hay tareas.</p>
      )}

      {!error && showList && (
        <>
          <div className="hidden md:block">
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
                {isLoading &&
                  SKELETON_ROWS.map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-8" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-8" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-8" />
                      </TableCell>
                    </TableRow>
                  ))}
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
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {isLoading &&
              SKELETON_CARDS.map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((j) => (
                      <div key={j}>
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="mt-1 h-4 w-8" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            {!isLoading &&
              data?.data.map((task: Task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{task.title}</CardTitle>
                      <Badge className={`border-transparent ${STATUS_BADGE_CLASSES[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </div>
                    <CardDescription>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full ${PRIORITY_DOT_CLASSES[task.priority]}`}
                        />
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Sin empezar</div>
                      <div className="tabular-nums">{task.notStartedEffort}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">En progreso</div>
                      <div className="tabular-nums">{task.inProgressEffort}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="tabular-nums">{task.totalEffort}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}

      {data && data.totalPages > 0 && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
