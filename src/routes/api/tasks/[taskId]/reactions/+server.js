import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function POST({ params, request, locals }) {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const { emoji } = await request.json();

  // Toggle: if user already reacted with this emoji, remove it; otherwise add
  const { data: existing } = await db
    .from('task_reactions')
    .select('id')
    .eq('task_id', params.taskId)
    .eq('user_id', locals.user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    await db.from('task_reactions').delete().eq('id', existing.id);
  } else {
    await db.from('task_reactions').insert({
      task_id: params.taskId,
      user_id: locals.user.id,
      emoji
    });
  }

  const { data: reactions } = await db
    .from('task_reactions')
    .select('id, emoji, user_id')
    .eq('task_id', params.taskId);

  return json(reactions || []);
}
