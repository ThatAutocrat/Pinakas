-- Add order column to tasks table for drag-and-drop sorting
-- Run this if you already have an existing database from a previous schema

alter table tasks add column if not exists "order" int not null default 0;

-- Backfill order based on created_at within each project+status group
with ranked as (
  select id, row_number() over (partition by project_id, status order by created_at) - 1 as rn
  from tasks
)
update tasks set "order" = ranked.rn from ranked where tasks.id = ranked.id;
