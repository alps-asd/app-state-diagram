/**
 * ALPS Crawler - Main Orchestrator
 *
 * Coordinates URL classification, DOM extraction, and ALPS generation.
 * Implements the efficient crawling strategy to minimize AI token usage.
 */

export { UrlPatternClassifier, type UrlPattern, type UrlClassification } from './url-pattern-classifier.js';
export { DomSkeletonExtractor, type DomSkeleton, type FormInfo, type LinkInfo } from './dom-skeleton-extractor.js';
export {
  AlpsDescriptorGenerator,
  type PageDescriptors,
  ALPS_EXTRACTION_PROMPT,
  generatePrompt,
  parseAIResponse,
} from './alps-descriptor-generator.js';
export { type AlpsDescriptor, type AlpsDocument, type AlpsLink } from './types.js';

import { UrlPatternClassifier } from './url-pattern-classifier.js';
import { DomSkeletonExtractor } from './dom-skeleton-extractor.js';
import { AlpsDescriptorGenerator, PageDescriptors } from './alps-descriptor-generator.js';
import { AlpsDescriptor, AlpsDocument } from './types.js';

export interface CrawlOptions {
  /** Starting URL */
  startUrl: string;
  /** Maximum crawl depth */
  maxDepth?: number;
  /** URL patterns to exclude (regex) */
  excludePatterns?: string[];
  /** AI call function */
  callAI: (prompt: string) => Promise<string>;
  /** Fetch HTML function */
  fetchHtml: (url: string) => Promise<string>;
  /** Progress callback */
  onProgress?: (status: CrawlProgress) => void;
}

export interface CrawlProgress {
  /** Current URL being processed */
  currentUrl: string;
  /** URLs discovered so far */
  discoveredUrls: number;
  /** URLs processed so far */
  processedUrls: number;
  /** Unique patterns found */
  patternsFound: number;
  /** AI calls made */
  aiCallsMade: number;
  /** Current status */
  status: 'discovering' | 'analyzing' | 'generating' | 'complete';
}

export interface CrawlResult {
  /** Generated ALPS document */
  alps: AlpsDocument;
  /** Crawl statistics */
  stats: {
    totalUrls: number;
    uniquePatterns: number;
    aiCallsMade: number;
    tokensEstimated: number;
  };
  /** URLs visited (for handover) */
  visitedUrls: string[];
  /** URLs in queue (for handover) */
  frontierQueue: string[];
}

/**
 * ALPS Crawler Orchestrator.
 *
 * Implements the efficient crawling strategy:
 * 1. Classify URLs by pattern (Strategy 1)
 * 2. Extract DOM skeleton for new patterns (Strategy 2)
 * 3. Generate ALPS descriptors via AI (Strategy 3)
 */
export class AlpsCrawler {
  private urlClassifier = new UrlPatternClassifier();
  private domExtractor = new DomSkeletonExtractor();
  private alpsGenerator = new AlpsDescriptorGenerator();

  private visitedUrls = new Set<string>();
  private frontierQueue: string[] = [];
  private processedPatterns = new Set<string>();

  private semanticDescriptors = new Map<string, AlpsDescriptor>();
  private stateDescriptors = new Map<string, AlpsDescriptor>();
  private transitionDescriptors = new Map<string, AlpsDescriptor>();

  private aiCallCount = 0;

