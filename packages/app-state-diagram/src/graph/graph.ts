/**
 * Graph utilities for ALPS state diagrams
 *
 * Extracts the application state graph (states and transitions) from an
 * ALPS document and answers reachability questions over it. Uses the same
 * state/transition model as generator/dot-generator.ts.
 */

import { localFragment } from '../parser/alps-parser';
import type { AlpsDocument, AlpsDescriptor } from '../parser/alps-parser';

export type TransitionType = 'safe' | 'unsafe' | 'idempotent';

export interface TransitionInfo {
  id: string;
  type: TransitionType;
  title?: string;
  /** States containing this transition */
  from: string[];
  /** Target state (rt) */
  to: string;
}

export interface StateGraph {
  states: AlpsDescriptor[];
  transitions: TransitionInfo[];
}

export interface PathStep {
  transition: string;
  type: TransitionType;
  to: string;
}

const TRANSITION_TYPES = new Set(['safe', 'unsafe', 'idempotent']);

/**
 * Whether a descriptor is a state transition (safe/unsafe/idempotent with rt)
 */
export function isTransition(descriptor: AlpsDescriptor): boolean {
  return !!descriptor.type && TRANSITION_TYPES.has(descriptor.type) && !!descriptor.rt;
}

/**
 * Extract the state graph from an ALPS document
 */
export function extractGraph(alpsData: AlpsDocument): StateGraph {
  const descriptors = alpsData.alps?.descriptor || [];

  const transitions: TransitionInfo[] = [];
  for (const desc of descriptors) {
    // External rt references (e.g. "other.json#State") are not part of this graph
    const rtTarget = localFragment(desc.rt);
    if (desc.id && isTransition(desc) && rtTarget) {
      transitions.push({
        id: desc.id,
        type: desc.type as TransitionType,
        title: desc.title,
        from: findContainers(desc.id, descriptors),
        to: rtTarget,
      });
    }
  }

  const stateIds = new Set<string>();
  for (const trans of transitions) {
    stateIds.add(trans.to);
    for (const from of trans.from) {
      stateIds.add(from);
    }
  }
  const states = descriptors.filter(d => d.id && stateIds.has(d.id));

  return { states, transitions };
}

/**
 * Find descriptors that contain the given descriptor (by href or inline id)
 */
export function findContainers(childId: string, descriptors: AlpsDescriptor[]): string[] {
  const containers: string[] = [];
  for (const desc of descriptors) {
    if (desc.id && Array.isArray(desc.descriptor)) {
      const contains = desc.descriptor.some(
        nested => nested.href === `#${childId}` || nested.id === childId
      );
      if (contains) {
        containers.push(desc.id);
      }
    }
  }
  return containers;
}

/**
 * Enumerate paths between two states (DFS, no state revisited within a path)
 */
export function findPaths(
  graph: StateGraph,
  from: string,
  to: string,
  maxPaths = 10,
  maxDepth = 10
): PathStep[][] {
  const edgesFrom = new Map<string, TransitionInfo[]>();
  for (const trans of graph.transitions) {
    for (const source of trans.from) {
      if (!edgesFrom.has(source)) {
        edgesFrom.set(source, []);
      }
      edgesFrom.get(source)!.push(trans);
    }
  }

  const paths: PathStep[][] = [];
  const visited = new Set<string>([from]);
  const current: PathStep[] = [];

  const dfs = (state: string): void => {
    if (paths.length >= maxPaths || current.length >= maxDepth) {
      return;
    }
    for (const trans of edgesFrom.get(state) || []) {
      if (visited.has(trans.to)) {
        continue;
      }
      current.push({ transition: trans.id, type: trans.type, to: trans.to });
      if (trans.to === to) {
        paths.push([...current]);
      } else {
        visited.add(trans.to);
        dfs(trans.to);
        visited.delete(trans.to);
      }
      current.pop();
      if (paths.length >= maxPaths) {
        return;
      }
    }
  };

  dfs(from);
  return paths;
}

/**
 * Format a path as a readable string: Home --goToCart(safe)--> ShoppingCart
 */
export function formatPath(from: string, path: PathStep[]): string {
  let result = from;
  for (const step of path) {
    result += ` --${step.transition}(${step.type})--> ${step.to}`;
  }
  return result;
}
