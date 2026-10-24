'use client';

import React from 'react';
import { FilterState } from '@/lib/types';
import { 
  Sparkles, 
  Calendar, 
  Layers, 
  Globe, 
  Search, 
  SlidersHorizontal, 
  BookOpen, 
  GitBranch, 
  LogOut,
  Bot,
  Flame
} from 'lucide-react';

interface HeaderProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onOpenRules: () => void;
  onOpenReleases: () => void;
  onOpenFatigue: () => void;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
  activeRulesCount: number;
  releasesCount: number;
  fatiguedAdsCount: number;
  onLogout: () => void;
}

export function Header({
  filters,
  onFilterChange,
  onOpenRules,
  onOpenReleases,
  onOpenFatigue,
  onToggleCopilot,
  isCopilotOpen,
  activeRulesCount,
  releasesCount,
  fatiguedAdsCount,
  onLogout,
}: HeaderProps) {
  const setPreset = (preset: FilterState['preset']) => {
    switch (preset) {
      case 'last_week':
        onFilterChange({ preset, startDate: '2026-10-05', endDate: '2026-10-11' });
        break;
      case 'last_7_days':
        onFilterChange({ preset, startDate: '2026-10-08', endDate: '2026-10-14' });
        break;
      case 'last_14_days':
        onFilterChange({ preset, startDate: '2026-10-01', endDate: '2026-10-14' });
        break;
      case 'mtd':
        onFilterChange({ preset, startDate: '2026-10-01', endDate: '2026-10-14' });
        break;
      case 'all':
        onFilterChange({ preset, startDate: '2026-09-03', endDate: '2026-10-14' });
        break;
      default:
        break;
    }
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.95)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Top Bar: Brand, Quick Status & Top Actions */}
      <div style={{
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LIVENSA
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                INTERNAL TOOLS
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span className="pulse-dot"></span>
              <span>Warehouse Today: <strong>2026-10-15</strong> (Yesterday: 2026-10-14)</span>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Teach Agent / Rules Manager */}
          <button 
            onClick={onOpenRules} 
            className="btn btn-ghost" 
            title="View & customize operational rules without code changes"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            <BookOpen size={15} color="#818cf8" />
            <span>Teach Agent</span>
            <span style={{
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#818cf8',
              padding: '1px 6px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 700,
            }}>
              {activeRulesCount}
            </span>
          </button>

          {/* Creative Fatigue Detector */}
          <button 
            onClick={onOpenFatigue} 
            className="btn btn-ghost" 
            title="Detect ads showing declining engagement (creative fatigue)"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            <Flame size={15} color="#f87171" />
            <span>Creative Fatigue</span>
            {fatiguedAdsCount > 0 && (
              <span style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '1px 6px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                animation: 'pulse 2s infinite',
              }}>
                {fatiguedAdsCount}
              </span>
            )}
          </button>

          {/* Release Impact */}
          <button 
            onClick={onOpenReleases} 
            className="btn btn-ghost" 
            title="Inspect mobile app releases and commit correlations"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            <GitBranch size={15} color="#34d399" />
            <span>Release Impact</span>
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              padding: '1px 6px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 700,
            }}>
              {releasesCount}
            </span>
          </button>

          {/* AI Copilot Toggle */}
          <button 
            onClick={onToggleCopilot} 
            className={`btn ${isCopilotOpen ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              border: isCopilotOpen ? 'none' : '1px solid var(--border-subtle)',
            }}
          >
            <Bot size={16} />
            <span>AI Copilot</span>
          </button>

          {/* Logout */}
          <button 
            onClick={onLogout} 
            className="btn btn-ghost" 
            title="Sign out"
            style={{ padding: '8px 10px' }}
          >
            <LogOut size={16} color="var(--text-muted)" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Date Range Presets & Live Filters */}
      <div style={{
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'rgba(13, 18, 31, 0.6)',
      }}>
        {/* Preset Date Range Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} color="var(--text-muted)" style={{ marginRight: 4 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>

          <button 
            onClick={() => setPreset('last_week')}
            className={`btn btn-sm ${filters.preset === 'last_week' ? 'btn-primary' : 'btn-ghost'}`}
            title="Monday to Sunday (Oct 5–11, 2026)"
          >
            Last Week (Oct 5–11)
          </button>

          <button 
            onClick={() => setPreset('last_7_days')}
            className={`btn btn-sm ${filters.preset === 'last_7_days' ? 'btn-primary' : 'btn-ghost'}`}
            title="7 days ending yesterday (Oct 8–14, 2026)"
          >
            Last 7d
          </button>

          <button 
            onClick={() => setPreset('last_14_days')}
            className={`btn btn-sm ${filters.preset === 'last_14_days' ? 'btn-primary' : 'btn-ghost'}`}
            title="14 days ending yesterday (Oct 1–14, 2026)"
          >
            Last 14d
          </button>

          <button 
            onClick={() => setPreset('mtd')}
            className={`btn btn-sm ${filters.preset === 'mtd' ? 'btn-primary' : 'btn-ghost'}`}
            title="Month to date (Oct 1–14, 2026)"
          >
            Month to Date
          </button>

          <button 
            onClick={() => setPreset('all')}
            className={`btn btn-sm ${filters.preset === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            title="All 6 weeks in warehouse (Sep 3–Oct 14)"
          >
            All 6 Weeks
          </button>

          {/* Date Range Label Display */}
          <div style={{ 
            fontSize: 12, 
            color: 'var(--text-secondary)', 
            padding: '4px 8px', 
            borderRadius: 6, 
            background: 'rgba(255,255,255,0.03)',
            marginLeft: 6,
            fontFamily: 'var(--font-geist-mono)',
          }}>
            {filters.startDate} → {filters.endDate}
          </div>
        </div>

        {/* Filter Controls: Channel, Country, Status, Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Channel Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Layers size={13} color="var(--text-muted)" />
            <select
              value={filters.channel}
              onChange={(e) => onFilterChange({ channel: e.target.value as FilterState['channel'] })}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Channels</option>
              <option value="meta">Meta (FB & IG)</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          {/* Country Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={13} color="var(--text-muted)" />
            <select
              value={filters.country}
              onChange={(e) => onFilterChange({ country: e.target.value as FilterState['country'] })}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Countries</option>
              <option value="US">US (United States)</option>
              <option value="DE">DE (Germany)</option>
              <option value="GB">GB (Great Britain)</option>
              <option value="BR">BR (Brazil)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <SlidersHorizontal size={13} color="var(--text-muted)" />
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value as FilterState['status'] })}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused Only</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            padding: '4px 8px',
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 12,
                outline: 'none',
                width: 130,
              }}
            />
            {filters.search && (
              <button 
                onClick={() => onFilterChange({ search: '' })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
