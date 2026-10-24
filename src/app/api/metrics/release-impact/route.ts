import { NextRequest, NextResponse } from 'next/server';
import { getAllReleases, getReleaseImpact } from '@/lib/build-logs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const releaseId = searchParams.get('releaseId');
    const windowDays = parseInt(searchParams.get('windowDays') || '3', 10);

    if (releaseId) {
      const impact = getReleaseImpact(releaseId, windowDays);
      if (!impact) {
        return NextResponse.json({ error: 'Release not found' }, { status: 404 });
      }
      return NextResponse.json({ impact });
    }

    const releases = getAllReleases();
    const impacts = releases.map(r => getReleaseImpact(r.id, windowDays)).filter(Boolean);

    return NextResponse.json({ releases, impacts });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
