---
name: bear-resource-generator
description: Generate complete BEAR.Sunday resource sets (Phinx migrations, Query/Command interfaces, SQL files, Entity classes, Resource classes, JsonSchema, tests) from simple specifications or ALPS profiles. Supports Ray.MediaQuery pattern and clean architecture principles.
---

# BEAR.Sunday Resource Generator

This skill generates a complete, consistent set of files for BEAR.Sunday resources following ROA (Resource Oriented Architecture) principles and Ray.MediaQuery patterns.

## When to Use This Skill

Use this skill when:
- Creating new BEAR.Sunday resources from scratch
- Need to generate CRUD operations for an entity
- Want consistent code structure across resources
- Have an ALPS profile to implement

## What This Skill Generates

1. **Phinx Migration** - Database schema with proper types and indexes
2. **Query Interface** - Read operations with `#[DbQuery]` attributes
3. **Command Interface** - Write operations (add/update/delete)
4. **SQL Files** - Flat structure in `var/sql/` (e.g., `ticket_add.sql`)
5. **Entity Class** - Readonly properties with snake_case → camelCase conversion
6. **Resource Class** - Full CRUD with proper HTTP status codes
7. **JsonSchema** - Both request and response schemas
8. **Tests** - Resource integration tests and entity unit tests

## Input Format

The skill accepts two input formats:

### Format 1: Simple Specification

```markdown
Entity: Ticket (id: string, title: string, content: string, dateCreated: datetime)

Operations:
- List tickets (GET)
- Get ticket detail (GET)
- Create ticket (POST)
- Update ticket (PUT)
- Delete ticket (DELETE)
```

### Format 2: ALPS Profile

Provide an ALPS JSON profile with semantic definitions.

## Step-by-Step Implementation Process

### Step 1: Analyze Input

1. Parse the entity specification or ALPS profile
2. Extract:
   - Entity name (e.g., "Ticket")
   - Properties with types (e.g., `id: string`, `title: string`)
   - Required operations (list, item, add, update, delete)
3. Determine:
   - Namespace from `composer.json` (e.g., `MyVendor\MyProject`)
   - Target directory structure

### Step 2: Generate Phinx Migration

Create `var/phinx/migrations/YYYYMMDDHHMMSS_create_{entity}_table.php`:

```php
<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Create{Entity}Table extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('{entity_snake}', ['id' => false, 'primary_key' => ['id']]);
        $table->addColumn('id', 'string', ['limit' => 64])
              // Add other columns based on entity properties
              ->addColumn('date_created', 'datetime', ['default' => 'CURRENT_TIMESTAMP'])
              ->addIndex(['{searchable_columns}'])
              ->create();
    }
}
```

**Type Mapping:**
- `string` → `'string', ['limit' => 255]`
- `int` → `'integer'`
- `bool` → `'boolean'`
- `float` → `'decimal', ['precision' => 10, 'scale' => 2]`
- `datetime` → `'datetime'`
- `?Type` (nullable) → add `['null' => true]`

**Add indexes for:**
- Search columns (title, name, etc.)
- Date columns
- Foreign keys

### Step 3: Generate Query Interface

Create `src/Query/{Entity}QueryInterface.php`:

```php
<?php
declare(strict_types=1);

namespace {Namespace}\Query;

use {Namespace}\Entity\{Entity};
use Ray\MediaQuery\Annotation\DbQuery;

interface {Entity}QueryInterface
{
    #[DbQuery('{entity_snake}_item')]
    public function item(string $id): {Entity}|null;

    /** @return array<{Entity}> */
    #[DbQuery('{entity_snake}_list')]
    public function list(): array;
}
```

### Step 4: Generate Command Interface

Create `src/Query/{Entity}CommandInterface.php`:

```php
<?php
declare(strict_types=1);

namespace {Namespace}\Query;

use DateTimeInterface;
use Ray\MediaQuery\Annotation\DbQuery;

interface {Entity}CommandInterface
{
    #[DbQuery('{entity_snake}_add')]
    public function add({parameters}): void;

    #[DbQuery('{entity_snake}_update')]
    public function update({parameters}): void;

    #[DbQuery('{entity_snake}_delete')]
    public function delete(string $id): void;
}
```

