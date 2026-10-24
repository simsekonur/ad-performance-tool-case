'use client';

import React, { useState } from 'react';
import { Sparkles, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { DEMO_CREDENTIALS } from '@/lib/constants';

interface LoginViewProps {
  onSuccess: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const [username, setUsername] = useState(DEMO_CREDENTIALS.username);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      onSuccess();
    } catch {
      setError('Invalid username or password. Use demo credentials below.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.15), transparent 70%), #07090e',
      padding: 20,
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 420,
        padding: 32,
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Brand Icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            marginBottom: 16,
          }}>
            <Sparkles size={28} color="#fff" />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Livensa Ad Performance
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Growth Marketing Dashboard &amp; AI Copilot
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#fca5a5',
              fontSize: 12,
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Username
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 12px',
            }}>
              <User size={16} color="var(--text-muted)" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 12px',
            }}>
              <Lock size={16} color="var(--text-muted)" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              marginTop: 6,
            }}
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Credentials Pill */}
        <div style={{
          marginTop: 24,
          padding: '12px 14px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <ShieldCheck size={20} color="#818cf8" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>Demo Credentials:</strong> <br />
            Username: <code style={{ color: '#fff' }}>admin</code> &nbsp;•&nbsp; Password: <code style={{ color: '#fff' }}>livensa2026</code>
          </div>
        </div>
      </div>
    </div>
  );
}
