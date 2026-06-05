import { json } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';

export async function POST({ locals, cookies }) {
  if (!locals.session) return json({ success: true });
  await lucia.invalidateSession(locals.session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies.set(sessionCookie.name, sessionCookie.value, { path: '.', ...sessionCookie.attributes });
  return json({ success: true });
}
