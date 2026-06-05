import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function POST({ request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const { title, status, projectId, order } = await request.json();

  // Verify the user has access to this project
  const { data: project } = await db
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .single();

  if (!project) return json({ error: 'Project not found' }, { status: 404 });

  if (project.owner_id !== locals.user.id) {
    const { data: memberCheck } = await db
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', locals.user.id)
      .maybeSingle();
    if (!memberCheck) return json({ error: 'Access denied' }, { status: 403 });
  }

  const { data: task, error } = await db
    .from('tasks')
    .insert({ title, status: status ?? 'Backlog', project_id: projectId, order: order ?? 0 })
    .select(`*, task_assignees(users(id,name,initials,color,text_color)), checklist_items(id,text,done), comments(id), task_reactions(id,emoji,user_id)`)
    .single();

  if (error) return json({ error: error.message }, { status: 500 });

  return json({
    ...task,
    assignees: (task.task_assignees || []).map(a => a.users),
    checklist: task.checklist_items || [],
    comments: task.comments || [],
    reactions: task.task_reactions || []
  });
}
