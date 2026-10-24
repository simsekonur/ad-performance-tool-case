'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TimeseriesPoint {
  date: string;
  spend: number;
  installs: number;
  trials: number;
  subscriptions: number;
  d7Revenue: number;
  cac: number;
  cpt: number;
  cpi: number;
  trialToSubRate: number;
  d7Roas: number;
  ctr: number;
  isImmature: boolean;
  releases: Array<{
    id: string;
    version: string;
    platform: 'ios' | 'android';
    summary: string;
  }>;
}

interface PerformanceChartProps {
  timeseries: TimeseriesPoint[];
  onSelectRelease?: (releaseId: string) => void;
}

type MetricMode = 'spend_subs' | 'cac_cpt' | 'conversion' | 'roas';

export function PerformanceChart({ timeseries, onSelectRelease }: PerformanceChartProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>('cac_cpt');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!timeseries || timeseries.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        No timeseries data available for this range.
      </div>
    );
  }

  // Calculate SVG dimensions
  const width = 850;
  const height = 240;
  const padding = { top: 30, right: 30, bottom: 40, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Determine series to plot based on metricMode
  let primaryKey: keyof TimeseriesPoint = 'cac';
  let secondaryKey: keyof TimeseriesPoint | null = 'cpt';
  let primaryLabel = 'Acquisition Cost (CAC)';
  let secondaryLabel = 'Cost per Trial (CPT)';
  let primaryColor = '#f59e0b';
  let secondaryColor = '#10b981';
  let isPercentage = false;

  if (metricMode === 'spend_subs') {
    primaryKey = 'spend';
    secondaryKey = 'subscriptions';
    primaryLabel = 'Spend ($)';
    secondaryLabel = 'Subscriptions';
    primaryColor = '#6366f1';
    secondaryColor = '#06b6d4';
  } else if (metricMode === 'conversion') {
    primaryKey = 'trialToSubRate';
    secondaryKey = null;
    primaryLabel = 'Trial → Subscription Rate (%)';
    secondaryLabel = '';
    primaryColor = '#a855f7';
    isPercentage = true;
  } else if (metricMode === 'roas') {
    primaryKey = 'd7Roas';
    secondaryKey = null;
    primaryLabel = '7-Day Return on Ad Spend (D7 ROAS) (%)';
    secondaryLabel = '';
    primaryColor = '#10b981';
    isPercentage = true;
  }

  // Find max values for scaling
  const primaryValues = timeseries.map(d => Number(d[primaryKey]) || 0);
  const maxPrimary = Math.max(...primaryValues, 10);
  const minPrimary = 0;

  const secondaryValues = secondaryKey ? timeseries.map(d => Number(d[secondaryKey!]) || 0) : [];
  const maxSecondary = secondaryKey ? Math.max(...secondaryValues, 10) : 100;

  // Scale functions
  const getX = (index: number) =>
    padding.left + (index / (timeseries.length - 1 || 1)) * chartWidth;

  const getYPrimary = (val: number) =>
    padding.top + chartHeight - (val / maxPrimary) * chartHeight;

  const getYSecondary = (val: number) =>
    padding.top + chartHeight - (val / maxSecondary) * chartHeight;

  // SVG Paths
  const primaryPoints = timeseries.map((d, i) => `${getX(i)},${getYPrimary(Number(d[primaryKey]) || 0)}`).join(' ');
  const secondaryPoints = secondaryKey
    ? timeseries.map((d, i) => `${getX(i)},${getYSecondary(Number(d[secondaryKey!]) || 0)}`).join(' ')
    : '';

  // Area under curve for primary
  const primaryArea = `${getX(0)},${padding.top + chartHeight} ${primaryPoints} ${getX(timeseries.length - 1)},${padding.top + chartHeight}`;

  const hoveredPoint = hoveredIndex !== null ? timeseries[hoveredIndex] : null;

  return (
    <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Chart Header & Mode Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Performance Over Time</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily Tracking</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            <span>Trends across acquisition cost, conversion rate, spend, and return</span>
          </div>
        </div>

        {/* View Toggles */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setMetricMode('cac_cpt')}
            className={`btn btn-sm ${metricMode === 'cac_cpt' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Acquisition Cost vs Cost per Trial
          </button>
          <button
            onClick={() => setMetricMode('spend_subs')}
            className={`btn btn-sm ${metricMode === 'spend_subs' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Spend & Subscriptions
          </button>
          <button
            onClick={() => setMetricMode('conversion')}
            className={`btn btn-sm ${metricMode === 'conversion' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Trial → Subscription %
          </button>
          <button
            onClick={() => setMetricMode('roas')}
            className={`btn btn-sm ${metricMode === 'roas' ? 'btn-primary' : 'btn-ghost'}`}
          >
            7-Day Ad Return (D7 ROAS)
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="immatureHatch" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.08)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0.16)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + chartHeight * ratio;
            const val = maxPrimary * (1 - ratio);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                  className="tabular-nums"
                >
                  {isPercentage ? `${val.toFixed(0)}%` : `$${val.toFixed(0)}`}
                </text>
              </g>
            );
          })}

          {/* Immature Cohort Shaded Zone (Oct 12-14) */}
          {timeseries.map((d, i) => {
            if (!d.isImmature) return null;
            const x = getX(i) - (chartWidth / (timeseries.length - 1)) / 2;
            const w = chartWidth / (timeseries.length - 1);
            return (
              <rect
                key={`immature-${i}`}
                x={x}
                y={padding.top}
                width={w}
                height={chartHeight}
                fill="url(#immatureHatch)"
              />
            );
          })}

          {/* Primary Area & Line */}
          <polygon points={primaryArea} fill="url(#primaryGradient)" />
          <polyline
            points={primaryPoints}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secondary Line (if present) */}
          {secondaryKey && (
            <polyline
              points={secondaryPoints}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}


          {/* Interactive Hover Columns */}
          {timeseries.map((_, i) => {
            const x = getX(i);
            const colWidth = chartWidth / (timeseries.length - 1 || 1);
            return (
              <rect
                key={`hover-${i}`}
                x={x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
              />
            );
          })}

          {/* Hover Crosshair & Dots */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + chartHeight}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getYPrimary(Number(timeseries[hoveredIndex][primaryKey]) || 0)}
                r={5}
                fill={primaryColor}
                stroke="#fff"
                strokeWidth="2"
              />
              {secondaryKey && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getYSecondary(Number(timeseries[hoveredIndex][secondaryKey]) || 0)}
                  r={5}
                  fill={secondaryColor}
                  stroke="#fff"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* X-Axis Dates */}
          {timeseries.map((d, i) => {
            if (i % Math.ceil(timeseries.length / 8) !== 0 && i !== timeseries.length - 1) return null;
            return (
              <text
                key={`label-${i}`}
                x={getX(i)}
                y={height - 12}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="middle"
                className="tabular-nums"
              >
                {d.date.slice(5)}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 15,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              boxShadow: 'var(--shadow-card)',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: 180,
            }}
          >
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{hoveredPoint.date}</span>
              {hoveredPoint.isImmature && (
                <span className="badge badge-warning" style={{ fontSize: 9 }}>Immature</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: primaryColor }}>
                <span>{primaryLabel}:</span>
                <strong className="tabular-nums">
                  {isPercentage
                    ? `${Number(hoveredPoint[primaryKey]).toFixed(1)}%`
                    : `$${Number(hoveredPoint[primaryKey]).toFixed(2)}`}
                </strong>
              </div>

              {secondaryKey && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: secondaryColor }}>
                  <span>{secondaryLabel}:</span>
                  <strong className="tabular-nums">
                    {secondaryKey === 'subscriptions'
                      ? hoveredPoint.subscriptions
                      : `$${Number(hoveredPoint[secondaryKey]).toFixed(2)}`}
                  </strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 11, marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
                <span>Daily Spend:</span>
                <span className="tabular-nums">${hoveredPoint.spend.toFixed(2)}</span>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Legend & Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 11, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 3, backgroundColor: primaryColor, borderRadius: 2 }} />
            {primaryLabel}
          </span>
          {secondaryKey && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 2, borderTop: `2px dashed ${secondaryColor}` }} />
              {secondaryLabel}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Info size={12} />
          <span>Shaded area marks incomplete cohort window (Oct 12–14)</span>
        </div>
      </div>
    </div>
  );
}
