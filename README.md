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

## Deployment (Vercel + API)

The frontend (`apps/web`) is deployed on Vercel, and the backend (`apps/server`) should be deployed separately (for example on Railway/Render/Fly).

### 1) Deploy backend first

Set these environment variables for the backend service:

- `PORT`
- `DATABASE_URL`
- `CORS_ORIGIN` (set this to your Vercel frontend domain)
- `NODE_ENV=production`
- `JWT_SECRET`

After deployment, copy your backend public URL (for example `https://your-api.example.com`).

### 2) Deploy frontend on Vercel

Import this repository in Vercel. The included `vercel.json` sets install/build commands for this monorepo:

- Install: `bun install`
- Build: `bun run --filter web build -- --webpack`

Set this required environment variable in the Vercel project:

- `NEXT_PUBLIC_SERVER_URL` = your deployed backend URL

Then deploy. Vercel will serve the Next.js app from `apps/web`.
