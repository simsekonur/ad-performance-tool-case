'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AgentStep } from '@/lib/types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Terminal, 
  ChevronDown, 
  ChevronRight, 
  Database, 
  X,
  RotateCcw
} from 'lucide-react';

interface AgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  'What was our spend on each channel last week?',
  'Which US ad set had the lowest customer acquisition cost over the last 14 days?',
  'How did the trial-to-subscription rate on TikTok change month over month?',
  'Why did acquisition cost go up yesterday?',
  'Is TikTok cheaper than Meta for us right now?',
  'Did any app release affect our paywall or trial conversions?',
];

export function AgentDrawer({ isOpen, onClose }: AgentDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleStepExpand = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const handleSend = async (textToSend?: string) => {
    const question = textToSend || input.trim();
    if (!question || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          history: messages,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.answer,
        steps: data.steps,
        timestamp: data.timestamp,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: `I encountered an error analyzing your question: ${errorMsg}. Please try again or rephrase.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      width: 440,
      maxWidth: '100vw',
      height: 'calc(100vh - 100px)',
      position: 'sticky',
      top: 100,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(13, 18, 31, 0.95)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--border-subtle)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      zIndex: 90,
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Marketing AI Copilot</span>
              <span className="badge badge-creative" style={{ fontSize: 10 }}>ReAct Tool Loop</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Connected to livensa.db & build logs
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn btn-ghost btn-sm" title="Clear conversation">
              <RotateCcw size={14} />
            </button>
          )}
          <button onClick={onClose} className="btn btn-ghost btn-sm" title="Close panel">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                <Sparkles size={16} />
                <span>Ask Anything About Performance</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                I inspect warehouse data, mobile app release commits, and team rules. Every answer leads with a direct executive summary followed by exact figures and verified SQL.
              </p>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggested Team Inquiries
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 12px',
                    fontSize: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* User Bubble */}
              {msg.role === 'user' ? (
                <div style={{
                  alignSelf: 'flex-end',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  padding: '9px 14px',
                  borderRadius: '14px 14px 4px 14px',
                  fontSize: 13,
                  maxWidth: '85%',
                  lineHeight: 1.4,
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
                }}>
                  {msg.content}
                </div>
              ) : (
                /* Assistant Bubble */
                <div style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px 14px 14px 4px',
                  padding: 14,
                  fontSize: 13,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  {/* Reasoning & Tool Steps Accordion */}
                  {msg.steps && msg.steps.length > 0 && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => toggleStepExpand(`step-${index}`)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Terminal size={12} color="#818cf8" />
                          <span>{msg.steps.length} Tool &amp; Reasoning Steps</span>
                        </div>
                        {expandedSteps.has(`step-${index}`) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {expandedSteps.has(`step-${index}`) && (
                        <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
                          {msg.steps.map((step, sIdx) => (
                            <div key={sIdx} style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.02)', borderLeft: '2px solid #6366f1' }}>
                              <div style={{ fontWeight: 600, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 5 }}>
                                {step.type === 'tool_call' ? <Database size={11} /> : <Sparkles size={11} />}
                                <span>{step.title}</span>
                              </div>
                              <div style={{ color: 'var(--text-secondary)', marginTop: 4, fontFamily: step.type === 'tool_call' ? 'var(--font-geist-mono)' : 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {step.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formatted Markdown Content */}
                  <div className="agent-markdown" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(msg.content) }} />


                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 12,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}>
            <div className="pulse-dot" />
            <span>Analyzing warehouse data &amp; verifying team conventions...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(9, 13, 22, 0.95)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: varRadius(8),
          padding: '6px 10px',
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about CAC, spend, ad sets, app releases..."
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: 13,
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              maxHeight: 90,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="btn btn-primary"
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              opacity: !input.trim() || isLoading ? 0.5 : 1,
            }}
          >
            <Send size={14} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Press <strong>Enter</strong> to send • Answers follow Livensa team conventions
        </div>
      </div>
    </div>
  );
}

function varRadius(px: number) {
  return `${px}px`;
}

/**
 * Basic markdown parser for formatting bold text, code, and tables safely
 */
function renderSimpleMarkdown(content: string): string {
  if (!content) return '';

  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Markdown tables
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
    } else {
      if (inTable) {
        processedLines.push(convertTableToHtml(tableRows));
        inTable = false;
        tableRows = [];
      }
      if (line) {
        processedLines.push(`<p>${line}</p>`);
      }
    }
  }

  if (inTable) {
    processedLines.push(convertTableToHtml(tableRows));
  }

  return processedLines.join('\n');
}

function convertTableToHtml(rows: string[]): string {
  if (rows.length === 0) return '';

  let out = '<table><thead>';
  let isHeader = true;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Check if separator row
    if (row.replace(/[\|\s\-:]/g, '') === '') {
      isHeader = false;
      out += '</thead><tbody>';
      continue;
    }

    const cells = row.split('|').slice(1, -1).map(c => c.trim());
    out += '<tr>';
    for (const cell of cells) {
      if (isHeader) {
        out += `<th>${cell}</th>`;
      } else {
        out += `<td>${cell}</td>`;
      }
    }
    out += '</tr>';
  }

  if (isHeader) {
    out += '</thead>';
  } else {
    out += '</tbody>';
  }
  out += '</table>';
  return out;
}
