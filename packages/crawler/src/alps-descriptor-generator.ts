/**
 * ALPS Descriptor Generator
 *
 * Generates ALPS descriptors from DOM skeleton using AI analysis.
 * Strategy 3: Convert DOM structure → ALPS semantics.
 *
 * This module provides the AI prompt and result parsing logic.
 */

import { DomSkeleton } from './dom-skeleton-extractor.js';
import { AlpsDescriptor } from './types.js';

export interface PageDescriptors {
  /** Page state descriptor */
  state: AlpsDescriptor;
  /** Semantic fields used in this page */
  semantics: AlpsDescriptor[];
  /** Transitions available from this page */
  transitions: AlpsDescriptor[];
}

/**
 * System prompt for AI to extract ALPS descriptors from DOM skeleton.
 */
export const ALPS_EXTRACTION_PROMPT = `You are an ALPS (Application-Level Profile Semantics) expert analyzing web page structures.

Your task: Analyze the provided DOM skeleton and extract ALPS descriptors.

## Input Format
You will receive a JSON object with:
- title: Page title
- description: Meta description
- forms: Array of forms with inputs
- links: Array of links (navigation/action)
- landmarks: Semantic HTML5 elements (nav, main, etc.)

## Output Format
Return a JSON object with:

{
  "state": {
    "id": "PageName",
    "title": "Human-readable page name",
    "doc": {"value": "What user sees on this page"},
    "tag": "domain-xxx flow-yyy"
  },
  "semantics": [
    {
      "id": "fieldName",
      "title": "Field Title",
      "def": "https://schema.org/PropertyName",
      "doc": {"value": "Field description, format, validation rules"}
    }
  ],
  "transitions": [
    {
      "id": "goTargetPage",
      "type": "safe",
      "rt": "#TargetPage",
      "title": "Navigate to target",
      "tag": "domain-xxx flow-yyy",
      "doc": {"value": "What this action does"},
      "descriptor": [{"href": "#requiredField"}]
    },
    {
      "id": "doSubmitForm",
      "type": "unsafe",
      "rt": "#ResultPage",
      "title": "Submit form",
      "tag": "domain-xxx flow-yyy",
      "doc": {"value": "Creates new resource"},
      "descriptor": [{"href": "#field1"}, {"href": "#field2"}]
    }
  ]
}

## Analysis Guidelines

### 1. State Identification (Page Role)
- Use PascalCase (e.g., "ProductList", "UserProfile")
- Derive from page title, URL pattern, and content structure
- State represents "what the user sees"

### 2. Semantic Fields (Data Elements)
- Extract from form inputs (name, type, required)
- Use camelCase (e.g., "userId", "productName")
- Add schema.org links when applicable (def)
- Document validation rules, formats in doc.value

### 3. Transition Extraction

**From Links (safe transitions):**
- Prefix: "go" (e.g., "goProductDetail")
- Type: "safe" (GET operations)
- Infer target state from link href pattern
- Must include target state name in id (goProductList → rt: "#ProductList")

**From Forms (unsafe/idempotent transitions):**
- Prefix: "do" (e.g., "doCreateUser", "doUpdateProfile")
- Type: "unsafe" for POST (create), "idempotent" for PUT/DELETE (update/delete)
- Determine type from:
  - Method: POST → unsafe, PUT/PATCH/DELETE → idempotent
  - Button text: "Create/Add/Submit" → unsafe, "Update/Edit/Save" → idempotent, "Delete/Remove" → idempotent
  - Form action: "/create" → unsafe, "/update" or "/edit" → idempotent
- List required fields in descriptor array

### 4. Semantic Inference

**Flow tags** (user journey):
- Purchase: flow-purchase
- Consultation: flow-consult
- Registration: flow-register
- Search: flow-search
- Cancellation: flow-cancel

**Domain tags** (technical area):
- domain-search, domain-cart, domain-payment, domain-auth, domain-profile, etc.

### 5. Special Cases

**Navigation links:**
- Home, back, cancel → safe transitions to known states

**Action buttons:**
- "Add to cart", "Buy now" → unsafe transitions
- "Update", "Save changes" → idempotent transitions
- "Delete", "Remove" → idempotent transitions

**External links:**
- Skip external domain links (type: "external")
- Focus on same-domain navigation only

## Example

Input:
\`\`\`json
{
  "title": "Product Details - iPhone 15",
  "description": "View product details and add to cart",
  "forms": [{
    "id": "add-to-cart-form",
    "action": "/cart/add",
    "method": "POST",
    "inputs": ["productId:hidden*", "quantity:number*", "variant:select"]
  }],
  "links": [
    {"type": "navigation", "href": "/products"},
    {"type": "navigation", "href": "/cart"}
  ],
  "landmarks": ["nav", "main", "footer"]
}
\`\`\`

Output:
\`\`\`json
{
  "state": {
    "id": "ProductDetail",
    "title": "Product Detail Page",
    "doc": {"value": "Displays detailed information about a single product. User can select variants and add to cart."},
    "tag": "domain-product flow-purchase"
  },
  "semantics": [
    {
      "id": "productId",
      "title": "Product ID",
      "def": "https://schema.org/identifier",
      "doc": {"value": "Unique product identifier. Required for cart operations."}
    },
    {
      "id": "quantity",
      "title": "Quantity",
      "def": "https://schema.org/quantity",
      "doc": {"value": "Number of items to add. Minimum: 1, Maximum: 99."}
    },
    {
      "id": "variant",
      "title": "Product Variant",
      "doc": {"value": "Selected product variant (e.g., color, size). Format: variant ID."}
    }
  ],
  "transitions": [
    {
      "id": "goProductList",
      "type": "safe",
      "rt": "#ProductList",
      "title": "Go to Product List",
      "tag": "domain-product flow-purchase",
      "doc": {"value": "Navigate back to product listing page."}
    },
    {
      "id": "goCart",
      "type": "safe",
      "rt": "#Cart",
      "title": "Go to Cart",
      "tag": "domain-cart flow-purchase",
      "doc": {"value": "Navigate to shopping cart page."}
    },
    {
      "id": "doAddToCart",
      "type": "unsafe",
      "rt": "#Cart",
      "title": "Add to Cart",
      "tag": "domain-cart flow-purchase",
      "doc": {"value": "Add product to shopping cart. Creates new cart item or increments quantity if already exists."},
      "descriptor": [
        {"href": "#productId"},
        {"href": "#quantity"},
        {"href": "#variant"}
      ]
    }
  ]
}
\`\`\`

## Important Rules

1. **Be conservative**: Only extract what's clearly visible in the DOM skeleton
2. **Consistent naming**: Follow ALPS conventions strictly
3. **No hallucination**: Don't invent fields or transitions not present in input
4. **Safe transition naming**: MUST include target state name (goProductList → rt: "#ProductList")
5. **Schema.org links**: Use when field maps to standard vocabulary
6. **Tag everything**: Add domain and flow tags to states and transitions

Return only the JSON object, no additional text.`;

