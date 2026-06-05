import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function load({ params, locals }) {
  if (!locals.user) return;

  // Check access
  const { data: project, error: err } = await db
    .from('projects')
    .select(`
      id, name, color, status, due_date, owner_id,
      owner:users!projects_owner_id_fkey(id, name, initials),
      project_members(id, role, users(id, name, initials, color, text_color)),
      tasks(
        id, title, description, status, priority, tag, due_date, created_at,
        task_assignees(users(id, name, initials, color, text_color)),
        checklist_items(id, text, done),
        comments(id, body, created_at, users!comments_author_id_fkey(id, name, initials)),
        task_reactions(id, emoji, user_id)
      )
    `)
    .eq('id', params.id)
    .single();

  if (err || !project) error(404, 'Project not found');

  // Auth gate
  const { data: memberCheck } = await db
    .from('project_members')
    .select('id')
    .eq('project_id', params.id)
    .eq('user_id', locals.user.id)
    .maybeSingle();

  if (project.owner_id !== locals.user.id && !memberCheck) {
    error(403, 'Access denied');
  }

  const columns = ['Backlog', 'To do', 'In progress', 'Done'];

  // Normalize tasks
  const tasks = (project.tasks || []).map(t => ({
    ...t,
    assignees: (t.task_assignees || []).map(a => a.users),
    checklist: t.checklist_items || [],
    comments: (t.comments || []).map(c => ({
      ...c,
      author: c.users
    })),
    reactions: t.task_reactions || []
  }));

  const board = Object.fromEntries(
    columns.map(col => [col, tasks.filter(t => t.status === col)])
  );

  const allMembers = [
    project.owner,
    ...(project.project_members || []).map(m => m.users)
  ].filter((u, i, arr) => u && arr.findIndex(x => x?.id === u.id) === i);

  return { project, board, columns, allMembers };
}

export const actions = {
  createTask: async ({ request, params, locals }) => {
    const data = await request.formData();
    const title = data.get('title')?.toString().trim();
    const status = data.get('status')?.toString() || 'Backlog';
    const priority = data.get('priority')?.toString() || 'Medium';
    const tag = data.get('tag')?.toString() || 'Feature';
    const description = data.get('description')?.toString() || '';
    const dueDate = data.get('dueDate')?.toString();

    if (!title) return fail(400, { error: 'Title required' });

    const { error: err } = await db.from('tasks').insert({
      title, status, priority, tag, description,
      due_date: dueDate || null,
      project_id: params.id
    });
    if (err) return fail(500, { error: err.message });
  },

  updateTask: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id')?.toString();
    const update = {};
    const status = data.get('status')?.toString();
    const title = data.get('title')?.toString();
    const description = data.get('description')?.toString();
    const priority = data.get('priority')?.toString();
    const dueDate = data.get('dueDate')?.toString();

    if (status) update.status = status;
    if (title) update.title = title;
    if (description !== undefined) update.description = description;
    if (priority) update.priority = priority;
    if (dueDate !== undefined) update.due_date = dueDate || null;

    await db.from('tasks').update(update).eq('id', id);
  },

  deleteTask: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id')?.toString();
    await db.from('tasks').delete().eq('id', id);
  },

  addComment: async ({ request, locals }) => {
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    const body = data.get('body')?.toString().trim();
    if (!taskId || !body) return fail(400, { error: 'Missing fields' });
    await db.from('comments').insert({ task_id: taskId, body, author_id: locals.user.id });
  },

  toggleChecklist: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id')?.toString();
    const done = data.get('done') === 'true';
    await db.from('checklist_items').update({ done }).eq('id', id);
  },

  toggleReaction: async ({ request, locals }) => {
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    const emoji = data.get('emoji')?.toString();

    const { data: existing } = await db
      .from('task_reactions')
      .select('id')
      .eq('task_id', taskId)
      .eq('user_id', locals.user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      await db.from('task_reactions').delete().eq('id', existing.id);
    } else {
      await db.from('task_reactions').insert({ task_id: taskId, user_id: locals.user.id, emoji });
    }
  }
};
