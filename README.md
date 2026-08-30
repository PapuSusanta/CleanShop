# Clean Shop

A modern NestJS backend starter focused on clean architecture, CQRS, and multi-database persistence. This project demonstrates a practical structure for building scalable APIs with a users domain, JWT authentication with role-based access control, validation, Swagger documentation, and support for both PostgreSQL and MongoDB.

## ✨ Features

- NestJS application with modular architecture
- CQRS pattern for commands and queries
- Clean architecture layers: domain, application, infrastructure, presentation
- User management with create, update, list, get, and delete flows
- JWT authentication with register, login, and current-user (`/auth/me`) endpoints
- Global auth guard — every route requires a valid access token by default
- `@Public()` decorator to opt specific routes out of authentication (e.g. register/login)
- Role-based access control via a `@Roles()` decorator and guard (e.g. admin-only user deletion)
- Passwords hashed with bcrypt, never stored or returned in plain text
- Validation and exception handling
- Swagger/OpenAPI documentation at `/docs`, with a bearer-token "Authorize" button for protected routes
- Database abstraction supporting:
  - PostgreSQL via Drizzle ORM (active by default)
  - MongoDB via native MongoDB driver (adapter included, disabled by default — see [Database selection](#database-selection))
- Docker Compose setup for local development (Postgres, pgweb, MongoDB, mongo-express)

## 🛠️ Tech Stack

- Node.js + TypeScript
- NestJS
- CQRS
- Drizzle ORM
- PostgreSQL
- MongoDB
- `@nestjs/jwt` for JWT signing/verification
- `bcryptjs` for password hashing
- `class-validator` / `class-transformer` for request validation
- Swagger
- Jest for testing

## 🧱 Project Structure

```text
src/
  app.module.ts
  main.ts

  shared/                       # cross-cutting building blocks used by every feature module
    config/                     # env validation and typed config access
    domain/
      enums/                    # e.g. Role
      exceptions/                # ApplicationException, DomainException
      interfaces/                # e.g. TokenPayload
      value-objects/
    infrastructure/
      database/                 # Drizzle (Postgres) and MongoDB providers/modules
      decorators/                # @Public(), @Roles(), @CurrentUser()
      guards/                    # JwtAuthGuard, RolesGuard
      filters/                   # exception filters
      types/                     # Express Request augmentation

  auth/                         # authentication feature (register, login, me)
    application/
      commends/                 # register, login command handlers
      queries/                  # me query handler
      ports/                    # PasswordHasherPort, TokenProviderPort
    infrastructure/
      adapters/                 # bcrypt hasher, JWT token provider
    presentation/
      auth.controller.ts
      contracts/                # request/response DTOs

  users/                        # users feature (domain, app, infra, presentation)
    application/
    domain/
    infrastructure/
    presentation/

drizzle/                        # Drizzle migrations
docs/                           # generated openapi.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker Desktop (for local databases)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the databases

```bash
docker compose up -d
```

This starts:

- PostgreSQL on `localhost:5432`
- pgweb (Postgres UI) on `http://localhost:8081`
- MongoDB on `localhost:27017`
- mongo-express (Mongo UI) on `http://localhost:8082`

The app uses PostgreSQL by default, so if you only need that, you can start a subset instead:

```bash
docker compose up -d postgres pgweb
```

### 3. Configure environment variables

Create a `.env` file in the project root (see `.env.example`):

```env
PORT=3000
DATABASE=postgres
POSTGRES_URL=postgresql://postgres:password@localhost:5432/clean_shop
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=clean-shop

JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=1h
```

`JWT_SECRET` must be at least 16 characters — the app fails to start without it.

### 4. Run database migrations

```bash
pnpm migrate
```

### 5. Run the app

```bash
pnpm start:dev
```

The API will be available at:

- `http://localhost:3000/api`
- Swagger docs: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`
- OpenAPI YAML: `http://localhost:3000/docs-yaml`

### Database selection

The `UsersRepositoryPort` has both a Drizzle (Postgres) and a MongoDB adapter, but only one is wired up at a time:

- `src/users/users.module.ts` currently binds `USERS_REPOSITORY` to `DrizzleUsersRepository`.
- `src/app.module.ts` currently has `MongoModule` commented out, since it isn't needed while Postgres is active.

To switch to MongoDB, uncomment `MongoModule` in `app.module.ts` and swap the `USERS_REPOSITORY` provider in `users.module.ts` to `MongoUsersRepository`.

## 🔐 Authentication & Authorization

Every route requires a valid JWT **by default**. Two building blocks in `shared/infrastructure` control this:

- **`JwtAuthGuard`** and **`RolesGuard`** are registered globally (`APP_GUARD` in `AuthModule`), so no controller needs `@UseGuards(...)` to be protected.
- **`@Public()`** marks a route as not requiring authentication. Used on `POST /auth/register` and `POST /auth/login`.
- **`@Roles(Role.ADMIN, ...)`** restricts a route to specific roles on top of authentication. Used on `DELETE /users/:id` (admin only). Omitting `@Roles()` means "any authenticated user."
- **`@CurrentUser()`** injects the decoded token payload (`{ sub, email, role }`) into a route handler, as used in `GET /auth/me`.

### Using a token

1. Register, then log in to get an `accessToken`.
2. Send it on subsequent requests: `Authorization: Bearer <accessToken>`.
3. In Swagger UI, click **Authorize** and paste the token — protected endpoints will then include it automatically.

## 📡 API Overview

### Auth

Register (public)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "supersecret1"
  }'
```

Login (public)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "supersecret1"
  }'
```

Get the current user (requires `Authorization: Bearer <accessToken>`)

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### Users

All endpoints below require `Authorization: Bearer <accessToken>` unless noted.

Create a user

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }'
```

Update a user

```bash
curl -X PUT http://localhost:3000/api/users/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com"
  }'
