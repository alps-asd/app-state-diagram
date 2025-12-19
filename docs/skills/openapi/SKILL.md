---
name: alps2openapi
description: Generate OpenAPI specification from ALPS profile. Converts ALPS semantic descriptors to RESTful API definitions with automatic validation.
---

# ALPS to OpenAPI Converter

Generate OpenAPI 3.1 specification from ALPS profile with validation loop.

## When to Use

- User asks to generate OpenAPI from ALPS
- User wants to create REST API documentation from ALPS profile
- User says "alps2openapi", "convert to openapi", "generate api spec"

## Conversion Rules

### 1. Transition Type → HTTP Method

| ALPS type | HTTP Method | Description |
|-----------|-------------|-------------|
| safe | GET | Read operations |
| unsafe | POST | Create operations (non-idempotent) |
| idempotent | PUT/DELETE/PATCH | Update/Delete operations (idempotent) |

#### Determining idempotent Method

Infer from transition ID:

**PUT (Update):**
- Keywords: `update`, `edit`, `modify`, `change`, `set`, `replace`
- Example: `doUpdateUser`, `doEditPost`, `doSetStatus`

**DELETE:**
- Keywords: `delete`, `remove`, `cancel`, `clear`, `destroy`
- Example: `doDeleteUser`, `doRemoveItem`, `doCancelOrder`

**PATCH:**
- Keywords: `toggle`, `patch`, `increment`, `decrement`
- Example: `doToggleComplete`, `doPatchProfile`

### 2. Transition ID → operationId

Use ALPS transition ID directly as operationId:
- `goTodoList` → `operationId: goTodoList`
- `doCreateTodo` → `operationId: doCreateTodo`

### 3. Path Generation

| Transition Pattern | Path | Method |
|-------------------|------|--------|
| goXxxList | /xxxs | GET |
| goXxxDetail | /xxxs/{xxxId} | GET |
| doCreateXxx | /xxxs | POST |
| doUpdateXxx | /xxxs/{xxxId} | PUT |
| doDeleteXxx | /xxxs/{xxxId} | DELETE |
| doToggleYyy | /xxxs/{xxxId}/yyy | PATCH |

#### Path Naming Rules

- Use lowercase plural nouns: `/todos`, `/users`, `/products`
- Use kebab-case for multi-word: `/order-items`, `/user-profiles`
- Nested resources: `/users/{userId}/posts`

### 4. Schema Generation

#### Semantic Fields → Properties

Map ALPS semantic descriptors to OpenAPI schema properties:

```yaml
# ALPS
{"id": "todoId", "title": "Task ID", "def": "https://schema.org/identifier"}

# OpenAPI
todoId:
  type: string
  description: Task ID
```

#### States → Schema Names

ALPS states become OpenAPI schema names:
- `TodoList` → `TodoListItem` (for list responses)
- `TodoDetail` → `TodoDetail` (for single item responses)

### 5. schema.org → OpenAPI Format Mapping

| schema.org | OpenAPI |
|------------|---------|
| https://schema.org/DateTime | `type: string, format: date-time` |
| https://schema.org/Date | `type: string, format: date` |
| https://schema.org/Time | `type: string, format: time` |
| https://schema.org/Email | `type: string, format: email` |
| https://schema.org/URL | `type: string, format: uri` |
| https://schema.org/identifier | `type: string` |
| https://schema.org/Integer | `type: integer` |
| https://schema.org/Number | `type: number` |
| https://schema.org/Boolean | `type: boolean` |
| https://schema.org/Text | `type: string` |

### 6. Input Parameters

Extract from transition's nested descriptors:

```json
{"id": "doCreateTodo", "type": "unsafe", "rt": "#TodoDetail", "descriptor": [
  {"href": "#title"},
  {"href": "#description"},
  {"href": "#dueDate"}
]}
```

Becomes:

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateTodoRequest'
```

With schema:

```yaml
CreateTodoRequest:
  type: object
  properties:
    title:
      type: string
    description:
      type: string
    dueDate:
      type: string
      format: date-time
  required:
    - title
```

### 7. HTTP Status Codes

| Operation | Success | Client Error | Not Found |
|-----------|---------|--------------|-----------|
| GET (single) | 200 | 400 | 404 |
| GET (list) | 200 | 400 | - |
| POST | 201 | 400, 409 | - |
| PUT | 200 | 400 | 404 |
| PATCH | 200 | 400 | 404 |
| DELETE | 204 | 400 | 404 |

### 8. Error Response Schema

Always include standard error schema:

```yaml
components:
  schemas:
    Error:
      type: object
      properties:
        code:
          type: string
          description: Error code
        message:
          type: string
          description: Error message
      required:
        - code
        - message

  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

