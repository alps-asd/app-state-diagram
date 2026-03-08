# Semantic First Design — Reuniting Meaning and Presentation in the Age of AI

## The Lost Promise of Separation

In the mid-1990s, the W3C established a foundational principle: **separate content from presentation**. HTML would carry meaning; CSS would carry design. The two would evolve independently.

[CSS Zen Garden](http://www.csszengarden.com/) (2003) proved it was possible. The same HTML, radically different designs — hundreds of them — all achieved by swapping a single stylesheet. It was a triumph of the principle.

But practice drifted. Bootstrap introduced `.col-md-6` and `.btn-primary`. BEM gave us `.block__element--modifier`. And then Tailwind's utility-first approach moved design entirely back into HTML:

```html
<article class="px-4 py-2 bg-blue-500 rounded-lg shadow-sm text-white font-medium">
```

The `class` attribute became CSS's servant, not content's identifier. The 30-year-old principle was forgotten, not disproven.

## Microformats and the Semantic Class

Microformats (2004) showed another path. `class="h-card"`, `class="p-name"` — class as semantic marker. These names described *what the data was*, not how it looked.

Schema.org continued with Microdata (`itemprop="name"`), but left `class` to designers. The semantic web and the visual web diverged into parallel tracks.

These approaches were partial. They had no formal contract binding class names to a profile definition. No machine-discoverable schema that said: "these are ALL the semantic terms this document uses, and here is what each one means."

## ALPS and the Semantic Contract

[ALPS](http://alps.io/) (Application-Level Profile Semantics) provides that formal contract. Per [§2.3.1 of the specification](http://alps.io/spec/alps/spec.html), descriptor IDs map directly to HTML `class` attributes.

An ALPS profile defines three layers that become visible in HTML:

**Ontology** — what the data IS:

```html
<h3 class="title">The Art of Programming</h3>
<p class="author">Jane Smith</p>
<p class="price">¥2,480</p>
```

**Taxonomy** — how things are organized:

```html
<article class="Book">
  <!-- contains title, author, price... -->
</article>
```

**Choreography** — what actions are possible:

```html
<a class="goToBookDetails" href="book.html?id=BK-001">View Details</a>
<form class="doAddToCart" method="post" action="shoppingcart.html">
```

The HTML declares its semantic contract in the `<head>`:

```html
<link rel="profile" href="../profile/alps.xml">
```

Unlike Microformats or Schema.org, ALPS provides a formal, machine-discoverable profile that covers vocabulary, structure, AND transitions — the complete application semantics.

## The Practice: Zero Presentation Classes

Here is what this looks like in practice. Consider a book listing:

**Before** — utility-class-laden HTML:

```html
<article class="Book bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
  <h3 class="title text-lg font-semibold text-gray-900 mb-1">The Art of Programming</h3>
  <p class="author text-sm text-gray-500 font-light mb-3">Jane Smith</p>
  <p class="price text-sm text-gray-700 font-medium tracking-wide">¥2,480</p>
  <a href="book.html?id=BK-001" class="goToBookDetails mt-4 inline-block text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300">View Details</a>
</article>
```

**After** — ALPS-only HTML:

```html
<article class="Book">
  <h3 class="title">The Art of Programming</h3>
  <p class="author">Jane Smith</p>
  <p class="price">¥2,480</p>
  <a href="book.html?id=BK-001" class="goToBookDetails">View Details</a>
</article>
```

Every class in the HTML is an ALPS descriptor ID — nothing else. No `bg-white`, no `rounded-lg`, no `text-sm`. The HTML carries only meaning.

CSS targets these semantic classes as selectors:

```css
.Book .title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.Book .author {
  font-size: 0.875rem;
  color: var(--brand-400);
  font-weight: 300;
}

.Book .goToBookDetails {
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  border-bottom: 1px solid var(--brand-300);
}
```

Layout uses structural selectors rather than presentation classes:

```css
/* Not: .book-grid { display: grid; } */
.Catalog > div {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
```

The cost: CSS selectors are slightly longer. The gain: HTML becomes a stable semantic document that any machine — browser, screen reader, AI agent, or API client — can understand without parsing CSS class heuristics. A screen reader navigating `.Book > .title` encounters meaning directly; no `aria-label` hacks needed to compensate for `<div class="flex items-center gap-2">`.

## CSS-Only Fidelity Switching

With zero presentation classes in HTML, something remarkable becomes possible: **CSS-only fidelity switching**. Three CSS files, one HTML:

**`level1.css`** — bare readability. A GitHub Pages-like rendering with minimal styling:

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

**`level2.css`** — wireframe. The skeleton of information architecture:

```css
section, article, aside {
  border: 1px dashed #ddd;
  padding: 1rem;
  margin: 0.75rem 0;
}
```

**`level3.css`** — production quality. A polished bookstore with custom typography, warm color palette, and refined spacing:

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

To switch fidelity, change one attribute in the `<link>` tag:

```html
<!-- Wireframe -->
<link rel="stylesheet" href="../css/level2.css">

<!-- Production -->
<link rel="stylesheet" href="../css/level3.css">
```

HTML untouched. Or use the `mock-switch` CLI:

```bash
./mock-switch 3 /tmp/mock   # Switch all HTML files to level3.css
```

```bash
#!/bin/bash
# mock-switch — Switch mock fidelity level
level=$1
dir=${2:-.}
for f in "$dir"/html/*.html; do
  sed -i '' "s|level[0-9]\.css|level${level}.css|g" "$f"
done
```

This is CSS Zen Garden's proof, 20 years later, with a formal semantic contract backing it. The same HTML renders as a bare document, a structural wireframe, or a polished storefront — because the HTML never carried design to begin with.

## The Wireframe as Profile Browser

The most surprising discovery: **`level2.css` becomes a visual ALPS browser**.

The key technique — a single CSS rule that reveals ALPS descriptor IDs on hover:

```css
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
```

Hover over any element and a tooltip appears: `.Book`, `.title`, `.goToBookDetails`, `.doAddToCart`. The ALPS vocabulary becomes *visible* in the browser.

Dashed borders visualize block boundaries. X-box placeholders mark image positions:

```css
/* Block structure */
section, article, aside {
  border: 1px dashed #ddd;
}

/* X-box image placeholder */
.Book > div:first-child {
  width: 80px;
  height: 100px;
  background: #eee;
  background-image:
    linear-gradient(to top right, transparent calc(50% - 1px), #ccc, transparent calc(50% + 1px)),
    linear-gradient(to top left, transparent calc(50% - 1px), #ccc, transparent calc(50% + 1px));
  font-size: 0;
}
```

`.Category` containing `.Book` articles — the nested semantic structure appears on mouseover. Designers see the skeleton of information architecture before adding any visual design. This is the bridge between information design and visual design.

## Why Skeletons Matter When AI Generates Infinitely

AI can generate unlimited UI variations — beautiful, polished, pixel-perfect. Give it a prompt and it will produce a stunning bookstore in seconds.

But without a skeleton, AI generates from imagination, not from architecture.

The semantic HTML IS the skeleton: it defines what exists, what relates to what, what actions are possible. Consider the catalog page:

```html
<main>
  <h1 class="Catalog">The Collection</h1>

  <form method="get" action="catalog.html" class="goSearchBooks">
    <input type="text" name="query" class="query" placeholder="Search…">
    <button type="submit">Search</button>
  </form>

  <nav>
    <a href="category.html?id=CAT-001" class="goToCategory">Programming</a>
    <a href="category.html?id=CAT-002" class="goToCategory">Software Design</a>
  </nav>

  <div>
    <article class="Book">
      <h3 class="title">The Art of Programming</h3>
      <p class="author">Jane Smith</p>
      <p class="price">¥2,480</p>
      <a href="book.html?id=BK-001" class="goToBookDetails">View Details</a>
    </article>
  </div>
</main>
```

This HTML is generated from the ALPS profile. Every class, every structure, every link target corresponds to a descriptor in the profile. AI fills in the flesh (CSS), but the bones (HTML + ALPS) come from human design decisions.

The level 2 wireframe makes this skeleton visible and reviewable *before* any flesh is added. The ALPS profile is the blueprint; the semantic HTML is the frame; CSS is the finish.

## Accessibility as a Natural Consequence

We noted earlier that screen readers benefit from semantic classes. This deserves deeper examination, because the implications go beyond convenience.

When HTML contains only semantic meaning, accessibility isn't an afterthought bolted on with ARIA — it's a structural property of the document itself. Screen readers encounter `.Book > .title`, `.price`, `.doAddToCart` — a complete, navigable information architecture, not a maze of layout primitives.

The ALPS profile doubles as an accessibility specification: it defines what every element means, what actions are available, and how states connect.

```html
<!-- Meaningless to assistive technology -->
<div class="flex items-center gap-2">
  <div class="text-sm font-medium text-gray-900">The Art of Programming</div>
  <div class="text-xs text-gray-500">Jane Smith</div>
</div>

<!-- Self-documenting -->
<article class="Book">
  <h3 class="title">The Art of Programming</h3>
  <p class="author">Jane Smith</p>
</article>
```

Semantic HTML + structural CSS = the most screen-reader-friendly architecture possible. What's good for machines reading meaning is good for assistive technology reading meaning.

## The Stability of Meaning, The Flexibility of Design

Domain semantics change slowly. "Book", "Author", "Price" endure across redesigns. These concepts are stable because they reflect the problem domain, not the current design trend.

Design changes fast. Colors, typography, layout shift with trends, A/B tests, and brand refreshes. Last year's rounded corners become this year's sharp edges.

Semantic First puts the stable thing (meaning) in HTML and the volatile thing (design) in CSS. This is not just separation of concerns — it's **separation by rate of change**.

Redesign = new CSS file. HTML untouched. ALPS contract honored.

The same HTML serves:
- Wireframe reviews (level 2)
- Design iterations (level 3, 3b, 3c...)
- Production deploy
- AI consumption (semantic classes are machine-readable)
- Accessibility audits (structure is self-documenting)
- API responses (the same semantics drive hypermedia APIs)

## Conclusion: Back to the Future

The W3C's 30-year-old principle was right: separate content from presentation.

CSS Zen Garden proved it was possible. Microformats showed `class` could carry meaning. ALPS formalized the semantic contract with a machine-discoverable profile that binds vocabulary to structure to transitions.

AI makes the skeleton essential. Without it, generation is untethered — beautiful but architecturally arbitrary. With an ALPS profile backing the HTML, AI generates *within* the semantic contract, producing CSS that respects the information architecture rather than inventing its own.

Accessibility makes it ethical. Semantic HTML serves everyone — sighted users, screen reader users, and machines alike.

Semantic First Design isn't new. It's the original web, rediscovered with better tools.

---

*The examples in this article are generated from an [ALPS profile](http://alps.io/) for a bookstore application. The HTML, CSS, and profile are available at [app-state-diagram](https://github.com/alps-asd/app-state-diagram).*
