# Ink

A minimalist writing app with AI-powered prompts to spark creativity.

## Stack

- **Next.js 16** + React 19
- **Tiptap** rich text editor
- **Prisma** + Turso (libSQL)
- **Clerk** authentication
- **Tailwind CSS**

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local

# Initialize database
bun run db:generate
bun run db:push

# Run dev server
bun run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run db:studio` | Open Prisma Studio |

## Environment Variables

```
DATABASE_URL=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```
