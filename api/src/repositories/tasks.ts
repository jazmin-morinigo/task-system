import { pool } from '../db/pool.js';
import type { TaskPriority, TaskStatus } from '../lib/taskTypes.js';

export async function findAllRoots(limit: number, offset: number) {
  const { rows } = await pool.query(
    `SELECT
       id,
       parent_id AS "parentId",
       title,
       description,
       status,
       priority,
       estimated_effort AS "estimatedEffort",
       created_at AS "createdAt",
       updated_at AS "updatedAt"
     FROM tasks
     WHERE parent_id IS NULL
     ORDER BY created_at DESC, id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  return rows;
}

export async function countRoots(): Promise<number> {
  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM tasks WHERE parent_id IS NULL');

  // COUNT(*) vuelve como bigint, y `pg` lo entrega como string igual que NUMERIC. Conversión
  // explícita acá, no con un type parser global (CLAUDE.md, Modelo de datos): bigint no está
  // acotado como NUMERIC(10,2), un parser global alcanzaría a cualquier columna bigint futura.
  return Number(rows[0].count);
}

export interface CreateTaskRow {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedEffort: number | null;
  parentId: string | null;
}

export async function create(input: CreateTaskRow) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (title, description, status, priority, estimated_effort, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       id,
       parent_id AS "parentId",
       title,
       description,
       status,
       priority,
       estimated_effort AS "estimatedEffort",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [input.title, input.description, input.status, input.priority, input.estimatedEffort, input.parentId],
  );

  return rows[0];
}

// Solo para el chequeo de existencia de parentId en el servicio — no trae la fila completa.
export async function findById(id: string) {
  const { rows } = await pool.query('SELECT id FROM tasks WHERE id = $1', [id]);

  return rows[0] ?? null;
}
