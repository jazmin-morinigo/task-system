// Mismos valores que los CHECK de db/schema.sql, como union de literales en vez de `string`
// suelto: un valor que no sea uno de estos no compila. Los arrays quedan exportados para que
// z.enum() en routes/tasks.ts los use directamente, sin repetir los literales ahí también.
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

// Una fila de `tasks` con el aliasing camelCase de los SELECT del repositorio. Vive acá y no en
// services/aggregate.ts porque la usan los dos lados: el repositorio la devuelve y la función
// pura de agregación la consume — así el repositorio no importa nada desde services/.
export interface TaskRow {
  id: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  // Llega como number, no string, por el type parser de NUMERIC registrado en db/pool.ts.
  estimatedEffort: number | null;
  createdAt: Date;
  updatedAt: Date;
}
