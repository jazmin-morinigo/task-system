# Task-system

App de gestión de tareas para un equipo de dev: CRUD con subtareas anidadas de profundidad
arbitraria y agregación de esfuerzo sobre todo el árbol.

## Entorno de ejecución

Claude Code corre en su propio sandbox Linux: **no ve el Docker Desktop de esta máquina.** Nunca
afirmar que un contenedor levantó, que un puerto responde o que un build pasó. Escribir los
archivos, indicar el comando exacto a correr, y esperar la salida textual pegada desde la
terminal del host.

## Reglas duras

- **No instalar dependencias nuevas sin preguntar antes.** Incluye eslint, prettier, husky,
  lint-staged y cualquier herramienta de scaffolding. Sin excepciones.
- Nada fuera de `api/src/repositories/` importa `pg` ni contiene SQL.
- Queries siempre parametrizadas (`$1`, `$2`, ...). Nunca concatenar strings en SQL.
- `sortBy` y `order` nunca se interpolan ni se parametrizan: se resuelven contra el mapa
  cerrado de `api/src/lib/query.ts`, o 400. Ver sección Ordenamiento.
- Stack cerrado (abajo). No proponer alternativas.

## Stack

Node + TypeScript + Express + PostgreSQL vía `pg` (sin ORM) · React + Vite + Tailwind + shadcn/ui
· Vitest.

## Estructura

```
api/src/{routes,services,repositories,db,lib}   routes → services → repositories
web/src/{pages,components/tree,hooks,lib}
db/schema.sql                                   montado en initdb de Postgres, no en la imagen
```

Repositorio = archivo con funciones sueltas (`findAll`, `findById`, `create`, ...). Sin
interfaces genéricas, sin inyección de dependencias.

## Modelo de datos

Tabla única `tasks`, `parent_id` autorreferencial con `ON DELETE CASCADE`.
`status VARCHAR CHECK (status IN ('TODO','IN_PROGRESS','IN_REVIEW','DONE'))`, `priority` con su
propio `CHECK`. `estimated_effort NUMERIC(10,2) NULL CHECK (estimated_effort >= 0)`.

**Gotcha:** `pg` devuelve `NUMERIC` como **string**. Se registra un type parser una sola vez en
`db/pool.ts` para que llegue como `number` — si no, las agregaciones concatenan en vez de sumar.

**Gotcha:** `COUNT(*)` devuelve `bigint`, y `pg` lo entrega como **string** igual que `NUMERIC`.
Sin convertir, la respuesta paginada sale con `total: "0"` y `totalPages` se calcula sobre un
string. La conversión va explícita en el repositorio con `Number(...)`, no con un type parser
global como el de `NUMERIC`: `NUMERIC(10,2)` está acotado por el schema y entra siempre en el
rango seguro de JavaScript, así que ahí el parser global es seguro; `bigint` no tiene esa cota y
un parser global se aplicaría a cualquier columna `bigint` futura, incluida una que desborde.

## Agregaciones

`WITH RECURSIVE` trae el subárbol plano desde el repositorio; una función pura en
`services/aggregate.ts` arma el árbol y calcula por nodo:

- `notStartedEffort` — suma de `TODO`
- `inProgressEffort` — suma de `IN_PROGRESS` + `IN_REVIEW`
- `totalEffort` — todos, incluido `DONE`

Esfuerzo `null` cuenta como 0 en las sumas, pero se muestra distinto de `0` en la UI.

## Contrato de la API

`GET /tasks?page=&limit=&sortBy=&order=&status=&priority=` — devuelve **solo tareas raíz**
(`parent_id IS NULL`), paginadas. `total`/`totalPages` cuentan raíces. Cada fila trae el
esfuerzo agregado de su subárbol completo.

Ese agregado se resuelve con el mismo `WITH RECURSIVE` que usa `GET /tasks/:id`, sembrado con los
ids de la página: el término base filtra por `id = ANY($1)`. No hay una query por raíz — eso es
N+1, 20 raíces son 21 viajes a la base. Y `ANY($1)` es un placeholder único que recibe un
arreglo, mientras que `IN` obligaría a construir la lista de placeholders dinámicamente según la
cantidad de ids, o sea armar el texto del SQL con strings, que "Reglas duras" prohíbe.

`status` y `priority` filtran **solo el nivel raíz** — restricción deliberada: filtran qué
raíces aparecen, no qué nodos se ven dentro de un subárbol. Paginar sobre un árbol filtrado no
tiene respuesta única.

`GET /tasks/:id` — el subárbol completo, sin filtrar.
`POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id` (cascada — ver nota en Docker).

Respuesta paginada: `{ data, page, limit, total, totalPages }`. Los schemas de `zod` en
`routes/` son la fuente de verdad de los params — no se duplican en prosa acá.
Default: `page` en `1`, `limit` en `20`.

