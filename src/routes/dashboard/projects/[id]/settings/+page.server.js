import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export async function load({ params, locals }) {
  if (!locals.user) return;

  const { data: project } = await db
    .from('projects')
    .select('id, name, color, status, due_date, owner_id, project_members(id, role, users(id, name, initials, email, color, text_color))')
    .eq('id', params.id)
    .single();

  if (!project) error(404, 'Project not found');
  if (project.owner_id !== locals.user.id) error(403, 'Only the project owner can manage settings');

  const { data: invites } = await db
    .from('project_invites')
    .select('id, email, created_at, expires_at, used_at')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return { project, invites: invites || [], isOwner: true, user: locals.user };
}

export const actions = {
  invite: async ({ request, params, locals }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();
    if (!email) return fail(400, { error: 'Email is required' });

    const { data: invite, error: err } = await db
      .from('project_invites')
      .insert({ project_id: params.id, email, invited_by: locals.user.id })
      .select()
      .single();

    if (err) return fail(500, { error: 'Could not create invite' });

    const inviteUrl = `${request.headers.get('origin')}/invite/${invite.token}`;
    return { inviteUrl };
  },

  removeMember: async ({ request, params, locals }) => {
    const data = await request.formData();
    const userId = data.get('userId')?.toString();
    if (userId === locals.user.id) return fail(400, { error: "Can't remove yourself" });
    await db.from('project_members').delete()
      .eq('project_id', params.id).eq('user_id', userId);
  },

  updateProject: async ({ request, params }) => {
    const data = await request.formData();
    const name   = data.get('name')?.toString().trim();
    const color  = data.get('color')?.toString();
    const status = data.get('status')?.toString();
    const dueDate = data.get('dueDate')?.toString();
    if (!name) return fail(400, { error: 'Name required' });
    await db.from('projects').update({ name, color, status, due_date: dueDate || null }).eq('id', params.id);
  }
};
