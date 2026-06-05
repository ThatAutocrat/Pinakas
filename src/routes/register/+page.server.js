import { fail, redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth.js';
import { db } from '$lib/server/db.js';
import bcrypt from 'bcryptjs';

export function load({ locals }) {
  if (locals.user) redirect(302, '/dashboard');
  return {};
}

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    const email = data.get('email')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();

    if (!name || !email || !password)
      return fail(400, { error: 'All fields are required.' });
    if (password.length < 8)
      return fail(400, { error: 'Password must be at least 8 characters.' });

    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) return fail(400, { error: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      { color: '#EAF3DE', text_color: '#27500A' },
      { color: '#E6F1FB', text_color: '#0C447C' },
      { color: '#FBEAF0', text_color: '#72243E' },
      { color: '#FAEEDA', text_color: '#633806' },
      { color: '#EEEDFE', text_color: '#3C3489' }
    ];
    const pick = colors[Math.floor(Math.random() * colors.length)];

    const { data: user, error } = await db
      .from('users')
      .insert({ name, email, password_hash: passwordHash, initials, ...pick })
      .select()
      .single();

    if (error) return fail(500, { error: 'Could not create account. Please try again.' });

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, { path: '.', ...sessionCookie.attributes });
    redirect(302, '/dashboard');
  }
};