Todos los errores de la API responden con la misma forma: `{ error: "<mensaje>" }` — tanto los
`AppError` como el 500 genérico, un único shape de error en toda la API. Los errores de
validación de `zod` se aplanan en un solo string legible dentro de ese `message`, en vez de un
array de errores por campo: es una simplificación deliberada para no tener un shape de error
distinto solo para validación. Un error inesperado responde 500 con un mensaje genérico al
cliente y loguea el detalle completo del lado del servidor, sin exponerlo.

### Ordenamiento

`sortBy` ∈ `{createdAt, updatedAt, priority, title}`, `order` ∈ `{asc, desc}`. Default:
`createdAt`/`desc`. Los placeholders de `pg` sustituyen valores, no identificadores —
`ORDER BY $1` no ordena por esa columna, ordena por una constante, y falla en silencio. Por eso
`sortBy`/`order` se resuelven contra un mapa cerrado en `lib/query.ts`; fuera del mapa → 400.

`priority` es `VARCHAR`: ordenar por la columna cruda da orden alfabético — `HIGH`, `LOW`,
`MEDIUM` — donde `MEDIUM` queda último en vez de en el medio. El mapa apunta a un `CASE` para
esa clave, no al nombre de columna, y ahí queda definido que el orden es `HIGH > MEDIUM > LOW`.

Todas las queries paginadas desempatan con `, id DESC` — sin desempate, la paginación no es
determinista cuando hay `created_at` repetidos.

## Convenciones de código

ESM (`"type": "module"`), imports relativos con extensión `.js`. Sin default exports. Errores
como `AppError` tipado — nunca `throw new Error(string)` suelto. Esa regla es para errores de
request, que necesitan mapearse a un status HTTP. Un error de configuración (por ejemplo una
variable de entorno faltante) falla al arranque con un `Error` común: no hay request en curso.

## Dirección de diseño

- Una sola escala de espaciado, base 4: `4·8·12·16·24·32·48`. Nada de valores arbitrarios.
- Manrope, dos pesos y nada más: 400 cuerpo, 600 títulos/números/labels. Números de esfuerzo
  con `tabular-nums`.
- Estados vacíos y de carga siempre presentes: skeletons con la forma real, nunca pantalla en
  blanco.
- El árbol de subtareas es el foco del esfuerzo de diseño: guía de indentación por nivel,
  colapsar/expandir por nodo (el colapsado sigue mostrando su esfuerzo agregado), esfuerzo
  agregado visible en columna propia. Tres niveles distinguibles por tamaño/color/opacidad de
  guía; desde el nivel 3 el tratamiento se estabiliza y solo aumenta la indentación.
- Base neutra, un solo color de acento. Estado como chip, prioridad como marca chica — el
  color nunca es el único portador de significado.

## Tests

Vitest, co-located `*.test.ts`. Solo sobre la función pura de `services/aggregate.ts`, con
árboles armados a mano, sin base de datos, sin mocks de `pg`. Casos obligatorios: nodo hoja,
esfuerzo `null`, árbol de 3+ niveles, mezcla de los 4 estados, hijo `DONE` bajo padre `TODO`,
árbol vacío.

## Docker

2 servicios (`postgres`, `app`), `depends_on` con healthcheck. `docker compose up --build`.
`/docker-entrypoint-initdb.d/` solo corre con volumen vacío — para reaplicar `schema.sql`,
`docker compose down -v`.

- Base `node:22-alpine`, consistente con `engines >=22`. Sin dependencias nativas.
- Puertos: `3000:3000` para el API, `5433:5432` para Postgres. El `5432` del host está ocupado
  por una instalación local de Windows.
- `DATABASE_URL` tiene dos formas. Desde el host en desarrollo apunta a `localhost:5433` y vive
  en `api/.env`; desde el contenedor apunta a `postgres:5432` y va en el `environment:` del
  compose. El mapeo de puertos es solo para el host — dentro de la red de Compose los servicios
  se hablan por nombre de servicio y puerto real.
- `GET /health` devuelve 200 sin tocar la base. Es liveness, no readiness: si consultara
  Postgres, un fallo no distinguiría contenedor caído de base caída.
- Probar cambios en el healthcheck o en `schema.sql` requiere `docker compose down -v`: con el
  volumen poblado, initdb se saltea entero y el cambio nunca se ejerce.

**Delete:** `ON DELETE CASCADE` borra el subárbol completo en silencio. El frontend confirma
mostrando cuántas subtareas se van a borrar antes de ejecutar.

**Pendiente (Bloque 4):** al pasar el Dockerfile a multi-stage, dejar una etapa nombrada que
conserve las devDependencies para correr Vitest dentro de Docker. La imagen final las descarta y
el README necesita un comando de tests que funcione sin Node instalado en el host.

## Git

Commits chicos: uno cada vez que algo pasa de no funcionar a funcionar. Formato
`tipo(scope): mensaje`.
