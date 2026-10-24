'use client';

import React, { useState } from 'react';
import { DrilldownNode } from '@/lib/types';
import { 
  ChevronRight, 
  ChevronDown, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowUpDown, 
  Layers
} from 'lucide-react';

interface DrillDownTableProps {
  campaigns: DrilldownNode[];
}

type SortField = 'name' | 'spend' | 'installs' | 'cpi' | 'trials' | 'cpt' | 'subscriptions' | 'cac' | 'trialToSubRate' | 'd7Roas';
type SortOrder = 'asc' | 'desc';

export function DrillDownTable({ campaigns }: DrillDownTableProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(campaigns.slice(0, 3).map(c => c.id)));
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    for (const c of campaigns) {
      all.add(c.id);
      if (c.children) {
        for (const s of c.children) {
          all.add(s.id);
        }
      }
    }
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortNodes = (nodes: DrilldownNode[]): DrilldownNode[] => {
    return [...nodes].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'name') {
        valA = a.name;
        valB = b.name;
      } else {
        valA = Number(a.metrics[sortField]) || 0;
        valB = Number(b.metrics[sortField]) || 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  };

  const formatMoney = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNum = (val: number) => val.toLocaleString('en-US');

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      {/* Table Toolbar */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'rgba(255, 255, 255, 0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layers size={18} color="#818cf8" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Performance Drilldown Explorer</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Campaign → Ad Set → Ad
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={expandAll} className="btn btn-ghost btn-sm">Expand All</button>
          <button onClick={collapseAll} className="btn btn-ghost btn-sm">Collapse All</button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 16px', minWidth: 260, cursor: 'pointer' }} onClick={() => handleSort('name')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Entity Name</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('spend')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>Spend</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('installs')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>Installs</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('cpi')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>Cost per Install (CPI)</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('trials')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>Trials</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('cpt')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>Cost per Trial (CPT)</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('subscriptions')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>Subscriptions</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('cac')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>Acquisition Cost (CAC)</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('trialToSubRate')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>Trial → Subscription %</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('d7Roas')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <span>7-Day Ad Return (D7 ROAS)</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No campaigns match the active filters.
                </td>
              </tr>
            ) : (
              sortNodes(campaigns).map(campaign => (
                <React.Fragment key={campaign.id}>
                  {/* Campaign Row */}
                  <tr style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    fontWeight: 600,
                  }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => toggleExpand(campaign.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {expandedNodes.has(campaign.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        <span className={`badge ${campaign.channel === 'meta' ? 'badge-meta' : 'badge-tiktok'}`}>
                          {campaign.channel === 'meta' ? 'Meta' : 'TikTok'}
                        </span>
                        <span style={{ fontSize: 11, padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                          {campaign.country}
                        </span>
                        <span style={{ color: '#ffffff' }}>{campaign.name}</span>
                      </div>
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 12px', textAlign: 'right', color: '#ffffff' }}>
                      {formatMoney(campaign.metrics.spend)}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatNum(campaign.metrics.installs)}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatMoney(campaign.metrics.cpi)}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatNum(campaign.metrics.trials)}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 12px', textAlign: 'right', color: '#34d399' }}>
                      {formatMoney(campaign.metrics.cpt)}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatNum(campaign.metrics.subscriptions)}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 12px', textAlign: 'right', color: campaign.isImmatureCac ? '#fbbf24' : '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        {campaign.hasLowSample && <span title="Less than 20 subscriptions — low sample"><ShieldAlert size={12} color="#818cf8" /></span>}
                        {campaign.isImmatureCac && <span title="Incomplete cohort — last 4 days still converting"><AlertTriangle size={12} color="#fbbf24" /></span>}
                        <span>{formatMoney(campaign.metrics.cac)}</span>
                      </div>
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {campaign.metrics.trialToSubRate.toFixed(1)}%
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 16px', textAlign: 'right', color: campaign.metrics.d7Roas >= 80 ? '#34d399' : '#ffffff' }}>
                      {campaign.metrics.d7Roas.toFixed(1)}%
                    </td>
                  </tr>

                  {/* Ad Sets inside Campaign */}
                  {expandedNodes.has(campaign.id) && campaign.children && sortNodes(campaign.children).map(adset => (
                    <React.Fragment key={adset.id}>
                      <tr style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                      }}>
                        <td style={{ padding: '10px 16px 10px 36px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => toggleExpand(adset.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              {expandedNodes.has(adset.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            <span className={`badge ${adset.status === 'active' ? 'badge-active' : 'badge-paused'}`}>
                              {adset.status}
                            </span>
                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{adset.name}</span>
                          </div>
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {formatMoney(adset.metrics.spend)}
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatNum(adset.metrics.installs)}
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatMoney(adset.metrics.cpi)}
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatNum(adset.metrics.trials)}
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', color: '#34d399' }}>
                          {formatMoney(adset.metrics.cpt)}
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatNum(adset.metrics.subscriptions)}
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', color: adset.isImmatureCac ? '#fbbf24' : '#ffffff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            {adset.hasLowSample && <span title="Less than 20 subscriptions — low sample"><ShieldAlert size={12} color="#818cf8" /></span>}
                            {adset.isImmatureCac && <span title="Incomplete cohort — last 4 days still converting"><AlertTriangle size={12} color="#fbbf24" /></span>}
                            <span>{formatMoney(adset.metrics.cac)}</span>
                          </div>
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {adset.metrics.trialToSubRate.toFixed(1)}%
                        </td>
                        <td className="tabular-nums" style={{ padding: '10px 16px', textAlign: 'right', color: adset.metrics.d7Roas >= 80 ? '#34d399' : 'var(--text-secondary)' }}>
                          {adset.metrics.d7Roas.toFixed(1)}%
                        </td>
                      </tr>

                      {/* Ads inside Ad Set */}
                      {expandedNodes.has(adset.id) && adset.children && sortNodes(adset.children).map(ad => (
                        <tr key={ad.id} style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                          fontSize: 12,
                        }}>
                          <td style={{ padding: '8px 16px 8px 64px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className={`badge ${ad.status === 'active' ? 'badge-active' : 'badge-paused'}`} style={{ fontSize: 10 }}>
                                {ad.status}
                              </span>
                              {ad.creativeType && (
                                <span className="badge badge-creative" style={{ fontSize: 10 }}>
                                  {ad.creativeType.replace(/_/g, ' ')}
                                </span>
                              )}
                              <span style={{ color: 'var(--text-secondary)' }}>{ad.name}</span>
                            </div>
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {formatMoney(ad.metrics.spend)}
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {formatNum(ad.metrics.installs)}
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {formatMoney(ad.metrics.cpi)}
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {formatNum(ad.metrics.trials)}
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 12px', textAlign: 'right', color: '#34d399' }}>
                            {formatMoney(ad.metrics.cpt)}
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {formatNum(ad.metrics.subscriptions)}
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 12px', textAlign: 'right', color: ad.isImmatureCac ? '#fbbf24' : 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                              {ad.hasLowSample && <span title="<20 subs sample"><ShieldAlert size={11} color="#818cf8" /></span>}
                              <span>{formatMoney(ad.metrics.cac)}</span>
                            </div>
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {ad.metrics.trialToSubRate.toFixed(1)}%
                          </td>
                          <td className="tabular-nums" style={{ padding: '8px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {ad.metrics.d7Roas.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
