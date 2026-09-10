import { pool } from '../db/pool.js';
import type { TaskPriority, TaskStatus } from '../lib/taskTypes.js';

interface RootFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
}

// Compartido por findAllRoots y countRoots para no duplicar la lógica de filtros entre las dos:
// arma el WHERE con parent_id IS NULL más status/priority condicionales, con los placeholders
// numerados según cuántos filtros haya. El texto de la condición es fijo (`status = $n`); el
// único valor que entra en la query va parametrizado en `params`.
function buildRootWhere(filter: RootFilter): { clause: string; params: unknown[] } {
  const conditions = ['parent_id IS NULL'];
  const params: unknown[] = [];

  if (filter.status) {
    params.push(filter.status);
    conditions.push(`status = $${params.length}`);
  }

  if (filter.priority) {
    params.push(filter.priority);
    conditions.push(`priority = $${params.length}`);
  }

  return { clause: conditions.join(' AND '), params };
}

export interface FindAllRootsOptions extends RootFilter {
  limit: number;
  offset: number;
  // Resuelto por lib/query.ts a partir de sortBy/order ya validados — nunca texto del cliente.
  orderBy: string;
}

export async function findAllRoots(options: FindAllRootsOptions) {
  const { clause, params } = buildRootWhere(options);

  params.push(options.limit);
  const limitIdx = params.length;
  params.push(options.offset);
  const offsetIdx = params.length;

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
     WHERE ${clause}
     ORDER BY ${options.orderBy}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  );

  return rows;
}

export async function countRoots(filter: RootFilter = {}): Promise<number> {
  const { clause, params } = buildRootWhere(filter);

  const { rows } = await pool.query(`SELECT COUNT(*) AS count FROM tasks WHERE ${clause}`, params);

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

// Fila completa, mismo aliasing camelCase que findAllRoots/create. Sirve para dos casos: el
// chequeo de existencia de parentId en createTask (le alcanza con que el resultado no sea null,
// no hace falta una query más liviana aparte) y GET /tasks/:id.
export async function findById(id: string) {
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
     WHERE id = $1`,
    [id],
  );

  return rows[0] ?? null;
}
