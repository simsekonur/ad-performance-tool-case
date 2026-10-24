import fs from 'node:fs';
import path from 'node:path';
import { ReleaseInfo, ReleaseCommit, ReleaseImpact, MetricAggregates } from './types';
import { executeReadOnlyQuery } from './db';

const BUILD_LOGS_DIR = path.join(process.cwd(), 'build-logs');

let cachedReleases: ReleaseInfo[] | null = null;

export function getAllReleases(): ReleaseInfo[] {
  if (cachedReleases) {
    return cachedReleases;
  }

  if (!fs.existsSync(BUILD_LOGS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BUILD_LOGS_DIR).filter(f => f.endsWith('.txt')).sort();
  const releases: ReleaseInfo[] = [];

  for (const filename of files) {
    const fullPath = path.join(BUILD_LOGS_DIR, filename);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Filename pattern: YYYY-MM-DD-platform-version.txt
    // e.g. 2026-09-11-ios-3.42.0.txt
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(ios|android)-([\d\.]+)\.txt$/);
    const releaseDate = match ? match[1] : '';
    const platform = (match ? match[2] : 'ios') as 'ios' | 'android';
    const version = match ? match[3] : '';

    const lines = content.split('\n');
    let releasedAt = '';
    const commits: ReleaseCommit[] = [];

    let currentCommit: Partial<ReleaseCommit> | null = null;
    let commitDescLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('Released:')) {
        releasedAt = line.replace('Released:', '').trim();
      } else if (line.startsWith('commit ')) {
        if (currentCommit && currentCommit.hash) {
          currentCommit.description = commitDescLines.join('\n').trim();
          commits.push(currentCommit as ReleaseCommit);
        }
        currentCommit = {
          hash: line.replace('commit ', '').trim(),
          description: '',
        };
        commitDescLines = [];
      } else if (line.startsWith('Author:') && currentCommit) {
        currentCommit.author = line.replace('Author:', '').trim();
      } else if (line.startsWith('Date:') && currentCommit) {
        currentCommit.date = line.replace('Date:', '').trim();
      } else if (currentCommit) {
        const trimmed = line.trim();
        if (trimmed && !currentCommit.message) {
          currentCommit.message = trimmed;
          // Parse conventional commit type & scope: feat(paywall): ...
          const msgMatch = trimmed.match(/^([a-z]+)(?:\(([^\)]+)\))?:\s*(.+)$/i);
          if (msgMatch) {
            currentCommit.type = msgMatch[1].toLowerCase();
            currentCommit.scope = msgMatch[2]?.toLowerCase();
          }
        } else if (currentCommit.message) {
          commitDescLines.push(line);
        }
      }
    }

    if (currentCommit && currentCommit.hash) {
      currentCommit.description = commitDescLines.join('\n').trim();
      commits.push(currentCommit as ReleaseCommit);
    }

    // Generate quick summary
    const highlights = commits
      .filter(c => c.scope === 'paywall' || c.scope === 'onboarding' || c.scope === 'templates' || c.scope === 'render')
      .map(c => c.message);

    const summary = highlights.length > 0 
      ? highlights.slice(0, 2).join('; ')
      : (commits[0]?.message || `${platform.toUpperCase()} ${version}`);

    releases.push({
      id: `${releaseDate}-${platform}-${version}`,
      filename,
      releaseDate,
      platform,
      version,
      releasedAt,
      commits,
      summary,
    });
  }

  // Sort chronologically
  releases.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  cachedReleases = releases;
  return releases;
}

export function searchBuildLogs(query: string): Array<{ release: ReleaseInfo; matchingCommits: ReleaseCommit[] }> {
  const all = getAllReleases();
  const q = query.toLowerCase();
  const results: Array<{ release: ReleaseInfo; matchingCommits: ReleaseCommit[] }> = [];

  for (const rel of all) {
    const matching = rel.commits.filter(c => 
      c.message.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.scope && c.scope.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q)) ||
      c.author.toLowerCase().includes(q)
    );

    if (matching.length > 0) {
      results.push({ release: rel, matchingCommits: matching });
    }
  }

  return results;
}

