# @alps-asd/crawler

ALPS Website Crawler - Extract ALPS profiles from existing websites using efficient pattern-based analysis.

## Overview

This package implements a token-efficient strategy for extracting ALPS (Application-Level Profile Semantics) profiles from live websites. Instead of analyzing every page, it uses intelligent URL pattern classification to minimize AI calls.

## Features

- **URL Pattern Classification**: Automatically groups similar URLs (`/products/123`, `/products/456` → same pattern)
- **DOM Structure Extraction**: Removes text content, extracts only structural information
- **AI-Powered ALPS Generation**: Generates semantic descriptors, states, and transitions from DOM skeleton
- **Token Optimization**: Minimizes AI calls by analyzing unique page types only

## Installation

```bash
pnpm add @alps-asd/crawler
```

## Usage

### Basic Example

```typescript
import { AlpsCrawler } from '@alps-asd/crawler';

const crawler = new AlpsCrawler();

const result = await crawler.crawl({
  startUrl: 'https://example.com',
  maxDepth: 3,
  excludePatterns: ['/admin/*', '/login'],

  // Provide AI function
  callAI: async (prompt) => {
    // Call your AI service (Claude, GPT, etc.)
    return await yourAIService.call(prompt);
  },

  // Provide HTML fetch function
  fetchHtml: async (url) => {
    const response = await fetch(url);
    return await response.text();
  },

  // Optional: track progress
  onProgress: (status) => {
    console.log(`Processing: ${status.currentUrl}`);
    console.log(`Patterns found: ${status.patternsFound}`);
    console.log(`AI calls made: ${status.aiCallsMade}`);
  }
});

console.log('Generated ALPS:', JSON.stringify(result.alps, null, 2));
console.log('Statistics:', result.stats);
```

### Individual Components

You can also use individual components independently:

#### URL Pattern Classifier

```typescript
import { UrlPatternClassifier } from '@alps-asd/crawler';

const classifier = new UrlPatternClassifier();

const classification1 = classifier.classify('https://example.com/products/123');
// { pattern: '/products/{id}', isNewPattern: true }

const classification2 = classifier.classify('https://example.com/products/456');
// { pattern: '/products/{id}', isNewPattern: false }  // Same pattern!

console.log(classifier.getStats());
// { totalPatterns: 1, totalUrls: 2, patterns: [...] }
```

#### DOM Skeleton Extractor

```typescript
import { DomSkeletonExtractor } from '@alps-asd/crawler';

const extractor = new DomSkeletonExtractor();
const html = '<html>...</html>';

const skeleton = extractor.extract(html, 'https://example.com/products/123');

console.log(skeleton.title);        // Page title
console.log(skeleton.forms);        // Form structures (without text)
console.log(skeleton.links);        // Link patterns
console.log(skeleton.landmarks);    // nav, main, footer, etc.
```

#### ALPS Descriptor Generator

```typescript
import { AlpsDescriptorGenerator, generatePrompt } from '@alps-asd/crawler';

const generator = new AlpsDescriptorGenerator();

// Generate prompt for AI
const prompt = generatePrompt(skeleton, '/products/{id}');

// Or use the generator directly
const descriptors = await generator.generate(
  skeleton,
  '/products/{id}',
  callAI
);

console.log(descriptors.state);       // Page state descriptor
console.log(descriptors.semantics);   // Semantic field descriptors
console.log(descriptors.transitions); // Transition descriptors
```

## How It Works

### Three-Layer Strategy

**Strategy 1: URL Pattern Classification (No AI)**
```
/products/123   ]
/products/456   ]→  Pattern: /products/{id}  → Analyze ONCE
/products/789   ]
```

**Strategy 2: DOM Structure Extraction (Lightweight)**
```html
<!-- Original HTML (thousands of tokens) -->
<div class="product-card">
  <h1>iPhone 15 Pro - The best iPhone ever...</h1>
  <button>Add to Cart</button>
</div>

<!-- Extracted Skeleton (minimal tokens) -->
{
  "forms": [{"action": "/cart/add", "inputs": ["productId", "quantity"]}],
  "links": [{"href": "/products"}],
  "landmarks": ["nav", "main"]
}
```

**Strategy 3: ALPS Generation (AI-Powered)**
```
DOM Skeleton → AI Analysis → ALPS Descriptors
{
  "state": {"id": "ProductDetail", ...},
  "semantics": [{"id": "productId", ...}],
  "transitions": [{"id": "doAddToCart", ...}]
}
```

## API Reference

### `AlpsCrawler`

Main orchestrator for crawling websites and generating ALPS profiles.

#### Methods

- `crawl(options: CrawlOptions): Promise<CrawlResult>`

#### Types

```typescript
interface CrawlOptions {
  startUrl: string;
  maxDepth?: number;
  excludePatterns?: string[];
  callAI: (prompt: string) => Promise<string>;
  fetchHtml: (url: string) => Promise<string>;
  onProgress?: (status: CrawlProgress) => void;
}

interface CrawlResult {
  alps: AlpsDocument;
  stats: {
    totalUrls: number;
    uniquePatterns: number;
    aiCallsMade: number;
    tokensEstimated: number;
  };
  visitedUrls: string[];
  frontierQueue: string[];
}
```

### Exports

```typescript
// Main crawler
export { AlpsCrawler }

// Components
export { UrlPatternClassifier }
export { DomSkeletonExtractor }
export { AlpsDescriptorGenerator }

// Utilities
export { ALPS_EXTRACTION_PROMPT, generatePrompt, parseAIResponse }

// Types
export type { AlpsDescriptor, AlpsDocument, AlpsLink }
export type { UrlPattern, UrlClassification }
export type { DomSkeleton, FormInfo, LinkInfo }
export type { PageDescriptors }
export type { CrawlOptions, CrawlResult, CrawlProgress }
```

## Best Practices

1. **Start Small**: Use `maxDepth: 2` initially to test
2. **Exclude Auth Pages**: Add login/admin pages to `excludePatterns`
3. **Monitor Progress**: Use `onProgress` callback to track crawling
4. **Save State**: Use `frontierQueue` from results for multi-session crawling

## Limitations

- Cannot access pages behind authentication (unless cookies provided)
- JavaScript-heavy SPAs may not be fully analyzed
- External services are noted but not crawled
- AI inference may miss domain-specific semantics

## Integration

This package is designed to work with:
- **ALPS Skill** (`.claude/skills/alps/`) - AI-powered ALPS generation
- **MCP Server** (`@alps-asd/mcp`) - Model Context Protocol integration
- **CLI Tools** - Standalone crawling utilities

## License

MIT
