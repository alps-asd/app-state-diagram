/**
 * Mermaid Generator for Node.js
 *
 * Generates Mermaid classDiagram format from ALPS data.
 */

import type { AlpsDocument, AlpsDescriptor } from '../parser/alps-parser';

const EMOJI = {
  semantic: '⬜',
  safe: '🟩',
  unsafe: '🟥',
  idempotent: '🟨',
} as const;

/**
 * Generate Mermaid classDiagram content from ALPS data
 */
export function generateMermaid(alpsData: AlpsDocument): string {
  const descriptors = alpsData.alps?.descriptor || [];

  // Get all transition targets (rt values) - these are the actual states
  const transitions = descriptors.filter(d => d.type && d.rt);
  const rtTargets = new Set(transitions.map(t => t.rt!.replace('#', '')));

  // States are descriptors that are referenced as rt targets
  let states = descriptors.filter(d => d.id && rtTargets.has(d.id));

  // If there are no transitions, include all semantic descriptors as states
  if (states.length === 0) {
    states = descriptors.filter(d => d.id && (!d.type || d.type === 'semantic'));
  }

  // Build a map of descriptor id to descriptor for quick lookup
  const descriptorMap = new Map<string, AlpsDescriptor>();
  for (const d of descriptors) {
    if (d.id) {
      descriptorMap.set(d.id, d);
    }
  }

  let mermaid = 'classDiagram\n';

  // Add class definitions for each state
  for (const state of states) {
    /* istanbul ignore if -- states are pre-filtered by id */
    if (!state.id) continue;

    mermaid += `    class ${state.id} {\n`;

    // Get child descriptors and sort by type: semantic, safe, unsafe, idempotent
    const children = getChildDescriptors(state, descriptorMap);
    const sorted = sortByType(children);

    for (const child of sorted) {
      const emoji = getEmoji(child.type);
      mermaid += `        ${emoji} ${child.id}\n`;
    }

    mermaid += '    }\n';
  }

  mermaid += '\n';

  // Add transitions (edges)
  for (const trans of transitions) {
    if (!trans.id || !trans.rt) continue;

    const targetState = trans.rt.replace('#', '');
    const sourceStates = findSourceStatesForTransition(trans.id, descriptors);
    const emoji = getEmoji(trans.type);

    for (const sourceState of sourceStates) {
      if (sourceState !== 'UnknownState') {
        mermaid += `    ${sourceState} --> ${targetState} : ${emoji} ${trans.id}\n`;
      }
    }
  }

  return mermaid;
}

/**
 * Get child descriptors from a state
 */
function getChildDescriptors(
  state: AlpsDescriptor,
  descriptorMap: Map<string, AlpsDescriptor>
): Array<{ id: string; type?: string }> {
  const children: Array<{ id: string; type?: string }> = [];

  if (!state.descriptor || !Array.isArray(state.descriptor)) {
    return children;
  }

  for (const child of state.descriptor) {
    let childId = child.href || child.id;
    if (childId?.startsWith('#')) {
      childId = childId.substring(1);
    }

    if (childId) {
      const resolved = descriptorMap.get(childId);
      children.push({
        id: childId,
        type: resolved?.type || child.type || 'semantic',
      });
    }
  }

  return children;
}

/**
 * Sort descriptors by type: semantic, safe, unsafe, idempotent
 */
function sortByType(descriptors: Array<{ id: string; type?: string }>): Array<{ id: string; type?: string }> {
  const order = { semantic: 0, safe: 1, unsafe: 2, idempotent: 3 };
  return [...descriptors].sort((a, b) => {
    /* istanbul ignore next -- fallback for unknown types */
    const aOrder = order[a.type as keyof typeof order] ?? 0;
    /* istanbul ignore next -- fallback for unknown types */
    const bOrder = order[b.type as keyof typeof order] ?? 0;
    return aOrder - bOrder;
  });
}

/**
 * Get emoji for descriptor type
 */
function getEmoji(type?: string): string {
  switch (type) {
    case 'safe':
      return EMOJI.safe;
    case 'unsafe':
      return EMOJI.unsafe;
    case 'idempotent':
      return EMOJI.idempotent;
    default:
      return EMOJI.semantic;
  }
}

/**
 * Find source states that contain a transition
 */
function findSourceStatesForTransition(transitionId: string, descriptors: AlpsDescriptor[]): string[] {
  const sources: string[] = [];

  for (const desc of descriptors) {
    if (desc.descriptor && Array.isArray(desc.descriptor)) {
      const hasTransition = desc.descriptor.some(nested =>
        nested.href === `#${transitionId}` || nested.id === transitionId
      );
      if (hasTransition && desc.id) {
        sources.push(desc.id);
      }
    }
  }

  return sources.length > 0 ? sources : ['UnknownState'];
}
