import { NextResponse } from 'next/server';
import { executeReadOnlyQuery } from '@/lib/db';

/**
 * Creative Fatigue Detector
 *
 * Analyses active ads over the last 3 complete weeks and flags those showing
 * classic fatigue signals:
 *   - Click-Through Rate (CTR) declining week over week
 *   - Cost per Trial (CPT) rising week over week
 *   - Impressions still high but engagement collapsing (audience exhaustion)
 *
 * Weeks used (warehouse ends Oct 14; today = Oct 15):
 *   W1 (oldest)  : Sep 22 – Sep 28
 *   W2           : Sep 29 – Oct  5
 *   W3 (freshest): Oct  6 – Oct 11  (full weeks only; Oct 12–14 excluded — immature)
 *
 * Fatigue Score (0–100):
 *   40 pts  — CTR dropped ≥ 20 % from W1 → W3
 *   30 pts  — CPT rose    ≥ 25 % from W1 → W3
 *   20 pts  — CTR dropped ≥ 10 % (softer signal)
 *   10 pts  — CPT rose    ≥ 15 % (softer signal)
 *   +10 pts — ad has been running ≥ 30 days
 *
 * Severity bands: high ≥ 60, medium ≥ 30, low < 30
 */

const W1_START = '2026-09-22';
const W1_END   = '2026-09-28';
const W2_START = '2026-09-29';
const W2_END   = '2026-10-05';
const W3_START = '2026-10-06';
const W3_END   = '2026-10-11';
const MIN_IMPRESSIONS_PER_WEEK = 5000; // ignore low-volume ads (noise)

interface WeeklyRow {
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  channel: string;
  country: string;
  creative_type: string;
  ad_created_at: string;
  impressions: number;
  clicks: number;
  spend_usd: number;
  trials: number;
}

function weeklyQuery(start: string, end: string): WeeklyRow[] {
  const sql = `
    SELECT
      a.ad_id,
      a.name              AS ad_name,
      a.creative_type,
      a.created_at        AS ad_created_at,
      s.name              AS adset_name,
      c.name              AS campaign_name,
      c.channel,
      c.country,
      COALESCE(SUM(d.impressions), 0) AS impressions,
      COALESCE(SUM(d.clicks), 0)      AS clicks,
      COALESCE(SUM(d.spend_usd), 0)   AS spend_usd,
      COALESCE(SUM(d.trials), 0)      AS trials
    FROM ads a
    JOIN ad_sets s ON a.adset_id = s.adset_id
    JOIN campaigns c ON s.campaign_id = c.campaign_id
    LEFT JOIN ads_daily d
      ON d.ad_id = a.ad_id
      AND d.date BETWEEN '${start}' AND '${end}'
    WHERE a.status = 'active'
    GROUP BY a.ad_id
    ORDER BY impressions DESC
  `;
  return executeReadOnlyQuery<WeeklyRow>(sql).rows;
}

