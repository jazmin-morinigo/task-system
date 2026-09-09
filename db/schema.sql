-- task-system — schema inicial.
-- Se monta en /docker-entrypoint-initdb.d/, que solo corre con el volumen de datos vacío.
-- Para reaplicarlo: docker compose down -v

CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id        UUID REFERENCES tasks (id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'TODO'
                     CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE')),
  priority         VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'
                     CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  estimated_effort NUMERIC(10, 2) CHECK (estimated_effort >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- El WITH RECURSIVE de las agregaciones baja por parent_id.
CREATE INDEX tasks_parent_id_idx ON tasks (parent_id);

-- Listado paginado de raíces: orden default createdAt/desc con desempate por id DESC.
CREATE INDEX tasks_roots_created_at_idx
  ON tasks (created_at DESC, id DESC)
  WHERE parent_id IS NULL;
