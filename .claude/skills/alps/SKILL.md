---
name: alps
description: Create, validate, and improve ALPS profiles. Generate from natural language (nl2alps), validate existing profiles, and get improvement suggestions.
---

# ALPS Profile Assistant

Generate, validate, and improve ALPS profiles for RESTful API design.

## Ideal ALPS Profile

**Goal: An ALPS that someone unfamiliar with the app can read and understand.**

### What Makes a Good ALPS

1. **States = What the user sees**
   - `ProductList` - viewing a list of products
   - `ProductDetail` - viewing one product
   - `Cart` - viewing cart contents

2. **Transitions = What the user does**
   - `goProductDetail` - select a product
   - `doAddToCart` - add to cart

3. **Self-documenting**
   - `title` explains the purpose
   - `doc` describes behavior and side effects
   - No need to read code to understand

4. **No unreachable states**
   - Every state has an entry point
   - Orphan states indicate design mistakes

5. **Necessary and sufficient**
   - No over-abstraction
   - Describes semantics, not implementation
   - No HTTP methods or URLs

### What to Avoid

- Mechanical CRUD listings without meaning
- Implementation details leaking in
- States without transitions (can't draw a diagram)
- Excessive documentation nobody reads

## How to Use

This skill responds to natural language requests:

### Generate ALPS from Description (nl2alps)
- "Create an ALPS profile for a blog application"
- "Generate ALPS for an e-commerce cart system"
- "Design an ALPS profile for user authentication"

### Validate Existing Profile
- "Validate this ALPS profile" (with file path or content)
- "Check my ALPS file for issues"
- "Review the ALPS profile at docs/api.json"

### Get Improvement Suggestions
- "Improve this ALPS profile"
- "Suggest enhancements for my ALPS"
- "How can I make this ALPS better?"

## ALPS Structure Reference

### Three Layers of ALPS

1. **Ontology** - Semantic descriptors (data elements)
   - Atomic data fields with `type="semantic"` (default)
   - Should have `id`, `title`, and optionally `doc` and `def` (schema.org link)

2. **Taxonomy** - State descriptors (screens/pages)
   - Composite descriptors containing semantic fields and transitions
   - Represents application states (e.g., HomePage, ProductDetail, Cart)

3. **Choreography** - Transition descriptors (actions)
   - `type="safe"` - Read operations (GET)
   - `type="unsafe"` - Create operations (POST) - not idempotent
   - `type="idempotent"` - Update/Delete operations (PUT/DELETE)
   - Must have `rt` (return type) pointing to target state

### Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Safe transition | `go` | `goToHome`, `goProductList`, `goSearchProducts` |
| Unsafe transition | `do` | `doCreateUser`, `doAddToCart`, `doLogin` |
| Idempotent transition | `do` | `doUpdateUser`, `doDeleteItem`, `doRemoveFromCart` |
| State/Page | PascalCase | `HomePage`, `ProductDetail`, `ShoppingCart` |
| Semantic field | camelCase | `userId`, `productName`, `createdAt` |

### Determining idempotent: PUT vs DELETE

Context clues for AI inference:

**PUT (Update) indicators:**
- `update`, `edit`, `modify`, `change`, `set`, `replace`
- Example: `doUpdateProfile`, `doEditComment`, `doSetQuantity`

**DELETE indicators:**
- `delete`, `remove`, `cancel`, `clear`, `destroy`
- Example: `doDeleteUser`, `doRemoveFromCart`, `doCancelOrder`

## Generation Guidelines

### When Creating ALPS from Natural Language

1. **Identify Entities** (Ontology)
   - Extract nouns: user, product, order, cart, etc.
   - Define atomic fields for each entity

2. **Identify States** (Taxonomy)
   - Map user journey: login -> home -> browse -> cart -> checkout
   - Each state contains relevant fields and available transitions

3. **Identify Transitions** (Choreography)
   - Safe: navigation, viewing, searching
   - Unsafe: creating new resources
   - Idempotent: updating or deleting resources

4. **Add Documentation**
   - Every descriptor should have a meaningful `title`
   - Complex descriptors should have `doc` explaining behavior
   - Link to schema.org definitions where applicable (`def`)

5. **Add Tags for Organization**
   - **Functional area tags**: Group by feature domain (e.g., `search`, `product`, `cart`, `checkout`, `order`, `account`, `review`)
   - **Flow tags**: Group by user journey with `flow-` prefix (e.g., `flow-purchase`, `flow-register`, `flow-return`)
   - States and transitions should have both types where applicable
   - Example: A cart-related transition might have `"tag": ["cart", "flow-purchase"]`

6. **Add Semantic Descriptors to Transitions**
   - Every transition (go/do) should specify its required input parameters as nested descriptors
   - These define what data is needed to perform the action
   - Example:
     ```json
     {"id": "goProductDetail", "type": "safe", "rt": "#ProductDetail", "tag": ["product"], "descriptor": [
       {"href": "#productId"}
     ]},
     {"id": "doAddToCart", "type": "unsafe", "rt": "#Cart", "tag": ["cart", "flow-purchase"], "descriptor": [
       {"href": "#productId"},
       {"href": "#quantity"},
       {"href": "#selectedVariant"}
     ]}
     ```

7. **MANDATORY: Validate After Generation**
   - After generating ALPS JSON, save it to a temporary file
   - Run `asd --validate <file>` to validate (outputs JSON per validation-result.json schema)
   - Parse the JSON result and report issues to the user
   - If errors exist, fix them before presenting the final output

### Output Format

Generate JSON format by default. Use XML only if explicitly requested.

```json
{
  "$schema": "https://alps-io.github.io/schemas/alps.json",
  "alps": {
    "title": "Application Title",
    "doc": {"value": "Description of the application"},
    "descriptor": [
      // Ontology: semantic fields
      {"id": "fieldName", "title": "Human Title", "doc": {"value": "Description"}},

      // Taxonomy: states
      {"id": "StateName", "title": "State Title", "descriptor": [
        {"href": "#fieldName"},
        {"href": "#transitionName"}
      ]},

      // Choreography: transitions
      {"id": "goToState", "type": "safe", "rt": "#TargetState", "title": "Navigate to State"},
      {"id": "doAction", "type": "unsafe", "rt": "#ResultState", "title": "Perform Action",
        "descriptor": [{"href": "#requiredField"}]}
    ]
  }
}
```

## Validation

Use `asd --validate <file>` to validate ALPS profiles. Output conforms to the [validation-result.json schema](https://alps-asd.github.io/app-state-diagram/schemas/validation-result.json).

### Error Codes (E)
- E001: Missing id or href
- E002: Missing rt on transition
- E003: Invalid type
- E004: Broken reference
- E005: Duplicate id
- E006: Invalid href
- E007: Invalid rt format
- E008: Missing alps property in document
- E009: Descriptor must be an array
- E010: Invalid XML character in descriptor title

### Warning Codes (W)
- W001: Missing title
- W002: Safe transition naming (should start with 'go')
- W003: Unsafe/idempotent naming (should start with 'do')
- W004: Orphan descriptor

### Suggestion Codes (S)
- S001: Missing doc on transition
- S002: Missing ALPS title
- S003: Missing ALPS doc

## Example: Blog Application

Input: "Create an ALPS for a simple blog with posts and comments"

Output:
```json
{
  "$schema": "https://alps-io.github.io/schemas/alps.json",
  "alps": {
    "title": "Simple Blog",
    "doc": {"value": "ALPS profile for a blog application with posts and comments"},
    "descriptor": [
      {"id": "postId", "title": "Post ID", "def": "https://schema.org/identifier"},
      {"id": "title", "title": "Post Title", "def": "https://schema.org/headline"},
      {"id": "body", "title": "Post Body", "def": "https://schema.org/articleBody"},
      {"id": "authorName", "title": "Author Name", "def": "https://schema.org/author"},
      {"id": "createdAt", "title": "Created Date", "def": "https://schema.org/dateCreated"},
      {"id": "commentId", "title": "Comment ID"},
      {"id": "commentBody", "title": "Comment Text"},

      {"id": "Home", "title": "Home Page", "descriptor": [
        {"href": "#goPostList"}
      ]},
      {"id": "PostList", "title": "Post List", "descriptor": [
        {"href": "#postId"},
        {"href": "#title"},
        {"href": "#authorName"},
        {"href": "#goPostDetail"},
        {"href": "#goHome"}
      ]},
      {"id": "PostDetail", "title": "Post Detail", "descriptor": [
        {"href": "#postId"},
        {"href": "#title"},
        {"href": "#body"},
        {"href": "#authorName"},
        {"href": "#createdAt"},
        {"href": "#Comment"},
        {"href": "#goPostList"},
        {"href": "#doCreateComment"}
      ]},
      {"id": "Comment", "title": "Comment", "descriptor": [
        {"href": "#commentId"},
        {"href": "#commentBody"},
        {"href": "#authorName"},
        {"href": "#createdAt"},
        {"href": "#doDeleteComment"}
      ]},

      {"id": "goHome", "type": "safe", "rt": "#Home", "title": "Go to Home"},
      {"id": "goPostList", "type": "safe", "rt": "#PostList", "title": "View Post List"},
      {"id": "goPostDetail", "type": "safe", "rt": "#PostDetail", "title": "View Post Detail",
        "descriptor": [{"href": "#postId"}]},
      {"id": "doCreatePost", "type": "unsafe", "rt": "#PostDetail", "title": "Create Post",
        "descriptor": [{"href": "#title"}, {"href": "#body"}]},
      {"id": "doUpdatePost", "type": "idempotent", "rt": "#PostDetail", "title": "Update Post",
        "descriptor": [{"href": "#postId"}, {"href": "#title"}, {"href": "#body"}]},
      {"id": "doDeletePost", "type": "idempotent", "rt": "#PostList", "title": "Delete Post",
        "descriptor": [{"href": "#postId"}]},
      {"id": "doCreateComment", "type": "unsafe", "rt": "#PostDetail", "title": "Add Comment",
        "descriptor": [{"href": "#postId"}, {"href": "#commentBody"}]},
      {"id": "doDeleteComment", "type": "idempotent", "rt": "#PostDetail", "title": "Delete Comment",
        "descriptor": [{"href": "#commentId"}]}
    ]
  }
}
```

## Integration with app-state-diagram

Generated ALPS profiles can be visualized using app-state-diagram:

```bash
# Generate HTML diagram
asd profile.json

# Generate with watch mode
asd --watch profile.json

# Generate markdown documentation
asd --mode=markdown profile.json
```

## Tips for Better ALPS

1. **Start with user journeys** - Map the happy path first, then add alternatives
2. **Be consistent** - Use the same naming pattern throughout
3. **Document transitions** - Explain what each action does and when it's available
4. **Use schema.org** - Link to standard definitions for interoperability
5. **Think about errors** - Add error states and recovery transitions
6. **Consider pagination** - List states should support pagination
7. **Tag descriptors** - Use `tag` attribute to group related descriptors

## References

- [ALPS Specification](http://alps.io/spec/)
- [Schema.org](https://schema.org/)
- [app-state-diagram](https://github.com/alps-asd/app-state-diagram)
