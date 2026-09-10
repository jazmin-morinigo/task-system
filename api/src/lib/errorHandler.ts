import type { ErrorRequestHandler } from 'express';
import { AppError } from './errors.js';

// Firma de 4 parámetros: es la que Express usa para reconocer un middleware como manejador de
// errores, aunque `_req` y `_next` no se usen acá.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Error inesperado: se loguea completo para diagnóstico, pero al cliente no le llega nada
  // del detalle interno.
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
