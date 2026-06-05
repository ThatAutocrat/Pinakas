import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function load({ params, locals }) {
  const { data: invite } = await db
    .from('project_invites')
    .select('*, projects(id,name,color)')
    .eq('token', params.token)
    .maybeSingle();

  if (!invite) error(404, 'Invite not found or expired');
  if (invite.used_at) error(410, 'This invite has already been used');
  if (new Date(invite.expires_at) < new Date()) error(410, 'This invite has expired');

  return { invite, project: invite.projects, loggedIn: !!locals.user, user: locals.user };
}

export const actions = {
  accept: async ({ params, locals, url }) => {
    if (!locals.user) redirect(302, `/login?redirect=/invite/${params.token}`);

    const { data: invite } = await db
      .from('project_invites')
      .select('*')
      .eq('token', params.token)
      .maybeSingle();

    if (!invite || invite.used_at || new Date(invite.expires_at) < new Date()) {
      error(410, 'Invite is no longer valid');
    }

    // Add to project_members (ignore if already member)
    await db.from('project_members').upsert(
      { project_id: invite.project_id, user_id: locals.user.id, role: 'member' },
      { onConflict: 'project_id,user_id' }
    );

    // Mark used
    await db.from('project_invites').update({ used_at: new Date().toISOString() }).eq('id', invite.id);

    redirect(302, `/dashboard/projects/${invite.project_id}`);
  }
};
