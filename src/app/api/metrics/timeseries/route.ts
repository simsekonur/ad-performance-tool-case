import { NextRequest, NextResponse } from 'next/server';
import { executeReadOnlyQuery } from '@/lib/db';
import { getAllReleases } from '@/lib/build-logs';
import { IMMATURE_CUTOFF_DATE } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '2026-09-03';
    const endDate = searchParams.get('endDate') || '2026-10-14';
    const channel = searchParams.get('channel') || 'all';
    const country = searchParams.get('country') || 'all';

    const conditions: string[] = ['d.date BETWEEN ? AND ?'];
    const params: (string | number)[] = [startDate, endDate];

    if (channel !== 'all') {
      conditions.push('c.channel = ?');
      params.push(channel);
    }
    if (country !== 'all') {
      conditions.push('c.country = ?');
      params.push(country);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        d.date,
        COALESCE(SUM(d.spend_usd), 0) as spend,
        COALESCE(SUM(d.installs), 0) as installs,
        COALESCE(SUM(d.trials), 0) as trials,
        COALESCE(SUM(d.trial_conversions), 0) as trial_conversions,
        COALESCE(SUM(d.subscriptions), 0) as subscriptions,
        COALESCE(SUM(d.d7_revenue_usd), 0) as d7_revenue,
        COALESCE(SUM(d.impressions), 0) as impressions,
        COALESCE(SUM(d.clicks), 0) as clicks
      FROM ads_daily d
      JOIN ads a ON d.ad_id = a.ad_id
      JOIN ad_sets s ON a.adset_id = s.adset_id
      JOIN campaigns c ON s.campaign_id = c.campaign_id
      WHERE ${whereClause}
      GROUP BY d.date
      ORDER BY d.date ASC
    `;

    const rows = executeReadOnlyQuery<{
      date: string;
      spend: number;
      installs: number;
      trials: number;
      trial_conversions: number;
      subscriptions: number;
      d7_revenue: number;
      impressions: number;
      clicks: number;
    }>(sql, params).rows;

    const allReleases = getAllReleases();

    const timeseries = rows.map(r => {
      const spend = Math.round(r.spend * 100) / 100;
      const cac = r.subscriptions > 0 ? Math.round((spend / r.subscriptions) * 100) / 100 : 0;
      const cpt = r.trials > 0 ? Math.round((spend / r.trials) * 100) / 100 : 0;
      const cpi = r.installs > 0 ? Math.round((spend / r.installs) * 100) / 100 : 0;
      const trialToSubRate = r.trials > 0 ? Math.round((r.trial_conversions / r.trials) * 1000) / 10 : 0;
      const d7Roas = spend > 0 ? Math.round((r.d7_revenue / spend) * 1000) / 10 : 0;
      const ctr = r.impressions > 0 ? Math.round((r.clicks / r.impressions) * 1000) / 10 : 0;

      const isImmature = r.date > IMMATURE_CUTOFF_DATE;

      // Find any releases deployed on this date
      const releasesOnDate = allReleases.filter(rel => rel.releaseDate === r.date);

      return {
        date: r.date,
        spend,
        installs: r.installs,
        trials: r.trials,
        subscriptions: r.subscriptions,
        d7Revenue: Math.round(r.d7_revenue * 100) / 100,
        cac,
        cpt,
        cpi,
        trialToSubRate,
        d7Roas,
        ctr,
        isImmature,
        releases: releasesOnDate.map(rel => ({
          id: rel.id,
          version: rel.version,
          platform: rel.platform,
          summary: rel.summary,
        })),
      };
    });

    return NextResponse.json({ timeseries });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