**CRITICAL: Parameter Rules**

Reference: https://bearsunday.github.io/manuals/1.0/ja/database_media.html

**1. DateTimeInterface Auto-Injection**

Use `DateTimeInterface $fieldName = null` for timestamp fields:

```php
// Correct - null default enables auto-injection
public function add(string $id, string $title, DateTimeInterface $dateCreated = null): void;

// Resource calls without DateTimeInterface
$this->command->add($id, $title); // Current time auto-injected by DI
```

**Benefits:**
- No hardcoded `NOW()` in SQL
- DI automatically injects current timestamp
- Testable (can mock DateTimeInterface in tests)

**2. Exclude Auto-Generated and Default Value Fields**

**Exclude from Command parameters:**
- Fields with `DEFAULT` in migration (e.g., `completed DEFAULT false`)
- Auto-generated fields (e.g., `id` generated in Resource)

**Example:**
```php
// Migration has: completed BOOLEAN DEFAULT false
// SQL: INSERT INTO todo (id, title, date_created) VALUES (:id, :title, :dateCreated)
// Command: add(string $id, string $title, DateTimeInterface $dateCreated = null)
// Resource: $this->command->add($id, $title); // Only user input
```

**3. Query Interface @return Type**

Use PHPDoc `@return` for automatic Entity conversion:

```php
/** @return array<{Entity}> */
#[DbQuery('{entity_snake}_list')]
public function list(): array;
```

**Auto-conversion:**
- DB snake_case → Entity camelCase (automatic via CamelCaseTrait)
- Array of arrays → Array of Entity objects (automatic)
- Direct use in Resource - no manual conversion needed

**Resource usage:**
```php
$this->body = ['items' => $this->query->list()]; // Already array<Entity>
```

### Step 5: Generate SQL Files

Create files in `var/sql/` with flat structure:

**`var/sql/{entity}_add.sql`:**
```sql
/* {entity} add */
INSERT INTO {entity} ({columns})
VALUES ({:params});
```

**`var/sql/{entity}_item.sql`:**
```sql
/* {entity} item */
SELECT {columns}
  FROM {entity}
 WHERE id = :id
```

**`var/sql/{entity}_list.sql`:**
```sql
/* {entity} list */
SELECT {columns}
  FROM {entity}
 ORDER BY date_created DESC
```

**`var/sql/{entity}_update.sql`:**
```sql
/* {entity} update */
UPDATE {entity}
   SET {column_assignments}
 WHERE id = :id
```

**`var/sql/{entity}_delete.sql`:**
```sql
/* {entity} delete */
DELETE FROM {entity}
 WHERE id = :id
```

### Step 6: Generate Entity Class

Create `src/Entity/{Entity}.php`:

```php
<?php
declare(strict_types=1);

namespace {Namespace}\Entity;

class {Entity}
{
    // Add readonly properties for snake_case → camelCase conversion

    public function __construct(
        public readonly string $id,
        // Add other properties
        string $property_snake_case
    ) {
        // Convert snake_case to camelCase in constructor
        $this->propertyCamelCase = $property_snake_case;
    }
}
```

**Conversion Rules:**
- Database: `date_created` (snake_case)
- Entity constructor param: `string $date_created`
- Entity property: `public readonly string $dateCreated` (camelCase)

### Step 7: Generate Resource Class

Create `src/Resource/App/{Entity}.php`:

