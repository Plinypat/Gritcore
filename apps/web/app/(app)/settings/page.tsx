'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_by_name: string;
  expires_at: string;
  created_at: string;
}

export default function SettingsPage() {
  const user = useAuthStore(s => s.user);
  const [tab, setTab] = useState<'team' | 'org'>('team');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('estimator');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    if (user?.org_id) {
      api.get('/orgs/me/invites').then(r => setInvites(r.data.data)).catch(() => {});
    }
  }, [user]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviting(true);
    try {
      const res = await api.post(`/orgs/${user!.org_id}/invites`, { email: inviteEmail, role: inviteRole });
      setInvites(prev => [res.data.data, ...prev]);
      setInviteSuccess(`Invite created for ${inviteEmail}`);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err?.response?.data?.message ?? 'Failed to create invite');
    } finally {
      setInviting(false);
    }
  };

  const revokeInvite = async (id: string) => {
    await api.delete(`/orgs/me/invites/${id}`);
    setInvites(prev => prev.filter(i => i.id !== id));
  };

  const canInvite = user?.role === 'owner' || user?.role === 'admin';

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', color: 'var(--text)', marginBottom: 24 }}>SETTINGS</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {(['team', 'org'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', fontWeight: tab === t ? 700 : 400, marginBottom: -1 }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'team' && (
        <div>
          {/* Current user info */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', marginBottom: 8, letterSpacing: '0.1em' }}>YOU</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
                {user?.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{user?.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Sans, sans-serif' }}>{user?.email} · <span style={{ color: 'var(--accent)' }}>{user?.role}</span></div>
              </div>
            </div>
          </div>

          {/* Invite form */}
          {canInvite && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text)', marginBottom: 14 }}>INVITE TEAM MEMBER</div>
              <form onSubmit={sendInvite} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
                  <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@company.com" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                    <option value="admin">Admin</option>
                    <option value="estimator">Estimator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button type="submit" disabled={inviting} style={{ padding: '8px 18px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: inviting ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.08em', opacity: inviting ? 0.6 : 1 }}>
                  {inviting ? 'SENDING...' : 'SEND INVITE'}
                </button>
              </form>
              {inviteError && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>{inviteError}</div>}
              {inviteSuccess && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent3)' }}>{inviteSuccess}</div>}
            </div>
          )}

          {/* Pending invites */}
          {invites.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', marginBottom: 10, letterSpacing: '0.1em' }}>PENDING INVITES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {invites.map(inv => (
                  <div key={inv.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>{inv.email}</span>
                      <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,107,43,0.1)', padding: '2px 6px', borderRadius: 10 }}>{inv.role}</span>
                      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Sans, sans-serif' }}>Invited by {inv.invited_by_name}</span>
                    </div>
                    {canInvite && (
                      <button onClick={() => revokeInvite(inv.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 8px', color: 'var(--text3)', cursor: 'pointer', fontSize: 11 }}>Revoke</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'org' && (
        <div style={{ color: 'var(--text2)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          Org settings coming soon.
        </div>
      )}
    </div>
  );
}
