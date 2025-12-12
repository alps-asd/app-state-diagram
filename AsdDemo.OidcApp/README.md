# AsdDemo.OidcApp

A demonstration OIDC (OpenID Connect) login system built with BEAR.Sunday framework, generated from an [ALPS profile](../oidc-login-system.json).

## Features

- **User Management**: Full CRUD operations for users with secure password hashing (bcrypt)
- **Session Management**: Login/logout with token-based session handling
- **CQRS Pattern**: Query/Command separation using Ray.MediaQuery
- **SQL-based Queries**: All database operations defined in SQL files
- **HAL+JSON**: Hypermedia responses with proper REST semantics
- **JsonSchema Validation**: Request/response validation
- **Comprehensive Tests**: 10 passing tests with full coverage

## Architecture

### Key Components

- **Entities**: `User`, `Session` - Read-only domain models with snake_case to camelCase conversion
- **Resources**: RESTful API endpoints at `src/Resource/App/`
- **Query/Command Interfaces**: CQRS separation in `src/Query/`
- **SQL Files**: Database operations in `var/sql/`
- **Migrations**: Phinx migrations in `var/phinx/migrations/`

### Technology Stack

- **Framework**: BEAR.Sunday (Resource-Oriented Architecture)
- **DI/AOP**: Ray.Di with compile-time optimization
- **Database**: SQLite with Phinx migrations
- **CQRS**: Ray.MediaQuery for SQL-based queries
- **Validation**: JsonSchema for request/response validation

## Installation

```bash
# Install dependencies
composer install

# Run database migrations
./vendor/bin/phinx migrate
```

## Usage

### CLI Commands

BEAR.Sunday CLI uses query string format for parameters:

```bash
# Create a user
php bin/app.php post '/user?username=alice&email=alice@example.com&password=secret123'

# Get user by ID
php bin/app.php get '/user?id={user-id}'

# List all users
php bin/app.php get /user

# Update user
php bin/app.php put '/user?id={user-id}&username=alice2&email=alice2@example.com'

# Delete user
php bin/app.php delete '/user?id={user-id}'
```

### Session Management

```bash
# Login (create session)
php bin/app.php post '/session?username=alice&password=secret123'
# Returns: {"sessionToken": "...", "expiresAt": "..."}

# Verify session
php bin/app.php get '/session?sessionToken={token}'

# Logout (delete session)
php bin/app.php delete '/session?sessionToken={token}'
```

### Web Server

```bash
# Start built-in server
composer serve

# Access via HTTP
curl http://localhost:8080/
```

## API Endpoints

### User Resource (`/user`)

- **GET /user** - List all users
- **GET /user?id={id}** - Get specific user
- **POST /user** - Create new user (requires: username, email, password)
- **PUT /user** - Update user (requires: id, username, email)
- **DELETE /user** - Delete user (requires: id)

### Session Resource (`/session`)

- **POST /session** - Login (requires: username, password)
- **GET /session?sessionToken={token}** - Verify session
- **DELETE /session?sessionToken={token}** - Logout

## Development

### Testing

```bash
# Run all tests
composer test
# or
./vendor/bin/phpunit

# Run with coverage
composer coverage
```

### Code Quality

```bash
# Run all quality checks
composer tests

# Fix coding standards
composer cs-fix

# Check coding standards
composer cs

# Static analysis
composer sa
```

### Database

```bash
# Check migration status
./vendor/bin/phinx status

# Run migrations
./vendor/bin/phinx migrate

# Rollback migration
./vendor/bin/phinx rollback
```

## Project Structure

```
src/
├── Entity/              # Domain entities (User, Session)
├── Query/               # CQRS interfaces (Query/Command)
├── Resource/
│   ├── App/            # Application resources (User, Session)
│   └── Page/           # Page resources (Index)
└── Module/             # DI configuration (AppModule)

var/
├── sql/                # SQL query files
├── phinx/migrations/   # Database migrations
└── schema/             # JsonSchema definitions

tests/
├── Entity/             # Entity tests
└── Resource/           # Resource tests
```

## Generated from ALPS

This application was automatically generated from the `oidc-login-system.json` ALPS profile using the [bear skill](./../.claude/skills/bear/). The ALPS profile defines:

- Semantic descriptors (userId, username, email, etc.)
- State transitions (safe, unsafe, idempotent operations)
- Authentication flow states

## Links

- [BEAR.Sunday](http://bearsunday.github.io/)
- [Ray.Di](https://github.com/ray-di/Ray.Di)
- [Ray.MediaQuery](https://github.com/ray-di/Ray.MediaQuery)
- [ALPS Specification](http://alps.io/)
- [Phinx](https://phinx.org/)
