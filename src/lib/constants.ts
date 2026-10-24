export const REFERENCE_TODAY = '2026-10-15';
export const WAREHOUSE_MAX_DATE = '2026-10-14';
export const WAREHOUSE_MIN_DATE = '2026-09-03';
export const TRIAL_DURATION_DAYS = 3;
export const IMMATURE_CUTOFF_DATE = '2026-10-11'; // Dates from 2026-10-12 to 2026-10-14 have immature CAC
export const MIN_SUBSCRIPTIONS_FOR_EVALUATION = 20;

export const DEMO_CREDENTIALS = {
  username: process.env.DEMO_USER || 'admin',
  password: process.env.DEMO_PASSWORD || 'livensa2026',
};

export const INITIAL_TEAM_NOTES = [
  {
    id: 'rule-1',
    title: 'Date Conventions & Calendar Arithmetic',
    content: '"Last week" strictly means the previous Monday to Sunday (Oct 5–11, 2026). "Last N days" means the N full calendar days ending yesterday (2026-10-14), calculated inclusive as date >= DATE(\'2026-10-14\', \'-{N-1} days\') (e.g., "last 14 days" is strictly Oct 1–14; "last 7 days" is strictly Oct 8–14). "Last two complete weeks" means Monday Sep 28 to Sunday Oct 11, 2026.',
    category: 'reporting_convention' as const,
    enabled: true,
  },
  {
    id: 'rule-2',
    title: 'Formatting Precision',
    content: 'Money is in USD with two decimals ($xx.xx). Percentages have one decimal (xx.x%). Metrics must be cleanly rounded.',
    category: 'reporting_convention' as const,
    enabled: true,
  },
  {
    id: 'rule-3',
    title: 'Executive Lead-in & Structured Presentation',
    content: 'Lead with the decisive answer in one bold executive sentence, followed by structured Markdown data tables with exact numbers and clear metric comparisons.',
    category: 'reporting_convention' as const,
    enabled: true,
  },
  {
    id: 'rule-4',
    title: 'Entity Naming',
    content: 'Name things the way the team does: ad sets and ads by their human-readable names, never by database IDs.',
    category: 'reporting_convention' as const,
    enabled: true,
  },
  {
    id: 'rule-5',
    title: 'Cohort Maturation & 3-Day Trial Lag',
    content: 'Livensa has a 3-day free trial; paid subscriptions and trial conversions register on Day 4 after install. Therefore: (a) Days less than 4 days old (Oct 12–14) have immature subscription counts. If asked why CAC spiked yesterday (Oct 14) or recently, lead by explaining that subscriptions haven\'t arrived yet, compare Cost per Trial (CPT) against last week (Oct 5–11) as the leading indicator rather than immature CAC, and advise re-evaluating in 3–4 days. (b) When ranking top/lowest CAC performers over multi-day periods (e.g. last 14 days Oct 1–14), evaluate and rank entities by CAC on the mature cutoff window (Oct 1–11) where trials have finished converting, while disclosing the full window context. (c) For trial-to-subscription rates (e.g. MoM Sep vs Oct), only evaluate trials started with at least 4 days to mature (for October, trials started through Oct 10).',
    category: 'metric_definition' as const,
    enabled: true,
  },
  {
    id: 'rule-6',
    title: 'Statistical Significance & Sample Size',
    content: 'Don\'t call an ad or ad set the best or worst until it has at least 20 subscriptions in the evaluation period (HAVING SUM(subscriptions) >= 20). Below that threshold, state that the sample size is too small for statistical significance.',
    category: 'optimization_rule' as const,
    enabled: true,
  },
  {
    id: 'rule-7',
    title: 'Simpson\'s Paradox Prevention (Geo Breakdown)',
    content: 'Compare channels within each country first, then provide blended totals. Over 70% of TikTok\'s spend is concentrated in Brazil where acquisition costs are naturally lower, which skews blended CAC. When comparing channel performance (e.g. Meta vs TikTok), evaluate across complete calendar weeks (e.g. last 2 complete weeks Sep 28–Oct 11) and report country-by-country breakdown before blended conclusions.',
    category: 'reporting_convention' as const,
    enabled: true,
  },
  {
    id: 'rule-8',
    title: 'Recommendation Filter (Paused Ads)',
    content: 'Paused ads count in historical spend and retrospective reporting, but exclude them from recommendations about what to scale or cut.',
    category: 'optimization_rule' as const,
    enabled: true,
  },
];

