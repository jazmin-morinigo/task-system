# task-system

Gestión de tareas para un equipo de desarrollo: CRUD con subtareas anidadas de profundidad
arbitraria y agregación de esfuerzo sobre todo el árbol.

## Stack

- **API**: Node + TypeScript + Express + PostgreSQL (`pg`, sin ORM)
- **Web**: React + Vite + Tailwind + shadcn/ui
- **Tests**: Vitest

Ver [CLAUDE.md](./CLAUDE.md) para el modelo de datos, el contrato de la API y las convenciones
de código.

## Cómo levantar todo

```bash
docker compose up --build
```

Levanta Postgres y la API (que sirve el build de React como estático). La primera vez, Postgres
aplica `db/schema.sql` automáticamente vía `/docker-entrypoint-initdb.d/`.

> `/docker-entrypoint-initdb.d/` solo corre con el volumen de datos vacío. Si cambiás el
> schema y necesitás reaplicarlo, `docker compose down -v` antes de levantar de nuevo.

## Desarrollo local (sin Docker)

```bash
cd api && npm install && npm run dev
cd web && npm install && npm run dev
```

Requiere una instancia de Postgres accesible (ver variables de entorno en `api/.env.example`).

## Tests

```bash
cd api && npm test
```

Los tests unitarios cubren la función pura de agregación de esfuerzo (`services/aggregate.ts`)
con árboles armados a mano, sin base de datos.

## Alcance del listado (`GET /tasks`)

El listado devuelve **solo tareas raíz**, paginadas. `?status=` y `?priority=` filtran qué
raíces aparecen, no los nodos dentro de un subárbol — es una restricción deliberada, no una
omisión: paginar sobre un árbol filtrado no tiene una respuesta única. El detalle de una tarea
(`GET /tasks/:id`) siempre muestra su subárbol completo, sin filtrar.
