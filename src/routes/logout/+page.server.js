import { redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth.js';

export const actions = {
  default: async ({ locals, cookies }) => {
    if (!locals.session) redirect(302, '/login');
    await lucia.invalidateSession(locals.session.id);
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies.set(sessionCookie.name, sessionCookie.value, { path: '.', ...sessionCookie.attributes });
    redirect(302, '/login');
  }
};
