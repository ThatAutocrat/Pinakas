import { redirect } from '@sveltejs/kit';

export async function GET() {
  redirect(302, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
}
