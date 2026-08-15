# Menu Planner

A responsive web app to manage recipes, plan weekly menus, and build shopping lists — synced across phone and desktop via [Supabase](https://supabase.com) (free tier).

## Features

- **Recipes** — scrollable list, detail view with scaled ingredients, add/edit/delete
- **Menu** — generate a 7-day menu from your recipes, shuffle or remove individual days
- **Shopping list** — add/remove items, adjust quantities, import ingredients from the current menu
- **Mobile-friendly** — bottom navigation, touch-friendly controls

## Quick start

### 1. Create a Supabase project (free)

1. Go to [supabase.com](https://supabase.com) and create an account + project.
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

### 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### 4. Deploy (optional, still free)

Deploy the frontend to [Vercel](https://vercel.com) or [Netlify](https://netlify.com):

```bash
npm run build
```

Set the same `VITE_SUPABASE_*` environment variables in your hosting dashboard. Your phone and computer will share the same Supabase database.

## Data model

| Entity | Fields |
|--------|--------|
| **Recipe** | name, source link, prep/cook duration, servings |
| **Ingredient** | name, category |
| **Quantity** | value + unit (on recipe ingredients & shopping list) |
| **Instruction** | ordered steps |
| **Menu item** | recipe + date |
| **Shopping item** | ingredient + quantity + checked state |

## Project structure

```
src/
  components/   # Layout, shared UI
  pages/        # Recipes, detail, form, menu, shopping
  lib/
    api/        # Supabase CRUD helpers
    types.ts    # Shared types & helpers
    supabase.ts # Client setup
supabase/
  schema.sql    # Database schema to run in Supabase
```

## Security note

The default schema uses open Row Level Security policies suitable for personal use. For shared or public deployment, add [Supabase Auth](https://supabase.com/docs/guides/auth) and restrict policies to authenticated users.

## Tech stack

- React 19 + TypeScript + Vite
- React Router
- Supabase (PostgreSQL)
- Tailwind CSS 4
