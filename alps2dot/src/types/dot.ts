export interface DotGraph {
  nodes: DotNode[];
  edges: DotEdge[];
  attributes: GraphAttributes;
}

export interface DotNode {
  id: string;
  label: string;
  attributes: NodeAttributes;
}

export interface DotEdge {
  from: string;
  to: string;
  label?: string;
  htmlLabel?: string;
  attributes: EdgeAttributes;
}

export interface GraphAttributes {
  rankdir?: 'TB' | 'LR' | 'BT' | 'RL';
  labelloc?: 't' | 'b';
  fontname?: string;
  [key: string]: string | undefined;
}

export interface NodeAttributes {
  shape?: 'box' | 'circle' | 'ellipse' | 'diamond';
  style?: string;
  fillcolor?: string;
  color?: string;
  fontcolor?: string;
  margin?: string;
  URL?: string;
  target?: string;
  [key: string]: string | undefined;
}

export interface EdgeAttributes {
  style?: string;
  color?: string;
  fontcolor?: string;
  arrowhead?: string;
  fontsize?: number;
  penwidth?: number;
  URL?: string;
  target?: string;
  class?: string;
  [key: string]: string | number | undefined;
}

export interface DotOptions {
  format?: 'svg' | 'png' | 'pdf';
  engine?: 'dot' | 'neato' | 'circo' | 'fdp' | 'twopi';
  title?: string;
}