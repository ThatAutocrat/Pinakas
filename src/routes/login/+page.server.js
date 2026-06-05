import { fail, redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import bcrypt from 'bcryptjs';

export async function load({ locals }) {
  if (locals.user) redirect(302, '/dashboard');
}

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();

    const { data: user } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) return fail(400, { error: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return fail(400, { error: 'Invalid email or password.' });

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, { path: '.', ...sessionCookie.attributes });
    redirect(302, '/dashboard');
  }
};