export async function GET() {
  try {
    const [w1Rows, w2Rows, w3Rows] = [
      weeklyQuery(W1_START, W1_END),
      weeklyQuery(W2_START, W2_END),
      weeklyQuery(W3_START, W3_END),
    ];

    // Index by ad_id for fast lookup
    const w1 = Object.fromEntries(w1Rows.map(r => [r.ad_id, r]));
    const w2 = Object.fromEntries(w2Rows.map(r => [r.ad_id, r]));
    const w3 = Object.fromEntries(w3Rows.map(r => [r.ad_id, r]));

    // Only analyse ads that appeared in all 3 weeks with enough volume
    const candidateIds = w3Rows
      .filter(r =>
        r.impressions >= MIN_IMPRESSIONS_PER_WEEK &&
        w1[r.ad_id]?.impressions >= MIN_IMPRESSIONS_PER_WEEK &&
        w2[r.ad_id]?.impressions >= MIN_IMPRESSIONS_PER_WEEK
      )
      .map(r => r.ad_id);

    const today = new Date('2026-10-15');

    const ads = candidateIds.map(id => {
      const r1 = w1[id];
      const r2 = w2[id];
      const r3 = w3[id];

      const ctr1 = r1.impressions > 0 ? (r1.clicks / r1.impressions) * 100 : 0;
      const ctr2 = r2.impressions > 0 ? (r2.clicks / r2.impressions) * 100 : 0;
      const ctr3 = r3.impressions > 0 ? (r3.clicks / r3.impressions) * 100 : 0;

      const cpt1 = r1.trials > 0 ? r1.spend_usd / r1.trials : null;
      const cpt2 = r2.trials > 0 ? r2.spend_usd / r2.trials : null;
      const cpt3 = r3.trials > 0 ? r3.spend_usd / r3.trials : null;

      const ctrDrop = ctr1 > 0 ? ((ctr1 - ctr3) / ctr1) * 100 : 0;
      const cptRise = cpt1 && cpt3 ? ((cpt3 - cpt1) / cpt1) * 100 : 0;

      // Score
      let score = 0;
      if (ctrDrop >= 20) score += 40;
      else if (ctrDrop >= 10) score += 20;
      if (cptRise >= 25) score += 30;
      else if (cptRise >= 15) score += 10;

      // Days running bonus
      const created = new Date(r3.ad_created_at);
      const daysRunning = Math.floor((today.getTime() - created.getTime()) / 86400000);
      if (daysRunning >= 30) score += 10;

      const severity: 'high' | 'medium' | 'low' =
        score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

      return {
        ad_id: id,
        ad_name: r3.ad_name,
        adset_name: r3.adset_name,
        campaign_name: r3.campaign_name,
        channel: r3.channel,
        country: r3.country,
        creative_type: r3.creative_type,
        days_running: daysRunning,
        severity,
        score,
        // Weekly trend data
        weeks: [
          {
            label: 'Sep 22–28',
            impressions: r1.impressions,
            ctr: Number(ctr1.toFixed(2)),
            cpt: cpt1 ? Number(cpt1.toFixed(2)) : null,
            spend: Number(r1.spend_usd.toFixed(2)),
          },
          {
            label: 'Sep 29–Oct 5',
            impressions: r2.impressions,
            ctr: Number(ctr2.toFixed(2)),
            cpt: cpt2 ? Number(cpt2.toFixed(2)) : null,
            spend: Number(r2.spend_usd.toFixed(2)),
          },
          {
            label: 'Oct 6–11',
            impressions: r3.impressions,
            ctr: Number(ctr3.toFixed(2)),
            cpt: cpt3 ? Number(cpt3.toFixed(2)) : null,
            spend: Number(r3.spend_usd.toFixed(2)),
          },
        ],
        ctr_change_pct: Number((-ctrDrop).toFixed(1)),   // negative = drop
        cpt_change_pct: Number(cptRise.toFixed(1)),        // positive = rise
        recommendation:
          score >= 60
            ? 'Replace creative immediately — audience is exhausted.'
            : score >= 30
            ? 'Schedule a creative refresh within the next week.'
            : 'Monitor — early fatigue signals, not yet critical.',
      };
    });

    // Sort: high first, then by score desc
    ads.sort((a, b) =>
      b.score - a.score
    );

    return NextResponse.json({
      ads,
      analysisWindow: { w1: `${W1_START} → ${W1_END}`, w2: `${W2_START} → ${W2_END}`, w3: `${W3_START} → ${W3_END}` },
      minImpressionsThreshold: MIN_IMPRESSIONS_PER_WEEK,
      summary: {
        total: ads.length,
        high: ads.filter(a => a.severity === 'high').length,
        medium: ads.filter(a => a.severity === 'medium').length,
        low: ads.filter(a => a.severity === 'low').length,
      },
    });
  } catch (err) {
    console.error('Fatigue API error:', err);
    return NextResponse.json({ error: 'Failed to compute fatigue analysis' }, { status: 500 });
  }
}
