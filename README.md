# Clean Shop

A modern NestJS backend starter focused on clean architecture, CQRS, and multi-database persistence. This project demonstrates a practical structure for building scalable APIs with a users domain, JWT authentication with role-based access control, validation, Swagger documentation, and support for both PostgreSQL and MongoDB.

## ✨ Features

- NestJS application with modular architecture
- CQRS pattern for commands and queries
- Clean architecture layers: domain, application, infrastructure, presentation
- Rich DDD domain model: a `User` aggregate root that owns its invariants, with `Email`, `PersonName`, `HashedPassword` and `UserId` value objects
- Domain events (`user.registered`, `user.created`, `user.renamed`, `user.email-changed`, `user.deleted`) recorded by the aggregate and dispatched to listeners after the aggregate is persisted
- Read models on the query side, so aggregates never leave the application layer
- User management with create, update, list (paginated, filterable), get, and delete flows
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
    application/
      ports/                    # DomainEventPublisherPort
    domain/
      entity.ts                 # identity-based equality
      aggregate-root.ts         # framework-free base that records domain events
      enums/                    # e.g. Role
      events/                   # DomainEvent base class
      exceptions/               # ApplicationException, DomainException
      interfaces/               # e.g. TokenPayload
      value-objects/            # UniqueEntityId, Money
    infrastructure/
      database/                 # Drizzle (Postgres) and MongoDB providers/modules
      decorators/               # @Public(), @Roles(), @CurrentUser()
      events/                   # CQRS adapter for the domain event publisher
      guards/                   # JwtAuthGuard, RolesGuard
      filters/                  # exception filters
      types/                    # Express Request augmentation

  auth/                         # authentication feature (register, login, me)
    application/
      commands/                 # register, login command handlers
      ports/                    # PasswordHasherPort, TokenProviderPort
    infrastructure/
      adapters/                 # bcrypt hasher, JWT token provider
    presentation/
      auth.controller.ts
      contracts/                # request/response DTOs

  users/                        # users feature (domain, app, infra, presentation)
    domain/
      user.aggregate.ts         # the aggregate root; every state change lives here
      events/                   # UserRegistered, UserRenamed, UserEmailChanged, ...
      value-objects/            # UserId, Email, PersonName, HashedPassword
    application/
      commands/                 # create, update, delete
      queries/                  # get, list, and the UserView read model
      events/                   # listeners reacting to the domain events
      ports/                    # UsersRepositoryPort
    infrastructure/
      adapters/                 # Drizzle and MongoDB repositories
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

## 🧩 Domain model

The `User` aggregate root is the only thing allowed to change a user. Use cases
load it, call a method on it, and save it back:

```ts
const user = await this.users.findById(userId);   // load the aggregate
user.rename(PersonName.create(first, last));      // let it change itself
user.changeEmail(Email.create(email));
await this.users.save(user);                      // store it as a whole
await this.eventPublisher.publishAll(user.pullDomainEvents());
```

A few rules the code follows:

- **Values are objects, not strings.** `Email` normalises and validates once, so
  every later comparison is case-insensitive by construction. `HashedPassword`
  redacts itself in logs and JSON, and the domain never sees a plain text
  password — hashing stays behind `PasswordHasherPort`.
- **Aggregates record what happened.** Each state change appends a domain event.
  Events are pulled by the use case *after* the aggregate was persisted and
  handed to `DomainEventPublisherPort`; only its adapter knows about the Nest
  event bus. Listeners live in `users/application/events` — the audit trail
  subscribes to every user event, the others handle one side effect each.
- **The query side returns read models.** `UserView`, not `User`, so controllers
  cannot reach into the domain model or mutate it.
- **Repositories look like collections.** `save` upserts a whole aggregate;
  there is no `insert`/`update` split leaking persistence into use cases.
- **Uniqueness is enforced twice.** The use case checks it for a good error
  message, and the unique index catches the race between two concurrent
  requests — the adapters translate that violation into the same `409`.

### Known trade-offs

- The auth context creates `User` aggregates through the users repository, so
  the aggregate is a shared kernel between the two modules rather than each
  owning its own model. Fine for a modular monolith; revisit if auth ever
  becomes a separate deployable.
- Events are dispatched in-process, after the write, with no outbox — a crash
  between the two loses them. Add a transactional outbox before relying on
  them for anything a user would notice.
- There is still no unit of work, so a use case that touches two aggregates
  cannot commit them atomically.
- Nothing hands out `Role.ADMIN` yet: there is no endpoint and no seed for it,
  so the admin-only routes need the role to be set directly in the database.

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

List users (optional `email`, `limit` — max 100, default 50 — and `offset` query parameters)

```bash
curl "http://localhost:3000/api/users?limit=20&offset=0" \
  -H "Authorization: Bearer <accessToken>"
```

Get a user by ID

```bash
curl http://localhost:3000/api/users/:id -H "Authorization: Bearer <accessToken>"
```

Delete a user (admin role required, responds `204 No Content`)

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
