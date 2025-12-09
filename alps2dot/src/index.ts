import { AlpsParser, AlpsTransformer } from './parser';
import { DotGenerator, LabelStrategy, createLabelStrategy } from './generator';
import { AlpsDocument } from './types';

export class Alps2Dot {
  private parser: AlpsParser;
  private transformer: AlpsTransformer;
  private generator: DotGenerator;

  constructor() {
    this.parser = new AlpsParser();
    this.transformer = new AlpsTransformer();
    this.generator = new DotGenerator(); // デフォルトはIDラベル
  }

  convert(input: string, format?: 'json' | 'xml'): string {
    return this.convertWithLabel(input, 'id', format);
  }

  convertWithLabel(input: string, labelType: 'id' | 'title', format?: 'json' | 'xml'): string {
    // Parse ALPS document
    const document = this.parser.parse(input, format);
    
    // Validate document
    const validation = this.parser.validate(document);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join('\n');
      throw new Error(`Invalid ALPS document:\n${errorMessages}`);
    }

    // Transform to internal model
    const model = this.transformer.transform(document);

    // Generate DOT output with specified label strategy
    const labelStrategy = createLabelStrategy(labelType);
    return this.generator.generateWithStrategy(model, labelStrategy);
  }

  convertBoth(input: string, format?: 'json' | 'xml'): { id: string; title: string } {
    // Parse ALPS document
    const document = this.parser.parse(input, format);
    
    // Validate document
    const validation = this.parser.validate(document);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join('\n');
      throw new Error(`Invalid ALPS document:\n${errorMessages}`);
    }

    // Transform to internal model
    const model = this.transformer.transform(document);

    // Generate both versions
    const idStrategy = createLabelStrategy('id');
    const titleStrategy = createLabelStrategy('title');

    return {
      id: this.generator.generateWithStrategy(model, idStrategy),
      title: this.generator.generateWithStrategy(model, titleStrategy)
    };
  }

  parseOnly(input: string, format?: 'json' | 'xml'): AlpsDocument {
    return this.parser.parse(input, format);
  }

  validateOnly(document: AlpsDocument) {
    return this.parser.validate(document);
  }
}

export * from './types';
export * from './parser';
export * from './generator';