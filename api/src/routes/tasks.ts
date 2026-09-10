import { Router } from 'express';
import { z } from 'zod';
import {
  createTask,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  deleteTask,
  getTaskById,
  listRootTasks,
  MAX_LIMIT,
  updateTask,
} from '../services/tasks.js';
import { AppError } from '../lib/errors.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../lib/taskTypes.js';
import { ORDER_VALUES, SORT_BY_VALUES } from '../lib/query.js';

export const tasksRouter = Router();

// safeParse + armado de detalle de zod + AppError(400), centralizado: lo usan el body del POST,
// el query del GET y el :id del GET — mismo formato de error en los tres.
function parseOrThrow<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, data: unknown, invalidMessage: string): T {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
      .join('; ');
    throw new AppError(`${invalidMessage} — ${detail}`, 400);
  }

  return parsed.data;
}

// Compartidas entre create y update: mismas reglas en los dos, una sola definición para que no
// puedan divergir (misma idea que TASK_STATUSES/TASK_PRIORITIES en lib/taskTypes.ts).
const titleSchema = z.string().trim().min(1).max(200);
const estimatedEffortSchema = z.number().nonnegative();

// Fuente de verdad de los params de POST /tasks (CLAUDE.md, Contrato de la API). Los enums de
// status/priority se derivan de lib/taskTypes.ts en vez de repetir los literales acá — mismos
// valores que los CHECK de db/schema.sql, en un solo lugar.
const createTaskSchema = z.object({
  title: titleSchema,
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  estimatedEffort: estimatedEffortSchema.optional(),
  parentId: z.string().uuid().optional(),
});

// Fuente de verdad de los params de PATCH /tasks/:id. parentId no es modificable: se define al
// crear (createTask). Moverla de padre exigiría validar que no se forme un ciclo — una tarea no
// puede volverse hija de su propia subtarea, eso rompería el árbol y un recorrido recursivo no
// terminaría — y esa es una operación aparte, con reglas propias que esta ruta no implementa.
// z.never() rechaza cualquier valor que no sea undefined, así que mandar parentId siempre falla
// acá, con un mensaje que lo explica en vez del genérico de zod.
const updateTaskSchema = z
  .object({
    title: titleSchema.optional(),
    description: z.string().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    estimatedEffort: estimatedEffortSchema.optional(),
    parentId: z.never({
      invalid_type_error: 'parentId no se puede modificar — se define al crear la tarea.',
    }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'El body no puede estar vacío — mandá al menos un campo para actualizar.',
  });

// Fuente de verdad de los params de GET /tasks. z.coerce.number() porque los query params
// llegan siempre como string (?page=2 es "2", no 2). sortBy/order se derivan del mapa cerrado
// de lib/query.ts — fuera de ese mapa, zod ya rechaza antes de llegar a buildOrderBy.
const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  sortBy: z.enum(SORT_BY_VALUES).default('createdAt'),
  order: z.enum(ORDER_VALUES).default('desc'),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

const idParamSchema = z.string().uuid();

tasksRouter.get('/', async (req, res, next) => {
  try {
    const query = parseOrThrow(listTasksQuerySchema, req.query, 'Parámetros inválidos');
    const result = await listRootTasks(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

tasksRouter.post('/', async (req, res, next) => {
  try {
    const body = parseOrThrow(createTaskSchema, req.body, 'Cuerpo inválido');
    const task = await createTask(body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// Fila sola, sin subárbol — el CTE recursivo y el esfuerzo agregado son de otro paso.
tasksRouter.get('/:id', async (req, res, next) => {
  try {
    const id = parseOrThrow(idParamSchema, req.params.id, 'Id inválido');
    const task = await getTaskById(id);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

tasksRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = parseOrThrow(idParamSchema, req.params.id, 'Id inválido');
    const body = parseOrThrow(updateTaskSchema, req.body, 'Cuerpo inválido');
    const task = await updateTask(id, body);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = parseOrThrow(idParamSchema, req.params.id, 'Id inválido');
    await deleteTask(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
