import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function POST({ request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId, email } = await request.json();
  if (!projectId || !email) return json({ error: 'Missing fields' }, { status: 400 });

  // Must be owner or member
  const { data: project } = await db.from('projects').select('id,name,owner_id').eq('id', projectId).single();
  if (!project) return json({ error: 'Project not found' }, { status: 404 });

  // Create invite
  const { data: invite, error } = await db
    .from('project_invites')
    .insert({ project_id: projectId, email: email.toLowerCase().trim(), invited_by: locals.user.id })
    .select()
    .single();

  if (error) return json({ error: error.message }, { status: 500 });

  const inviteUrl = `${request.headers.get('origin')}/invite/${invite.token}`;
  return json({ inviteUrl, token: invite.token });
}
