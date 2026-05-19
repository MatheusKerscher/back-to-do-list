# Coopers To-Do List — API

REST API built for the Coopers Full Stack Developer technical challenge. Handles user authentication, a per-user to-do list, and a contact form with email delivery.

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Language   | TypeScript                                      |
| Framework  | Express 5                                       |
| ORM        | Prisma 5                                        |
| Database   | PostgreSQL (Docker locally, Neon in production) |
| Auth       | JWT stored in httpOnly cookie                   |
| Password   | bcryptjs with salt + pepper                     |
| Email      | Resend                                          |
| Validation | Zod                                             |
| Tests      | Jest + Supertest                                |

## Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Docker](https://www.docker.com)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.development
# Fill in all values in .env.development

# 3. Start — spins up Docker, runs migrations, starts the server
npm run dev
```

The API will be available at `http://localhost:3333` (or the `PORT` you configured).

## Running Tests

```bash
npm test
```

Starts Docker, applies migrations to an isolated test database, then runs the full integration test suite.

## Environment Variables

| Variable             | Description                                   | Example                                    |
| -------------------- | --------------------------------------------- | ------------------------------------------ |
| `POSTGRES_USER`      | PostgreSQL username                           | `postgres`                                 |
| `POSTGRES_PASSWORD`  | PostgreSQL password                           | `postgres`                                 |
| `POSTGRES_DB`        | Database name                                 | `coopers_dev`                              |
| `DATABASE_URL`       | Full Prisma connection string                 | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET`         | Secret used to sign JWT tokens                | `a-long-random-string`                     |
| `PASSWORD_PEPPER`    | Server-side secret prepended before hashing   | `another-random-string`                    |
| `RESEND_API_KEY`     | API key from [resend.com](https://resend.com) | `re_...`                                   |
| `CONTACT_EMAIL_FROM` | Verified sender address in Resend             | `hello@yourdomain.com`                     |
| `FRONTEND_URL`       | Allowed CORS origin                           | `http://localhost:3000`                    |
| `PORT`               | Port the server listens on                    | `3333`                                     |

## API Endpoints

### Auth

| Method | Route            | Auth     | Description                          |
| ------ | ---------------- | -------- | ------------------------------------ |
| `POST` | `/auth/register` | —        | Create a new account                 |
| `POST` | `/auth/login`    | —        | Sign in and receive a session cookie |
| `POST` | `/auth/logout`   | —        | Clear the session cookie             |
| `GET`  | `/auth/me`       | Required | Return the authenticated user        |

### To-Do

| Method   | Route              | Auth     | Description                       |
| -------- | ------------------ | -------- | --------------------------------- |
| `GET`    | `/to-do`           | Required | List all to-do items for the user |
| `POST`   | `/to-do`           | Required | Create a new to-do item           |
| `PUT`    | `/to-do/:id`       | Required | Update the text of an item        |
| `PATCH`  | `/to-do/:id/check` | Required | Toggle the item's done status     |
| `DELETE` | `/to-do/:id`       | Required | Delete an item                    |

### Contact

| Method | Route      | Auth | Description                           |
| ------ | ---------- | ---- | ------------------------------------- |
| `POST` | `/contact` | —    | Send a contact form message via email |

### Documentation

| Method | Route   | Auth | Description                        |
| ------ | ------- | ---- | ---------------------------------- |
| `GET`  | `/docs` | —    | Interactive API reference (Scalar) |

### Error responses

All errors follow a consistent shape:

```json
{
  "name": "NotFoundError",
  "action": "Check the ID and try again.",
  "message": "Item not found.",
  "status_code": 404
}
```

Validation errors include a `fields` object with per-field messages.

## License

[MIT](./LICENSE)
