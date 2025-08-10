import { InternalModel, InternalNode, InternalLink } from '../types/internal';
import { LabelStrategy, IdLabelStrategy } from './label-strategy';

export class DotGenerator {
  private labelStrategy: LabelStrategy;

  constructor(labelStrategy?: LabelStrategy) {
    this.labelStrategy = labelStrategy || new IdLabelStrategy();
  }

  generate(model: InternalModel): string {
    return this.generateWithStrategy(model, this.labelStrategy);
  }

  generateWithStrategy(model: InternalModel, labelStrategy: LabelStrategy): string {
    const transNodes = this.getTransNodes(model);
    const [, nodesOutput] = this.getNodes(transNodes, labelStrategy, model.nodes);
    const edgeOutput = this.createEdgeOutput(model.links, labelStrategy);
    const appStateOutput = this.createAppStateOutput(model.links, model.nodes, labelStrategy);

    const template = `digraph application_state_diagram {
  graph [
    labelloc="t";
    fontname="Helvetica"
  ];
  node [shape = box, style = "bold,filled" fillcolor="lightgray", margin="0.3,0.1"];

%s
%s
%s
}`;

    return template
      .replace('%s', nodesOutput)
      .replace('%s', edgeOutput)
      .replace('%s', appStateOutput);
  }

  /**
   * PHP版のgetTransNodes()と同等
   * リンクに関与するノードIDのリストを取得
   */
  private getTransNodes(model: InternalModel): string[] {
    const transNodes: string[] = [];
    for (const link of model.links) {
      if (!transNodes.includes(link.from)) {
        transNodes.push(link.from);
      }
      if (!transNodes.includes(link.to)) {
        transNodes.push(link.to);
      }
    }
    return transNodes;
  }

  /**
   * PHP版のgetNodes()と同等
   * semantic descriptorで、semantic fieldsまたはsemantic hrefsを持つノードのみを出力
   */
  private getNodes(transNodes: string[], labelStrategy: LabelStrategy, nodes: InternalNode[]): [string[], string] {
    const ids: string[] = [];
    let dot = '';

    for (const node of nodes) {
      if (!transNodes.includes(node.id)) {
        continue;
      }

      const [id, deltaDot] = this.getNode(node, labelStrategy, nodes);
      dot += deltaDot;
      if (id && id !== '') {
        ids.push(id);
      }
    }

    return [ids, dot];
  }

  /**
   * PHP版のgetNode()と同等
   * semantic descriptorで子descriptorを持つもののみ処理
   */
  private getNode(node: InternalNode, labelStrategy: LabelStrategy, allNodes: InternalNode[]): [string | null, string] {
    // semantic descriptorで子descriptorを持つかチェック
    const hasDescriptor = node.type === 'semantic' && node.semanticFields.length > 0;
    if (!hasDescriptor) {
      return [null, ''];
    }

    const props = this.getNodeProps(node, labelStrategy, allNodes);
    if (props.length === 0) {
      return [null, ''];
    }

    return [node.id, this.nodeTemplate(node, labelStrategy)];
  }

  /**
   * PHP版のgetNodeProps()と同等
   * semantic fieldsまたはsemantic hrefsを取得
   */
  private getNodeProps(node: InternalNode, labelStrategy: LabelStrategy, allNodes: InternalNode[]): string[] {
    const props: string[] = [];

    // semantic fieldsを追加
    for (const field of node.semanticFields) {
      props.push(field);
    }

    // TODO: semantic hrefsの処理（必要に応じて実装）
    
    return props;
  }

  /**
   * PHP版のtemplate()と同等
   * semantic fieldノードのDOTテンプレート
   */
  private nodeTemplate(node: InternalNode, labelStrategy: LabelStrategy): string {
    // PHP版と同じく、labelNameのgetNodeLabel()のみを使用（semantic fieldsは含まない）
    const label = labelStrategy.getNodeLabel(node);
    const url = `#${node.id}`;
    
    return `    ${node.id} [margin=0.1, label="${this.escapeLabel(label)}", shape=box, URL="${url}" target="_parent"]\n`;
  }

  /**
   * semantic fieldラベルを生成（PHP版のgetNodeProps相当の処理を含む）
   */
  private createSemanticFieldLabel(node: InternalNode, labelStrategy: LabelStrategy): string {
    let label = labelStrategy.getNodeLabel(node);
    
    if (node.semanticFields.length > 0) {
      const fields = node.semanticFields.join('\\n');
      label += `\\n${fields}`;
    }
    
    return label;
  }

