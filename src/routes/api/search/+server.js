import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function GET({ url, locals }) {
  if (!locals.user) return json([]);
  const q = url.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return json([]);

  // Get accessible project IDs
  const { data: memberRows } = await db.from('project_members').select('project_id').eq('user_id', locals.user.id);
  const memberIds = (memberRows || []).map(m => m.project_id);
  const { data: ownedProjects } = await db.from('projects').select('id').eq('owner_id', locals.user.id);
  const ownedIds = (ownedProjects || []).map(p => p.id);
  const allIds = [...new Set([...memberIds, ...ownedIds])];

  const results = [];

  // Search projects
  const { data: projects } = await db.from('projects')
    .select('id, name, color')
    .ilike('name', `%${q}%`)
    .in('id', allIds.length ? allIds : ['none'])
    .limit(3);

  for (const p of projects || []) {
    results.push({ type: 'project', title: p.name, href: `/dashboard/projects/${p.id}`, subtitle: 'Project' });
  }

  // Search tasks
  if (allIds.length) {
    const { data: tasks } = await db.from('tasks')
      .select('id, title, status, project_id, projects(name)')
      .ilike('title', `%${q}%`)
      .in('project_id', allIds)
      .limit(8);

    for (const t of tasks || []) {
      results.push({
        type: 'task',
        title: t.title,
        href: `/dashboard/projects/${t.project_id}`,
        subtitle: t.projects?.name ?? ''
      });
    }
  }

  return json(results);
}
