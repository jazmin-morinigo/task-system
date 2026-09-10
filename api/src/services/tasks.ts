import { countRoots, findAllRoots } from '../repositories/tasks.js';

// Placeholder hasta que exista el schema de zod en routes/ (CLAUDE.md, Contrato de la API):
// esa etapa reutiliza estas constantes en vez de repetir los números.
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export async function listRootTasks() {
  const page = DEFAULT_PAGE;
  const limit = DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([findAllRoots(limit, offset), countRoots()]);

  return {
    data,
    page,
    limit,
    total,
    // Con total 0, Math.ceil(0 / limit) da 0 de forma natural — sin forzar mínimo 1.
    totalPages: Math.ceil(total / limit),
  };
}
