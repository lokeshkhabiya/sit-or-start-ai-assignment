# Design Document - Mini Event Seat Booking System

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
- [Backend Design](#backend-design)
- [Frontend Design](#frontend-design)
- [Authentication Flow](#authentication-flow)
- [Concurrency & Race Condition Handling](#concurrency--race-condition-handling)
- [State Management](#state-management)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)

---

## Architecture Overview

The system is a **Bun monorepo**
**Workspace layout:**

| Path | Purpose |
|---|---|
| `apps/server` | Express API server |
| `apps/web` | Next.js frontend |
| `packages/db` | Shared Prisma client & schema |
| `packages/env` | Zod-validated environment variables |
| `packages/config` | Shared TypeScript & ESLint config |

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Bun 1.3 | Fast package management, native TypeScript, workspace support |
| Frontend | Next.js 16, React 19 | File-based routing, typed routes, React Compiler |
| Styling | TailwindCSS 4, shadcn/ui | Utility-first CSS, pre-built accessible components |
| State | Zustand 5 | Lightweight, no boilerplate, works well with React 19 |
| Forms | TanStack React Form + Zod | Type-safe validation, declarative field-level errors |
| HTTP Client | Axios | Interceptors, request cancellation, typed responses |
| Backend | Express 5 | Minimal, well-understood, async handler support |
| ORM | Prisma 7 | Type-safe queries, migration tooling, raw SQL escape hatch |
| Database | PostgreSQL (Neon) | ACID transactions, serverless scaling, CHECK constraints |
| Auth | JWT + bcryptjs | Stateless auth, password hashing with 10-round salt |
| Validation | Zod | Shared schema validation across client and server |
| Notifications | Sonner | Lightweight toast library for user feedback |

---

## Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        UUID id PK
        STRING name
        STRING email UQ
        STRING password
        DATETIME createdAt
        DATETIME updatedAt
    }

    RESERVATION {
        UUID id PK
        UUID userId FK
        UUID eventId FK
        ENUM status
        DATETIME createdAt
        DATETIME updatedAt
    }

    EVENT {
        UUID id PK
        STRING name
        STRING description
        INT totalSeats
        INT availableSeats
        DATETIME createdAt
        DATETIME updatedAt
    }

    USER ||--o{ RESERVATION : has
    EVENT ||--o{ RESERVATION : contains
```

### Schema Highlights

**Reservation status** is an enum: `ACTIVE | CANCELLED`

**Database-level constraints:**

| Constraint | Purpose |
|---|---|
| `@@unique([userId, eventId])` on Reservation | Prevents a user from holding duplicate reservations for the same event |
| `UNIQUE` on `User.email` | Prevents duplicate accounts |
| `availableSeats > 0` check via atomic SQL | Prevents overbooking at the query level |
| Foreign keys with `onDelete: Cascade` | Cleans up reservations when a user is deleted |
| `@@index([eventId])` on Reservation | Fast lookup of reservations by event |

### Why Three Tables

Putting reservations in a separate table (instead of an array on Event or User) allows:
- Enforcing the unique `(userId, eventId)` constraint at the database level
- Querying reservations independently (e.g., "all active reservations for event X")
- Tracking reservation history (ACTIVE vs CANCELLED) without data loss
- Clean foreign key relationships with referential integrity

---

## Backend Design

### Layered Architecture

```
Request → Route → Middleware → Controller → Prisma → Response
```

- **Routes** define HTTP method + path, attach middleware, delegate to controllers
- **Middleware** handles cross-cutting concerns (auth, CORS)
- **Controllers** contain all business logic, validation, and database operations
- **Prisma** provides type-safe database access

### Input Validation

All request bodies are validated using Zod schemas before processing:
- `signupSchema`: name (min 2), email (valid format), password (min 6)
- `loginSchema`: email, password
- Pagination params validated with defaults (page=1, limit=20)

Invalid input returns a `400` with a descriptive error message before any database call.

### Error Handling Strategy

Controllers return structured JSON responses:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Descriptive message" }
```

Specific Prisma errors are caught and mapped:

| Prisma Code | Meaning | HTTP Status |
|---|---|---|
| P2002 | Unique constraint violation | 409 Conflict |
| P2025 | Record not found (optimistic lock) | 404 Not Found |

Domain-specific error codes are used on the frontend to show contextual messages (e.g., `EVENT_FULL`, `ALREADY_RESERVED`, `RESERVATION_NOT_FOUND`).

---

## Frontend Design

### Page Map

| Route | Component | Auth | Description |
|---|---|---|---|
| `/` | `page.tsx` | Optional | Event listing with pagination |
| `/login` | `login/page.tsx` | Guest only | Sign up / sign in toggle form |
| `/my-reservations` | `my-reservations/page.tsx` | Required | User's active & cancelled reservations |

### Component Hierarchy

```
layout.tsx
├── Providers
│   ├── AuthInitializer (checks localStorage token on mount)
│   └── Toaster (Sonner notifications)
└── page content
    ├── Header (auth-aware navigation)
    ├── EventGrid (paginated event list + actions)
    │   └── EventCard[] (individual event display)
    └── ...page-specific content
```

### EventCard Design

Each card shows:
- Event name with an availability badge (green "Available" / red "Sold Out")
- Date and location with icons
- Seat count as "X of Y seats" with a visual progress bar
- Context-sensitive action button:

| State | Button |
|---|---|
| Seats available, not reserved | "Reserve Seat" (primary) |
| User has active reservation | "Cancel Reservation" (destructive) |
| Fully booked | "Fully Booked" (disabled) |
| Action in progress | Spinner + "Reserving..." / "Cancelling..." |

### Pagination

- Default page size: 12 events
- Server returns `{ total, totalPages, page, limit }` metadata
- Numbered page buttons with Previous/Next navigation
- Handles large event lists without loading all records

### UX Safeguards

- **Double-click prevention**: `actionInProgress` map disables buttons per-event during API calls
- **Loading states**: Skeleton-equivalent loading indicators while fetching
- **Toast notifications**: Success/error feedback via Sonner
- **Redirect on auth**: Login page redirects home if authenticated; reservations page redirects to login if not
- **Optimistic updates**: Event store updated immediately after successful action, then reconciled with server data

---

## Authentication Flow

### Signup → Auto-Login

```
Client                          Server
  │                               │
  │─── POST /api/auth/signup ────►│  Validate → hash password → create user
  │◄── { userId, email } ──────── │
  │                               │
  │─── POST /api/auth/login ─────►│  Validate → compare hash → sign JWT (1h)
  │◄── { token } ──────────────── │
  │                               │
  │  localStorage.setItem(token)  │
  │                               │
  │─── GET /api/auth/me ─────────►│  Verify JWT → return user profile
  │◄── { user } ───────────────── │
  │                               │
  │  zustand: setUser(user)       │
```

### Token Lifecycle

1. JWT signed with `JWT_SECRET`, expires in 1 hour
2. Stored in `localStorage` on the client
3. Sent as `Authorization: Bearer <token>` header
4. `AuthInitializer` validates token on app mount by calling `/auth/me`
5. Invalid/expired tokens are cleared from `localStorage`
6. Sign out clears both `localStorage` and Zustand auth store

### Middleware Variants

- **`authMiddleware`**: Rejects requests without a valid token (401)
- **`optionalAuthMiddleware`**: Extracts user if token present, continues regardless

---

## Concurrency & Race Condition Handling

This is the most critical design concern. Multiple users may attempt to reserve the last seat simultaneously.

### Approach: Atomic SQL with Conditional Update

```sql
UPDATE "Event"
SET "availableSeats" = "availableSeats" - 1
WHERE "id" = $1 AND "availableSeats" > 0
RETURNING "id"
```

**Why this works:**
- PostgreSQL acquires a row-level lock during UPDATE
- The `WHERE availableSeats > 0` condition is checked atomically
- Only one concurrent UPDATE can succeed for the last seat
- If `RETURNING` returns no rows, the seat was taken — no overbooking

### Full Reservation Transaction

```
BEGIN TRANSACTION
  1. Atomic UPDATE: decrement availableSeats (only if > 0)
  2. If no rows affected → event is full, ROLLBACK
  3. CREATE reservation with status ACTIVE
  4. If unique constraint violated → already reserved, ROLLBACK
COMMIT
```

### Cancellation Transaction

```
BEGIN TRANSACTION
  1. UPDATE reservation: set status to CANCELLED (only if ACTIVE)
  2. If no rows affected → reservation not found, ROLLBACK
  3. Atomic UPDATE: increment availableSeats
COMMIT
```

Both paths use `prisma.$transaction()` to ensure atomicity.

---

## State Management

### Zustand Stores

**AuthStore** — manages user session:

```
┌───────────────────────── ┐
│ user: User | null        │
│ isAuthenticated: boolean │
│ loading: boolean         │
├───────────────────────── ┤
│ setUser(user)            │
│ setLoading(loading)      │
│ signOut()                │
└───────────────────────── ┘
```

**EventStore** — manages event list and UI state:

```
┌──────────────────────────────────────┐
│ events: Event[]                      │
│ pagination: { page, limit, total, …} │
│ loading: boolean                     │
│ actionInProgress: Record<id, boolean>│
├──────────────────────────────────────┤
│ setEvents(events, pagination)        │
│ setLoading(loading)                  │
│ setActionInProgress(eventId, bool)   │
│ updateEvent(eventId, partialUpdate)  │
└──────────────────────────────────────┘
```

`actionInProgress` is a map of `eventId → boolean`, enabling per-card loading states without affecting other cards.

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Register a new user |
| POST | `/api/auth/login` | No | Authenticate and receive JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Events

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/events?page=1&limit=20` | No | List events (paginated) |
| GET | `/api/events/:id` | Optional | Event detail + user's reservation |
| POST | `/api/events/:id/reserve` | Yes | Reserve a seat |
| DELETE | `/api/events/:id/reserve` | Yes | Cancel a reservation |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | No | List all users |
| GET | `/api/users/:id/reservations` | Yes | Get user's reservations |

### Seed

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/seed` | No | Populate database with test data |

---

## Project Structure

```
sitorstartai/
├── apps/
│   ├── server/
│   │   └── src/
│   │       ├── index.ts                 # Express app entry, CORS, route mounting
│   │       ├── controllers/
│   │       │   ├── auth.controllers.ts  # signup, login, me
│   │       │   ├── event.controllers.ts # list, detail, reserve, cancel
│   │       │   ├── user.controllers.ts  # list users, user reservations
│   │       │   └── seed.controllers.ts  # database seeding
│   │       ├── routes/
│   │       │   ├── auth.routes.ts
│   │       │   ├── events.routes.ts
│   │       │   ├── user.routes.ts
│   │       │   └── seed.routes.ts
│   │       ├── middleware/
│   │       │   └── auth.middleware.ts   # JWT verification (required + optional)
│   │       └── utils/
│   │           ├── schemas.ts           # Zod validation schemas
│   │           └── types.ts             # TypeScript type definitions
│   └── web/
│       └── src/
│           ├── app/
│           │   ├── layout.tsx           # Root layout with providers
│           │   ├── page.tsx             # Home — event listing
│           │   ├── login/page.tsx       # Sign up / sign in form
│           │   ├── my-reservations/
│           │   │   └── page.tsx         # User's reservations
│           │   └── api/
│           │       ├── api.ts           # API endpoint URLs
│           │       └── operations/
│           │           ├── auth-apis.ts # Auth API calls
│           │           └── event-apis.ts# Event API calls
│           ├── components/
│           │   ├── header.tsx           # Navigation with auth state
│           │   ├── event-grid.tsx       # Paginated event list + actions
│           │   ├── event-card.tsx       # Individual event card
│           │   ├── auth-initializer.tsx # Token validation on mount
│           │   ├── providers.tsx        # Root providers wrapper
│           │   └── ui/                  # shadcn components
│           ├── stores/
│           │   ├── auth-store.ts        # Zustand auth state
│           │   └── event-store.ts       # Zustand event + pagination state
│           └── utils/
│               ├── api-connector.ts     # Axios wrapper
│               └── api-connection.ts    # BASE_URL config
├── packages/
│   ├── db/
│   │   └── prisma/schema/schema.prisma  # Database schema
│   ├── env/
│   │   └── src/
│   │       ├── server.ts                # Server env validation
│   │       └── web.ts                   # Web env validation
│   └── config/                          # Shared TS & ESLint config
├── package.json                         # Bun workspace root
└── requirements.md
```

---

## Deployment Plan

### Target Deployment Topology

- **Frontend**: Next.js app (`apps/web`) deployed on AWS at `https://assignment.lokeshh.com`
- **Backend**: Express API (`apps/server`) deployed on AWS at `https://assignmentserver.lokeshh.com`
- **Database**: PostgreSQL (Neon) connected to backend via `DATABASE_URL`
- **CORS**: Backend allows only the deployed frontend origin via `CORS_ORIGIN`

### Environment & Runtime Requirements

- Backend must have:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `CORS_ORIGIN=https://assignment.lokeshh.com`
  - `NODE_ENV=production`
  - Any server envs validated by `packages/env/src/server.ts`
- Frontend must have:
  - `NEXT_PUBLIC_SERVER_URL` pointing to deployed backend
  - Any web envs validated by `packages/env/src/web.ts`

### Deployment Validation Checklist

After deployment, validate:

1. Frontend URL (`https://assignment.lokeshh.com`) loads and event list renders
2. Backend API URL (`https://assignmentserver.lokeshh.com`) is reachable
3. `/api/events` returns paginated data from production DB
4. Auth flow works (signup/login/me)
5. Reserve/cancel works from deployed UI against live DB
6. Concurrency safety still holds (no overbooking / negative seats)
7. CORS policy blocks non-frontend origins

---

## Engineering Decisions 

### 1) What tradeoffs did you make due to time constraints?

- Prioritized reservation correctness and race-condition safety over feature breadth
- Kept business logic in controllers for speed instead of adding an extra service layer
- Built strong UX for core flows (loading/disabled/toasts), but skipped advanced product features (search/filter/admin analytics)
- Focused on schema constraints + transactional integrity first; postponed deeper test automation

### 2) Which part of the system is most likely to break at higher scale?

- **Most likely bottleneck**: Event listing read path with offset pagination (`skip/take`) plus `count()` per request for very large datasets
- **Hot-row contention risk**: Heavily demanded events create write contention on a single `Event` row during reserve/cancel (correctness remains intact, latency may rise)

### 3) Which part of your implementation do you trust the most, and why?

- **Most trusted**: Reserve/cancel transactional flow
- It combines:
  - Atomic seat updates at SQL level (`availableSeats > 0` condition)
  - Single transaction boundaries via `prisma.$transaction()`
  - Database constraints (`@@unique([userId, eventId])` + seat check constraints)
- This layered protection gives high confidence against overbooking and duplicate active reservations

### 4) If you had 2 more days, what would you improve or redesign?

- Add integration + concurrency tests for reserve/cancel and auth-protected flows
- Replace offset pagination with cursor pagination and optimize metadata strategy for large lists
- Harden auth/session model (e.g., cookie implementation)
- Extract controller logic into service modules for better maintainability and testability