```php
<?php
declare(strict_types=1);

namespace {Namespace}\Resource\App;

use BEAR\Resource\Annotation\JsonSchema;
use BEAR\Resource\ResourceObject;
use {Namespace}\Query\{Entity}CommandInterface;
use {Namespace}\Query\{Entity}QueryInterface;

class {Entity} extends ResourceObject
{
    public function __construct(
        private readonly {Entity}QueryInterface $query,
        private readonly {Entity}CommandInterface $command
    ) {}

    #[JsonSchema(schema: '{entity}.json')]
    public function onGet(string $id): static
    {
        $item = $this->query->item($id);
        if ($item === null) {
            $this->code = 404;
            return $this;
        }

        $this->body = (array) $item;
        return $this;
    }

    #[JsonSchema(schema: '{entity}-post.json')]
    public function onPost({parameters}): static
    {
        $id = $this->generateId();
        $this->command->add($id, {params}); // DateTimeInterface auto-injected

        $this->code = 201;
        $this->headers['Location'] = "/{entity}?id={$id}";
        $this->body = ['id' => $id];

        return $this;
    }

    #[JsonSchema(schema: '{entity}-put.json')]
    public function onPut(string $id, {parameters}): static
    {
        $item = $this->query->item($id);
        if ($item === null) {
            $this->code = 404;
            return $this;
        }

        $this->command->update($id, {params});
        $this->code = 200;
        $this->body = ['id' => $id];

        return $this;
    }

    public function onDelete(string $id): static
    {
        $item = $this->query->item($id);
        if ($item === null) {
            $this->code = 404;
            return $this;
        }

        $this->command->delete($id);
        $this->code = 204;

        return $this;
    }

    private function generateId(): string
    {
        return bin2hex(random_bytes(16));
    }
}
```

**HTTP Status Codes:**
- GET: 200 OK / 404 Not Found
- POST: 201 Created + Location header
- PUT: 200 OK / 404 Not Found
- DELETE: 204 No Content / 404 Not Found
- 400 Bad Request: Automatically handled by JsonSchema validation

**Optional: Advanced Resource Patterns**

These patterns are added manually based on your resource relationships:

**1. #[Embed] - Embed Related Resources**

Reference: https://bearsunday.github.io/manuals/1.0/ja/resource_link.html

Use when you need to include related resource data in the response:

```php
#[Embed(rel: 'author', src: 'app://self/user{?authorId}')]
public function onGet(string $id): static
{
    $post = $this->query->item($id);
    $this->body = [
        'id' => $post->id,
        'title' => $post->title,
        'authorId' => $post->authorId  // Used in URI template
    ];
    return $this;
}
// Response will include embedded 'author' resource
```

**Common use cases:**
- Blog post with author details
- Order with customer information
- Todo with creator information

**2. #[ResourceParam] - Inject from Other Resources**

Reference: https://bearsunday.github.io/manuals/1.0/ja/resource_param.html

Use when you need to inject values from other resources (e.g., authentication):

```php
#[JsonSchema(schema: 'todo-post.json')]
public function onPost(
    #[ResourceParam('app://self/login#userId')] string $userId,
    string $title
): static {
    $id = $this->generateId();
    $this->command->add($id, $title, $userId); // Authenticated user ID
    // ...
}
```

**Common use cases:**
- Inject authenticated user ID
- Inject session information
- Inject global configuration values

**Note:** These patterns require understanding your application's resource relationships and are added manually after basic resource generation.

### Step 8: Generate JsonSchema Files

**Response: `var/schema/response/{entity}.json`:**
```json
{
  "$id": "{entity}.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "{Entity}",
  "type": "object",
  "required": ["{required_fields}"],
  "properties": {
    "id": {
      "description": "The unique identifier for a {entity}.",
      "type": "string",
      "maxLength": 64
    }
  }
}
```

**Request: `var/schema/request/{entity}-post.json`:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Create {Entity} Request",
  "type": "object",
  "required": ["{required_input_fields}"],
  "properties": {
    // Input fields (exclude id and auto-generated fields)
  }
}
```

**Request: `var/schema/request/{entity}-put.json`:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Update {Entity} Request",
  "type": "object",
  "required": ["{required_update_fields}"],
  "properties": {
    // Updateable fields
  }
}
```

### Step 9: Generate Tests

