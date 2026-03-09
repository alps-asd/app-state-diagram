---
name: alps2mock
description: Generate multi-fidelity HTML mock from ALPS profile. Creates semantic HTML pages, three CSS fidelity levels, mock API responses, and i18n labels — all from a single ALPS profile.
---

# ALPS to Mock Generator

Generate a complete HTML mock site from an ALPS profile. Every CSS class in the generated HTML is an ALPS descriptor ID — zero presentation classes. This enables CSS-only fidelity switching between bare HTML, wireframe, and production quality.

## When to Use

- User asks to generate a mock, prototype, or wireframe from an ALPS profile
- User says "alps2mock", "generate mock", "create wireframe", "mock from alps"
- User wants to visualize ALPS states as browsable HTML pages
- User wants to review information architecture before visual design

## What It Generates

From a single ALPS profile, generate the following directory structure:

```
{output-dir}/
├── profile/
│   └── alps.xml              # Copy of source ALPS profile
├── html/
│   ├── index.html            # Home state
│   ├── catalog.html          # One HTML per ALPS state
│   └── ...
├── css/
│   ├── level1.css            # Bare readability
│   ├── level2.css            # Wireframe (information skeleton)
│   └── level3.css            # Production quality
├── api/
│   ├── home.json             # HAL+JSON mock response per state
│   └── ...
├── i18n/
│   └── labels.json           # ALPS descriptor ID → human label mapping
└── mock-switch               # Shell script to switch CSS fidelity
```

## Core Principle: Semantic First HTML

**Every `class` attribute in the generated HTML MUST be an ALPS descriptor ID.** No presentation classes (`bg-white`, `rounded-lg`, `flex`, `text-sm`, etc.) are allowed in HTML.

Three layers of ALPS become CSS classes:

| Layer | Example classes | Source |
|-------|----------------|--------|
| Ontology | `.title`, `.author`, `.price` | Semantic descriptors |
| Taxonomy | `.Book`, `.Catalog`, `.ShoppingCart` | State descriptors |
| Choreography | `.goToBookDetails`, `.doAddToCart` | Transition descriptors |

### HTML Generation Rules

1. **One HTML file per ALPS state** (Taxonomy descriptor with nested descriptors)
2. **`<link rel="profile" href="../profile/alps.xml">`** in every `<head>`
3. **`<link rel="stylesheet" href="../css/level2.css">`** as default stylesheet
4. **Semantic HTML elements**: `<article>` for entities, `<form>` for unsafe/idempotent transitions, `<a>` for safe transitions, `<nav>` for navigation groups
5. **ALPS `title` attribute** maps to HTML `title` attribute on links and buttons
6. **ALPS `doc` value** is NOT rendered in HTML — it's for developers, not end users
7. **Placeholder content**: Use realistic sample data (not "Lorem ipsum")

### Example: Book Detail Page

Given this ALPS taxonomy:

```xml
<descriptor id="Book" title="Book">
    <descriptor href="#id"/>
    <descriptor href="#title"/>
    <descriptor href="#author"/>
    <descriptor href="#isbn"/>
    <descriptor href="#price"/>
    <descriptor href="#doAddToCart"/>
    <descriptor href="#goToCatalog"/>
</descriptor>
```

Generate (partial example — only showing the Book state; other states like ShoppingCart and their descriptors like `goToCart`, `category`, `quantity` are defined elsewhere in the full profile):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book - ALPS Book Store</title>
  <link rel="profile" href="../profile/alps.xml">
  <link rel="stylesheet" href="../css/level2.css">
</head>
<body>
  <header>
    <div>
      <a href="index.html">ALPS Book Store</a>
      <nav>
        <a href="catalog.html" class="goToCatalog" title="Go to Catalog">Catalog</a>
        <a href="shoppingcart.html" class="goToCart" title="Go to Cart">Cart</a>
      </nav>
    </div>
  </header>
  <main>
    <article class="Book">
      <span class="id" hidden>BK-001</span>
      <h1 class="title">The Art of Programming</h1>
      <p class="author">Jane Smith</p>
      <dl>
        <div><dt>ISBN</dt><dd class="isbn">978-4-1234-5678-9</dd></div>
        <div><dt>Category</dt><dd class="category">Programming</dd></div>
      </dl>
      <p class="price">¥2,480</p>
      <form method="post" action="shoppingcart.html" class="doAddToCart">
        <input type="hidden" name="id" value="BK-001" class="id">
        <label for="quantity">Qty</label>
        <input type="number" id="quantity" name="quantity" min="1" value="1" class="quantity">
        <button type="submit" title="Add to Cart">Add to Cart</button>
      </form>
    </article>
  </main>
  <footer>
    <div>Mock generated from ALPS profile: ALPS Book Store</div>
  </footer>
