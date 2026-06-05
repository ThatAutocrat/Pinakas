import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function load({ locals }) {
  if (!locals.user) redirect(302, '/login');

  const { data: memberRows } = await db
    .from('project_members')
    .select('project_id')
    .eq('user_id', locals.user.id);

  const ids = (memberRows || []).map(m => m.project_id);

  let query = db
    .from('projects')
    .select('id, name, color, status, due_date, owner_id, tasks(count)')
    .order('created_at', { ascending: false });

  if (ids.length) {
    query = query.or(`owner_id.eq.${locals.user.id},id.in.(${ids.join(',')})`);
  } else {
    query = query.eq('owner_id', locals.user.id);
  }

  const { data: projects } = await query;

  return {
    user: locals.user,
    projects: (projects || []).map(p => ({
      ...p,
      _count: { tasks: p.tasks?.[0]?.count ?? 0 }
    }))
  };
}
