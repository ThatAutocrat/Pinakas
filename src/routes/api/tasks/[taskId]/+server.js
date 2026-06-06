import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// Helper — returns true if the user owns or is a member of the task's project
async function canAccessTask(taskId, userId) {
  const { data: task } = await db
    .from('tasks')
    .select('project_id, projects(owner_id)')
    .eq('id', taskId)
    .single();

  if (!task) return false;
  if (task.projects.owner_id === userId) return true;

  const { data: member } = await db
    .from('project_members')
    .select('id')
    .eq('project_id', task.project_id)
    .eq('user_id', userId)
    .maybeSingle();

  return !!member;
}

export async function PATCH({ params, request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await canAccessTask(params.taskId, locals.user.id))) {
    return json({ error: 'Nice try 😏' }, { status: 403 });
  }

  const body = await request.json();
  const mapped = {};
  if (body.status !== undefined) mapped.status = body.status;
  if (body.title !== undefined) mapped.title = body.title;
  if (body.description !== undefined) mapped.description = body.description;
  if (body.priority !== undefined) mapped.priority = body.priority;
  if (body.dueDate !== undefined) mapped.due_date = body.dueDate;
  if (body.tag !== undefined) mapped.tag = body.tag;
  if (body.order !== undefined) mapped.order = body.order;

  const { data: task, error } = await db
    .from('tasks')
    .update(mapped)
    .eq('id', params.taskId)
    .select(`*, task_assignees(users(id,name,initials,color,text_color)), checklist_items(id,text,done), task_reactions(id,emoji,user_id)`)
    .single();

  if (error) return json({ error: error.message }, { status: 500 });

  return json({
    ...task,
    assignees: (task.task_assignees || []).map(a => a.users),
    checklist: task.checklist_items || [],
    reactions: task.task_reactions || []
  });
}

export async function DELETE({ params, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await canAccessTask(params.taskId, locals.user.id))) {
    return json({ error: 'Nice try 😏' }, { status: 403 });
  }

  const { error } = await db.from('tasks').delete().eq('id', params.taskId);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ success: true });
}
