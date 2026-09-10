import { Router } from 'express';
import { listRootTasks } from '../services/tasks.js';

export const tasksRouter = Router();

tasksRouter.get('/', async (_req, res, next) => {
  try {
    const result = await listRootTasks();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
