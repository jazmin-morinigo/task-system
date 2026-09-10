import type { ErrorRequestHandler } from 'express';
import { AppError } from './errors.js';

// Errores de http-errors, que es como express.json() (body-parser y raw-body) reporta los
// problemas al leer el body: traen `status` y `expose`, y expose vale `status < 500` salvo que
// quien lo creó diga otra cosa. Se respeta el status que el propio error declara, en vez de
// reconocer cada error por nombre: JSON mal formado o body cortado (400), body demasiado grande
// (413), charset o content-encoding no soportado (415).
//
// Solo el rango 4xx: raw-body también crea errores 500 (el stream ya lo consumió otro
// middleware), y esos son bugs del servidor — con este chequeo siguen yendo a la rama genérica.
// Se pide `expose` además del status para no tomar por error de cliente cualquier objeto que
// casualmente traiga un `status` numérico. Es el mismo chequeo por forma que hace isHttpError de
// http-errors, sin importarlo: es dependencia transitiva, no directa.
function clientErrorStatus(err: unknown): number | undefined {
  if (
    err instanceof Error &&
    'expose' in err &&
    err.expose === true &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500
  ) {
    return err.status;
  }
  return undefined;
}

// Mensajes en castellano por status, no err.message: el de la librería viene en inglés y, en el
// caso del JSON, depende del motor. El status no identifica la causa — un 400 puede ser JSON mal
// formado, un body cortado o un request abortado —, así que cada texto es tan general como su
// status.
const CLIENT_ERROR_MESSAGES: Record<number, string> = {
  400: 'Cuerpo inválido — no se pudo leer como JSON.',
  413: 'Cuerpo inválido — supera el tamaño máximo permitido.',
  415: 'Cuerpo inválido — codificación o charset no soportado.',
};
const DEFAULT_CLIENT_ERROR_MESSAGE = 'Request inválido.';

// Firma de 4 parámetros: es la que Express usa para reconocer un middleware como manejador de
// errores, aunque `_req` y `_next` no se usen acá.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // El que se equivocó es el cliente: su status, con el mismo shape que el resto. Sin log, igual
  // que un AppError — no hay nada del servidor para diagnosticar.
  const status = clientErrorStatus(err);
  if (status !== undefined) {
    const message = CLIENT_ERROR_MESSAGES[status] ?? DEFAULT_CLIENT_ERROR_MESSAGE;
    res.status(status).json({ error: message });
    return;
  }

  // Error inesperado: se loguea completo para diagnóstico, pero al cliente no le llega nada
  // del detalle interno.
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
