# Database Setup Guide

## Prerequisites

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up a Turso database:
   - Sign up at https://turso.tech
   - Create a new database
   - Get your database URL and auth token

## Environment Variables

Add the following to your `.env.local` file:

```env
# Turso Database
DATABASE_URL="libsql://your-database-name.turso.io?authToken=your-auth-token"

# Clerk (if not already set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Getting Turso Database URL

1. Install Turso CLI (if not already installed):
   ```bash
   curl -sSfL https://get.turso.tech/install.sh | bash
   ```

2. Login to Turso:
   ```bash
   turso auth login
   ```

3. Create a database:
   ```bash
   turso db create ink-app
   ```

4. Get your database URL:
   ```bash
   turso db show ink-app --url
   ```

5. Create an auth token:
   ```bash
   turso db tokens create ink-app
   ```

6. Combine them into DATABASE_URL:
   ```
   DATABASE_URL="libsql://ink-app-your-org.turso.io?authToken=your-token-here"
   ```

## Initialize Database Schema

Since Prisma SQLite provider doesn't support `libsql://` URLs directly, we use libsql client for database operations. 

### Step 1: Generate Prisma Client (for types)

```bash
# Generate Prisma Client (uses local SQLite file for schema management)
bun run db:generate
```

### Step 2: Initialize Turso Database Schema

Run the initialization script to create tables in your Turso database:

```bash
# Using Bun script (recommended - no CLI needed)
bun run db:init
```

This script will:
- Connect to your Turso database using `DATABASE_URL` and `DATABASE_TOKEN`
- Execute the SQL schema from `scripts/init-turso-schema.sql`
- Create all necessary tables and indexes

**Alternative**: If you have Turso CLI installed:
```bash
turso db shell your-database-name < scripts/init-turso-schema.sql
```

**Important**: Make sure your `.env.local` has:
```
DATABASE_URL="libsql://your-database-name.turso.io"
DATABASE_TOKEN="your-token"
```

The application uses libsql client directly for all database operations with Turso.

## Development

- View database: `bun run db:studio`
- Create migration: `bun run db:migrate`
- Push schema changes: `bun run db:push`

