'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const login = useAuthStore(s => s.login);

  const [invite, setInvite] = useState<{ email: string; org_name: string; role: string } | null>(null);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('No invite token'); setLoading(false); return; }
    api.get(`/invites/${token}`)
      .then(r => { setInvite(r.data.data); setLoading(false); })
      .catch(() => { setError('This invite is invalid or has expired.'); setLoading(false); });
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/invites/${token}/accept`, { full_name: fullName });
      const { user, tokens } = res.data.data;
      login(user, tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to accept invite');
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading invite...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 28, letterSpacing: '0.05em', color: 'var(--text)' }}>
            GRIT<span style={{ color: 'var(--accent)' }}>CORE</span>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
          {error ? (
            <div style={{ textAlign: 'center', color: 'var(--danger)', fontSize: 14 }}>{error}</div>
          ) : invite ? (
            <>
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em', color: 'var(--text)', marginBottom: 8 }}>JOIN {invite.org_name.toUpperCase()}</h2>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20, fontFamily: 'DM Sans, sans-serif' }}>
                You&apos;ve been invited as <strong style={{ color: 'var(--accent)' }}>{invite.role}</strong> ({invite.email})
              </p>
              <form onSubmit={handleAccept}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Name</label>
                  <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={submitting} style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 6, padding: 11, color: '#fff', fontSize: 14, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.1em', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'JOINING...' : 'ACCEPT INVITE'}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
