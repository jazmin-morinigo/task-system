import {
  countRoots,
  create,
  findAllRoots,
  findById,
  findSubtrees,
  remove,
  update,
} from '../repositories/tasks.js';
import { buildForest } from './aggregate.js';
import { AppError } from '../lib/errors.js';
import type { TaskPriority, TaskStatus } from '../lib/taskTypes.js';
import { buildOrderBy, type Order, type SortBy } from '../lib/query.js';

// Defaults de page/limit, y el techo de limit al lado — la ruta los usa como default/máximo del
// schema de zod en vez de repetir los números.
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface ListRootTasksParams {
  page: number;
  limit: number;
  sortBy: SortBy;
  order: Order;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export async function listRootTasks(params: ListRootTasksParams) {
  const { page, limit, sortBy, order, status, priority } = params;
  const offset = (page - 1) * limit;
  const orderBy = buildOrderBy(sortBy, order);

  const [roots, total] = await Promise.all([
    findAllRoots({ limit, offset, orderBy, status, priority }),
    // Mismos status/priority que findAllRoots: el total cuenta las raíces que pasan el filtro,
    // no todas.
    countRoots({ status, priority }),
  ]);

  // Este arreglo ES el orden de la página: lo definió el ORDER BY de findAllRoots. findSubtrees
  // siembra con ANY, que no respeta el orden del arreglo, así que el bosque que vuelve no sirve
  // para ordenar — se indexa por id y se recorre `ids`, no el bosque.
  const ids = roots.map((root) => root.id);

  // Página vacía: sin viaje a la base para un CTE que no devolvería nada.
  const forest = ids.length > 0 ? buildForest(await findSubtrees(ids)) : [];
  const treesById = new Map(forest.map((tree) => [tree.id, tree]));

  // Cada fila lleva el esfuerzo agregado de su subárbol, sin `children`: el subárbol completo es
  // de GET /tasks/:id (CLAUDE.md, Contrato de la API). Una raíz que no está en el bosque se borró
  // entre findAllRoots y findSubtrees — no corren en una transacción — y se omite: ya no existe.
  const data = ids.flatMap((id) => {
    const tree = treesById.get(id);
    if (!tree) return [];
    const { children: _children, ...withEffort } = tree;
    return [withEffort];
  });

  return {
    data,
    page,
    limit,
    total,
    // Con total 0, Math.ceil(0 / limit) da 0 de forma natural — sin forzar mínimo 1.
    totalPages: Math.ceil(total / limit),
  };
}

// Dos tipos separados a propósito, no es duplicación: CreateTaskInput modela lo que el cliente
// puede mandar (y omitir) en el body; CreateTaskRow, en el repositorio, modela lo que la columna
// de la tabla acepta, ya sin nada opcional. Este servicio es la traducción entre uno y otro —
// completa status/priority con sus defaults antes de llamar a create().
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedEffort?: number;
  parentId?: string;
}

export async function createTask(input: CreateTaskInput) {
  if (input.parentId) {
    // El SELECT es una validación anticipada para devolver un 400 legible antes de intentar el
    // INSERT. La garantía real de integridad sigue siendo la foreign key de schema.sql: entre
    // este SELECT y el INSERT hay una carrera teórica (alguien podría borrar la tarea padre
    // justo en el medio) que este chequeo no cierra. Si eso pasa, el INSERT falla por la FK
    // (23503) — traducir ese código de Postgres a un mensaje de negocio es una capa que no le
    // corresponde al servicio.
    const parent = await findById(input.parentId);
    if (!parent) {
      throw new AppError('La tarea padre no existe.', 400);
    }
  }

  return create({
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? 'TODO',
    priority: input.priority ?? 'MEDIUM',
    estimatedEffort: input.estimatedEffort ?? null,
    parentId: input.parentId ?? null,
  });
}

// Subárbol completo, sin filtrar (CLAUDE.md, Contrato de la API). Sembrado con un solo id, el
// bosque tiene a lo sumo una raíz: la tarea pedida — aunque sea una subtarea, su padre no viene
// en las filas y buildForest la trata como raíz.
export async function getTaskById(id: string) {
  const [tree] = buildForest(await findSubtrees([id]));

  if (!tree) {
    throw new AppError('La tarea no existe.', 404);
  }

  return tree;
}

// Sin parentId — ni siquiera está en el tipo: zod ya lo bloqueó en la ruta antes de que un
// UpdateTaskInput llegue a existir. parentId no es modificable acá (ver routes/tasks.ts).
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedEffort?: number;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const task = await update(id, input);

  if (!task) {
    throw new AppError('La tarea no existe.', 404);
  }

  return task;
}

export async function deleteTask(id: string): Promise<void> {
  const deleted = await remove(id);

  if (!deleted) {
    throw new AppError('La tarea no existe.', 404);
  }
}
