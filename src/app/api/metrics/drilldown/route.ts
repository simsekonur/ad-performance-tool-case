import { NextRequest, NextResponse } from 'next/server';
import { executeReadOnlyQuery } from '@/lib/db';
import { IMMATURE_CUTOFF_DATE, MIN_SUBSCRIPTIONS_FOR_EVALUATION } from '@/lib/constants';
import { DrilldownNode, MetricAggregates } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '2026-10-05';
    const endDate = searchParams.get('endDate') || '2026-10-11';
    const channel = searchParams.get('channel') || 'all';
    const country = searchParams.get('country') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = (searchParams.get('search') || '').toLowerCase().trim();

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
    if (status !== 'all') {
      conditions.push('a.status = ?');
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // Query aggregated data down to ad level
    const sql = `
      SELECT 
        c.campaign_id,
        c.name as campaign_name,
        c.channel,
        c.country,
        c.status as campaign_status,
        s.adset_id,
        s.name as adset_name,
        s.status as adset_status,
        s.daily_budget_usd,
        a.ad_id,
        a.name as ad_name,
        a.creative_type,
        a.status as ad_status,
        COALESCE(SUM(d.spend_usd), 0) as spend,
        COALESCE(SUM(d.impressions), 0) as impressions,
        COALESCE(SUM(d.clicks), 0) as clicks,
        COALESCE(SUM(d.installs), 0) as installs,
        COALESCE(SUM(d.trials), 0) as trials,
        COALESCE(SUM(d.trial_conversions), 0) as trial_conversions,
        COALESCE(SUM(d.subscriptions), 0) as subscriptions,
        COALESCE(SUM(d.d7_revenue_usd), 0) as d7_revenue
      FROM ads_daily d
      JOIN ads a ON d.ad_id = a.ad_id
      JOIN ad_sets s ON a.adset_id = s.adset_id
      JOIN campaigns c ON s.campaign_id = c.campaign_id
      WHERE ${whereClause}
      GROUP BY c.campaign_id, s.adset_id, a.ad_id
      ORDER BY c.name ASC, s.name ASC, a.name ASC
    `;

    const rows = executeReadOnlyQuery<{
      campaign_id: string;
      campaign_name: string;
      channel: string;
      country: string;
      campaign_status: string;
      adset_id: string;
      adset_name: string;
      adset_status: string;
      daily_budget_usd: number;
      ad_id: string;
      ad_name: string;
      creative_type: string;
      ad_status: string;
      spend: number;
      impressions: number;
      clicks: number;
      installs: number;
      trials: number;
      trial_conversions: number;
      subscriptions: number;
      d7_revenue: number;
    }>(sql, params).rows;

    const isImmatureCac = endDate > IMMATURE_CUTOFF_DATE;

    // Build hierarchical tree: Campaign -> Ad Set -> Ad
    const campaignMap = new Map<string, {
      id: string;
      name: string;
      channel: string;
      country: string;
      status: string;
      raw: { spend: number; impressions: number; clicks: number; installs: number; trials: number; trial_conversions: number; subscriptions: number; d7_revenue: number };
      adsetMap: Map<string, {
        id: string;
        name: string;
        channel: string;
        country: string;
        status: string;
        daily_budget_usd: number;
        raw: { spend: number; impressions: number; clicks: number; installs: number; trials: number; trial_conversions: number; subscriptions: number; d7_revenue: number };
        ads: DrilldownNode[];
      }>;
    }>();

    for (const r of rows) {
      if (search) {
        const matchesSearch = 
          r.campaign_name.toLowerCase().includes(search) ||
          r.adset_name.toLowerCase().includes(search) ||
          r.ad_name.toLowerCase().includes(search) ||
          r.creative_type.toLowerCase().includes(search);
        if (!matchesSearch) continue;
      }

      // 1. Campaign level
      if (!campaignMap.has(r.campaign_id)) {
        campaignMap.set(r.campaign_id, {
          id: r.campaign_id,
          name: r.campaign_name,
          channel: r.channel,
          country: r.country,
          status: r.campaign_status,
          raw: { spend: 0, impressions: 0, clicks: 0, installs: 0, trials: 0, trial_conversions: 0, subscriptions: 0, d7_revenue: 0 },
          adsetMap: new Map(),
        });
      }
      const camp = campaignMap.get(r.campaign_id)!;
      addRaw(camp.raw, r);

      // 2. Ad Set level
      if (!camp.adsetMap.has(r.adset_id)) {
        camp.adsetMap.set(r.adset_id, {
          id: r.adset_id,
          name: r.adset_name,
          channel: r.channel,
          country: r.country,
          status: r.adset_status,
          daily_budget_usd: r.daily_budget_usd,
          raw: { spend: 0, impressions: 0, clicks: 0, installs: 0, trials: 0, trial_conversions: 0, subscriptions: 0, d7_revenue: 0 },
          ads: [],
        });
      }
      const adset = camp.adsetMap.get(r.adset_id)!;
      addRaw(adset.raw, r);

      // 3. Ad level
      const adMetrics = computeMetrics(r);
      adset.ads.push({
        id: r.ad_id,
        type: 'ad',
        name: r.ad_name,
        channel: r.channel,
        country: r.country,
        status: r.ad_status,
        creativeType: r.creative_type,
        metrics: adMetrics,
        isImmatureCac,
        hasLowSample: adMetrics.subscriptions < MIN_SUBSCRIPTIONS_FOR_EVALUATION,
      });
    }

    // Convert map structure into DrilldownNode array
    const campaigns: DrilldownNode[] = [];

    for (const camp of campaignMap.values()) {
      const campMetrics = computeMetrics(camp.raw);
      const adsets: DrilldownNode[] = [];

      for (const adset of camp.adsetMap.values()) {
        const adsetMetrics = computeMetrics(adset.raw);
        adsets.push({
          id: adset.id,
          type: 'adset',
          name: adset.name,
          channel: adset.channel,
          country: adset.country,
          status: adset.status,
          dailyBudget: adset.daily_budget_usd,
          metrics: adsetMetrics,
          isImmatureCac,
          hasLowSample: adsetMetrics.subscriptions < MIN_SUBSCRIPTIONS_FOR_EVALUATION,
          children: adset.ads,
        });
      }

      campaigns.push({
        id: camp.id,
        type: 'campaign',
        name: camp.name,
        channel: camp.channel,
        country: camp.country,
        status: camp.status,
        metrics: campMetrics,
        isImmatureCac,
        hasLowSample: campMetrics.subscriptions < MIN_SUBSCRIPTIONS_FOR_EVALUATION,
        children: adsets,
      });
    }

    return NextResponse.json({ campaigns });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

function addRaw(target: { spend: number; impressions: number; clicks: number; installs: number; trials: number; trial_conversions: number; subscriptions: number; d7_revenue: number }, src: { spend: number; impressions: number; clicks: number; installs: number; trials: number; trial_conversions: number; subscriptions: number; d7_revenue: number }) {
  target.spend += src.spend || 0;
  target.impressions += src.impressions || 0;
  target.clicks += src.clicks || 0;
  target.installs += src.installs || 0;
  target.trials += src.trials || 0;
  target.trial_conversions += src.trial_conversions || 0;
  target.subscriptions += src.subscriptions || 0;
  target.d7_revenue += src.d7_revenue || 0;
}

function computeMetrics(row: {
  spend: number;
  impressions: number;
  clicks: number;
  installs: number;
  trials: number;
  trial_conversions: number;
  subscriptions: number;
  d7_revenue: number;
}): MetricAggregates {
  const spend = row.spend || 0;
  const impressions = row.impressions || 0;
  const clicks = row.clicks || 0;
  const installs = row.installs || 0;
  const trials = row.trials || 0;
  const trialConversions = row.trial_conversions || 0;
  const subscriptions = row.subscriptions || 0;
  const d7Revenue = row.d7_revenue || 0;

  const cpi = installs > 0 ? Math.round((spend / installs) * 100) / 100 : 0;
  const cac = subscriptions > 0 ? Math.round((spend / subscriptions) * 100) / 100 : 0;
  const cpt = trials > 0 ? Math.round((spend / trials) * 100) / 100 : 0;
  const trialToSubRate = trials > 0 ? Math.round((trialConversions / trials) * 1000) / 10 : 0;
  const d7Roas = spend > 0 ? Math.round((d7Revenue / spend) * 1000) / 10 : 0;
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0;

  return {
    spend: Math.round(spend * 100) / 100,
    impressions,
    clicks,
    installs,
    trials,
    trialConversions,
    subscriptions,
    d7Revenue: Math.round(d7Revenue * 100) / 100,
    cpi,
    cac,
    cpt,
    trialToSubRate,
    d7Roas,
    ctr,
  };
}