```

List users

```bash
curl http://localhost:3000/api/users -H "Authorization: Bearer <accessToken>"
```

Get a user by ID

```bash
curl http://localhost:3000/api/users/:id -H "Authorization: Bearer <accessToken>"
```

Delete a user (admin role required)

```bash
curl -X DELETE http://localhost:3000/api/users/:id \
  -H "Authorization: Bearer <adminAccessToken>"
```

## 🧪 Scripts

```bash
pnpm build
pnpm test
pnpm test:e2e
pnpm lint
pnpm generate   # generate a new Drizzle migration from schema changes
pnpm migrate    # apply pending Drizzle migrations
pnpm openapi    # build the app and emit an openapi.json file
```

## 🧠 Architecture Notes

The project uses a layered approach, repeated per feature module (`users`, `auth`):

- **Domain**: entities, value objects, enums, domain exceptions
- **Application**: commands, queries, handlers, and ports (interfaces) for anything the domain needs from the outside world — e.g. `UsersRepositoryPort`, `PasswordHasherPort`, `TokenProviderPort`
- **Infrastructure**: concrete adapters implementing those ports — Drizzle/Mongo repositories, a bcrypt password hasher, a JWT token provider
- **Presentation**: controllers, request/response DTOs, guards, and decorators

Ports are bound to their infrastructure implementation via NestJS DI tokens (e.g. `USERS_REPOSITORY`), so swapping an implementation — a different database, a different hashing library — means changing a provider registration, not application or domain code.

Cross-cutting pieces that don't belong to a single feature (the `Role` enum, `TokenPayload` shape, auth guards, and the `@Public()` / `@Roles()` / `@CurrentUser()` decorators) live under `shared/`, so both `users` and `auth` depend on `shared` rather than on each other's internals.

`shared/domain` also includes a couple of generic primitives (`Entity`, `Money`) available for future domain modeling beyond the current `users`/`auth` features.

## 📄 Sample Requests

An openapi.json file is provided in the docs folder for testing the API with tools like Postman, Insomnia or Bruno. Import the file and you can easily test the endpoints.
Or you can run **pnpm openapi** to generate the openapi.json file.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
