/**
 * URL Pattern Classifier
 *
 * Classifies URLs into patterns (types) to avoid redundant analysis.
 * Strategy 1: Detect URL patterns like /products/{id} without AI.
 *
 * Examples:
 * - /products/12345 and /products/67890 -> pattern: /products/{id}
 * - /users/alice and /users/bob -> pattern: /users/{username}
 * - /blog/2024/01/post1 -> pattern: /blog/{year}/{month}/{slug}
 */

export interface UrlPattern {
  /** Pattern template (e.g., "/products/{id}") */
  pattern: string;
  /** Regex to match this pattern */
  regex: RegExp;
  /** Parameter names extracted from pattern */
  params: string[];
  /** Example URL that created this pattern */
  example: string;
  /** Count of URLs matching this pattern */
  count: number;
}

export interface UrlClassification {
  /** Original URL */
  url: string;
  /** Matched pattern (if exists) */
  pattern?: UrlPattern;
  /** Extracted parameter values */
  params?: Record<string, string>;
  /** True if this is a new pattern */
  isNewPattern: boolean;
}

/**
 * URL Pattern Classifier
 * Maintains a registry of known URL patterns and classifies new URLs.
 */
export class UrlPatternClassifier {
  private patterns: Map<string, UrlPattern> = new Map();

  /**
   * Classify a URL against known patterns.
   * If it matches an existing pattern, return that pattern.
   * If it's new, create a new pattern.
   */
  classify(url: string): UrlClassification {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Try to match against existing patterns
    for (const pattern of this.patterns.values()) {
      const match = pathname.match(pattern.regex);
      if (match) {
        // Extract parameter values
        const params: Record<string, string> = {};
        pattern.params.forEach((paramName, index) => {
          params[paramName] = match[index + 1];
        });

        // Increment count
        pattern.count++;

        return {
          url,
          pattern,
          params,
          isNewPattern: false,
        };
      }
    }

    // No match found - create new pattern
    const newPattern = this.createPattern(pathname, url);
    this.patterns.set(newPattern.pattern, newPattern);

    return {
      url,
      pattern: newPattern,
      isNewPattern: true,
    };
  }

  /**
   * Create a new pattern from a pathname.
   * Detects numeric IDs, UUIDs, slugs, dates, etc.
   */
  private createPattern(pathname: string, exampleUrl: string): UrlPattern {
    const segments = pathname.split('/').filter(Boolean);
    const patternSegments: string[] = [];
    const params: string[] = [];

    for (const segment of segments) {
      const paramName = this.detectParameterType(segment);
      if (paramName) {
        patternSegments.push(`{${paramName}}`);
        params.push(paramName);
      } else {
        // Static segment
        patternSegments.push(segment);
      }
    }

    const pattern = '/' + patternSegments.join('/');
    const regex = this.patternToRegex(patternSegments);

    return {
      pattern,
      regex,
      params,
      example: exampleUrl,
      count: 1,
    };
  }

  /**
   * Detect parameter type from a URL segment.
   * Returns parameter name if it's a variable, null if it's static.
   */
  private detectParameterType(segment: string): string | null {
    // Numeric ID (e.g., "12345", "001")
    if (/^\d+$/.test(segment)) {
      return 'id';
    }

    // UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      return 'uuid';
    }

    // Date YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(segment)) {
      return 'date';
    }

    // Year (4 digits)
    if (/^\d{4}$/.test(segment)) {
      return 'year';
    }

    // Month or day (1-2 digits)
    if (/^\d{1,2}$/.test(segment) && parseInt(segment) <= 31) {
      return 'month_or_day';
    }

    // Slug (alphanumeric with hyphens, longer than 3 chars)
    // BUT: if it looks like a common route keyword, treat as static
    const staticKeywords = [
      'api', 'v1', 'v2', 'admin', 'user', 'users', 'product', 'products',
      'search', 'category', 'categories', 'login', 'logout', 'register',
      'profile', 'settings', 'help', 'about', 'contact', 'home', 'index',
      'list', 'detail', 'edit', 'new', 'create', 'update', 'delete',
    ];

    if (staticKeywords.includes(segment.toLowerCase())) {
      return null; // Static
    }

    // If it contains special chars or is short, likely static
    if (segment.length <= 3 || /[^a-zA-Z0-9_-]/.test(segment)) {
      return null;
    }

    // Long alphanumeric string - likely a slug or username
    if (/^[a-zA-Z0-9_-]+$/.test(segment) && segment.length > 3) {
      return 'slug';
    }

    return null; // Default: treat as static
  }

  /**
   * Convert pattern segments to regex.
   */
  private patternToRegex(patternSegments: string[]): RegExp {
    const regexSegments = patternSegments.map(seg => {
      if (seg.startsWith('{') && seg.endsWith('}')) {
        const paramType = seg.slice(1, -1);
        switch (paramType) {
          case 'id':
            return '(\\d+)';
          case 'uuid':
            return '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})';
          case 'year':
            return '(\\d{4})';
          case 'month_or_day':
            return '(\\d{1,2})';
          case 'date':
            return '(\\d{4}-\\d{2}-\\d{2})';
          case 'slug':
            return '([a-zA-Z0-9_-]+)';
          default:
            return '([^/]+)';
        }
      }
      // Escape static segment for regex
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });

    return new RegExp('^/' + regexSegments.join('/') + '$');
  }

  /**
   * Get all known patterns.
   */
  getPatterns(): UrlPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get pattern statistics.
   */
  getStats() {
    const patterns = this.getPatterns();
    return {
      totalPatterns: patterns.length,
      totalUrls: patterns.reduce((sum, p) => sum + p.count, 0),
      patterns: patterns.map(p => ({
        pattern: p.pattern,
        count: p.count,
        example: p.example,
      })),
    };
  }
}