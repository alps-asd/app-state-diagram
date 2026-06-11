# ALPS Tag Vocabulary

A convention for making ALPS tags dereferenceable: every tag used in a
profile is defined in one HTML document that both humans and machines can
read.

## Motivation

ALPS descriptors point at shared meaning through `def` — a `title` field
referencing `https://schema.org/title` is not just a string, it is an
identifier you can dereference and read. Tags deserve the same treatment.
A profile's space-separated `tag` attributes form a faceted taxonomy
(`flow-customer-purchase`, `actor-admin`, `checkout`), but each tag is an
opaque string: a typo like `flow-purchace` silently creates a new category,
and nothing explains what `flow-customer-purchase` actually promises.

The fix is a vocabulary file. Each tag becomes a URI fragment in one HTML
document — `tags.html#flow-customer-purchase` — which serves as:

- **Documentation** for humans: open it in a browser, read the definitions.
- **Ground truth** for tooling: validators flag tags that are not defined,
  and listings join usage with definitions.

## The vocabulary file

`tags.html` lives next to the profile and is linked from it:

```json
{
  "alps": {
    "link": [{ "rel": "tag", "href": "tags.html" }]
  }
}
```

Profiles may equivalently announce the vocabulary with an ALPS `ext`
element (`{"ext": [{"id": "tag-vocabulary", "href": "tags.html"}]}`) when a
link relation is impractical.

## HTML structure

Each facet is a `<section data-facet="...">` containing a definition list.
Each tag is a `<dt>` whose `id` is the tag value, followed by a `<dd>`
description:

```html
<section data-facet="flow">
  <dl>
    <dt id="flow-customer-purchase"
        data-actor="customer"
        data-spans="feature-browse feature-purchase">Customer purchase</dt>
    <dd>
      A customer finds a product, adds it to the cart, and completes an order.
      <p data-role="goal">The order confirmation state is reached and the
      order is recorded.</p>
      <p data-role="evidence">Order appears in the customer's history.</p>
    </dd>
  </dl>
</section>
```

Conventions:

- **`id` on `<dt>`**: the `id` attribute of each `<dt>` is the tag value.
  Tooling treats *only* `<dt>` ids as tag definitions, so keep ids for other
  purposes off `<dt>` elements. Tag values become URI fragments:
  `tags.html#flow-customer-purchase`.
- **`<dt>` text content** is the tag's human-readable title.
- **Data attributes** carry machine-readable relations: flows declare their
  `data-actor` and the features they span via `data-spans` (space-separated
  tag values).
- **Flow descriptions** may carry `<p data-role="goal">` (the semantic
  postcondition that makes the flow count as completed) and
  `<p data-role="evidence">` (how completion is observed).

## Facet prefix registry

| Prefix | Facet | Meaning | Example |
|--------|-------|---------|---------|
| `actor-` | actor | Who performs the behavior | `actor-customer` |
| `flow-` | flow | A business journey with a goal condition | `flow-customer-purchase` |
| `feature-` | feature | Feature area / coverage bucket | `feature-purchase` |
| `src-` | src | Information source the descriptor was derived from | `src-entity` |
| `page-` | page | HTML screen classification | `page-list` |
| (none) | domain | Domain vocabulary | `checkout`, `catalog` |

## Complete example

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Store Tag Vocabulary</title></head>
<body>
  <h1>Store Tag Vocabulary</h1>
  <section data-facet="actor">
    <dl>
      <dt id="actor-customer">Customer</dt>
      <dd>A shopper using the storefront.</dd>
    </dl>
  </section>
  <section data-facet="flow">
    <dl>
      <dt id="flow-customer-purchase" data-actor="customer"
          data-spans="feature-browse feature-purchase">Customer purchase</dt>
      <dd>A customer finds a product and completes an order.
        <p data-role="goal">Order confirmation reached; order recorded.</p>
      </dd>
    </dl>
  </section>
  <section data-facet="feature">
    <dl>
      <dt id="feature-browse">Browse</dt><dd>Product discovery screens.</dd>
      <dt id="feature-purchase">Purchase</dt><dd>Cart and checkout.</dd>
    </dl>
  </section>
  <section data-facet="domain">
    <dl>
      <dt id="checkout">Checkout</dt><dd>Order placement vocabulary.</dd>
    </dl>
  </section>
</body>
</html>
```

## Tooling

The MCP server consumes the vocabulary file:

- **`validate_alps`** with `vocabulary: "tags.html"` checks every tag used
  in the profile against the `<dt>` ids. Tags not defined in the vocabulary
  are reported as `W005` warnings ("Unknown tag ..."), and tags defined but
  never used are listed informationally — so typos surface instead of
  silently creating new categories.
- **`alps_tags`** lists the tags in use, grouped by facet with usage counts;
  given `vocabulary`, each tag is joined with its definition (`defined`,
  `title`).
