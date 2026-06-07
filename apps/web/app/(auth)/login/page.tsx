'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authApi.login(email, password);
      login(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Background grid already via body::before */}
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <svg width="36" height="40" viewBox="0 0 36 40" fill="none">
              <path
                d="M18 0L36 10V30L18 40L0 30V10L18 0Z"
                fill="rgba(255,107,43,0.15)"
                stroke="var(--accent)"
                strokeWidth="1.5"
              />
              <path d="M18 8L28 14V26L18 32L8 26V14L18 8Z" fill="var(--accent)" opacity="0.3" />
              <text
                x="18"
                y="24"
                textAnchor="middle"
                fill="var(--accent)"
                fontSize="11"
                fontFamily="Rajdhani, sans-serif"
                fontWeight="700"
                letterSpacing="1"
              >
                GC
              </text>
            </svg>
            <span
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: '0.05em',
                color: 'var(--text)',
              }}
            >
              GRIT<span style={{ color: 'var(--accent)' }}>CORE</span>
            </span>
          </div>
          <p
            style={{
              color: 'var(--text2)',
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.1em',
            }}
          >
            AI CONSTRUCTION DRAWING INTELLIGENCE
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 32,
          }}
        >
          <h2
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '0.05em',
              marginBottom: 24,
              color: 'var(--text)',
            }}
          >
            SIGN IN
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.1em',
                  color: 'var(--text2)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="estimator@company.com"
                style={{
                  width: '100%',
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.1em',
                  color: 'var(--text2)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                Password{' '}
                <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(pilot: any value)</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(255,64,64,0.1)',
                  border: '1px solid rgba(255,64,64,0.3)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: 'var(--danger)',
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(255,107,43,0.4)' : 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                padding: '11px',
                color: '#fff',
                fontSize: 14,
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.1em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <p
            style={{
              marginTop: 20,
              fontSize: 12,
              color: 'var(--text3)',
              textAlign: 'center',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            Enter any email to auto-provision a pilot account
          </p>
        </div>
      </div>
    </div>
  );
}
