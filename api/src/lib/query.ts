// Mapa cerrado de la sección Ordenamiento (CLAUDE.md). Los placeholders de `pg` sustituyen
// valores, no identificadores — ORDER BY $1 ordena por una constante, no por la columna. Por
// eso sortBy/order nunca se parametrizan ni se interpolan directo desde el input: se resuelven
// acá, contra un mapa cerrado por el propio tipo (Record<SortBy, string> obliga a que las
// cuatro claves existan), y el resultado — un string fijo que escribimos nosotros, nunca texto
// del cliente — es lo único que se interpola en el SQL del repositorio.
export const SORT_BY_VALUES = ['createdAt', 'updatedAt', 'priority', 'title'] as const;
export type SortBy = (typeof SORT_BY_VALUES)[number];

export const ORDER_VALUES = ['asc', 'desc'] as const;
export type Order = (typeof ORDER_VALUES)[number];

const SORT_COLUMNS: Record<SortBy, string> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // priority es VARCHAR: ordenar por la columna cruda da orden alfabético (HIGH, LOW, MEDIUM),
  // donde MEDIUM queda último en vez de en el medio. Este CASE no arma un ranking arbitrario:
  // el número representa el nivel de urgencia (LOW 1, MEDIUM 2, HIGH 3), así que DESC —
  // "el número más alto primero" — muestra de más urgente a menos: HIGH, MEDIUM, LOW.
  priority: "CASE priority WHEN 'LOW' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'HIGH' THEN 3 END",
  title: 'title',
};

export function buildOrderBy(sortBy: SortBy, order: Order): string {
  const column = SORT_COLUMNS[sortBy];
  const direction = order === 'asc' ? 'ASC' : 'DESC';

  // Todas las queries paginadas desempatan con id DESC (CLAUDE.md, Ordenamiento): sin desempate
  // la paginación no es determinista cuando hay valores repetidos en la columna de orden.
  return `${column} ${direction}, id DESC`;
}