**Resource Test: `tests/Resource/App/{Entity}Test.php`:**
```php
<?php
declare(strict_types=1);

namespace {Namespace}\Resource\App;

use BEAR\Resource\ResourceInterface;
use PHPUnit\Framework\TestCase;

class {Entity}Test extends TestCase
{
    private ResourceInterface $resource;

    protected function setUp(): void
    {
        // Setup injector and resource client
    }

    public function testOnGet(): void
    {
        $item = $this->resource->get('app://self/{entity_snake}', ['id' => '1']);
        $this->assertSame(200, $item->code);
        $this->assertArrayHasKey('id', $item->body);
    }

    public function testOnGetNotFound(): void
    {
        $item = $this->resource->get('app://self/{entity_snake}', ['id' => 'non-existent']);
        $this->assertSame(404, $item->code);
    }

    public function testOnPost(): void
    {
        $item = $this->resource->post('app://self/{entity_snake}', [{post_params}]);
        $this->assertSame(201, $item->code);
        $this->assertArrayHasKey('Location', $item->headers);
    }

    public function testOnPut(): void
    {
        $item = $this->resource->put('app://self/{entity_snake}', [{put_params}]);
        $this->assertSame(200, $item->code);
    }

    public function testOnDelete(): void
    {
        $item = $this->resource->delete('app://self/{entity_snake}', ['id' => '1']);
        $this->assertSame(204, $item->code);
    }
}
```

**Entity Test: `tests/Entity/{Entity}Test.php`:**
```php
<?php
declare(strict_types=1);

namespace {Namespace}\Entity;

use PHPUnit\Framework\TestCase;

class {Entity}Test extends TestCase
{
    public function testConstruct(): void
    {
        $item = new {Entity}({constructor_params});
        $this->assertSame({expected_values});
    }
}
```

### Step 10: Create Directories

Ensure all necessary directories exist:
```bash
mkdir -p app/src/Query
mkdir -p app/src/Entity
mkdir -p app/src/Resource/App
mkdir -p app/var/sql
mkdir -p app/var/phinx/migrations
mkdir -p app/var/schema/request
mkdir -p app/var/schema/response
mkdir -p app/tests/Resource/App
mkdir -p app/tests/Entity
```

### Step 11: Summary Output

After generating all files, provide a summary:

```markdown
## Generated Files

✓ Phinx Migration: `var/phinx/migrations/YYYYMMDDHHMMSS_create_{entity}_table.php`
✓ Query Interface: `src/Query/{Entity}QueryInterface.php`
✓ Command Interface: `src/Query/{Entity}CommandInterface.php`
✓ SQL Files: `var/sql/{entity}_*.sql` (5 files)
✓ Entity: `src/Entity/{Entity}.php`
✓ Resource: `src/Resource/App/{Entity}.php`
✓ JsonSchema: `var/schema/response/{entity}.json`, `var/schema/request/{entity}-*.json` (3 files)
✓ Tests: `tests/Resource/App/{Entity}Test.php`, `tests/Entity/{Entity}Test.php`

## Next Steps

1. Run migration:
   ```bash
   cd app && ./vendor/bin/phinx migrate
   ```

2. Run tests:
   ```bash
   cd app && composer test
   ```

3. Fix coding standards:
   ```bash
   cd app && composer cs-fix
   ```
```

## Important Notes

- **Flat SQL Structure**: All SQL files go directly in `var/sql/` with `{entity}_{operation}.sql` naming
- **snake_case → camelCase**: Database uses snake_case, JSON/PHP uses camelCase
- **404 Handling**: Always check if item exists before update/delete operations
- **Type Safety**: Use readonly properties and proper type hints
- **CQRS**: Separate Query (read) and Command (write) interfaces
- **DIP**: Interfaces define contracts, SQL files are implementation details

## Troubleshooting

- If namespace detection fails, ask user for vendor and project name
- If uncertain about nullable fields, ask user
- If operations are unclear, ask which CRUD operations are needed
- Always validate generated SQL syntax
- Ensure proper PHP 8.3+ syntax (readonly properties, constructor property promotion)
