# Pinakas 

(πίνακας) is a greek word used for anything from a blackboard to a painting, table, or chart.

### A Project management board 
<img width="1920" height="928" alt="image" src="https://github.com/user-attachments/assets/ac4c7cee-c063-48f5-8e8e-e446cb58ad24" />


---

## Setup (2 minutes)

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New project.

### 2. Run the schema
In your Supabase dashboard → **SQL Editor** → paste and run `supabase/schema.sql`.

Optionally run `supabase/seed.sql` for demo accounts.

### 3. Get your credentials
In Supabase dashboard → **Settings** → **API**:
- `Project URL` → `PUBLIC_SUPABASE_URL`
- `anon public` key → `PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

In **Settings** → **Database** → **Connection string** → **URI** (use the **pooler** URI for serverless):
- Paste as `DATABASE_URL`

### 4. Configure .env
```
PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:5432/postgres"
```

### 5. Install and run
```bash
npm install
npm run dev
```

---


## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 + Svelte 5 |
| Auth | Lucia v3 + `@lucia-auth/adapter-postgresql` |
| Database | Supabase (PostgreSQL) |
| DB Client | `@supabase/supabase-js` (service-role, server-only) |
| Styling | Vanilla CSS with CSS variables |

## Database schema

```
users ──< sessions              (lucia auth)
users ──< projects              (owner)
projects ──< project_members >── users
projects ──< tasks
tasks ──< task_assignees >── users
tasks ──< checklist_items
tasks ──< comments >── users (author)
tasks ──< task_reactions >── users   ← anime moods
```

