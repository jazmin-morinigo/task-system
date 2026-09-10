import { describe, expect, it } from 'vitest';
import { buildForest, type EffortSummary, type TaskNode } from './aggregate.js';
import type { TaskRow } from '../lib/taskTypes.js';

// Fila armada a mano: solo importan id, parentId, status y estimatedEffort; el resto se completa
// con valores fijos para que cada caso muestre únicamente lo que está probando.
function row(fields: Pick<TaskRow, 'id'> & Partial<TaskRow>): TaskRow {
  return {
    parentId: null,
    title: fields.id,
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    estimatedEffort: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...fields,
  };
}

function findNode(nodes: TaskNode[], id: string): TaskNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

// Devuelve undefined si el nodo no existe, así el toEqual falla mostrando eso en vez de romper.
function effortOf(nodes: TaskNode[], id: string): EffortSummary | undefined {
  const node = findNode(nodes, id);
  if (!node) return undefined;
  return {
    notStartedEffort: node.notStartedEffort,
    inProgressEffort: node.inProgressEffort,
    totalEffort: node.totalEffort,
  };
}

function effort(notStartedEffort: number, inProgressEffort: number, totalEffort: number): EffortSummary {
  return { notStartedEffort, inProgressEffort, totalEffort };
}

describe('buildForest', () => {
  it('árbol vacío: sin filas devuelve un bosque vacío', () => {
    expect(buildForest([])).toEqual([]);
  });

  it('nodo hoja: el agregado es su propio esfuerzo y no tiene hijos', () => {
    const forest = buildForest([row({ id: 'a', status: 'TODO', estimatedEffort: 5 })]);

    expect(forest.map((n) => n.id)).toEqual(['a']);
    expect(findNode(forest, 'a')?.children).toEqual([]);
    expect(effortOf(forest, 'a')).toEqual(effort(5, 0, 5));
  });

  it('esfuerzo null: suma 0 pero estimatedEffort sigue siendo null', () => {
    const forest = buildForest([
      row({ id: 'p', status: 'TODO', estimatedEffort: null }),
      row({ id: 'hoja-null', parentId: 'p', status: 'IN_PROGRESS', estimatedEffort: null }),
      row({ id: 'hoja-3', parentId: 'p', status: 'TODO', estimatedEffort: 3 }),
    ]);

    expect(effortOf(forest, 'hoja-null')).toEqual(effort(0, 0, 0));
    expect(findNode(forest, 'hoja-null')?.estimatedEffort).toBeNull();

    expect(effortOf(forest, 'p')).toEqual(effort(3, 0, 3));
    expect(findNode(forest, 'p')?.estimatedEffort).toBeNull();
  });

  it('árbol de 4 niveles: cada nivel agrega todo su subárbol', () => {
    // Potencias de 2 para que cada suma identifique sin ambigüedad qué nodos entraron.
    const forest = buildForest([
      row({ id: 'r', status: 'TODO', estimatedEffort: 1 }),
      row({ id: 'a', parentId: 'r', status: 'IN_PROGRESS', estimatedEffort: 2 }),
      row({ id: 'b', parentId: 'a', status: 'IN_REVIEW', estimatedEffort: 4 }),
      row({ id: 'c', parentId: 'b', status: 'TODO', estimatedEffort: 8 }),
    ]);

    expect(forest.map((n) => n.id)).toEqual(['r']);
    expect(effortOf(forest, 'c')).toEqual(effort(8, 0, 8));
    expect(effortOf(forest, 'b')).toEqual(effort(8, 4, 12));
    expect(effortOf(forest, 'a')).toEqual(effort(8, 6, 14));
    expect(effortOf(forest, 'r')).toEqual(effort(9, 6, 15));
  });

  it('mezcla de los 4 estados: cada uno cae en su bucket', () => {
    const forest = buildForest([
      row({ id: 'r', status: 'DONE', estimatedEffort: 16 }),
      row({ id: 'todo', parentId: 'r', status: 'TODO', estimatedEffort: 1 }),
      row({ id: 'in-progress', parentId: 'r', status: 'IN_PROGRESS', estimatedEffort: 2 }),
      row({ id: 'in-review', parentId: 'r', status: 'IN_REVIEW', estimatedEffort: 4 }),
      row({ id: 'done', parentId: 'r', status: 'DONE', estimatedEffort: 8 }),
    ]);

    expect(effortOf(forest, 'r')).toEqual(effort(1, 6, 31));
  });

  it('hijo DONE bajo padre TODO: suma al total pero no al pendiente', () => {
    const forest = buildForest([
      row({ id: 'p', status: 'TODO', estimatedEffort: 3 }),
      row({ id: 'c', parentId: 'p', status: 'DONE', estimatedEffort: 5 }),
    ]);

    expect(effortOf(forest, 'c')).toEqual(effort(0, 0, 5));
    expect(effortOf(forest, 'p')).toEqual(effort(3, 0, 8));
  });

  it('varias raíces en una llamada: cada una agrega solo su subárbol', () => {
    const forest = buildForest([
      row({ id: 'r1', status: 'TODO', estimatedEffort: 1 }),
      row({ id: 'r1-hijo', parentId: 'r1', status: 'TODO', estimatedEffort: 2 }),
      row({ id: 'r2', status: 'TODO', estimatedEffort: 10 }),
      row({ id: 'r2-hijo', parentId: 'r2', status: 'IN_PROGRESS', estimatedEffort: 20 }),
    ]);

    expect(forest.map((n) => n.id)).toEqual(['r1', 'r2']);
    expect(effortOf(forest, 'r1')).toEqual(effort(3, 0, 3));
    expect(effortOf(forest, 'r2')).toEqual(effort(10, 20, 30));
  });

  it('sembrado con una subtarea: el nodo cuyo padre no vino en las filas queda como raíz', () => {
    const forest = buildForest([
      row({ id: 'a', parentId: 'padre-fuera-del-conjunto', status: 'TODO', estimatedEffort: 2 }),
      row({ id: 'b', parentId: 'a', status: 'DONE', estimatedEffort: 3 }),
    ]);

    expect(forest.map((n) => n.id)).toEqual(['a']);
    expect(effortOf(forest, 'a')).toEqual(effort(2, 0, 5));
  });

  it('hijo antes que el padre en la entrada: el árbol se arma igual', () => {
    const forest = buildForest([
      row({ id: 'c', parentId: 'p', status: 'TODO', estimatedEffort: 2 }),
      row({ id: 'p', status: 'TODO', estimatedEffort: 1 }),
    ]);

    expect(forest.map((n) => n.id)).toEqual(['p']);
    expect(findNode(forest, 'p')?.children.map((n) => n.id)).toEqual(['c']);
    expect(effortOf(forest, 'p')).toEqual(effort(3, 0, 3));
  });

  it('hermanos: conservan el orden de la entrada', () => {
    const forest = buildForest([
      row({ id: 'p' }),
      row({ id: 'segundo', parentId: 'p' }),
      row({ id: 'primero', parentId: 'p' }),
    ]);

    expect(findNode(forest, 'p')?.children.map((n) => n.id)).toEqual(['segundo', 'primero']);
  });

  it('decimales: la suma es exacta, sin error de punto flotante', () => {
    const forest = buildForest([
      row({ id: 'p', status: 'TODO', estimatedEffort: 0.1 }),
      row({ id: 'c', parentId: 'p', status: 'TODO', estimatedEffort: 0.2 }),
    ]);

    expect(findNode(forest, 'p')?.notStartedEffort).toBe(0.3);
    expect(findNode(forest, 'p')?.totalEffort).toBe(0.3);
  });

  it('no muta las filas de entrada', () => {
    const rows = [
      row({ id: 'p', status: 'TODO', estimatedEffort: 1 }),
      row({ id: 'c', parentId: 'p', status: 'DONE', estimatedEffort: 2 }),
    ];
    const snapshot = structuredClone(rows);

    buildForest(rows);

    expect(rows).toEqual(snapshot);
  });
});
