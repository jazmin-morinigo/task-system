import type { TaskRow } from '../lib/taskTypes.js';

// Función pura (CLAUDE.md, Agregaciones): recibe las filas planas que trae el WITH RECURSIVE del
// repositorio y devuelve el árbol armado con el esfuerzo agregado por nodo. No importa nada de
// `pg` ni de la base — por eso se testea con árboles armados a mano, sin mocks.

export interface EffortSummary {
  // Suma de TODO en todo el subárbol, incluido el propio nodo.
  notStartedEffort: number;
  // Suma de IN_PROGRESS + IN_REVIEW.
  inProgressEffort: number;
  // Todos los estados, incluido DONE.
  totalEffort: number;
}

export interface TaskNode extends TaskRow, EffortSummary {
  children: TaskNode[];
}

// Acumuladores en centésimos enteros, no en floats: NUMERIC(10,2) garantiza dos decimales, y
// sumar floats directo deja basura binaria en el JSON (0.1 + 0.2 = 0.30000000000000004).
// Sumando enteros la cuenta es exacta y se divide por 100 una sola vez, al final.
interface Cents {
  notStarted: number;
  inProgress: number;
  total: number;
}

// Estado interno del armado: el nodo de salida más lo que hace falta para recorrerlo sin
// volver a buscar por id.
interface Pending {
  node: TaskNode;
  parent: Pending | undefined;
  children: Pending[];
  cents: Cents;
}

function ownCents(row: TaskRow): Cents {
  // Esfuerzo null cuenta como 0 en las sumas. El estimatedEffort del nodo sigue siendo null —
  // la UI lo muestra distinto de 0 (CLAUDE.md, Agregaciones).
  const cents = Math.round((row.estimatedEffort ?? 0) * 100);

  switch (row.status) {
    case 'TODO':
      return { notStarted: cents, inProgress: 0, total: cents };
    case 'IN_PROGRESS':
    case 'IN_REVIEW':
      return { notStarted: 0, inProgress: cents, total: cents };
    case 'DONE':
      return { notStarted: 0, inProgress: 0, total: cents };
    default: {
      // Chequeo de exhaustividad: si se agrega un estado a TASK_STATUSES sin decidir en qué
      // bucket cae, esta asignación deja de compilar en vez de sacarlo de las sumas en silencio.
      const unhandled: never = row.status;
      return unhandled;
    }
  }
}

// Raíz del bosque = nodo cuyo parentId es null o apunta a una tarea que no vino en las filas.
// Lo segundo es lo que pasa en GET /tasks/:id sobre una subtarea: el CTE baja desde ella, su
// padre no está en el resultado, y ella queda como raíz. Con las raíces de una página de
// GET /tasks el bosque tiene una raíz por cada id sembrado.
//
// Los hermanos quedan en el orden en que vienen las filas; el orden de las raíces también, y
// quien necesite otro orden (la página de GET /tasks) lo repone del lado del que llama.
export function buildForest(rows: TaskRow[]): TaskNode[] {
  const byId = new Map<string, Pending>();

  // Primera pasada: un nodo por fila. El enlace va en una pasada aparte para que el orden de
  // entrada no importe — un hijo puede venir antes que su padre.
  for (const row of rows) {
    byId.set(row.id, {
      node: { ...row, notStartedEffort: 0, inProgressEffort: 0, totalEffort: 0, children: [] },
      parent: undefined,
      children: [],
      cents: ownCents(row),
    });
  }

  const roots: Pending[] = [];

  for (const entry of byId.values()) {
    const parent = entry.node.parentId === null ? undefined : byId.get(entry.node.parentId);

    if (parent) {
      entry.parent = parent;
      parent.children.push(entry);
      parent.node.children.push(entry.node);
    } else {
      roots.push(entry);
    }
  }

  // Orden BFS desde las raíces: cada nodo aparece antes que todos sus descendientes. El for...of
  // sobre un array que crece mientras se recorre visita también lo agregado — el iterador de
  // Array relee el length en cada paso. Iterativo a propósito, no recursivo: la profundidad es
  // arbitraria y una recursión por nivel puede agotar el stack.
  const order: Pending[] = [...roots];
  for (const entry of order) {
    for (const child of entry.children) {
      order.push(child);
    }
  }

  // Recorrido inverso: cuando se procesa un nodo, todos sus descendientes ya sumaron en él.
  // Cierra su cuenta y la pasa al padre.
  for (const { node, parent, cents } of order.reverse()) {
    node.notStartedEffort = cents.notStarted / 100;
    node.inProgressEffort = cents.inProgress / 100;
    node.totalEffort = cents.total / 100;

    if (parent) {
      parent.cents.notStarted += cents.notStarted;
      parent.cents.inProgress += cents.inProgress;
      parent.cents.total += cents.total;
    }
  }

  return roots.map((entry) => entry.node);
}
