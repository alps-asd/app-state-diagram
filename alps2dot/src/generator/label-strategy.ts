import { InternalNode } from '../types/internal';

export interface LabelStrategy {
  getNodeLabel(node: InternalNode): string;
  getLinkLabel(transId: string, transTitle?: string): string;
}

/**
 * PHP版のLabelNameと同等
 * IDベースのラベル戦略
 */
export class IdLabelStrategy implements LabelStrategy {
  getNodeLabel(node: InternalNode): string {
    return node.id;
  }

  getLinkLabel(transId: string, transTitle?: string): string {
    return transId;
  }
}

/**
 * PHP版のLabelNameTitleと同等  
 * タイトルベースのラベル戦略
 */
export class TitleLabelStrategy implements LabelStrategy {
  getNodeLabel(node: InternalNode): string {
    return node.title || node.id;
  }

  getLinkLabel(transId: string, transTitle?: string): string {
    const title = transTitle || transId;
    // PHP版のstr_replace(' ', '&nbsp;', $title)と同等
    return title.replace(/ /g, '&nbsp;');
  }
}

export type LabelStrategyType = 'id' | 'title' | 'both';

export function createLabelStrategy(type: 'id' | 'title'): LabelStrategy {
  switch (type) {
    case 'id':
      return new IdLabelStrategy();
    case 'title':
      return new TitleLabelStrategy();
    default:
      throw new Error(`Unknown label strategy: ${type}`);
  }
}