  /**
   * Crawl website and generate ALPS profile.
   */
  async crawl(options: CrawlOptions): Promise<CrawlResult> {
    const {
      startUrl,
      maxDepth = 3,
      excludePatterns = [],
      callAI,
      fetchHtml,
      onProgress,
    } = options;

    // Initialize
    this.frontierQueue.push(startUrl);
    let currentDepth = 0;

    while (this.frontierQueue.length > 0 && currentDepth < maxDepth) {
      const url = this.frontierQueue.shift()!;

      // Skip if already visited
      if (this.visitedUrls.has(url)) {
        continue;
      }

      // Skip if matches exclude pattern
      if (excludePatterns.some(pattern => new RegExp(pattern).test(url))) {
        continue;
      }

      // Report progress
      onProgress?.({
        currentUrl: url,
        discoveredUrls: this.visitedUrls.size + this.frontierQueue.length,
        processedUrls: this.visitedUrls.size,
        patternsFound: this.processedPatterns.size,
        aiCallsMade: this.aiCallCount,
        status: 'discovering',
      });

      // Mark as visited
      this.visitedUrls.add(url);

      // Classify URL
      const classification = this.urlClassifier.classify(url);

      // If this is a known pattern, skip AI analysis
      if (!classification.isNewPattern) {
        continue;
      }

      // New pattern - fetch and analyze
      onProgress?.({
        currentUrl: url,
        discoveredUrls: this.visitedUrls.size + this.frontierQueue.length,
        processedUrls: this.visitedUrls.size,
        patternsFound: this.processedPatterns.size,
        aiCallsMade: this.aiCallCount,
        status: 'analyzing',
      });

      try {
        const html = await fetchHtml(url);

        // Extract DOM skeleton
        const skeleton = this.domExtractor.extract(html, url);

        // Add discovered links to frontier
        for (const link of skeleton.links) {
          if (link.type !== 'external') {
            this.frontierQueue.push(link.href);
          }
        }

        // Generate ALPS descriptors via AI
        onProgress?.({
          currentUrl: url,
          discoveredUrls: this.visitedUrls.size + this.frontierQueue.length,
          processedUrls: this.visitedUrls.size,
          patternsFound: this.processedPatterns.size,
          aiCallsMade: this.aiCallCount,
          status: 'generating',
        });

        const descriptors = await this.alpsGenerator.generate(
          skeleton,
          classification.pattern!.pattern,
          callAI
        );

        this.aiCallCount++;

        // Merge descriptors into ALPS profile
        this.mergeDescriptors(descriptors);

        // Mark pattern as processed
        this.processedPatterns.add(classification.pattern!.pattern);
      } catch (error) {
        console.error(`Failed to process ${url}:`, error);
      }

      currentDepth++;
    }

    // Build final ALPS document
    const alps = this.buildAlpsDocument();

    onProgress?.({
      currentUrl: '',
      discoveredUrls: this.visitedUrls.size,
      processedUrls: this.visitedUrls.size,
      patternsFound: this.processedPatterns.size,
      aiCallsMade: this.aiCallCount,
      status: 'complete',
    });

    return {
      alps,
      stats: {
        totalUrls: this.visitedUrls.size,
        uniquePatterns: this.processedPatterns.size,
        aiCallsMade: this.aiCallCount,
        tokensEstimated: this.aiCallCount * 2000, // Rough estimate
      },
      visitedUrls: Array.from(this.visitedUrls),
      frontierQueue: this.frontierQueue,
    };
  }

  /**
   * Merge page descriptors into the global ALPS profile.
   */
  private mergeDescriptors(page: PageDescriptors): void {
    // Merge semantic descriptors (avoid duplicates)
    for (const semantic of page.semantics) {
      if (semantic.id && !this.semanticDescriptors.has(semantic.id)) {
        this.semanticDescriptors.set(semantic.id, semantic);
      }
    }

    // Add state descriptor
    if (page.state.id) {
      this.stateDescriptors.set(page.state.id, page.state);
    }

    // Add transitions
    for (const transition of page.transitions) {
      if (transition.id && !this.transitionDescriptors.has(transition.id)) {
        this.transitionDescriptors.set(transition.id, transition);
      }
    }
  }

  /**
   * Build final ALPS document from collected descriptors.
   */
  private buildAlpsDocument(): AlpsDocument {
    const descriptors: AlpsDescriptor[] = [
      // Ontology (semantic fields)
      ...Array.from(this.semanticDescriptors.values()),

      // Taxonomy (states)
      ...Array.from(this.stateDescriptors.values()),

      // Choreography (transitions)
      ...Array.from(this.transitionDescriptors.values()),
    ];

    return {
      alps: {
        title: 'Generated ALPS Profile',
        doc: {
          value: `Auto-generated ALPS profile from website crawl. ${this.processedPatterns.size} unique page patterns analyzed.`,
        },
        descriptor: descriptors,
      },
    };
  }
}
