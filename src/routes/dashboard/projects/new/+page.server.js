import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';

export const actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    const color = data.get('color')?.toString() || '#639922';
    const dueDate = data.get('dueDate')?.toString();

    if (!name) return fail(400, { error: 'Project name is required.' });

    const { data: project, error } = await db
      .from('projects')
      .insert({
        name,
        color,
        due_date: dueDate ? dueDate : null,
        owner_id: locals.user.id
      })
      .select()
      .single();

    if (error) return fail(500, { error: 'Could not create project.' });
    redirect(302, `/dashboard`);
  }
};
