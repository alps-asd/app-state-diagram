# BEAR.Sunday Resource Generator - Examples

## Example 1: Simple Blog Post Resource

### Input

```markdown
Entity: Post (id: string, title: string, content: string, author: string, published: bool, dateCreated: datetime, dateModified: datetime)

Operations:
- List posts (GET)
- Get post detail (GET)
- Create post (POST)
- Update post (PUT)
- Delete post (DELETE)
```

### Expected Output Structure

```
app/
├── src/
│   ├── Entity/
│   │   └── Post.php
│   ├── Query/
│   │   ├── PostQueryInterface.php
│   │   └── PostCommandInterface.php
│   └── Resource/
│       └── App/
│           └── Post.php
├── var/
│   ├── phinx/
│   │   └── migrations/
│   │       └── 20250113000000_create_post_table.php
│   ├── sql/
│   │   ├── post_add.sql
│   │   ├── post_list.sql
│   │   ├── post_item.sql
│   │   ├── post_update.sql
│   │   └── post_delete.sql
│   └── schema/
│       ├── request/
│       │   ├── post-post.json
│       │   └── post-put.json
│       └── response/
│           └── post.json
└── tests/
    ├── Entity/
    │   └── PostTest.php
    └── Resource/
        └── App/
            └── PostTest.php
```

## Example 2: E-commerce Product Resource

### Input

```markdown
Entity: Product (id: string, name: string, description: string, price: float, stock: int, isActive: bool, dateCreated: datetime)

Operations:
- List products (GET)
- Get product detail (GET)
- Create product (POST)
- Update product (PUT)
- Delete product (DELETE)
```

### Key Points

- `price: float` → `'decimal', ['precision' => 10, 'scale' => 2]` in Phinx
- `stock: int` → `'integer'` in Phinx
- `isActive: bool` → `'boolean', ['default' => true]` in Phinx
- Indexes on: `name`, `isActive`, `dateCreated`

## Example 3: User Profile Resource (with nullable fields)

### Input

```markdown
Entity: Profile (id: string, userId: string, bio: ?string, avatar: ?string, location: ?string, website: ?string, dateCreated: datetime, dateModified: datetime)

Operations:
- Get profile (GET)
- Update profile (PUT)
```

### Key Points

- `bio: ?string` (nullable) → `'text', ['null' => true]` in Phinx
- No `onPost` (profiles created automatically with user)
- No `onDelete` (profiles deleted with user cascade)
- Foreign key: `userId` references `user(id)`

## Example 4: ALPS Profile Input

### Input (ALPS JSON)

```json
{
  "descriptor": [
    {"id": "id", "def": "https://schema.org/identifier"},
    {"id": "title", "def": "https://schema.org/name"},
    {"id": "content", "def": "https://schema.org/text"},
    {"id": "author", "def": "https://schema.org/author"},
    {"id": "dateCreated", "def": "https://schema.org/dateCreated"},
    {"id": "BlogPosting", "descriptor": [
      {"href": "#id"},
      {"href": "#title"},
      {"href": "#content"},
      {"href": "#author"},
      {"href": "#dateCreated"}
    ]},
    {"id": "goBlogPostingList", "type": "safe", "rt": "#BlogPosting"},
    {"id": "goBlogPosting", "type": "safe", "rt": "#BlogPosting", "descriptor": [
      {"href": "#id"}
    ]},
    {"id": "doBlogPostingAdd", "type": "unsafe", "rt": "#BlogPosting", "descriptor": [
      {"href": "#title"},
      {"href": "#content"},
      {"href": "#author"}
    ]},
    {"id": "doBlogPostingUpdate", "type": "idempotent", "rt": "#BlogPosting", "descriptor": [
      {"href": "#id"},
      {"href": "#title"},
      {"href": "#content"}
    ]},
    {"id": "doBlogPostingDelete", "type": "idempotent", "descriptor": [
      {"href": "#id"}
    ]}
  ]
}
```

### Expected Behavior

- Entity name extracted from descriptor: `BlogPosting`
- Properties inferred from Schema.org definitions
- Operations determined by transition types (safe/unsafe/idempotent)
- `type: "safe"` → Query interface methods
- `type: "unsafe"` → Command interface POST
- `type: "idempotent"` → Command interface PUT/DELETE