### 9. Required Fields

**Request (POST/PUT):**
- Fields in transition's descriptor are required by default
- Mark as optional with `(optional)` in ALPS doc

**Response:**
- ID field is always required
- Primary fields (title, name, etc.) are required
- Timestamps (createdAt, updatedAt) are required

### 10. Tags from ALPS

Use ALPS `tag` attribute for OpenAPI tags:

```json
{"id": "goTodoList", "type": "safe", "rt": "#TodoList", "tag": "todo"}
```

Becomes:

```yaml
tags:
  - todo
```

## Workflow

1. **Read ALPS profile** - Parse JSON or XML
2. **Extract components**:
   - Semantic fields → Schema properties
   - States → Response schemas
   - Transitions → Operations
3. **Generate OpenAPI YAML**
4. **Validate with Spectral**:
   ```bash
   npx @stoplight/spectral-cli lint <output_file>
   ```
5. **Fix errors** - If validation fails, fix and regenerate
6. **Return result** - Provide the validated OpenAPI spec

## Output Format

- YAML format (not JSON)
- OpenAPI version: 3.1.0
- Include `$schema` reference
- Japanese descriptions from ALPS `title`

## Template

```yaml
openapi: 3.1.0
info:
  title: {alps.title}
  description: {alps.doc}
  version: 1.0.0

servers:
  - url: http://localhost:8080/api
    description: Development server

paths:
  # Generated from transitions

components:
  schemas:
    # Generated from semantic descriptors and states
    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
      required:
        - code
        - message

  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

## Validation

After generating OpenAPI, validate:

```bash
npx @stoplight/spectral-cli lint openapi.yaml
```

If errors occur:
1. Read error messages
2. Fix the issues in the generated spec
3. Re-validate until no errors

## Example

### Input (ALPS)

```json
{
  "alps": {
    "title": "Todo API",
    "descriptor": [
      {"id": "todoId", "title": "Task ID"},
      {"id": "title", "title": "Title"},
      {"id": "completed", "title": "Completed"},

      {"id": "TodoList", "descriptor": [
        {"href": "#todoId"},
        {"href": "#title"},
        {"href": "#goTodoDetail"},
        {"href": "#doCreateTodo"}
      ]},

      {"id": "goTodoList", "type": "safe", "rt": "#TodoList"},
      {"id": "goTodoDetail", "type": "safe", "rt": "#TodoDetail", "descriptor": [
        {"href": "#todoId"}
      ]},
      {"id": "doCreateTodo", "type": "unsafe", "rt": "#TodoDetail", "descriptor": [
        {"href": "#title"}
      ]},
      {"id": "doDeleteTodo", "type": "idempotent", "rt": "#TodoList", "descriptor": [
        {"href": "#todoId"}
      ]}
    ]
  }
}
```

### Output (OpenAPI)

```yaml
openapi: 3.1.0
info:
  title: Todo API
  version: 1.0.0

paths:
  /todos:
    get:
      operationId: goTodoList
      summary: Get todo list
      responses:
        '200':
          description: Todo list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TodoListItem'

    post:
      operationId: doCreateTodo
      summary: Create todo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTodoRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TodoDetail'
        '400':
          $ref: '#/components/responses/BadRequest'

  /todos/{todoId}:
    parameters:
      - name: todoId
        in: path
        required: true
        schema:
          type: string

    get:
      operationId: goTodoDetail
      summary: Get todo detail
      responses:
        '200':
          description: Todo detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TodoDetail'
        '404':
          $ref: '#/components/responses/NotFound'

    delete:
      operationId: doDeleteTodo
      summary: Delete todo
      responses:
        '204':
          description: Deleted
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    TodoListItem:
      type: object
      properties:
        todoId:
          type: string
          description: Task ID
        title:
          type: string
          description: Title
      required:
        - todoId
        - title

    TodoDetail:
      type: object
      properties:
        todoId:
          type: string
        title:
          type: string
        completed:
          type: boolean
      required:
        - todoId
        - title
        - completed

    CreateTodoRequest:
      type: object
      properties:
        title:
          type: string
      required:
        - title

    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
      required:
        - code
        - message

  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```
