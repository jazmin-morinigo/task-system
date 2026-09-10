// Errores de request: los que necesitan mapearse a un status HTTP dentro del ciclo
// request → response (CLAUDE.md, Convenciones de código). Los errores de configuración —
// una variable de entorno faltante, por ejemplo — no pasan por acá: fallan al arranque con un
// Error común, antes de que exista cualquier request (ver db/pool.ts).
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