## Example 5: Minimal Resource (Read-only)

### Input

```markdown
Entity: Category (id: string, name: string, slug: string, description: string)

Operations:
- List categories (GET)
- Get category detail (GET)
```

### Key Points

- No Command interface (read-only)
- No POST/PUT/DELETE operations
- Only `category_list.sql` and `category_item.sql`
- No migration (assume pre-existing table)
- Only request schemas for GET operations

## Common Patterns

### Pattern 1: Auto-generated ID

```php
private function generateId(): string
{
    return bin2hex(random_bytes(16)); // 32-character hex
}
```

### Pattern 2: Timestamp Fields

```php
// In Command interface
public function add(
    string $id,
    string $title,
    DateTimeInterface $dateCreated
): void;

// In Resource onPost
$this->command->add($id, $title, new DateTimeImmutable());
```

### Pattern 3: 404 Handling

```php
public function onPut(string $id, string $title): static
{
    $item = $this->query->item($id);
    if ($item === null) {
        $this->code = 404;
        return $this;
    }

    $this->command->update($id, $title);
    $this->code = 200;
    return $this;
}
```

### Pattern 4: snake_case → camelCase

```php
// Database column: date_created
// SQL: SELECT date_created FROM ...
// Entity constructor: string $date_created
// Entity property: public readonly string $dateCreated
// JSON output: {"dateCreated": "2025-01-13 00:00:00"}

class Post
{
    public readonly string $dateCreated;

    public function __construct(
        public readonly string $id,
        public readonly string $title,
        string $date_created  // snake_case parameter
    ) {
        $this->dateCreated = $date_created; // camelCase property
    }
}
```

## Testing Examples

### Resource Test Example

```php
public function testOnPostAndGet(): void
{
    // Create
    $post = $this->resource->post('app://self/post', [
        'title' => 'Test Post',
        'content' => 'Test Content',
        'author' => 'Test Author'
    ]);
    $this->assertSame(201, $post->code);
    $this->assertArrayHasKey('id', $post->body);

    // Retrieve
    $id = $post->body['id'];
    $retrieved = $this->resource->get('app://self/post', ['id' => $id]);
    $this->assertSame(200, $retrieved->code);
    $this->assertSame('Test Post', $retrieved->body['title']);
}
```

### Entity Test Example

```php
public function testSnakeToCamelConversion(): void
{
    $post = new Post(
        '1',
        'Test Post',
        'Test Content',
        'Test Author',
        true,
        '2025-01-13 00:00:00',
        '2025-01-13 00:00:00'
    );

    $this->assertSame('2025-01-13 00:00:00', $post->dateCreated);
    $this->assertSame('2025-01-13 00:00:00', $post->dateModified);
}
```

## SQL File Examples

### Complex List Query (with filtering)

```sql
/* post list */
SELECT id, title, content, author, published, date_created, date_modified
  FROM post
 WHERE published = COALESCE(:published, published)
   AND author = COALESCE(:author, author)
 ORDER BY date_created DESC
 LIMIT :limit OFFSET :offset
```

### Update with Timestamp

```sql
/* post update */
UPDATE post
   SET title = :title,
       content = :content,
       date_modified = NOW()
 WHERE id = :id
```

## Migration Examples

### With Indexes and Foreign Keys

```php
public function change(): void
{
    $table = $this->table('post', ['id' => false, 'primary_key' => ['id']]);
    $table->addColumn('id', 'string', ['limit' => 64])
          ->addColumn('title', 'string', ['limit' => 255])
          ->addColumn('content', 'text')
          ->addColumn('author_id', 'string', ['limit' => 64])
          ->addColumn('published', 'boolean', ['default' => false])
          ->addColumn('date_created', 'datetime', ['default' => 'CURRENT_TIMESTAMP'])
          ->addColumn('date_modified', 'datetime', ['default' => 'CURRENT_TIMESTAMP'])
          ->addIndex(['title'])
          ->addIndex(['published'])
          ->addIndex(['author_id'])
          ->addIndex(['date_created'])
          ->addForeignKey('author_id', 'user', 'id', ['delete' => 'CASCADE'])
          ->create();
}
```