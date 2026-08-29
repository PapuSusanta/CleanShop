# Clean Shop

A modern NestJS backend starter focused on clean architecture, CQRS, and multi-database persistence. This project demonstrates a practical structure for building scalable APIs with a users domain, validation, Swagger documentation, and support for both PostgreSQL and MongoDB.

## ✨ Features

- NestJS application with modular architecture
- CQRS pattern for commands and queries
- Clean architecture layers: domain, application, infrastructure, presentation
- User management with create, list, get, and delete flows
- Validation and exception handling
- Swagger/OpenAPI documentation at `/docs`
- Database abstraction supporting:
  - PostgreSQL via Drizzle ORM
  - MongoDB via native MongoDB driver
- Docker Compose setup for local development

## 🛠️ Tech Stack

- Node.js + TypeScript
- NestJS
- CQRS
- Drizzle ORM
- MongoDB
- PostgreSQL
- Swagger
- Jest for testing

## 🧱 Project Structure

```text
src/
  app.module.ts
  main.ts
  shared/                  # shared domain and infrastructure pieces
  users/                   # users feature (domain, app, infra, presentation)
    application/
    domain/
    infrastructure/
    presentation/

drizzle/                  # Drizzle migrations
requests/                 # sample API requests
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
- MongoDB on `localhost:27017`

### 3. Configure environment variables

Create a `.env` file in the project root with values such as:

```env
PORT=3000
DATABASE=postgres
POSTGRES_URL= Your postgres connection url
MONGO_URI= Your mongo connection url
MONGO_DB_NAME= Your mongo database name
```

### 4. Run the app

```bash
pnpm start:dev
```

The API will be available at:

- `http://localhost:3000/api`
- Swagger docs: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`
- OpenAPI YAML: `http://localhost:3000/docs-yaml`

## 📡 API Overview

### Users

Create a user

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }'
```

List users

```bash
curl http://localhost:3000/api/users
```

Get a user by ID

```bash
curl http://localhost:3000/api/users/:id
```

Delete a user

```bash
curl -X DELETE http://localhost:3000/api/users/:id
```

## 🧪 Scripts

```bash
pnpm build
pnpm test
pnpm test:e2e
pnpm lint
```

## 🧠 Architecture Notes

The project uses a layered approach:

- Domain: entities, value objects, domain exceptions
- Application: commands, queries, handlers, repository ports
- Infrastructure: adapters for PostgreSQL and MongoDB
- Presentation: controllers and DTOs

This keeps the core business logic independent from the persistence layer and makes it easier to swap storage implementations.

## 📄 Sample Requests

An openapi.json file is provided in the docs folder for testing the API with tools like Postman, Insomnia or Bruno. Import the file and you can easily test the endpoints.
Or you can run **pnpm openapi** to generate the openapi.json file.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
