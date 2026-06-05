import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import pg from 'pg';
import { DATABASE_URL } from '$env/static/private';
import { dev } from '$app/environment';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

const adapter = new NodePostgresAdapter(pool, {
  user: 'users',
  session: 'sessions'
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: { secure: !dev }
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    name: attributes.name,
    initials: attributes.initials,
    color: attributes.color,
    textColor: attributes.text_color
  })
});