/**
 * Parse AI response into PageDescriptors.
 */
export function parseAIResponse(aiResponse: string): PageDescriptors {
  // Remove markdown code blocks if present
  let jsonStr = aiResponse.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  const parsed = JSON.parse(jsonStr);

  return {
    state: parsed.state,
    semantics: parsed.semantics || [],
    transitions: parsed.transitions || [],
  };
}

/**
 * Generate AI prompt from DOM skeleton.
 */
export function generatePrompt(skeleton: DomSkeleton, urlPattern: string): string {
  const skeletonJson = JSON.stringify({
    title: skeleton.title,
    description: skeleton.description,
    urlPattern,
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

  return `${ALPS_EXTRACTION_PROMPT}

## Input DOM Skeleton

\`\`\`json
${skeletonJson}
\`\`\`

Analyze this page and extract ALPS descriptors.`;
}

/**
 * ALPS Descriptor Generator (AI-powered).
 */
export class AlpsDescriptorGenerator {
  /**
   * Generate ALPS descriptors from DOM skeleton.
   *
   * @param skeleton - DOM skeleton extracted from HTML
   * @param urlPattern - URL pattern for this page type
   * @param callAI - Function to call AI with a prompt and get response
   * @returns PageDescriptors containing state, semantics, and transitions
   */
  async generate(
    skeleton: DomSkeleton,
    urlPattern: string,
    callAI: (prompt: string) => Promise<string>
  ): Promise<PageDescriptors> {
    const prompt = generatePrompt(skeleton, urlPattern);
    const aiResponse = await callAI(prompt);
    return parseAIResponse(aiResponse);
  }
}
