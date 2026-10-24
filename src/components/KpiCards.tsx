'use client';

import React from 'react';
import { MetricAggregates } from '@/lib/types';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles,
  MousePointerClick
} from 'lucide-react';

interface KpiCardsProps {
  metrics: MetricAggregates;
  channels: Array<{ channel: string; metrics: MetricAggregates }>;
  countries: Array<{ country: string; metrics: MetricAggregates }>;
  isImmatureCac: boolean;
  hasLowSample: boolean;
  cohortMessage: string | null;
  sampleSizeMessage: string | null;
}

export function KpiCards({
  metrics,
  channels,
  isImmatureCac,
  hasLowSample,
  cohortMessage,
  sampleSizeMessage,
}: KpiCardsProps) {
  const formatMoney = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNumber = (val: number) =>
    val.toLocaleString('en-US');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Cohort Maturation Warning Banner (Team Note 5) */}
      {isImmatureCac && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#fef3c7',
        }}>
          <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13 }}>
            <strong>Cohort Maturation Alert:</strong> {cohortMessage || "Recent days (< 4 days old) have incomplete trial conversion data. Subscriptions are still arriving. Cost per Trial (CPT) should be used instead of Customer Acquisition Cost (CAC) for evaluation."}
          </div>
        </div>
      )}

      {/* Low Sample Size Warning Banner (Team Note 6) */}
      {hasLowSample && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#e0e7ff',
        }}>
          <ShieldAlert size={20} color="#818cf8" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13 }}>
            <strong>Sample Size Notice:</strong> {sampleSizeMessage || `Total subscriptions (${metrics.subscriptions}) is below the 20-subscription threshold. Team policy requires at least 20 subscriptions before declaring top or bottom performers.`}
          </div>
        </div>
      )}

      {/* Grid of Key Performance Indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 14,
      }}>
        {/* Card 1: Total Spend */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL SPEND</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)' }}>
              <DollarSign size={16} color="#818cf8" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>
            {formatMoney(metrics.spend)}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            {channels.map(ch => (
              <span key={ch.channel} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: ch.channel === 'meta' ? 'var(--color-meta)' : 'var(--color-tiktok)'
                }} />
                {ch.channel === 'meta' ? 'Meta' : 'TikTok'}: {formatMoney(ch.metrics.spend)}
              </span>
            ))}
          </div>
        </div>

        {/* Card 2: Customer Acquisition Cost (CAC) */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>CUSTOMER ACQUISITION COST (CAC)</span>
              {isImmatureCac && (
                <span className="badge badge-warning" title="Trial conversions still arriving — last 4 days">
                  Incomplete
                </span>
              )}
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)' }}>
              <Activity size={16} color="#f87171" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: isImmatureCac ? '#fbbf24' : '#ffffff' }}>
            {formatMoney(metrics.cac)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{formatNumber(metrics.subscriptions)} subscriptions</span>
            {hasLowSample && <span style={{ color: '#fbbf24' }}>Low sample (&lt;20 subscriptions)</span>}
          </div>
        </div>

        {/* Card 3: Cost Per Trial (CPT) */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>COST PER TRIAL (CPT)</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)' }}>
              <Sparkles size={16} color="#34d399" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: '#34d399' }}>
            {formatMoney(metrics.cpt)}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{formatNumber(metrics.trials)} total free trials started</span>
          </div>
        </div>

        {/* Card 4: Trial to Subscription Conversion Rate */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>TRIAL → SUBSCRIPTION RATE</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)' }}>
              <TrendingUp size={16} color="#c084fc" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>
            {metrics.trialToSubRate.toFixed(1)}%
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{formatNumber(metrics.trialConversions)} converted from {formatNumber(metrics.trials)} trials</span>
          </div>
        </div>

        {/* Card 5: Day-7 Return on Ad Spend (D7 ROAS) */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>7-DAY RETURN ON AD SPEND (D7 ROAS)</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)' }}>
              <DollarSign size={16} color="#22d3ee" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: metrics.d7Roas >= 80 ? '#34d399' : '#ffffff' }}>
            {metrics.d7Roas.toFixed(1)}%
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Revenue in first 7 days: {formatMoney(metrics.d7Revenue)}</span>
          </div>
        </div>

        {/* Card 6: App Installs & Cost Per Install (CPI) */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>APP INSTALLS</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)' }}>
              <Users size={16} color="#60a5fa" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>
            {formatNumber(metrics.installs)}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Cost per Install (CPI): <strong>{formatMoney(metrics.cpi)}</strong></span>
          </div>
        </div>

        {/* Card 7: Click-Through Rate (CTR) */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>CLICK-THROUGH RATE (CTR)</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(244, 63, 94, 0.15)' }}>
              <MousePointerClick size={16} color="#fb7185" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>
            {metrics.ctr.toFixed(1)}%
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{formatNumber(metrics.clicks)} clicks / {formatNumber(metrics.impressions)} impressions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
