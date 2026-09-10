import { Router } from 'express';
import { z } from 'zod';
import {
  createTask,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  getTaskById,
  listRootTasks,
  MAX_LIMIT,
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

// Fuente de verdad de los params de POST /tasks (CLAUDE.md, Contrato de la API). Los enums de
// status/priority se derivan de lib/taskTypes.ts en vez de repetir los literales acá — mismos
// valores que los CHECK de db/schema.sql, en un solo lugar.
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  estimatedEffort: z.number().nonnegative().optional(),
  parentId: z.string().uuid().optional(),
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
