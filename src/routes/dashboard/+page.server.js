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
    .select(`
      id, name, color,
      tasks(
        id, title, status, priority, tag, due_date, "order", created_at,
        task_assignees(users(id, name, initials, color, text_color)),
        checklist_items(id, done),
        comments(id)
      )
    `)
    .order('created_at', { ascending: false });

  if (ids.length) {
    query = query.or(`owner_id.eq.${locals.user.id},id.in.(${ids.join(',')})`);
  } else {
    query = query.eq('owner_id', locals.user.id);
  }

  const { data: projects } = await query;

  // Flatten all tasks with their project info attached
  const allTasks = (projects || []).flatMap(p =>
    (p.tasks || []).map(t => ({
      ...t,
      assignees: (t.task_assignees || []).map(a => a.users),
      checklistTotal: (t.checklist_items || []).length,
      checklistDone:  (t.checklist_items || []).filter(i => i.done).length,
      commentCount:   (t.comments || []).length,
      project: { id: p.id, name: p.name, color: p.color }
    }))
  );

  return { allTasks };
}
