'use client';

import React, { useEffect, useState } from 'react';
import { X, Flame, AlertTriangle, TrendingDown, TrendingUp, RefreshCw, Clock, Zap } from 'lucide-react';

interface WeekData {
  label: string;
  impressions: number;
  ctr: number;
  cpt: number | null;
  spend: number;
}

interface FatiguedAd {
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  channel: string;
  country: string;
  creative_type: string;
  days_running: number;
  severity: 'high' | 'medium' | 'low';
  score: number;
  weeks: WeekData[];
  ctr_change_pct: number;
  cpt_change_pct: number;
  recommendation: string;
}

interface FatigueSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
}

interface FatigueData {
  ads: FatiguedAd[];
  summary: FatigueSummary;
  analysisWindow: { w1: string; w2: string; w3: string };
}

interface FatigueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEVERITY_COLORS = {
  high:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   text: '#f87171', label: '🔴 High' },
  medium: { bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.30)',  text: '#fbbf24', label: '🟡 Medium' },
  low:    { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)',  text: '#818cf8', label: '🔵 Low' },
};

/** Mini inline sparkline — 3 dots connected by a line */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 60, H = 24;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 4) - 2,
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
      ))}
    </svg>
  );
}

function AdCard({ ad }: { ad: FatiguedAd }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_COLORS[ad.severity];

  const channelLabel = ad.channel === 'meta' ? 'Meta' : 'TikTok';
  const ctrValues = ad.weeks.map(w => w.ctr);
  const cptValues = ad.weeks.map(w => w.cpt ?? 0).filter(v => v > 0);

  return (
    <div style={{
      background: sev.bg,
      border: `1px solid ${sev.border}`,
      borderRadius: 12,
      padding: '14px 16px',
      transition: 'all 0.15s ease',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', wordBreak: 'break-word' }}>
              {ad.ad_name}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
              background: sev.border, color: sev.text,
            }}>
              {sev.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            {ad.campaign_name} › {ad.adset_name} · {channelLabel} · {ad.country} · {ad.creative_type}
          </div>
        </div>

        {/* Score badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '6px 10px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: sev.text, lineHeight: 1 }}>{ad.score}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>score</span>
        </div>
      </div>

      {/* Key signals */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        {/* CTR trend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkline values={ctrValues} color={ad.ctr_change_pct < 0 ? '#f87171' : '#34d399'} />
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Click-Through Rate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
              {ad.ctr_change_pct < 0
                ? <TrendingDown size={12} color="#f87171" />
                : <TrendingUp size={12} color="#34d399" />}
              <span style={{ color: ad.ctr_change_pct < 0 ? '#f87171' : '#34d399' }}>
                {ad.ctr_change_pct > 0 ? '+' : ''}{ad.ctr_change_pct}%
              </span>
            </div>
          </div>
        </div>

        {/* CPT trend */}
        {cptValues.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkline values={cptValues} color={ad.cpt_change_pct > 0 ? '#fbbf24' : '#34d399'} />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Cost per Trial</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                {ad.cpt_change_pct > 0
                  ? <TrendingUp size={12} color="#fbbf24" />
                  : <TrendingDown size={12} color="#34d399" />}
                <span style={{ color: ad.cpt_change_pct > 0 ? '#fbbf24' : '#34d399' }}>
                  {ad.cpt_change_pct > 0 ? '+' : ''}{ad.cpt_change_pct}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Days running */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={13} color="var(--text-muted)" />
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Days running</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: ad.days_running >= 30 ? '#fbbf24' : '#e2e8f0' }}>
              {ad.days_running}d
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div style={{
        marginTop: 12, padding: '8px 12px', borderRadius: 8,
        background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <Zap size={13} color={sev.text} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.4 }}>{ad.recommendation}</span>
      </div>

      {/* Weekly breakdown toggle */}
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          marginTop: 10, background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        {expanded ? '▲' : '▼'} {expanded ? 'Hide' : 'Show'} weekly breakdown
      </button>

      {expanded && (
        <div style={{ marginTop: 10, overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 600 }}>Week</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Impressions</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Click-Through Rate</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Cost per Trial</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>Spend</th>
              </tr>
            </thead>
            <tbody>
              {ad.weeks.map((w, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '5px 8px', color: '#e2e8f0' }}>{w.label}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#e2e8f0' }}>{w.impressions.toLocaleString()}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#e2e8f0' }}>{w.ctr.toFixed(2)}%</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#e2e8f0' }}>
                    {w.cpt != null ? `$${w.cpt.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#e2e8f0' }}>${w.spend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function FatigueModal({ isOpen, onClose }: FatigueModalProps) {
  const [data, setData] = useState<FatigueData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch('/api/metrics/fatigue')
      .then(r => r.json())
      .then(d => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = data?.ads.filter(a => filter === 'all' || a.severity === filter) ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 800,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(251,191,36,0.06) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Creative Fatigue Detector</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Ads showing declining engagement over the last 3 weeks — Sep 22 → Oct 11
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        {/* Summary Bar */}
        {data && (
          <div style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.015)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: '#ffffff' }}>{data.summary.total}</strong> ads analysed
            </div>
            {[
              { key: 'high', label: 'High fatigue', color: '#f87171' },
              { key: 'medium', label: 'Medium fatigue', color: '#fbbf24' },
              { key: 'low', label: 'Low / Monitor', color: '#818cf8' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFilter(filter === key as 'all' | 'high' | 'medium' | 'low' ? 'all' : key as 'high' | 'medium' | 'low')}
                style={{
                  background: filter === key ? `rgba(${key === 'high' ? '239,68,68' : key === 'medium' ? '251,191,36' : '99,102,241'},0.2)` : 'transparent',
                  border: `1px solid ${filter === key ? color : 'transparent'}`,
                  borderRadius: 20, padding: '3px 10px', cursor: 'pointer',
                  fontSize: 12, color, display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <AlertTriangle size={11} />
                <strong>{data.summary[key as keyof typeof data.summary]}</strong> {label}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={11} />
              Min. 5,000 impressions/week threshold applied
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', padding: 20 }}>
              <div className="pulse-dot" />
              <span>Analysing 3-week engagement trends...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Flame size={32} color="var(--text-muted)" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>No fatigued ads found</div>
              <div style={{ fontSize: 12 }}>All active ads with sufficient volume are performing consistently.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Showing {filtered.length} ad{filtered.length !== 1 ? 's' : ''} · Sorted by fatigue score (highest first)
              </div>
              {filtered.map(ad => <AdCard key={ad.ad_id} ad={ad} />)}
            </>
          )}
        </div>

        {/* Explanation footer */}
        <div style={{
          padding: '12px 24px', borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.2)',
          fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5,
        }}>
          <strong style={{ color: '#e2e8f0' }}>How scores are calculated:</strong> 40 pts for Click-Through Rate drop ≥20%, 30 pts for Cost per Trial rise ≥25%, softer signals 10–20 pts each, +10 pts for ads running ≥30 days.
          High ≥ 60 · Medium ≥ 30 · Low &lt; 30.
        </div>
      </div>
    </div>
  );
}
