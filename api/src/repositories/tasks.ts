import { pool } from '../db/pool.js';
import type { TaskPriority, TaskRow, TaskStatus } from '../lib/taskTypes.js';

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

export async function findAllRoots(options: FindAllRootsOptions): Promise<TaskRow[]> {
  const { clause, params } = buildRootWhere(options);

  params.push(options.limit);
  const limitIdx = params.length;
  params.push(options.offset);
  const offsetIdx = params.length;

  const { rows } = await pool.query<TaskRow>(
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

// Fila completa, mismo aliasing camelCase que findAllRoots/create. La usa el chequeo de
// existencia de parentId en createTask (le alcanza con que el resultado no sea null, no hace
// falta una query más liviana aparte). GET /tasks/:id no pasa por acá: usa findSubtrees.
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

// Subárboles completos como filas planas, en un solo viaje a la base para todos los ids
// (CLAUDE.md, Contrato de la API): GET /tasks/:id lo siembra con un id, GET /tasks con los ids
// de la página. Una query por raíz sería N+1.
//
// ANY($1::uuid[]) es un único placeholder que recibe el arreglo entero — con IN habría que armar
// la lista de placeholders concatenando strings según la cantidad de ids.
//
// Precondición: los ids siembran subárboles disjuntos (las raíces de una página, o un id solo).
// Con UNION ALL, un id que fuera descendiente de otro sembrado aparecería dos veces.
//
// El ORDER BY define el orden de los hermanos dentro del árbol (el más viejo primero), no el
// orden de la página: ANY no respeta el orden del arreglo, eso lo repone el servicio.
export async function findSubtrees(ids: string[]): Promise<TaskRow[]> {
  const { rows } = await pool.query<TaskRow>(
    `WITH RECURSIVE subtree AS (
       SELECT * FROM tasks WHERE id = ANY($1::uuid[])
       UNION ALL
       SELECT t.* FROM tasks t JOIN subtree s ON t.parent_id = s.id
     )
     SELECT
       id,
       parent_id AS "parentId",
       title,
       description,
       status,
       priority,
       estimated_effort AS "estimatedEffort",
       created_at AS "createdAt",
       updated_at AS "updatedAt"
     FROM subtree
     ORDER BY created_at ASC, id ASC`,
    [ids],
  );

  return rows;
}

export interface UpdateTaskFields {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedEffort?: number;
}

export async function update(id: string, fields: UpdateTaskFields) {
  const assignments: string[] = [];
  const params: unknown[] = [];

  if (fields.title !== undefined) {
    params.push(fields.title);
    assignments.push(`title = $${params.length}`);
  }

  if (fields.description !== undefined) {
    params.push(fields.description);
    assignments.push(`description = $${params.length}`);
  }

  if (fields.status !== undefined) {
    params.push(fields.status);
    assignments.push(`status = $${params.length}`);
  }

  if (fields.priority !== undefined) {
    params.push(fields.priority);
    assignments.push(`priority = $${params.length}`);
  }

  if (fields.estimatedEffort !== undefined) {
    params.push(fields.estimatedEffort);
    assignments.push(`estimated_effort = $${params.length}`);
  }

  // updated_at se pisa acá explícito, no con un trigger: hay un solo punto de escritura (este
  // UPDATE), un trigger sería lógica invisible mirando solo schema.sql, y agregar uno a
  // schema.sql exige `docker compose down -v` para que initdb lo vuelva a aplicar.
  assignments.push('updated_at = now()');

  params.push(id);
  const idIdx = params.length;

  const { rows } = await pool.query(
    `UPDATE tasks
     SET ${assignments.join(', ')}
     WHERE id = $${idIdx}
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
    params,
  );

  return rows[0] ?? null;
}

// El ON DELETE CASCADE de schema.sql es quien borra el subárbol completo — este código no
// recorre hijos, es responsabilidad de la base, no del código.
export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

  return (rowCount ?? 0) > 0;
}
