import { useEffect, useState, type FormEvent } from 'react'
import { createTask, updateTask } from '../lib/api'
import { STATUS_LABELS, PRIORITY_LABELS } from '../lib/labels'
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskPriority, type TaskStatus } from '../lib/types'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  parentId?: string
  task?: Task
  onSuccess: () => void
}

export function TaskFormDialog({
  open,
  onOpenChange,
  mode,
  parentId,
  task,
  onSuccess,
}: TaskFormDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('TODO')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [estimatedEffort, setEstimatedEffort] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setStatus(task?.status ?? 'TODO')
    setPriority(task?.priority ?? 'MEDIUM')
    setEstimatedEffort(task?.estimatedEffort != null ? String(task.estimatedEffort) : '')
    setError(null)
  }, [open, task, mode, parentId])

  const dialogTitle =
    mode === 'edit' ? 'Editar tarea' : parentId ? 'Nueva subtarea' : 'Nueva tarea'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('El título no puede estar vacío.')
      return
    }

    let effortValue: number | null = null
    if (estimatedEffort.trim() !== '') {
      const parsed = Number(estimatedEffort)
      if (Number.isNaN(parsed) || parsed < 0) {
        setError('El esfuerzo estimado tiene que ser un número mayor o igual a 0.')
        return
      }
      effortValue = parsed
    }

    setSubmitting(true)
    try {
      if (mode === 'create') {
        await createTask({
          title: trimmedTitle,
          description: description.trim() || undefined,
          status,
          priority,
          estimatedEffort: effortValue ?? undefined,
          parentId,
        })
      } else if (task) {
        // Siempre se manda estimatedEffort acá (número o null), nunca se omite: es la única
        // forma de poder borrar una estimación ya puesta (ver UpdateTaskInput en lib/types.ts).
        await updateTask(task.id, {
          title: trimmedTitle,
          description: description.trim() || undefined,
          status,
          priority,
          estimatedEffort: effortValue,
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la tarea')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Descripción</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="task-status">Estado</Label>
              <Select value={status} onValueChange={(value) => value && setStatus(value as TaskStatus)}>
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="task-priority">Prioridad</Label>
              <Select
                value={priority}
                onValueChange={(value) => value && setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PRIORITY_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-effort">Esfuerzo estimado</Label>
            <Input
              id="task-effort"
              type="number"
              min="0"
              step="0.01"
              placeholder="Sin estimar"
              value={estimatedEffort}
              onChange={(e) => setEstimatedEffort(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
