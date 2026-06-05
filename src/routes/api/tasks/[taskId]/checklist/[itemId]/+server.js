import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function PATCH({ params, request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const { done } = await request.json();
  const { data, error } = await db
    .from('checklist_items')
    .update({ done })
    .eq('id', params.itemId)
    .select()
    .single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json(data);
}
