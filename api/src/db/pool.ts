import pg from 'pg';

// Import default + destructuring: el build de `pg` es CJS, un named import no es seguro en ESM.
const { Pool, types } = pg;

// OID 1700 = NUMERIC. Gotcha documentado en CLAUDE.md (sección Modelo de datos): sin esto, `pg`
// entrega `estimated_effort` como string y las agregaciones concatenan en vez de sumar. Un
// parser global es seguro acá porque NUMERIC(10,2) está acotado por el schema y siempre cae en
// el rango seguro de JavaScript.
types.setTypeParser(1700, (value) => Number(value));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Error de configuración, no de request: no hay status HTTP que mapear porque no hay request
  // en curso. Falla al arranque con un Error común (CLAUDE.md, Convenciones de código) —
  // AppError queda para errores de request.
  throw new Error(
    'DATABASE_URL no está definida. Configurala en api/.env si corrés desde el host, o en el ' +
      '"environment:" de docker-compose.yml si corrés dentro del contenedor.',
  );
}

export const pool = new Pool({ connectionString });
