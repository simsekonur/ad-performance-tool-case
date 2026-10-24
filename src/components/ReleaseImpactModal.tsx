'use client';

import React, { useState, useEffect } from 'react';
import { ReleaseImpact, ReleaseInfo } from '@/lib/types';
import { X, GitBranch, GitCommit, ArrowRight, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface ReleaseImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReleaseId?: string | null;
}

export function ReleaseImpactModal({
  isOpen,
  onClose,
  selectedReleaseId,
}: ReleaseImpactModalProps) {
  const [releases, setReleases] = useState<ReleaseInfo[]>([]);
  const [activeReleaseId, setActiveReleaseId] = useState<string | null>(null);
  const [impact, setImpact] = useState<ReleaseImpact | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/metrics/release-impact')
        .then(res => res.json())
        .then(data => {
          if (data.releases) {
            setReleases(data.releases);
            const initialId = selectedReleaseId || data.releases[0]?.id;
            setActiveReleaseId(initialId);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, selectedReleaseId]);

  useEffect(() => {
    if (activeReleaseId) {
      setIsLoading(true);
      fetch(`/api/metrics/release-impact?releaseId=${activeReleaseId}&windowDays=3`)
        .then(res => res.json())
        .then(data => {
          setImpact(data.impact || null);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [activeReleaseId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 860 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GitBranch size={18} color="#34d399" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>App Release Impact Correlation Engine</h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Inspect mobile releases from build logs and evaluate pre vs post metric shifts
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', gap: 16, padding: 18, minHeight: 460 }}>
          {/* Release Sidebar */}
          <div style={{
            width: 240,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            borderRight: '1px solid var(--border-subtle)',
            paddingRight: 12,
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
              Releases ({releases.length})
            </div>

            {releases.map(rel => {
              const isSelected = rel.id === activeReleaseId;
              return (
                <button
                  key={rel.id}
                  onClick={() => setActiveReleaseId(rel.id)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                      {rel.platform.toUpperCase()} {rel.version}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {rel.releaseDate.slice(5)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rel.summary}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Impact Details & Git Commits */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 8 }}>
                <div className="pulse-dot" />
                <span>Computing 3-day pre vs post deltas...</span>
              </div>
            ) : impact ? (
              <>
                {/* Release Header */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${impact.release.platform === 'ios' ? 'badge-meta' : 'badge-tiktok'}`}>
                        {impact.release.platform.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                        Version {impact.release.version}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} />
                      <span>{impact.release.releasedAt}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 8 }}>
                    {impact.release.summary}
                  </p>
                </div>

                {/* Pre vs Post Delta Metrics */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} color="#34d399" />
                    <span>3-Day Pre vs Post Metric Shift</span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 10,
                  }}>
                    {/* Trial -> Sub Delta */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trial → Sub %</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{impact.prePeriod.metrics.trialToSubRate}%</span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{impact.postPeriod.metrics.trialToSubRate}%</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: impact.delta.trialToSubRateDelta >= 0 ? '#34d399' : '#f87171' }}>
                        {impact.delta.trialToSubRateDelta >= 0 ? '+' : ''}{impact.delta.trialToSubRateDelta}%
                      </div>
                    </div>

                    {/* CAC Delta */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Blended CAC</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>${impact.prePeriod.metrics.cac.toFixed(2)}</span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>${impact.postPeriod.metrics.cac.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: impact.delta.cacDelta <= 0 ? '#34d399' : '#f87171' }}>
                        {impact.delta.cacDelta >= 0 ? '+' : ''}${impact.delta.cacDelta.toFixed(2)}
                      </div>
                    </div>

                    {/* Cost Per Trial Delta */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cost Per Trial</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>${impact.prePeriod.metrics.cpt.toFixed(2)}</span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>${impact.postPeriod.metrics.cpt.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: impact.delta.cptDelta <= 0 ? '#34d399' : '#f87171' }}>
                        {impact.delta.cptDelta >= 0 ? '+' : ''}${impact.delta.cptDelta.toFixed(2)}
                      </div>
                    </div>

                    {/* Subscriptions Delta */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Subscriptions</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{impact.prePeriod.metrics.subscriptions}</span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{impact.postPeriod.metrics.subscriptions}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: impact.delta.subscriptionsDelta >= 0 ? '#34d399' : '#f87171' }}>
                        {impact.delta.subscriptionsDelta >= 0 ? '+' : ''}{impact.delta.subscriptionsDelta}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Git Commits in this Release */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GitCommit size={14} color="#818cf8" />
                    <span>Included Commits ({impact.release.commits.length})</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {impact.release.commits.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, color: '#818cf8', fontWeight: 600 }}>
                              {c.hash.slice(0, 7)}
                            </span>
                            {c.scope && (
                              <span className="badge badge-creative" style={{ fontSize: 10 }}>
                                {c.scope}
                              </span>
                            )}
                            <span style={{ fontWeight: 600, fontSize: 12.5, color: '#e2e8f0' }}>
                              {c.message}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            by {c.author}
                          </span>
                        </div>
                        {c.description && (
                          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', paddingLeft: 12, borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                            {c.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Select a release to view details.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
