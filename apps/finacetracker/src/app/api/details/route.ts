import { isAuthenticated } from '@/lib/auth';
import { loadStateCached } from '@/lib/store';
import { parseDetail, resolveDetail } from '@/lib/details';
export async function GET(request: Request) {
  if (!await isAuthenticated()) return Response.json({ error: 'Sign in to view details.' }, { status: 401 });
  let query;
  try { query = parseDetail(new URL(request.url).searchParams); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  const state = await loadStateCached();
  try { return Response.json(resolveDetail(state, query), { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 422 }); }
}
