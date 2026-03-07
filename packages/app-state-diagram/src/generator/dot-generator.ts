/**
 * DOT Generator for Node.js
 *
 * Generates Graphviz DOT format from ALPS data.
 * Ported from public/js/diagramAdapters.js Alps2DotAdapter.generateDotFromAlps()
 */

import type { AlpsDocument, AlpsDescriptor } from '../parser/alps-parser';

export type LabelMode = 'id' | 'title';

/**
 * Escape a string for use as a DOT ID.
 * DOT IDs need quoting if they contain special characters.
 * Returns the ID quoted if necessary.
 */
function escapeDotId(id: string): string {
  // If ID is alphanumeric with underscores only, no quoting needed
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id)) {
    return id;
  }
  // Otherwise, quote it and escape internal quotes/backslashes
  return `"${id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Escape a string for use as a DOT label (inside double quotes).
 * Escapes backslashes and double quotes.
 */
function escapeDotLabel(label: string): string {
  return label
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Escape a string for use in a DOT attribute value (inside double quotes).
 * Same as escapeDotLabel - escapes backslashes and double quotes.
 */
function escapeDotAttr(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

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
    const nodeId = escapeDotId(state.id!);
    const nodeLabel = escapeDotLabel(getLabel(state));
    const nodeUrl = escapeDotAttr(`#${state.id}`);
    dot += `    ${nodeId} [margin=0.1, label="${nodeLabel}", shape=box, URL="${nodeUrl}"]\n`;
  }

  dot += '\n';

  // Group transitions by (source, target) pair
  const edgeGroups = new Map<string, { ids: string[]; labels: string[]; colors: string[]; types: string[]; titles: string[] }>();

  for (const trans of transitions) {
    if (trans.id) {
      const targetState = trans.rt!.replace('#', '');
      const sourceStates = findSourceStatesForTransition(trans.id, descriptors);
      const color = getTransitionColor(trans.type);
      const transLabel = getLabel(trans);
      for (const sourceState of sourceStates) {
        const key = `${sourceState}\t${targetState}`;
        if (!edgeGroups.has(key)) {
          edgeGroups.set(key, { ids: [], labels: [], colors: [], types: [], titles: [] });
        }
        const group = edgeGroups.get(key)!;
        group.ids.push(trans.id);
        group.labels.push(transLabel);
        group.colors.push(color);
        group.types.push(trans.type || '');
        group.titles.push(trans.title || trans.id);
      }
    }
  }

  // Render grouped edges
  for (const [key, group] of edgeGroups) {
    const [sourceState, targetState] = key.split('\t');
    const srcId = escapeDotId(sourceState);
    const tgtId = escapeDotId(targetState);

    if (group.ids.length === 1) {
      // Single transition: use HTML TABLE label with color symbol
      const tableLabel = `<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0"><TR><TD VALIGN="MIDDLE" HREF="#${escapeDotAttr(group.ids[0])}" TOOLTIP="${escapeDotAttr(group.titles[0])} (${group.types[0]})"><FONT COLOR="${group.colors[0]}">■</FONT> ${escapeDotLabel(group.labels[0])}</TD></TR></TABLE>`;
      dot += `    ${srcId} -> ${tgtId} [label=<${tableLabel}> URL="#${escapeDotAttr(group.ids[0])}" fontsize=13 class="${escapeDotAttr(group.ids[0])}" penwidth=1.3 color="#99999977"];\n`;
    } else {
      // Multiple transitions: HTML TABLE with one row per transition
      let rows = '';
      for (let i = 0; i < group.ids.length; i++) {
        rows += `<TR><TD VALIGN="MIDDLE" ALIGN="LEFT" HREF="#${escapeDotAttr(group.ids[i])}" TOOLTIP="${escapeDotAttr(group.titles[i])} (${group.types[i]})"><FONT COLOR="${group.colors[i]}">■</FONT> ${escapeDotLabel(group.labels[i])}</TD></TR>`;
      }
      const tableLabel = `<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">${rows}</TABLE>`;
      dot += `    ${srcId} -> ${tgtId} [label=<${tableLabel}> URL="#${escapeDotAttr(group.ids[0])}" fontsize=13 class="${escapeDotAttr(group.ids[0])}" penwidth=1.3 color="#99999977"];\n`;
    }
  }

  dot += '\n';

  // Add basic state nodes again (for compatibility)
  for (const state of states) {
    // state.id is guaranteed by the filter above
    const nodeId = escapeDotId(state.id!);
    const nodeLabel = escapeDotLabel(getLabel(state));
    const nodeUrl = escapeDotAttr(`#${state.id}`);
    dot += `    ${nodeId} [label="${nodeLabel}" URL="${nodeUrl}"]\n`;
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
