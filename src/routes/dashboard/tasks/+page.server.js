import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';


export async function load({ locals }) {
  if (!locals.user) redirect(302, '/login');

  const { data: memberRows } = await db
    .from('project_members').select('project_id').eq('user_id', locals.user.id);
  const ids = (memberRows || []).map(m => m.project_id);

  let projectIds = [];

  if (ids.length) {
    const { data: myProjects } = await db.from('projects')
      .select('id').or(`owner_id.eq.${locals.user.id},id.in.(${ids.join(',')})`);
    projectIds = (myProjects || []).map(p => p.id);
  } else {
    const { data: myProjects } = await db.from('projects')
      .select('id').eq('owner_id', locals.user.id);
    projectIds = (myProjects || []).map(p => p.id);
  }

  // only change from your original
  if (!projectIds.length) return { tasks: [] };

  const { data: tasks } = await db.from('tasks').select(`
    id, title, status, priority, tag, due_date, created_at,
    projects(id, name, color),
    task_assignees(users(id, name, initials, color, text_color)),
    checklist_items(id, done),
    task_reactions(id, emoji, user_id)
  `)
  .in('project_id', projectIds)
  .order('created_at', { ascending: false });

  return {
    tasks: (tasks || []).map(t => ({
      ...t,
      project: t.projects,
      assignees: (t.task_assignees || []).map(a => a.users),
      checklist: t.checklist_items || [],
      reactions: t.task_reactions || []
    }))
  };
}
