// Mismos valores que los CHECK de db/schema.sql, como union de literales en vez de `string`
// suelto: un valor que no sea uno de estos no compila. Los arrays quedan exportados para que
// z.enum() en routes/tasks.ts los use directamente, sin repetir los literales ahí también.
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