</body>
</html>
```

Key points:
- `class="Book"`, `class="title"`, `class="doAddToCart"` — all ALPS descriptor IDs
- `<form>` for `doAddToCart` (unsafe transition) with nested descriptors as form fields
- `<a>` for `goToCatalog` (safe transition)
- Realistic sample data, not placeholder text

## CSS Fidelity Levels

### level1.css — Bare Readability

Minimal styling for raw HTML readability. No layout, no branding. Think GitHub Pages rendering.

```css
body {
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
}
a { color: #0366d6; }
```

### level2.css — Wireframe (Information Skeleton)

The wireframe level is the most important. It makes the ALPS vocabulary visible:

```css
[class] {
  position: relative;
}

/* ALPS ID tooltip on hover */
[class]:hover::after {
  content: "." attr(class);
  position: absolute;
  top: -1.25rem;
  left: 0;
  font-size: 0.5625rem;
  font-family: 'SF Mono', Menlo, Consolas, monospace !important;
  color: #fff;
  background: #555;
  padding: 0.125rem 0.375rem;
  border-radius: 2px;
  white-space: nowrap;
  pointer-events: none;
}

/* Block structure: dashed borders */
section, article, aside {
  border: 1px dashed #ddd;
  padding: 1rem;
}

/* X-box image placeholder */
img {
  background: #eee;
  background-image:
    linear-gradient(to top right, transparent calc(50% - 1px), #ccc, transparent calc(50% + 1px)),
    linear-gradient(to top left, transparent calc(50% - 1px), #ccc, transparent calc(50% + 1px));
  min-height: 120px;
  object-position: -9999px;
}
```

Key features:
- **Hover tooltips** show ALPS descriptor IDs (`.Book`, `.title`, `.goToBookDetails`)
- **Dashed borders** around `section`, `article`, `aside` — these are the semantic blocks of the page. The dashes make the information structure visible: which elements are grouped together, how they nest, where one block ends and the next begins. This is the skeleton that disappears in production but must be right before design begins.
- **X-box placeholders** for images — crossed diagonal lines in a gray box, the universal wireframe convention for "an image goes here" without committing to content
- **No color branding** — structure only, monochrome
- **Grid layouts** use semantic selectors (`.Catalog > div`, `section > div`) not presentation classes (`.book-grid`)

### level3.css — Production Quality

Full design system with design tokens, custom typography, color palette, transitions, and responsive layout. CSS targets ALPS semantic classes:

```css
.Book .title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
}

.doAddToCart {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
```

Key requirements:
- **Design tokens** in `:root` (colors, fonts, spacing)
- **Google Fonts** import for display typography
- **Responsive breakpoints** (`@media (max-width: 768px)`)
- **Hover/focus states** with transitions
- **All selectors reference ALPS classes** — no `.btn-primary`, `.card`, `.grid` etc.

## Mock API (HAL+JSON)

Generate one JSON file per ALPS state, following HAL format:

```json
{
  "id": "BK-001",
  "title": "The Art of Programming",
  "author": "Jane Smith",
  "isbn": "978-4-1234-5678-9",
  "price": 2480,
  "category": "Programming",
  "_links": {
    "self": {"href": "/api/book/BK-001"},
    "goToCatalog": {"href": "/api/catalog", "method": "GET"},
    "doAddToCart": {"href": "/api/cart/items", "method": "POST"}
  }
}
```

Rules:
- Field names match ALPS semantic descriptor IDs
- `_links` keys match ALPS transition descriptor IDs
- Safe transitions use `"method": "GET"`
- Unsafe transitions use `"method": "POST"`
- Idempotent transitions use `"method": "PUT"` or `"method": "DELETE"`

## i18n Labels

Generate `labels.json` mapping ALPS descriptor IDs to human-readable labels:

```json
{
  "id": "ID",
  "title": "Title",
  "author": "Author",
  "price": "Price",
  "Book": "Book",
  "Catalog": "Book Catalog",
  "goToCatalog": "Go to Catalog",
  "doAddToCart": "Add to Cart"
}
```

Source: Use ALPS `title` attribute. If no title, use the descriptor `id` as-is.

## mock-switch Script

Generate a shell script that switches CSS fidelity across all HTML files:

```bash
#!/bin/bash
# mock-switch — Switch mock fidelity level
# Usage: ./mock-switch <1|2|3> [mock-dir]

level=$1
dir=${2:-.}

if [[ ! "$level" =~ ^[123]$ ]]; then
  echo "Usage: ./mock-switch <1|2|3> [mock-dir]"
  exit 1
fi

count=0
for f in "$dir"/html/*.html; do
  [ -f "$f" ] || continue
  tmp=$(mktemp)
  sed "s|level[0-9]\.css|level${level}.css|g" "$f" > "$tmp" && mv "$tmp" "$f"
  count=$((count + 1))
done

echo "Switched ${count} files to level${level}.css"
```

## Workflow

1. **Read the ALPS profile** — Parse XML or JSON
2. **Identify states** — Taxonomy descriptors with nested children
3. **Generate HTML** — One page per state, semantic classes only
4. **Generate CSS** — Three fidelity levels
5. **Generate API** — HAL+JSON per state
6. **Generate i18n** — Labels from ALPS titles
7. **Generate mock-switch** — Shell script
8. **Report** — List generated files and suggest opening in browser

## Tips

- **Start with level2.css** (wireframe) for information architecture review
- **Hover elements** in level2 to see ALPS descriptor IDs
- **Switch to level3** only after the information structure is approved
- **The HTML never changes** — all design iteration happens in CSS
- **Share the wireframe** with stakeholders before investing in visual design

## Related

- [Semantic First Design](https://alps-asd.github.io/app-state-diagram/blog/semantic-first-design.html) — The design philosophy behind this approach
- [ALPS Specification §2.3.1](http://alps.io/spec/alps/spec.html) — Descriptor ID to class mapping
- [CSS Zen Garden](http://www.csszengarden.com/) — The original proof that same HTML can have radically different designs
