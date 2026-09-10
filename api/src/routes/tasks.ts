import { Router } from 'express';
import { z } from 'zod';
import { createTask, listRootTasks } from '../services/tasks.js';
import { AppError } from '../lib/errors.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../lib/taskTypes.js';

export const tasksRouter = Router();

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

tasksRouter.get('/', async (_req, res, next) => {
  try {
    const result = await listRootTasks();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

tasksRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);

    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join('; ');
      throw new AppError(`Cuerpo inválido — ${detail}`, 400);
    }

    const task = await createTask(parsed.data);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});
