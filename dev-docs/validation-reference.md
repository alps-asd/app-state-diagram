# ALPS Validation Reference

This document describes all validation codes used by the ALPS validator.

## Errors (E-codes)

Errors indicate problems that must be fixed for the ALPS profile to be valid.

### E001: Missing id or href

**Message:** `Descriptor must have either id or href`

**Cause:** A descriptor element lacks both `id` and `href` attributes.

**Solution:** Add either an `id` (for definitions) or `href` (for references).

```json
// Invalid
{ "type": "semantic" }

// Valid - with id
{ "id": "userName", "type": "semantic" }

// Valid - with href
{ "href": "#userName" }
```

### E002: Missing rt for transition

**Message:** `Missing rt (return type) for {type} transition`

**Cause:** A transition descriptor (`safe`, `unsafe`, or `idempotent`) is missing the `rt` attribute.

**Solution:** Add an `rt` attribute pointing to the target state.

```json
// Invalid
{ "id": "goHome", "type": "safe" }

// Valid
{ "id": "goHome", "type": "safe", "rt": "#HomePage" }
```

### E003: Invalid type value

**Message:** `Invalid type value: {value}. Must be one of: semantic, safe, unsafe, idempotent`

**Cause:** The `type` attribute has an invalid value.

**Solution:** Use one of the valid types: `semantic`, `safe`, `unsafe`, or `idempotent`.

```json
// Invalid
{ "id": "doSubmit", "type": "action" }

// Valid
{ "id": "doSubmit", "type": "unsafe", "rt": "#Result" }
```

### E004: Broken reference

**Message:** `Broken reference: {ref} does not exist`

**Cause:** An `href` or `rt` attribute references a descriptor ID that doesn't exist.

**Solution:** Ensure the referenced descriptor is defined, or fix the reference.

```json
// Invalid - #UserProfile doesn't exist
{ "id": "goProfile", "type": "safe", "rt": "#UserProfile" }

// Valid - #UserProfile is defined
{
  "descriptor": [
    { "id": "UserProfile", "type": "semantic" },
    { "id": "goProfile", "type": "safe", "rt": "#UserProfile" }
  ]
}
```

### E005: Duplicate id

**Message:** `Duplicate id: {id}`

**Cause:** Multiple descriptors share the same `id` value.

**Solution:** Ensure each descriptor has a unique `id`.

```json
// Invalid
{
  "descriptor": [
    { "id": "name", "type": "semantic" },
    { "id": "name", "type": "semantic" }
  ]
}

// Valid
{
  "descriptor": [
    { "id": "userName", "type": "semantic" },
    { "id": "productName", "type": "semantic" }
  ]
}
```

### E008: Missing alps property

**Message:** `Missing alps property`

**Cause:** The root document is missing the `alps` property.

**Solution:** Wrap your profile in an `alps` object.

```json
// Invalid
{ "descriptor": [...] }

// Valid
{ "alps": { "descriptor": [...] } }
```

### E009: Missing descriptor array

**Message:** `Missing descriptor array`

**Cause:** The `alps` object is missing the `descriptor` array.

**Solution:** Add a `descriptor` array containing your descriptors.

```json
// Invalid
{ "alps": { "title": "My API" } }

// Valid
{ "alps": { "title": "My API", "descriptor": [...] } }
```

### E011: Tag must be string

**Message:** `Tag must be a space-separated string, not an array`

**Cause:** The `tag` attribute is an array instead of a string.

**Solution:** Use a space-separated string for tags.

```json
// Invalid
{ "id": "userId", "tag": ["ontology", "identifier"] }

// Valid
{ "id": "userId", "tag": "ontology identifier" }
```

## Warnings (W-codes)

Warnings indicate potential issues or deviations from best practices.

### W001: Missing title

**Message:** `Missing title attribute in ALPS document`

**Cause:** The ALPS document lacks a `title` attribute.

**Solution:** Add a `title` to describe your API.

```json
// Triggers warning
{ "alps": { "descriptor": [...] } }

// No warning
{ "alps": { "title": "User Management API", "descriptor": [...] } }
```

### W002: Safe transition naming

**Message:** `Safe transition "{id}" should start with "go"`

**Cause:** A `safe` transition doesn't follow the `goXxx` naming convention.

**Solution:** Rename the transition to start with `go`.

```json
// Triggers warning
{ "id": "viewProduct", "type": "safe", "rt": "#Product" }

// No warning
{ "id": "goProduct", "type": "safe", "rt": "#Product" }
```

### W003: Unsafe/idempotent transition naming

**Message:** `{type} transition "{id}" should start with "do"`

**Cause:** An `unsafe` or `idempotent` transition doesn't follow the `doXxx` naming convention.

**Solution:** Rename the transition to start with `do`.

```json
// Triggers warning
{ "id": "submitOrder", "type": "unsafe", "rt": "#Confirmation" }

// No warning
{ "id": "doSubmitOrder", "type": "unsafe", "rt": "#Confirmation" }
```

## Suggestions (S-codes)

Suggestions are optional improvements to enhance your ALPS profile.

### S001: Missing doc for transition

**Message:** `Consider adding doc to transition "{id}"`

**Cause:** A transition descriptor lacks documentation.

**Solution:** Add a `doc` element to describe the transition's purpose.

```json
// Triggers suggestion
{ "id": "goCheckout", "type": "safe", "rt": "#Checkout" }

// No suggestion
{
  "id": "goCheckout",
  "type": "safe",
  "rt": "#Checkout",
  "doc": { "value": "Navigate to the checkout page" }
}
```

## Summary Table

| Code | Severity | Description |
|------|----------|-------------|
| E001 | Error | Missing id or href |
| E002 | Error | Missing rt for transition |
| E003 | Error | Invalid type value |
| E004 | Error | Broken reference |
| E005 | Error | Duplicate id |
| E008 | Error | Missing alps property |
| E009 | Error | Missing descriptor array |
| E011 | Error | Tag must be string |
| W001 | Warning | Missing title |
| W002 | Warning | Safe transition should start with "go" |
| W003 | Warning | Unsafe/idempotent should start with "do" |
| S001 | Suggestion | Consider adding doc to transition |
