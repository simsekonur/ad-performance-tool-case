export interface MetricAggregates {
  spend: number;
  impressions: number;
  clicks: number;
  installs: number;
  trials: number;
  trialConversions: number;
  subscriptions: number;
  d7Revenue: number;
  cpi: number;
  cac: number;
  cpt: number;
  trialToSubRate: number; // percentage (0-100)
  d7Roas: number; // percentage (0-100)
  ctr: number; // percentage (0-100)
}

export interface DrilldownNode {
  id: string;
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  channel: string;
  country: string;
  status: string;
  creativeType?: string;
  dailyBudget?: number;
  metrics: MetricAggregates;
  isImmatureCac: boolean;
  hasLowSample: boolean;
  children?: DrilldownNode[];
}

export interface ReleaseCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
  scope?: string;
  type?: string;
  description: string;
}

export interface ReleaseInfo {
  id: string;
  filename: string;
  releaseDate: string;
  platform: 'ios' | 'android';
  version: string;
  releasedAt: string;
  commits: ReleaseCommit[];
  summary: string;
}

export interface ReleaseImpact {
  release: ReleaseInfo;
  prePeriod: { start: string; end: string; metrics: MetricAggregates };
  postPeriod: { start: string; end: string; metrics: MetricAggregates };
  delta: {
    trialToSubRateDelta: number;
    cacDelta: number;
    cptDelta: number;
    spendDelta: number;
    subscriptionsDelta: number;
  };
}

export interface DynamicRule {
  id: string;
  title: string;
  content: string;
  category: 'metric_definition' | 'reporting_convention' | 'optimization_rule' | 'custom';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStep {
  type: 'thought' | 'tool_call' | 'tool_result' | 'error';
  title: string;
  content: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  steps?: AgentStep[];
  timestamp: string;
  shareId?: string;
}

export interface ShareSnapshot {
  id: string;
  title: string;
  question?: string;
  answer?: string;
  steps?: AgentStep[];
  sqlQuery?: string;
  filters: {
    startDate?: string;
    endDate?: string;
    channel?: string;
    country?: string;
  };
  metricsSnapshot?: MetricAggregates;
  createdAt: string;
}

export interface FilterState {
  preset: 'last_week' | 'last_7_days' | 'last_14_days' | 'mtd' | 'all' | 'custom';
  startDate: string;
  endDate: string;
  channel: 'all' | 'meta' | 'tiktok';
  country: 'all' | 'US' | 'GB' | 'DE' | 'BR';
  status: 'all' | 'active' | 'paused';
  search: string;
}
