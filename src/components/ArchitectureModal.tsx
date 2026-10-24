'use client';

import React, { useState } from 'react';
import { X, Network, Database, Server, Laptop, ShieldCheck, ArrowRight, Bot, Cpu } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  const [selectedNode, setSelectedNode] = useState<string>('agent');

  if (!isOpen) return null;

  const nodeDetails: Record<string, { title: string; type: string; desc: string; tech: string; keyPoints: string[] }> = {
    client: {
      title: 'Frontend Client (Next.js 15 + React 19)',
      type: 'Presentation & UI Layer',
      desc: 'Single-page reactive workspace utilizing Vanilla CSS tokens, glassmorphism, responsive drilldown tables, SVG time-series charts with release markers, and interactive Copilot drawer.',
      tech: 'Next.js 15, React 19, Lucide Icons, Custom CSS Modules',
      keyPoints: [
        'Tabular numerals (tabular-nums) for currency and conversion metrics',
        'Cohort maturation badges (<4 days old) highlighting Cost per Trial (CPT)',
        'Sample size confidence badges (<20 subscriptions)',
        'Shareable insight deep-linking and 1-click Slack message export',
      ],
    },
    agent: {
      title: 'AI Copilot Engine (ReAct Loop)',
      type: 'Intelligence & Reasoning Layer',
      desc: 'Multi-model agent engine with live tool execution loop. Supports Gemini 2.5 Flash, OpenAI GPT-4o-mini, and a deterministic analytical fallback that runs with zero external API dependencies.',
      tech: 'Google GenAI SDK, ReAct Pattern, AST SQL Validator, Context Window Management',
      keyPoints: [
        'Full domain knowledge injection: schema, glossary definitions, 8 team conventions',
        'Dynamic rule learning without code changes (persisted in app_state.db)',
        'Real-time thought and SQL inspector with execution time metrics',
        'Cohort maturation guards and Simpson\'s paradox geo-breakdowns',
      ],
    },
    api: {
      title: 'Server API Layer (Node.js Runtime)',
      type: 'Backend & Orchestration Layer',
      desc: 'Secure TypeScript API routes serving aggregations, time-series, drilldown trees, commit log parsing, rule mutations, and session authentication.',
      tech: 'Next.js App Router API Routes, Node 24 runtime, HTTP-only cookie auth',
      keyPoints: [
        '/api/metrics/overview - Funnel aggregations, channel & geo breakdowns',
        '/api/metrics/timeseries - Daily tracking with mobile release markers',
        '/api/metrics/drilldown - 3-level tree (Campaign → Ad Set → Ad)',
        '/api/agent/chat - ReAct agent reasoning and tool loop',
        '/api/rules - Dynamic team conventions CRUD',
      ],
    },
    livensaDb: {
      title: 'livensa.db (Ad Warehouse)',
      type: 'Data Warehouse (Read-Only)',
      desc: '6 weeks of Meta and TikTok ad performance data (2026-09-03 to 2026-10-14). Connected via Node 24 native node:sqlite with readOnly: true.',
      tech: 'SQLite3, node:sqlite DatabaseSync, AST Safety Guard',
      keyPoints: [
        'campaigns (7 rows): Meta & TikTok in US, GB, DE, BR',
        'ad_sets (13 rows): Audience IDs, daily budget limits',
        'ads (53 rows): 45 active, 8 paused, creative types (video/image)',
        'ads_daily (1,815 rows): Impressions, clicks, installs, trials, subscriptions, spend, D7 revenue',
      ],
    },
    appStateDb: {
      title: 'app_state.db (Application State)',
      type: 'Transactional Data Store',
      desc: 'Dedicated persistent SQLite database storing dynamic operational rules ("Teach the Agent"), shared insight snapshots, and chat session histories.',
      tech: 'SQLite3, Auto-seeding on initial boot',
      keyPoints: [
        'rules: Pre-seeded with the 8 Livensa team rules from team-notes.md',
        'shares: Permanent snapshot links with query, answer, and SQL',
        'Enables non-code modifications to agent reasoning in real time',
      ],
    },
    buildLogs: {
      title: 'build-logs/ (Mobile App Releases)',
      type: 'Release Commit Repository',
      desc: '12 mobile release logs (iOS & Android) between Sep 5 and Oct 13, 2026. Parsed into structured commits for release correlation analysis.',
      tech: 'Node.js FS, Conventional Commits parser',
      keyPoints: [
        'feat(paywall): Yearly savings percentage test ("Save 58%")',
        'feat(onboarding): Autoplay sample video on first screen',
        'feat(i18n): Brazilian Portuguese template translations',
        'Pre vs Post 3-day window metric delta calculations',
      ],
    },
  };

  const active = nodeDetails[selectedNode] || nodeDetails.agent;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 880 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Network size={18} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>System Architecture &amp; Data Flow</h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Full-stack topology connecting the UI, AI Copilot, SQLite warehouse, and build logs
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Visual Interactive Architecture SVG */}
          <div style={{
            background: 'rgba(7, 10, 17, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 12px',
            position: 'relative',
          }}>
            <svg viewBox="0 0 800 360" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <linearGradient id="clientGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="serverGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="dataGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Connecting Lines */}
              {/* Client -> Server */}
              <line x1="220" y1="90" x2="280" y2="90" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="220" y1="180" x2="280" y2="180" stroke="#818cf8" strokeWidth="2" />
              <line x1="220" y1="270" x2="280" y2="270" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />

              {/* Server -> Data */}
              <line x1="520" y1="130" x2="580" y2="90" stroke="#10b981" strokeWidth="2" />
              <line x1="520" y1="180" x2="580" y2="180" stroke="#34d399" strokeWidth="2" />
              <line x1="520" y1="230" x2="580" y2="270" stroke="#10b981" strokeWidth="2" />

              {/* Column 1: Client Subsystems */}
              <g onClick={() => setSelectedNode('client')} style={{ cursor: 'pointer' }}>
                <rect x="30" y="30" width="190" height="300" rx="12" fill="url(#clientGrad)" stroke={selectedNode === 'client' ? '#60a5fa' : 'rgba(59, 130, 246, 0.4)'} strokeWidth={selectedNode === 'client' ? '2.5' : '1'} />
                <text x="125" y="60" fill="#93c5fd" fontSize="13" fontWeight="bold" textAnchor="middle">FRONTEND CLIENT</text>
                <text x="125" y="76" fill="#64748b" fontSize="10" textAnchor="middle">Next.js 15 + React 19</text>

                {/* Sub-cards */}
                <rect x="45" y="95" width="160" height="42" rx="6" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.08)" />
                <text x="55" y="114" fill="#fff" fontSize="11" fontWeight="600">📊 KPI Cards &amp; Charts</text>
                <text x="55" y="127" fill="#94a3b8" fontSize="9">Cohort Maturation &amp; Releases</text>

                <rect x="45" y="147" width="160" height="42" rx="6" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.08)" />
                <text x="55" y="166" fill="#fff" fontSize="11" fontWeight="600">📑 Drilldown Explorer</text>
                <text x="55" y="179" fill="#94a3b8" fontSize="9">Campaign → Ad Set → Ad</text>

                <rect x="45" y="199" width="160" height="42" rx="6" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.08)" />
                <text x="55" y="218" fill="#fff" fontSize="11" fontWeight="600">🤖 AI Copilot Drawer</text>
                <text x="55" y="231" fill="#94a3b8" fontSize="9">Thought &amp; SQL Inspector</text>

                <rect x="45" y="251" width="160" height="42" rx="6" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.08)" />
                <text x="55" y="270" fill="#fff" fontSize="11" fontWeight="600">⚙️ Teach Agent Studio</text>
                <text x="55" y="283" fill="#94a3b8" fontSize="9">Non-code Rules Manager</text>
              </g>

              {/* Column 2: Server & ReAct Engine */}
              <g onClick={() => setSelectedNode('agent')} style={{ cursor: 'pointer' }}>
                <rect x="280" y="30" width="240" height="300" rx="12" fill="url(#serverGrad)" stroke={selectedNode === 'agent' ? '#a855f7' : 'rgba(99, 102, 241, 0.4)'} strokeWidth={selectedNode === 'agent' ? '2.5' : '1'} />
                <text x="400" y="60" fill="#c084fc" fontSize="13" fontWeight="bold" textAnchor="middle">SERVER &amp; AGENT RUNTIME</text>
                <text x="400" y="76" fill="#64748b" fontSize="10" textAnchor="middle">TypeScript / Node 24</text>

                {/* Sub-card: AI Copilot ReAct Engine */}
                <rect x="295" y="95" width="210" height="70" rx="8" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(99, 102, 241, 0.4)" />
                <text x="310" y="117" fill="#fff" fontSize="12" fontWeight="bold">AI Copilot (ReAct Loop)</text>
                <text x="310" y="133" fill="#cbd5e1" fontSize="10">• Multi-Model: Gemini / OpenAI</text>
                <text x="310" y="147" fill="#cbd5e1" fontSize="10">• Analytical Engine Fallback (Zero-cost)</text>

                {/* Sub-card: Server API Endpoints */}
                <rect x="295" y="175" width="210" height="60" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.08)" />
                <text x="310" y="196" fill="#fff" fontSize="11" fontWeight="600">REST API Controllers</text>
                <text x="310" y="211" fill="#94a3b8" fontSize="9">/metrics/overview, /timeseries, /drilldown</text>
                <text x="310" y="223" fill="#94a3b8" fontSize="9">/agent/chat, /rules, /share, /auth</text>

                {/* Sub-card: Security Guard */}
                <rect x="295" y="245" width="210" height="48" rx="8" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)" />
                <text x="310" y="265" fill="#34d399" fontSize="11" fontWeight="bold">🛡️ AST SQL Safety Guard</text>
                <text x="310" y="279" fill="#94a3b8" fontSize="9">Strict Read-Only Enforcement (SELECT only)</text>
              </g>

              {/* Column 3: Storage & Data Assets */}
              <g onClick={() => setSelectedNode('livensaDb')} style={{ cursor: 'pointer' }}>
                <rect x="580" y="30" width="190" height="90" rx="10" fill="url(#dataGrad)" stroke={selectedNode === 'livensaDb' ? '#34d399' : 'rgba(16, 185, 129, 0.4)'} strokeWidth={selectedNode === 'livensaDb' ? '2.5' : '1'} />
                <text x="675" y="55" fill="#6ee7b7" fontSize="12" fontWeight="bold" textAnchor="middle">livensa.db (READ-ONLY)</text>
                <text x="675" y="70" fill="#94a3b8" fontSize="9" textAnchor="middle">4 Tables • 1,815 Daily Rows</text>
                <text x="675" y="86" fill="#cbd5e1" fontSize="9" textAnchor="middle">campaigns, ad_sets, ads, ads_daily</text>
                <text x="675" y="100" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">🔒 Native node:sqlite readOnly: true</text>
              </g>

              <g onClick={() => setSelectedNode('appStateDb')} style={{ cursor: 'pointer' }}>
                <rect x="580" y="135" width="190" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke={selectedNode === 'appStateDb' ? '#818cf8' : 'rgba(255, 255, 255, 0.1)'} strokeWidth={selectedNode === 'appStateDb' ? '2.5' : '1'} />
                <text x="675" y="160" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">app_state.db (READ-WRITE)</text>
                <text x="675" y="175" fill="#94a3b8" fontSize="9" textAnchor="middle">Dynamic Rules &amp; Shared Insights</text>
                <text x="675" y="191" fill="#cbd5e1" fontSize="9" textAnchor="middle">8 Pre-seeded Team Rules</text>
                <text x="675" y="205" fill="#818cf8" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ Real-time prompt context feed</text>
              </g>

              <g onClick={() => setSelectedNode('buildLogs')} style={{ cursor: 'pointer' }}>
                <rect x="580" y="240" width="190" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke={selectedNode === 'buildLogs' ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'} strokeWidth={selectedNode === 'buildLogs' ? '2.5' : '1'} />
                <text x="675" y="265" fill="#fde68a" fontSize="12" fontWeight="bold" textAnchor="middle">build-logs/ (12 RELEASES)</text>
                <text x="675" y="280" fill="#94a3b8" fontSize="9" textAnchor="middle">iOS &amp; Android Git Commits</text>
                <text x="675" y="296" fill="#cbd5e1" fontSize="9" textAnchor="middle">Paywall, Onboarding, Templates</text>
                <text x="675" y="310" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">📈 Pre/Post 3-Day Deltas</text>
              </g>
            </svg>

            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Click any architecture node above to view its technical specifications and security guarantees.
            </div>
          </div>

          {/* Node Inspector Panel */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} color="#818cf8" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{active.title}</span>
              </div>
              <span className="badge badge-creative">{active.type}</span>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {active.desc}
            </p>

            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <strong>Tech Stack:</strong> <code style={{ color: '#fff' }}>{active.tech}</code>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 8,
              marginTop: 4,
            }}>
              {active.keyPoints.map((pt, idx) => (
                <div key={idx} style={{
                  fontSize: 11.5,
                  color: '#e2e8f0',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '6px 10px',
                  borderRadius: 6,
                  borderLeft: '2px solid #6366f1',
                }}>
                  {pt}
                </div>
              ))}
            </div>
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
