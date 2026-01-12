# Validation Issues Reference

This page documents all validation errors, warnings, and suggestions reported by the ALPS validator.

## Issue types

**Errors**
- [E001](#e001) Missing id or href
- [E002](#e002) Missing rt for transition
- [E003](#e003) Invalid type value
- [E004](#e004) Broken reference
- [E005](#e005) Duplicate id
- [E008](#e008) Missing alps property
- [E009](#e009) Missing descriptor array
- [E011](#e011) Tag must be string

**Warnings**
- [W001](#w001) Missing title
- [W002](#w002) Safe transition naming
- [W003](#w003) Unsafe/idempotent transition naming
- [W004](#w004) Orphan descriptor

**Suggestions**
- [S001](#s001) Add doc to transition

---

## Errors

<a id="e001"></a>
### E001: Missing id or href

**Why:** Every descriptor must be uniquely identifiable. Either define an `id` for a new descriptor or use `href` to reference an existing one.

**How to fix:**
```diff
- { "type": "semantic" }
+ { "id": "userName", "type": "semantic" }
```

---

<a id="e002"></a>
### E002: Missing rt for transition

**Why:** Transitions (`safe`, `unsafe`, `idempotent`) must specify their return type (`rt`) to indicate which state they lead to.

**How to fix:**
```diff
- { "id": "goHome", "type": "safe" }
+ { "id": "goHome", "type": "safe", "rt": "#Home" }
```

---

<a id="e003"></a>
### E003: Invalid type value

**Why:** The `type` attribute must be one of: `semantic`, `safe`, `unsafe`, `idempotent`.

**How to fix:**
```diff
- { "id": "submit", "type": "action" }
+ { "id": "submit", "type": "unsafe" }
```

---

<a id="e004"></a>
### E004: Broken reference

**Why:** References (`href` or `rt`) starting with `#` must point to an existing descriptor id.

**How to fix:**
1. Check if the referenced id exists
2. Fix the typo or add the missing descriptor

```diff
  { "id": "goProduct", "type": "safe", "rt": "#ProductDetail" }
+ { "id": "ProductDetail" }
```

---

<a id="e005"></a>
### E005: Duplicate id

**Why:** Each descriptor id must be unique within the document.

**How to fix:**
```diff
  { "id": "name", "title": "User Name" }
- { "id": "name", "title": "Product Name" }
+ { "id": "productName", "title": "Product Name" }
```

---

<a id="e008"></a>
### E008: Missing alps property

**Why:** ALPS documents must have a root `alps` property.

**How to fix:**
```diff
- { "descriptor": [...] }
+ { "alps": { "descriptor": [...] } }
```

---

<a id="e009"></a>
### E009: Missing descriptor array

**Why:** The `alps` object must contain a `descriptor` array.

**How to fix:**
```diff
- { "alps": { "title": "My API" } }
+ { "alps": { "title": "My API", "descriptor": [] } }
```

---

<a id="e011"></a>
### E011: Tag must be string

**Why:** Tags must be a space-separated string, not an array. This is per ALPS specification.

**How to fix:**
```diff
- { "id": "user", "tag": ["profile", "account"] }
+ { "id": "user", "tag": "profile account" }
```

---

## Warnings

<a id="w001"></a>
### W001: Missing title

**Why:** Adding a `title` to your ALPS document improves readability and documentation.

**How to fix:**
```diff
- { "alps": { "descriptor": [...] } }
+ { "alps": { "title": "My Application API", "descriptor": [...] } }
```

---

<a id="w002"></a>
### W002: Safe transition naming

**Why:** By convention, safe transitions (read-only, like GET) should start with `go` prefix for clarity.

**How to fix:**
```diff
- { "id": "viewProduct", "type": "safe", "rt": "#Product" }
+ { "id": "goProduct", "type": "safe", "rt": "#Product" }
```

---

<a id="w003"></a>
### W003: Unsafe/idempotent transition naming

**Why:** By convention, unsafe (POST) and idempotent (PUT/DELETE) transitions should start with `do` prefix.

**How to fix:**
```diff
- { "id": "createUser", "type": "unsafe", "rt": "#User" }
+ { "id": "doCreateUser", "type": "unsafe", "rt": "#User" }
```

---

<a id="w004"></a>
### W004: Orphan descriptor

**Why:** A descriptor is defined but never referenced by any transition. This may indicate dead code or a missing reference.

**How to fix:**
1. Add a transition that references this descriptor
2. Or remove the unused descriptor

---

## Suggestions

<a id="s001"></a>
### S001: Add doc to transition

**Why:** Adding documentation to transitions helps explain their purpose and behavior.

**How to fix:**
```diff
  {
    "id": "doCreateUser",
    "type": "unsafe",
    "rt": "#User",
+   "doc": { "value": "Create a new user account" }
  }
```

---

## See Also

- [ALPS Specification](http://alps.io/)
- [Quick Start Guide](https://www.app-state-diagram.com/manuals/1.0/en/quick-start.html)
