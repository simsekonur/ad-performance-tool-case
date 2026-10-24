'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FilterState, 
  MetricAggregates, 
  DrilldownNode, 
  DynamicRule,
} from '@/lib/types';
import { Header } from '@/components/Header';
import { KpiCards } from '@/components/KpiCards';
import { PerformanceChart } from '@/components/PerformanceChart';
import { DrillDownTable } from '@/components/DrillDownTable';
import { AgentDrawer } from '@/components/AgentDrawer';
import { RulesModal } from '@/components/RulesModal';
import { ReleaseImpactModal } from '@/components/ReleaseImpactModal';
import { FatigueModal } from '@/components/FatigueModal';
import { LoginView } from '@/components/LoginView';

const INITIAL_FILTERS: FilterState = {
  preset: 'last_week',
  startDate: '2026-10-05',
  endDate: '2026-10-11',
  channel: 'all',
  country: 'all',
  status: 'all',
  search: '',
};

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Data States
  const [metrics, setMetrics] = useState<MetricAggregates | null>(null);
  const [channels, setChannels] = useState<Array<{ channel: string; metrics: MetricAggregates }>>([]);
  const [countries, setCountries] = useState<Array<{ country: string; metrics: MetricAggregates }>>([]);
  const [isImmatureCac, setIsImmatureCac] = useState(false);
  const [hasLowSample, setHasLowSample] = useState(false);
  const [cohortMessage, setCohortMessage] = useState<string | null>(null);
  const [sampleSizeMessage, setSampleSizeMessage] = useState<string | null>(null);

  const [timeseries, setTimeseries] = useState([]);
  const [campaigns, setCampaigns] = useState<DrilldownNode[]>([]);
  const [rules, setRules] = useState<DynamicRule[]>([]);
  const [releasesCount, setReleasesCount] = useState(12);
  const [fatiguedAdsCount, setFatiguedAdsCount] = useState(0);

  // Modal & Drawer States — start closed on server to avoid hydration mismatch
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  useEffect(() => { setIsCopilotOpen(true); }, []);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isReleasesModalOpen, setIsReleasesModalOpen] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [isFatigueModalOpen, setIsFatigueModalOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) setIsAuthenticated(true);
        else setIsAuthenticated(false);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Fetch Dashboard Data
  const fetchData = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        channel: filters.channel,
        country: filters.country,
        status: filters.status,
        search: filters.search,
      });

      const [overviewRes, timeseriesRes, drilldownRes] = await Promise.all([
        fetch(`/api/metrics/overview?${queryParams}`),
        fetch(`/api/metrics/timeseries?${queryParams}`),
        fetch(`/api/metrics/drilldown?${queryParams}`),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setMetrics(data.metrics);
        setChannels(data.channels || []);
        setCountries(data.countries || []);
        setIsImmatureCac(data.isImmatureCac);
        setHasLowSample(data.hasLowSample);
        setCohortMessage(data.cohortMessage);
        setSampleSizeMessage(data.sampleSizeMessage);
      }
      if (timeseriesRes.ok) {
        const data = await timeseriesRes.json();
        setTimeseries(data.timeseries || []);
      }
      if (drilldownRes.ok) {
        const data = await drilldownRes.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, [filters]);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
    }
  }, []);

  const fetchReleases = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics/release-impact');
      if (res.ok) {
        const data = await res.json();
        if (data.releases) setReleasesCount(data.releases.length);
      }
    } catch (err) {
      console.error('Error fetching releases count:', err);
    }
  }, []);

  const fetchFatigueSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics/fatigue');
      if (res.ok) {
        const data = await res.json();
        setFatiguedAdsCount(data.ads?.filter((a: { severity: string }) => a.severity === 'high').length || 0);
      }
    } catch (err) {
      console.error('Error fetching fatigue data:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      fetchRules();
      fetchReleases();
      fetchFatigueSummary();
    }
  }, [isAuthenticated, fetchData, fetchRules, fetchReleases, fetchFatigueSummary]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    await fetch('/api/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled }),
    });
    fetchRules();
  };

  const handleAddRule = async (newRule: { title: string; content: string; category: DynamicRule['category'] }) => {
    await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    });
    fetchRules();
  };

  const handleDeleteRule = async (id: string) => {
    await fetch(`/api/rules?id=${id}`, { method: 'DELETE' });
    fetchRules();
  };

  const handleOpenReleaseDetails = (relId: string) => {
    setSelectedReleaseId(relId);
    setIsReleasesModalOpen(true);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="pulse-dot" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenReleases={() => {
          setSelectedReleaseId(null);
          setIsReleasesModalOpen(true);
        }}
        onOpenFatigue={() => setIsFatigueModalOpen(true)}
        onToggleCopilot={() => setIsCopilotOpen(prev => !prev)}
        isCopilotOpen={isCopilotOpen}
        activeRulesCount={rules.filter(r => r.enabled).length}
        releasesCount={releasesCount}
        fatiguedAdsCount={fatiguedAdsCount}
        onLogout={handleLogout}
      />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <main style={{
          flex: 1,
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          maxWidth: isCopilotOpen ? 'calc(100vw - 440px)' : '100vw',
          transition: 'max-width 0.2s ease',
        }}>
          {metrics && (
            <KpiCards
              metrics={metrics}
              channels={channels}
              countries={countries}
              isImmatureCac={isImmatureCac}
              hasLowSample={hasLowSample}
              cohortMessage={cohortMessage}
              sampleSizeMessage={sampleSizeMessage}
            />
          )}

          <PerformanceChart
            timeseries={timeseries}
          />

          <DrillDownTable campaigns={campaigns} />
        </main>

        <AgentDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />
      </div>

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={rules}
        onToggleRule={handleToggleRule}
        onAddRule={handleAddRule}
        onDeleteRule={handleDeleteRule}
      />

      <ReleaseImpactModal
        isOpen={isReleasesModalOpen}
        onClose={() => setIsReleasesModalOpen(false)}
        selectedReleaseId={selectedReleaseId}
      />

      <FatigueModal
        isOpen={isFatigueModalOpen}
        onClose={() => setIsFatigueModalOpen(false)}
      />
    </div>
  );
}
