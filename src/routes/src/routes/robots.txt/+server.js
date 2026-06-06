export async function GET() {
  return new Response(
    `User-agent: *\nDisallow: /api/secret`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
