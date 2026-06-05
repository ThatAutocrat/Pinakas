// Supabase DB client using @supabase/supabase-js (service role for server-side)
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import ws from 'ws';

// Service-role client for server operations (bypasses RLS)
export const db = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

// ── Helpers ────────────────────────────────────────────────────────────────

export async function getUserById(id) {
  const { data } = await db.from('users').select('*').eq('id', id).single();
  return data;
}

export async function getUserByEmail(email) {
  const { data } = await db.from('users').select('*').eq('email', email).single();
  return data;
}

export async function getProjects(userId) {
  const { data: memberProjects } = await db
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId);
  const memberProjectIds = (memberProjects || []).map(m => m.project_id);
  const { data } = await db
    .from('projects')
    .select(`
      *,
      tasks(count),
      project_members(
        id, role,
        users(id, name, initials, color, text_color)
      )
    `)
    .or(`owner_id.eq.${userId},id.in.(${memberProjectIds.length ? memberProjectIds.join(',') : 'null'})`)
    .order('created_at', { ascending: false });
  return (data || []).map(p => ({
    ...p,
    _count: { tasks: p.tasks?.[0]?.count ?? 0 },
    members: p.project_members || []
  }));
}

export async function getProjectById(projectId, userId) {
  const { data: access } = await db
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .single();
  if (!access) return null;
  const { data: memberCheck } = await db
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  if (access.owner_id !== userId && !memberCheck) return null;
  const { data } = await db
    .from('projects')
    .select(`
      *,
      owner:users!projects_owner_id_fkey(id, name, initials),
      project_members(id, role, users(id, name, initials)),
      tasks(
        *,
        task_assignees(users(id, name, initials, color, text_color)),
        checklist_items(id, text, done, order),
        comments(id, body, created_at, users!comments_author_id_fkey(id, name, initials)),
        task_reactions(id, emoji, user_id)
      )
    `)
    .eq('id', projectId)
    .single();
  return data;
}

export async function getUsers() {
  const { data } = await db
    .from('users')
    .select('id, name, initials, color, text_color, email');
  return data || [];
}
