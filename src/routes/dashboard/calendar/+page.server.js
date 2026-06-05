import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function load({ locals, url }) {
  if (!locals.user) redirect(302, '/login');

  const { data: memberRows } = await db
    .from('project_members').select('project_id').eq('user_id', locals.user.id);
  const ids = (memberRows || []).map(m => m.project_id);

  let projects = [];
  if (ids.length) {
    const { data } = await db.from('projects')
      .select('id, name, color, status, due_date')
      .or(`owner_id.eq.${locals.user.id},id.in.(${ids.join(',')})`);
    projects = data || [];
  } else {
    const { data } = await db.from('projects')
      .select('id, name, color, status, due_date')
      .eq('owner_id', locals.user.id);
    projects = data || [];
  }

  const projectsWithDue = projects.filter(p => p.due_date && /^\d{4}-\d{2}-\d{2}/.test(p.due_date));

  // Load all month notes for this user
  const { data: notes } = await db
    .from('month_notes')
    .select('month_key, body')
    .eq('user_id', locals.user.id);

  const notesByMonth = Object.fromEntries((notes || []).map(n => [n.month_key, n.body]));

  return { projects: projectsWithDue, notesByMonth };
}

export const actions = {
  saveNote: async ({ request, locals }) => {
    if (!locals.user) redirect(302, '/login');
    const data = await request.formData();
    const monthKey = data.get('monthKey')?.toString();
    const body = data.get('body')?.toString() ?? '';

    if (!monthKey) return;

    // Upsert — insert or update if already exists
    await db.from('month_notes').upsert(
      { user_id: locals.user.id, month_key: monthKey, body, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,month_key' }
    );
  }
};