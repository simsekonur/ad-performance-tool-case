'use client';

import React, { useState } from 'react';
import { DynamicRule } from '@/lib/types';
import { X, Plus, BookOpen, Check, Trash2, Sliders } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: DynamicRule[];
  onToggleRule: (id: string, enabled: boolean) => Promise<void>;
  onAddRule: (rule: { title: string; content: string; category: DynamicRule['category'] }) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
}

export function RulesModal({
  isOpen,
  onClose,
  rules,
  onToggleRule,
  onAddRule,
  onDeleteRule,
}: RulesModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DynamicRule['category']>('reporting_convention');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
      await onAddRule({ title: title.trim(), content: content.trim(), category });
      setTitle('');
      setContent('');
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780 }}>
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
              <BookOpen size={18} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Teach the Agent: Operational Rules Studio</h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Configure rules, reporting conventions, and thresholds without code changes
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Explanation Alert */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            <strong>Live Context Injection:</strong> Active rules below are automatically injected into the AI agent&apos;s master system prompt on every query. The team can add new target thresholds (e.g. &ldquo;Target CAC for DE is $40&rdquo;), custom definitions, or formatting rules instantly without redeploying code.
          </div>

          {/* New Rule Form Toggle */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
            >
              <Plus size={15} />
              <span>Add New Team Rule / Definition</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#ffffff' }}>Create New Operational Rule</div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Rule Title (e.g., DE Target CAC, Creative Scaling Cap)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 240,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                  required
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DynamicRule['category'])}
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="reporting_convention">Reporting Convention</option>
                  <option value="metric_definition">Metric Definition</option>
                  <option value="optimization_rule">Optimization Rule</option>
                  <option value="custom">Custom Policy</option>
                </select>
              </div>

              <textarea
                placeholder="Rule Content (How should the agent apply this rule when answering questions?)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary btn-sm"
                >
                  {isSaving ? 'Saving...' : 'Save Rule to Knowledge Base'}
                </button>
              </div>
            </form>
          )}

          {/* Rules List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  background: rule.enabled ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.25)',
                  border: `1px solid ${rule.enabled ? 'var(--border-subtle)' : 'rgba(255, 255, 255, 0.03)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 14,
                  opacity: rule.enabled ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: rule.enabled ? '#ffffff' : 'var(--text-muted)' }}>
                      {rule.title}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}>
                      {rule.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {rule.content}
                  </p>
                </div>

                {/* Right controls: Toggle & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => onToggleRule(rule.id, !rule.enabled)}
                    style={{
                      background: rule.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${rule.enabled ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                      color: rule.enabled ? '#34d399' : 'var(--text-muted)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title={rule.enabled ? 'Rule is active' : 'Rule is paused'}
                  >
                    {rule.enabled ? <Check size={12} /> : <Sliders size={12} />}
                    <span>{rule.enabled ? 'Active' : 'Disabled'}</span>
                  </button>

                  {rule.id.startsWith('custom-') && (
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="btn btn-ghost btn-sm"
                      title="Delete rule"
                      style={{ padding: 6, color: '#f87171' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
