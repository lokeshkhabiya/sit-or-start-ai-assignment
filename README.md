# sitorstartai

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Express** - Fast, unopinionated web framework
- **Bun** - Runtime environment
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Prisma.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
sitorstartai/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   └── server/      # Backend API (Express)
├── packages/
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI

## Deployment (AWS)

The application is deployed to AWS with a separate frontend and backend:

- Frontend (`apps/web`): hosted on AWS at `https://assignment.lokeshh.com`
- Backend (`apps/server`): hosted on AWS API domain
- Database: Neon Postgres

### Production API

- Backend base URL: `https://assignmentserver.lokeshh.com`

The frontend API connector (`apps/web/src/utils/api-connection.ts`) is configured to use this URL.

### Required environment variables

Set these for production deployments:

**Backend (`apps/server`)**
- `PORT`
- `DATABASE_URL`
- `CORS_ORIGIN=https://assignment.lokeshh.com`
- `NODE_ENV=production`
- `JWT_SECRET`

**Frontend (`apps/web`)**
- `NEXT_PUBLIC_SERVER_URL` (set to your deployed backend URL)

### Post-deploy verification

1. Open deployed frontend and confirm event list loads
2. Verify `GET https://assignmentserver.lokeshh.com/api/events` returns paginated data
3. Verify signup/login flow works end-to-end
4. Verify reserve/cancel actions update seats correctly
5. Verify CORS allows only `https://assignment.lokeshh.com` in production