function calculateAggregates(rows: Array<{
  spend_usd: number;
  impressions: number;
  clicks: number;
  installs: number;
  trials: number;
  trial_conversions: number;
  subscriptions: number;
  d7_revenue_usd: number;
}>): MetricAggregates {
  let spend = 0, impressions = 0, clicks = 0, installs = 0;
  let trials = 0, trialConversions = 0, subscriptions = 0, d7Revenue = 0;

  for (const r of rows) {
    spend += r.spend_usd || 0;
    impressions += r.impressions || 0;
    clicks += r.clicks || 0;
    installs += r.installs || 0;
    trials += r.trials || 0;
    trialConversions += r.trial_conversions || 0;
    subscriptions += r.subscriptions || 0;
    d7Revenue += r.d7_revenue_usd || 0;
  }

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

/**
 * Calculates pre vs post release performance deltas (e.g., 3 days before vs 3 days after release).
 */
export function getReleaseImpact(releaseId: string, windowDays: number = 3): ReleaseImpact | null {
  const releases = getAllReleases();
  const release = releases.find(r => r.id === releaseId || r.releaseDate === releaseId);
  if (!release) return null;

  // Release date
  const relDate = new Date(release.releaseDate);

  // Pre-period: (relDate - windowDays) to (relDate - 1)
  const preEnd = new Date(relDate);
  preEnd.setDate(preEnd.getDate() - 1);
  const preStart = new Date(relDate);
  preStart.setDate(preStart.getDate() - windowDays);

  // Post-period: (relDate + 1) to (relDate + windowDays)
  const postStart = new Date(relDate);
  postStart.setDate(postStart.getDate() + 1);
  const postEnd = new Date(relDate);
  postEnd.setDate(postEnd.getDate() + windowDays);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const preStartStr = formatDate(preStart);
  const preEndStr = formatDate(preEnd);
  const postStartStr = formatDate(postStart);
  const postEndStr = formatDate(postEnd);

  const preQuery = `
    SELECT spend_usd, impressions, clicks, installs, trials, trial_conversions, subscriptions, d7_revenue_usd
    FROM ads_daily
    WHERE date BETWEEN ? AND ?
  `;
  const preRows = executeReadOnlyQuery<{
    spend_usd: number;
    impressions: number;
    clicks: number;
    installs: number;
    trials: number;
    trial_conversions: number;
    subscriptions: number;
    d7_revenue_usd: number;
  }>(preQuery, [preStartStr, preEndStr]).rows;

  const postRows = executeReadOnlyQuery<{
    spend_usd: number;
    impressions: number;
    clicks: number;
    installs: number;
    trials: number;
    trial_conversions: number;
    subscriptions: number;
    d7_revenue_usd: number;
  }>(preQuery, [postStartStr, postEndStr]).rows;

  const preMetrics = calculateAggregates(preRows);
  const postMetrics = calculateAggregates(postRows);

  return {
    release,
    prePeriod: { start: preStartStr, end: preEndStr, metrics: preMetrics },
    postPeriod: { start: postStartStr, end: postEndStr, metrics: postMetrics },
    delta: {
      trialToSubRateDelta: Math.round((postMetrics.trialToSubRate - preMetrics.trialToSubRate) * 10) / 10,
      cacDelta: Math.round((postMetrics.cac - preMetrics.cac) * 100) / 100,
      cptDelta: Math.round((postMetrics.cpt - preMetrics.cpt) * 100) / 100,
      spendDelta: Math.round((postMetrics.spend - preMetrics.spend) * 100) / 100,
      subscriptionsDelta: postMetrics.subscriptions - preMetrics.subscriptions,
    },
  };
}
