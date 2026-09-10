import { useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { TaskFormDialog } from '../TaskFormDialog'
import { deleteTask } from '../../lib/api'
import { STATUS_LABELS, PRIORITY_LABELS } from '../../lib/labels'
import type { TaskNode, TaskPriority, TaskStatus } from '../../lib/types'

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

// Tres niveles distinguibles por tamaño/color/opacidad de guía; desde el nivel 3 el
// tratamiento se estabiliza y solo aumenta la indentación (CLAUDE.md, Dirección de diseño).
function guideClasses(childDepth: number): string {
  if (childDepth === 1) return 'border-l-2 border-border'
  if (childDepth === 2) return 'border-l-[1.5px] border-border/60'
  return 'border-l border-border/35'
}

// No cuenta al propio nodo, solo sus descendientes — para el mensaje de confirmación de borrado.
function countDescendants(node: TaskNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0)
}

interface TaskTreeNodeProps {
  node: TaskNode
  depth: number
  onChanged: () => void
  onDeleted: (deletedId: string) => void
}

export function TaskTreeNode({ node, depth, onChanged, onDeleted }: TaskTreeNodeProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [dialogMode, setDialogMode] = useState<'edit' | 'create-child' | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const hasChildren = node.children.length > 0
  const descendantCount = countDescendants(node)

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteTask(node.id)
      setIsDeleteOpen(false)
      onDeleted(node.id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar la tarea')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b py-2 text-sm">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground"
            aria-label={collapsed ? 'Expandir subtareas' : 'Colapsar subtareas'}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        ) : (
          <span className="inline-block size-4" />
        )}
        <span className="flex-1">{node.title}</span>
        <Badge className={`border-transparent ${STATUS_BADGE_CLASSES[node.status]}`}>
          {STATUS_LABELS[node.status]}
        </Badge>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className={`size-2 rounded-full ${PRIORITY_DOT_CLASSES[node.priority]}`} />
          {PRIORITY_LABELS[node.priority]}
        </span>
        <span className="w-24 text-right tabular-nums text-muted-foreground">
          {node.estimatedEffort === null ? 'Sin estimar' : node.estimatedEffort}
        </span>
        <span className="w-20 text-right tabular-nums">{node.notStartedEffort}</span>
        <span className="w-20 text-right tabular-nums">{node.inProgressEffort}</span>
        <span className="w-20 text-right tabular-nums">{node.totalEffort}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Editar tarea"
            onClick={() => setDialogMode('edit')}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Agregar subtarea"
            onClick={() => setDialogMode('create-child')}
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Eliminar tarea"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {hasChildren && !collapsed && (
        <div className={`${guideClasses(depth + 1)} pl-4`}>
          {node.children.map((child) => (
            <TaskTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onChanged={onChanged}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}

      <TaskFormDialog
        open={dialogMode === 'edit'}
        onOpenChange={(open) => setDialogMode(open ? 'edit' : null)}
        mode="edit"
        task={node}
        onSuccess={onChanged}
      />
      <TaskFormDialog
        open={dialogMode === 'create-child'}
        onOpenChange={(open) => setDialogMode(open ? 'create-child' : null)}
        mode="create"
        parentId={node.id}
        onSuccess={onChanged}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar "{node.title}"</AlertDialogTitle>
            <AlertDialogDescription>
              {descendantCount > 0
                ? `Esto también va a eliminar ${descendantCount} subtarea${descendantCount === 1 ? '' : 's'}. Esta acción no se puede deshacer.`
                : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
