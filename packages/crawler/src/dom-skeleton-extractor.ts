/**
 * DOM Skeleton Extractor
 *
 * Extracts structural information from HTML while removing text content.
 * Strategy 2: Extract only HTML structure (tags, classes, IDs, forms, links).
 *
 * This minimizes token usage when passing to AI for ALPS generation.
 *
 * Extracted information:
 * - HTML tag hierarchy
 * - Class names and IDs
 * - Form input names and types
 * - Link destinations (href patterns)
 * - Button types and actions
 */

export interface DomElement {
  /** HTML tag name */
  tag: string;
  /** CSS classes */
  classes?: string[];
  /** Element ID */
  id?: string;
  /** Attributes (filtered) */
  attrs?: Record<string, string>;
  /** Child elements */
  children?: DomElement[];
}

export interface FormInfo {
  /** Form ID or name */
  id?: string;
  /** Form action URL pattern */
  action?: string;
  /** HTTP method */
  method?: string;
  /** Input fields */
  inputs: Array<{
    name: string;
    type: string;
    required?: boolean;
  }>;
}

export interface LinkInfo {
  /** Link text type (navigation, action, etc.) */
  type: 'navigation' | 'action' | 'external';
  /** Link destination (URL pattern) */
  href: string;
  /** Inferred semantic meaning from context */
  semantic?: string;
}

export interface DomSkeleton {
  /** Page title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Main content structure */
  structure: DomElement;
  /** Forms found on page */
  forms: FormInfo[];
  /** Links found on page (grouped by pattern) */
  links: LinkInfo[];
  /** Semantic landmarks (nav, main, aside, footer) */
  landmarks: Record<string, DomElement>;
}

/**
 * Extract DOM skeleton from HTML string.
 * Uses simple regex-based parsing (no heavy dependencies).
 */
export class DomSkeletonExtractor {
  /**
   * Extract skeleton from HTML content.
   */
  extract(html: string, baseUrl: string): DomSkeleton {
    // Extract metadata
    const title = this.extractTitle(html);
    const description = this.extractMetaDescription(html);

    // Extract forms
    const forms = this.extractForms(html, baseUrl);

    // Extract links
    const links = this.extractLinks(html, baseUrl);

    // Extract main structure (simplified)
    const structure = this.extractStructure(html);

    // Extract semantic landmarks
    const landmarks = this.extractLandmarks(html);

    return {
      title,
      description,
      structure,
      forms,
      links,
      landmarks,
    };
  }

  /**
   * Extract page title.
   */
  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract meta description.
   */
  private extractMetaDescription(html: string): string | undefined {
    const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract forms with inputs.
   */
  private extractForms(html: string, baseUrl: string): FormInfo[] {
    const forms: FormInfo[] = [];
    const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
    let formMatch;

    while ((formMatch = formRegex.exec(html)) !== null) {
      const formHtml = formMatch[0];
      const formContent = formMatch[1];

      // Extract form attributes
      const idMatch = formHtml.match(/id=["']([^"']+)["']/i);
      const nameMatch = formHtml.match(/name=["']([^"']+)["']/i);
      const actionMatch = formHtml.match(/action=["']([^"']+)["']/i);
      const methodMatch = formHtml.match(/method=["']([^"']+)["']/i);

      // Extract inputs
      const inputs: FormInfo['inputs'] = [];
      const inputRegex = /<input[^>]*>/gi;
      let inputMatch;

      while ((inputMatch = inputRegex.exec(formContent)) !== null) {
        const inputHtml = inputMatch[0];
        const nameMatch = inputHtml.match(/name=["']([^"']+)["']/i);
        const typeMatch = inputHtml.match(/type=["']([^"']+)["']/i);
        const requiredMatch = inputHtml.match(/required/i);

        if (nameMatch) {
          inputs.push({
            name: nameMatch[1],
            type: typeMatch ? typeMatch[1] : 'text',
            required: !!requiredMatch,
          });
        }
      }

      // Also extract select and textarea
      const selectRegex = /<select[^>]*name=["']([^"']+)["'][^>]*>/gi;
      let selectMatch;
      while ((selectMatch = selectRegex.exec(formContent)) !== null) {
        inputs.push({
          name: selectMatch[1],
          type: 'select',
        });
      }

      const textareaRegex = /<textarea[^>]*name=["']([^"']+)["'][^>]*>/gi;
      let textareaMatch;
      while ((textareaMatch = textareaRegex.exec(formContent)) !== null) {
        inputs.push({
          name: textareaMatch[1],
          type: 'textarea',
        });
      }

      if (inputs.length > 0) {
        forms.push({
          id: idMatch?.[1] || nameMatch?.[1],
          action: actionMatch ? this.normalizeUrl(actionMatch[1], baseUrl) : undefined,
          method: methodMatch?.[1]?.toUpperCase() || 'GET',
          inputs,
        });
      }
    }

    return forms;
  }

  /**
   * Extract links with URL patterns.
   */
  private extractLinks(html: string, baseUrl: string): LinkInfo[] {
    const links: LinkInfo[] = [];
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
    const seen = new Set<string>();
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];

      // Skip anchors, javascript, mailto, tel
      if (href.startsWith('#') || href.startsWith('javascript:') ||
          href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      const normalizedUrl = this.normalizeUrl(href, baseUrl);
      const urlPattern = this.extractUrlPattern(normalizedUrl);

      if (!seen.has(urlPattern)) {
        seen.add(urlPattern);

        const baseUrlObj = new URL(baseUrl);
        const linkUrlObj = new URL(normalizedUrl);
        const isExternal = linkUrlObj.hostname !== baseUrlObj.hostname;

        links.push({
          type: isExternal ? 'external' : 'navigation',
          href: urlPattern,
        });
      }
    }

    return links;
  }

  /**
   * Extract simplified structure (just main landmarks).
   */
  private extractStructure(html: string): DomElement {
    // For now, just return a simplified structure
    // In a full implementation, we'd use a proper HTML parser
    return {
      tag: 'html',
      children: [
        { tag: 'head' },
        { tag: 'body' },
      ],
    };
  }

  /**
   * Extract semantic landmarks (nav, main, aside, footer).
   */
  private extractLandmarks(html: string): Record<string, DomElement> {
    const landmarks: Record<string, DomElement> = {};
    const landmarkTags = ['nav', 'main', 'aside', 'footer', 'header'];

    for (const tag of landmarkTags) {
      const regex = new RegExp(`<${tag}[^>]*>`, 'i');
      if (regex.test(html)) {
        landmarks[tag] = { tag };
      }
    }

    return landmarks;
  }

  /**
   * Normalize URL (resolve relative URLs).
   */
  private normalizeUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Extract URL pattern (replace dynamic segments).
   */
  private extractUrlPattern(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Replace numeric IDs with {id}
      let pattern = pathname.replace(/\/\d+/g, '/{id}');

      // Replace UUIDs with {uuid}
      pattern = pattern.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/{uuid}');

      return urlObj.origin + pattern;
    } catch {
      return url;
    }
  }

  /**
   * Serialize skeleton to compact JSON string for AI consumption.
   */
  serializeForAI(skeleton: DomSkeleton): string {
    return JSON.stringify({
      title: skeleton.title,
      description: skeleton.description,
      forms: skeleton.forms.map(f => ({
        id: f.id,
        action: f.action,
        method: f.method,
        inputs: f.inputs.map(i => `${i.name}:${i.type}${i.required ? '*' : ''}`),
      })),
      links: skeleton.links.map(l => ({
        type: l.type,
        href: l.href,
      })),
      landmarks: Object.keys(skeleton.landmarks),
    }, null, 2);
  }
}
