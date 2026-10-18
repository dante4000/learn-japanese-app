import { loadStateCached } from '@/lib/store';
import { parseDetail, resolveDetail } from '@/lib/details';
import { DetailContent } from '@/components/DetailPanel';
import { PageHeading } from '@/components/ui';
import Link from '@/components/AppLink';
export const dynamic = 'force-dynamic';
export default async function DetailsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) if (typeof value === 'string') params.set(key, value);
  const state = await loadStateCached();
  let data;
  try { data = resolveDetail(state, parseDetail(params)); }
  catch (error) { return <div><PageHeading title="Details unavailable" /><p role="alert" className="text-muted">{(error as Error).message}</p><Link href="/">Back to overview</Link></div>; }
  return <div><Link href="/" className="detail-link mb-4">← Overview</Link><PageHeading title={data.title} /><DetailContent data={data} /></div>;
}
