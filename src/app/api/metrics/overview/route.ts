import { NextRequest, NextResponse } from 'next/server';
import { executeReadOnlyQuery } from '@/lib/db';
import { IMMATURE_CUTOFF_DATE, MIN_SUBSCRIPTIONS_FOR_EVALUATION } from '@/lib/constants';
import { MetricAggregates } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '2026-10-05';
    const endDate = searchParams.get('endDate') || '2026-10-11';
    const channel = searchParams.get('channel') || 'all';
    const country = searchParams.get('country') || 'all';
    const status = searchParams.get('status') || 'all';

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

    // 1. Overall Aggregates
    const overallQuery = `
      SELECT 
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
    `;

    const overallRow = executeReadOnlyQuery<{
      spend: number;
      impressions: number;
      clicks: number;
      installs: number;
      trials: number;
      trial_conversions: number;
      subscriptions: number;
      d7_revenue: number;
    }>(overallQuery, params).rows[0] || {
      spend: 0,
      impressions: 0,
      clicks: 0,
      installs: 0,
      trials: 0,
      trial_conversions: 0,
      subscriptions: 0,
      d7_revenue: 0,
    };

    const overallMetrics = computeMetrics(overallRow);

    // 2. Channel Breakdown
    const channelQuery = `
      SELECT 
        c.channel,
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
      GROUP BY c.channel
      ORDER BY spend DESC
    `;
    const channelRows = executeReadOnlyQuery<{
      channel: string;
      spend: number;
      impressions: number;
      clicks: number;
      installs: number;
      trials: number;
      trial_conversions: number;
      subscriptions: number;
      d7_revenue: number;
    }>(channelQuery, params).rows;

    const channelBreakdown = channelRows.map(r => ({
      channel: r.channel,
      metrics: computeMetrics(r),
    }));

    // 3. Country Breakdown
    const countryQuery = `
      SELECT 
        c.country,
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
      GROUP BY c.country
      ORDER BY spend DESC
    `;
    const countryRows = executeReadOnlyQuery<{
      country: string;
      spend: number;
      impressions: number;
      clicks: number;
      installs: number;
      trials: number;
      trial_conversions: number;
      subscriptions: number;
      d7_revenue: number;
    }>(countryQuery, params).rows;

    const countryBreakdown = countryRows.map(r => ({
      country: r.country,
      metrics: computeMetrics(r),
    }));

    const isImmatureCac = endDate > IMMATURE_CUTOFF_DATE;
    const hasLowSample = overallMetrics.subscriptions < MIN_SUBSCRIPTIONS_FOR_EVALUATION;

    return NextResponse.json({
      metrics: overallMetrics,
      channels: channelBreakdown,
      countries: countryBreakdown,
      isImmatureCac,
      hasLowSample,
      cohortMessage: isImmatureCac
        ? "Days after Oct 11 are less than 4 days old. Trials are still converting to subscriptions, so CAC reads high. Use Cost per Trial (CPT) for evaluation."
        : null,
      sampleSizeMessage: hasLowSample
        ? `Sample size is small (${overallMetrics.subscriptions} subscriptions < 20 threshold). Interpret performance cautiously.`
        : null,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
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
