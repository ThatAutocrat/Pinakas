-- ============================================================
-- Pinakas — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create extension if not exists "pgcrypto";

-- Users
create table if not exists users (
  id            text primary key default gen_random_uuid()::text,
  email         text unique not null,
  name          text not null,
  initials      text not null,
  color         text not null default '#EAF3DE',
  text_color    text not null default '#27500A',
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- Sessions (Lucia auth)
create table if not exists sessions (
  id         text primary key,
  user_id    text not null references users(id) on delete cascade,
  expires_at timestamptz not null
);

-- Projects
create table if not exists projects (
  id         text primary key default gen_random_uuid()::text,
  name       text not null,
  color      text not null default '#639922',
  status     text not null default 'On track',
  due_date   text,
  owner_id   text not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Project members
create table if not exists project_members (
  id         text primary key default gen_random_uuid()::text,
  project_id text not null references projects(id) on delete cascade,
  user_id    text not null references users(id) on delete cascade,
  role       text not null default 'member',
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

-- Tasks
create table if not exists tasks (
  id          text primary key default gen_random_uuid()::text,
  title       text not null,
  description text,
  status      text not null default 'Backlog',
  priority    text not null default 'Medium',
  tag         text not null default 'Feature',
  due_date    text,
  "order"     int not null default 0,
  project_id  text not null references projects(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Task assignees
create table if not exists task_assignees (
  id      text primary key default gen_random_uuid()::text,
  task_id text not null references tasks(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  unique(task_id, user_id)
);

-- Checklist items
create table if not exists checklist_items (
  id         text primary key default gen_random_uuid()::text,
  task_id    text not null references tasks(id) on delete cascade,
  text       text not null,
  done       boolean not null default false,
  "order"    int not null default 0,
  created_at timestamptz not null default now()
);

-- Comments
create table if not exists comments (
  id         text primary key default gen_random_uuid()::text,
  task_id    text not null references tasks(id) on delete cascade,
  author_id  text not null references users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- Task reactions (anime moods) — unique per user+task+emoji
create table if not exists task_reactions (
  id         text primary key default gen_random_uuid()::text,
  task_id    text not null references tasks(id) on delete cascade,
  user_id    text not null references users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique(task_id, user_id, emoji)
);

-- Indexes
create index if not exists idx_tasks_project        on tasks(project_id);
create index if not exists idx_project_members_user on project_members(user_id);
create index if not exists idx_sessions_user        on sessions(user_id);
create index if not exists idx_task_reactions_task  on task_reactions(task_id);
create index if not exists idx_comments_task        on comments(task_id);
create index if not exists idx_checklist_task       on checklist_items(task_id);

-- ── Project invites ──────────────────────────────────────────
create table if not exists project_invites (
  id         text primary key default gen_random_uuid()::text,
  token      text unique not null default encode(gen_random_bytes(32),'hex'),
  project_id text not null references projects(id) on delete cascade,
  email      text not null,
  invited_by text not null references users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_invites_token on project_invites(token);
