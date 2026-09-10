-- task-system — datos de prueba reproducibles.
-- Se monta en /docker-entrypoint-initdb.d/ junto a schema.sql (corre después, por orden
-- alfabético: "schema.sql" < "seed.sql", sin necesidad de prefijos numéricos).
-- Solo corre con el volumen de datos vacío. Para reaplicarlo: docker compose down -v
--
-- Tres raíces. La primera es el árbol complejo: 5 niveles de profundidad, los 4 estados
-- presentes, un hijo DONE colgando de un padre no-DONE (dos niveles: Wireframes DONE bajo
-- Diseño UI IN_PROGRESS bajo la raíz TODO), un estimatedEffort NULL, y prioridades mezcladas.
-- created_at/updated_at son fijos y escalonados (no now()) para que el orden default
-- (createdAt/desc, desempate id DESC) sea reproducible entre corridas.

-- Raíz 1: "Lanzar app móvil" — árbol de 5 niveles.
INSERT INTO tasks (id, parent_id, title, status, priority, estimated_effort, created_at, updated_at) VALUES
  ('10000000-0000-0000-0000-000000000001', NULL,                                    'Lanzar app móvil',        'TODO',        'HIGH',   40,   '2024-01-15 09:00:00+00', '2024-01-15 09:00:00+00'),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Diseño UI',                'IN_PROGRESS', 'MEDIUM', 10,   '2024-01-15 09:05:00+00', '2024-01-15 09:05:00+00'),
  ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Backend API',              'TODO',        'HIGH',   15,   '2024-01-15 09:10:00+00', '2024-01-15 09:10:00+00'),
  ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Wireframes',               'DONE',        'LOW',    3,    '2024-01-15 09:15:00+00', '2024-01-15 09:15:00+00'),
  ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Paleta de colores',        'TODO',        'LOW',    2,    '2024-01-15 09:20:00+00', '2024-01-15 09:20:00+00'),
  ('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'Revisión de wireframes',   'IN_REVIEW',   'MEDIUM', NULL, '2024-01-15 09:25:00+00', '2024-01-15 09:25:00+00'),
  ('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000006', 'Ajustes finales',          'TODO',        'LOW',    1,    '2024-01-15 09:30:00+00', '2024-01-15 09:30:00+00');

-- Raíz 2: "Migrar base de datos" — un nivel de hijos.
INSERT INTO tasks (id, parent_id, title, status, priority, estimated_effort, created_at, updated_at) VALUES
  ('20000000-0000-0000-0000-000000000001', NULL,                                    'Migrar base de datos', 'IN_PROGRESS', 'MEDIUM', 8, '2024-01-15 09:35:00+00', '2024-01-15 09:35:00+00'),
  ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Backup previo',         'DONE',        'LOW',    1, '2024-01-15 09:40:00+00', '2024-01-15 09:40:00+00'),
  ('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Migrar tablas',         'TODO',        'HIGH',   5, '2024-01-15 09:45:00+00', '2024-01-15 09:45:00+00');

-- Raíz 3: "Documentación de la API" — sin hijos, la más simple.
INSERT INTO tasks (id, parent_id, title, status, priority, estimated_effort, created_at, updated_at) VALUES
  ('30000000-0000-0000-0000-000000000001', NULL, 'Documentación de la API', 'TODO', 'LOW', NULL, '2024-01-15 09:50:00+00', '2024-01-15 09:50:00+00');
