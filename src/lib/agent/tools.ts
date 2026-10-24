import { executeReadOnlyQuery } from '../db';
import { searchBuildLogs, getAllReleases, getReleaseImpact } from '../build-logs';
import { IMMATURE_CUTOFF_DATE, REFERENCE_TODAY, WAREHOUSE_MAX_DATE } from '../constants';
import { AgentStep } from '../types';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'execute_sql',
    description: 'Execute a read-only SQL query on the Livensa advertising database (livensa.db). Contains tables: campaigns, ad_sets, ads, ads_daily.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The SQL SELECT query to execute.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_build_logs',
    description: 'Search mobile app release commit logs (iOS and Android) for features, bug fixes, paywall updates, templates, and render changes.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'The keyword to search for (e.g., paywall, templates, onboarding, render, audio).',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_release_impact',
    description: 'Analyze the impact of a specific app release on conversion and CAC by comparing the 3-day window before vs 3-day window after.',
    parameters: {
      type: 'object',
      properties: {
        releaseId: {
          type: 'string',
          description: 'The release ID or date (e.g., 2026-09-15-android-3.42.0 or 2026-09-15).',
        },
      },
      required: ['releaseId'],
    },
  },
  {
    name: 'get_warehouse_metadata',
    description: 'Get date ranges, active channels, countries, and immature cohort boundaries.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

export function runAgentTool(name: string, args: Record<string, unknown>): { result: unknown; step: AgentStep } {
  const timestamp = new Date().toISOString();

  try {
    if (name === 'execute_sql') {
      const query = (args.query as string) || '';
      const { rows, executionTimeMs } = executeReadOnlyQuery(query);
      return {
        result: { rowCount: rows.length, rows: rows.slice(0, 100), executionTimeMs },
        step: {
          type: 'tool_call',
          title: 'Database Query',
          content: query,
          details: { rowCount: rows.length, executionTimeMs, sampleRows: rows.slice(0, 5) },
          timestamp,
        },
      };
    }

    if (name === 'search_build_logs') {
      const keyword = (args.keyword as string) || '';
      const results = searchBuildLogs(keyword);
      return {
        result: results,
        step: {
          type: 'tool_call',
          title: `Build Logs Search: "${keyword}"`,
          content: `Found ${results.length} releases containing "${keyword}".`,
          details: { matches: results.map(r => ({ id: r.release.id, summary: r.release.summary })) },
          timestamp,
        },
      };
    }

    if (name === 'get_release_impact') {
      const releaseId = (args.releaseId as string) || '';
      const impact = getReleaseImpact(releaseId);
      return {
        result: impact,
        step: {
          type: 'tool_call',
          title: `Release Impact Analysis: ${releaseId}`,
          content: impact
            ? `Trial-to-Sub: ${impact.prePeriod.metrics.trialToSubRate}% → ${impact.postPeriod.metrics.trialToSubRate}% (Δ ${impact.delta.trialToSubRateDelta}%), CAC: $${impact.prePeriod.metrics.cac} → $${impact.postPeriod.metrics.cac}`
            : 'Release not found',
          details: impact ? (impact as unknown as Record<string, unknown>) : undefined,
          timestamp,
        },
      };
    }

    if (name === 'get_warehouse_metadata') {
      const data = {
        referenceToday: REFERENCE_TODAY,
        yesterdayWarehouseMax: WAREHOUSE_MAX_DATE,
        immatureCutoffDate: IMMATURE_CUTOFF_DATE,
        immatureDates: ['2026-10-12', '2026-10-13', '2026-10-14'],
        channels: ['meta', 'tiktok'],
        countries: ['US', 'GB', 'DE', 'BR'],
        totalReleases: getAllReleases().length,
      };
      return {
        result: data,
        step: {
          type: 'tool_call',
          title: 'Warehouse Metadata Lookup',
          content: `Warehouse anchor: Today ${REFERENCE_TODAY}, Max data ${WAREHOUSE_MAX_DATE}. Immature cutoff: ${IMMATURE_CUTOFF_DATE}.`,
          details: data,
          timestamp,
        },
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      result: { error: errorMsg },
      step: {
        type: 'error',
        title: `Tool Error: ${name}`,
        content: errorMsg,
        timestamp,
      },
    };
  }
}