  /**
   * PHP版のEdge::__toString()と同等
   * エッジ出力を生成
   */
  private createEdgeOutput(links: InternalLink[], labelStrategy: LabelStrategy): string {
    let graph = '';
    const groupedLinks = this.groupEdges(links);
    
    for (const linkGroup of Object.values(groupedLinks)) {
      graph += linkGroup.length === 1 ? this.singleLink(linkGroup) : this.multipleLink(linkGroup);
    }

    return graph;
  }

  /**
   * PHP版のAppState::__toString()と同等
   * 基本状態ノードを生成
   */
  private createAppStateOutput(links: InternalLink[], nodes: InternalNode[], labelStrategy: LabelStrategy): string {
    const states = this.getAppStates(links, nodes);
    let dot = '';

    for (const node of states) {
      const base = `    %s [label="%s" URL="#%s" target="_parent"]`;
      dot += base
        .replace('%s', node.id)
        .replace('%s', this.escapeLabel(labelStrategy.getNodeLabel(node)))
        .replace('%s', node.id) + '\n';
    }

    return dot;
  }

  /**
   * リンクに関与する基本状態ノードを取得
   */
  private getAppStates(links: InternalLink[], nodes: InternalNode[]): InternalNode[] {
    const states: InternalNode[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const link of links) {
      const fromNode = nodeMap.get(link.from);
      const toNode = nodeMap.get(link.to);

      if (fromNode && !states.some(s => s.id === fromNode.id)) {
        states.push(fromNode);
      }
      if (toNode && !states.some(s => s.id === toNode.id)) {
        states.push(toNode);
      }
    }

    return states;
  }

  /**
   * PHP版のsingleLink()と同等
   */
  private singleLink(links: InternalLink[]): string {
    const link = links[0];
    const symbolUnicode = this.getTypeSymbolUnicode(link.transitionType || 'semantic');
    const labelHtml = link.transitionId || link.relation || '';
    const tooltip = link.transitionTitle || link.transitionId || '';
    const type = link.transitionType || 'semantic';

    const labelContent = `<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#${link.transitionId}" tooltip="${this.escapeHtml(tooltip)} (${type})">${symbolUnicode} ${labelHtml}</td></tr></table>`;

    const base = `    %s -> %s [label=<%s> URL="#%s" target="_parent" fontsize=13 class="%s" penwidth=1.5];\n`;

    return base
      .replace('%s', link.from)
      .replace('%s', link.to)
      .replace('%s', labelContent)
      .replace('%s', link.transitionId || '')
      .replace('%s', link.transitionId || '');
  }

  /**
   * PHP版のmultipleLink()と同等
   */
  private multipleLink(links: InternalLink[]): string {
    let trs = '';
    
    for (const link of links) {
      const symbolUnicode = this.getTypeSymbolUnicode(link.transitionType || 'semantic');
      const labelHtml = link.transitionId || link.relation || '';
      const tooltip = link.transitionTitle || link.transitionId || '';
      const type = link.transitionType || 'semantic';

      trs += `<tr><td valign="middle" align="left" href="#${link.transitionId}" tooltip="${this.escapeHtml(tooltip)} (${type})">${symbolUnicode} ${labelHtml}</td></tr>`;
    }

    const base = `    %s -> %s [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0">%s</table>> URL="#%s" target="_parent" fontsize=13 class="%s" penwidth=1.5];\n`;

    return base
      .replace('%s', links[0].from)
      .replace('%s', links[0].to)
      .replace('%s', trs)
      .replace('%s', links[0].transitionId || '')
      .replace('%s', links[0].transitionId || '');
  }

  /**
   * PHP版のgroupEdges()と同等
   */
  private groupEdges(links: InternalLink[]): Record<string, InternalLink[]> {
    const groupedLinks: Record<string, InternalLink[]> = {};
    
    for (const link of links) {
      const fromTo = link.from + link.to;
      if (!groupedLinks[fromTo]) {
        groupedLinks[fromTo] = [];
      }
      groupedLinks[fromTo].push(link);
    }

    return groupedLinks;
  }

  /**
   * PHP版のgetTypeSymbolUnicode()と同等
   */
  private getTypeSymbolUnicode(type: string): string {
    let color: string;
    switch (type) {
      case 'safe':
        color = '#00A86B';
        break;
      case 'unsafe':
        color = '#FF4136';
        break;
      case 'idempotent':
        color = '#FFDC00';
        break;
      default:
        color = '#000000';
    }
    const symbol = '■'; // Unicode Black Square (U+25A0)

    return `<font color="${color}">${symbol}</font>`;
  }

  private escapeLabel(label: string): string {
    return label
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}