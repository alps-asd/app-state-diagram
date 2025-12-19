/**
 * DOT Generator for Node.js
 *
 * Generates Graphviz DOT format from ALPS data.
 * Ported from public/js/diagramAdapters.js Alps2DotAdapter.generateDotFromAlps()
 */

import type { AlpsDocument, AlpsDescriptor } from '../parser/alps-parser';

export type LabelMode = 'id' | 'title';

/**
 * Generate DOT content from ALPS data
 */
export function generateDot(alpsData: AlpsDocument, labelMode: LabelMode = 'id'): string {
  const descriptors = alpsData.alps?.descriptor || [];

  // Get all transition targets (rt values) - these are the actual states
  const transitions = descriptors.filter(d => d.type && d.rt);
  const rtTargets = new Set(transitions.map(t => t.rt!.replace('#', '')));

  // States are descriptors that are referenced as rt targets
  let states = descriptors.filter(d => d.id && rtTargets.has(d.id));

  // If there are no transitions, include all descriptors with an id as states
  if (states.length === 0) {
    // Exclude descriptors that look like transitions (have safe/unsafe/idempotent type)
    states = descriptors.filter(d => d.id && (!d.type || d.type === 'semantic'));
  }

  const getLabel = (descriptor: AlpsDescriptor): string => {
    if (labelMode === 'title' && descriptor.title) {
      return descriptor.title;
    }
    return descriptor.id!;
  };

  let dot = `digraph application_state_diagram {
    graph [
        labelloc="t";
        fontname="Helvetica"
    ];
    node [shape = box, style = "bold,filled" fillcolor="lightgray", margin="0.3,0.1"];

`;

  // Add state nodes
  for (const state of states) {
    // state.id is guaranteed by the filter above
    dot += `    ${state.id} [margin=0.1, label="${getLabel(state)}", shape=box, URL="#${state.id}"]\n`;
  }

  dot += '\n';

  // Add transitions
  for (const trans of transitions) {
    // trans.rt is guaranteed by filter. trans.id is needed for valid DOT node ID.
    if (trans.id) {
      const targetState = trans.rt!.replace('#', '');
      const sourceStates = findSourceStatesForTransition(trans.id, descriptors);
      const color = getTransitionColor(trans.type);
      const transLabel = getLabel(trans);

      for (const sourceState of sourceStates) {
        dot += `    ${sourceState} -> ${targetState} [label="${transLabel}" URL="#${trans.id}" fontsize=13 class="${trans.id}" penwidth=1.5 color="${color}"];\n`;
      }
    }
  }

  dot += '\n';

  // Add basic state nodes again (for compatibility)
  for (const state of states) {
    // state.id is guaranteed by the filter above
    dot += `    ${state.id} [label="${getLabel(state)}" URL="#${state.id}"]\n`;
  }

  dot += '\n}';

  return dot;
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

/**
 * Get color for transition type
 */
function getTransitionColor(type?: string): string {
  switch (type) {
    case 'safe':
      return '#00A86B';
    case 'unsafe':
      return '#FF4136';
    case 'idempotent':
      return '#D4A000';
    default:
      return '#000000';
  }
}

/**
 * Build relationship map for parent-child highlighting
 */
export function buildRelationshipMap(alpsData: AlpsDocument): {
  parentOf: Record<string, string[]>;
  childrenOf: Record<string, string[]>;
} {
  const relationships = {
    parentOf: {} as Record<string, string[]>,
    childrenOf: {} as Record<string, string[]>,
  };

  const descriptors = alpsData.alps?.descriptor || [];

  for (const parent of descriptors) {
    if (parent.id && parent.descriptor && Array.isArray(parent.descriptor)) {
      relationships.childrenOf[parent.id] = [];

      for (const child of parent.descriptor) {
        let childId = child.href || child.id;
        if (childId && childId.startsWith('#')) {
          childId = childId.substring(1);
        }

        if (childId) {
          relationships.childrenOf[parent.id].push(childId);

          if (!relationships.parentOf[childId]) {
            relationships.parentOf[childId] = [];
          }
          relationships.parentOf[childId].push(parent.id);
        }
      }
    }
  }

  return relationships;
}
