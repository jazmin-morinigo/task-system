import { Badge } from '../ui/badge'
import type { TaskNode, TaskPriority, TaskStatus } from '../../lib/types'

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

interface TaskTreeNodeProps {
  node: TaskNode
  depth: number
}

export function TaskTreeNode({ node, depth }: TaskTreeNodeProps) {
  return (
    <div>
      <div
        style={{ paddingLeft: depth * 16 }}
        className="flex flex-wrap items-center gap-3 border-b py-2 text-sm"
      >
        <span className="flex-1">{node.title}</span>
        <Badge variant="secondary">{STATUS_LABELS[node.status]}</Badge>
        <Badge variant="outline">{PRIORITY_LABELS[node.priority]}</Badge>
        <span className="w-24 text-right tabular-nums text-muted-foreground">
          {node.estimatedEffort === null ? 'Sin estimar' : node.estimatedEffort}
        </span>
        <span className="w-20 text-right tabular-nums">{node.notStartedEffort}</span>
        <span className="w-20 text-right tabular-nums">{node.inProgressEffort}</span>
        <span className="w-20 text-right tabular-nums">{node.totalEffort}</span>
      </div>
      {node.children.map((child) => (
        <TaskTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}
