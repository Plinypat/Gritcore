'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import type { RFI } from '@gritcore/types';

const STATUS_COLOR: Record<string, string> = {
  draft: 'var(--text3)',
  submitted: 'var(--accent)',
  answered: 'var(--accent3)',
  closed: 'var(--text3)',
};

const PRIORITY_COLOR: Record<string, string> = {
  low: 'var(--text3)',
  medium: 'var(--accent)',
  high: 'var(--accent2, #f59e0b)',
  urgent: 'var(--danger)',
};

export default function RFIsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: '', question: '', priority: 'medium', due_date: '', spec_section: '', cost_impact: false, cost_impact_amount: '', schedule_impact: false, schedule_impact_days: '' });
  const [submitting, setSubmitting] = useState(false);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;
    api.get(`/projects/${projectId}/rfis`)
      .then(r => setRfis(r.data.data))
      .finally(() => setLoading(false));
  }, [projectId, token]);

  const createRFI = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        subject: form.subject,
        question: form.question,
        priority: form.priority,
        due_date: form.due_date || undefined,
        spec_section: form.spec_section || undefined,
        cost_impact: form.cost_impact,
        cost_impact_amount: form.cost_impact && form.cost_impact_amount ? Number(form.cost_impact_amount) : undefined,
        schedule_impact: form.schedule_impact,
        schedule_impact_days: form.schedule_impact && form.schedule_impact_days ? Number(form.schedule_impact_days) : undefined,
      };
      const res = await api.post(`/projects/${projectId}/rfis`, payload);
      setRfis(prev => [res.data.data, ...prev]);
      setShowModal(false);
      setForm({ subject: '', question: '', priority: 'medium', due_date: '', spec_section: '', cost_impact: false, cost_impact_amount: '', schedule_impact: false, schedule_impact_days: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitRFI = async (rfiId: string) => {
    const res = await api.post(`/rfis/${rfiId}/submit`);
    setRfis(prev => prev.map(r => r.id === rfiId ? res.data.data : r));
  };

  const deleteRFI = async (rfiId: string) => {
    await api.delete(`/rfis/${rfiId}`);
    setRfis(prev => prev.filter(r => r.id !== rfiId));
  };

  const countByStatus = (s: string) => rfis.filter(r => r.status === s).length;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', color: 'var(--text)', margin: 0 }}>
            REQUESTS FOR INFORMATION
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            {rfis.length} total · {countByStatus('submitted')} submitted · {countByStatus('answered')} answered
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '8px 16px', color: '#fff', fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}
        >
          + NEW RFI
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['draft', 'submitted', 'answered', 'closed'].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: STATUS_COLOR[s] }}>
            {s.toUpperCase()} <span style={{ opacity: 0.6 }}>{countByStatus(s)}</span>
          </div>
        ))}
      </div>

      {loading && <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>LOADING...</div>}

      {!loading && rfis.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>No RFIs yet</p>
          <p style={{ fontSize: 12 }}>Create one from an issue or use the button above</p>
        </div>
      )}

      {/* RFI list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rfis.map(rfi => (
          <div key={rfi.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', fontWeight: 700 }}>{rfi.rfi_number}</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: STATUS_COLOR[rfi.status], background: STATUS_COLOR[rfi.status] + '15', padding: '2px 6px', borderRadius: 10, border: `1px solid ${STATUS_COLOR[rfi.status]}40` }}>{rfi.status.toUpperCase()}</span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: PRIORITY_COLOR[rfi.priority] }}>{rfi.priority.toUpperCase()}</span>
                  {rfi.due_date && <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Sans, sans-serif' }}>Due {new Date(rfi.due_date).toLocaleDateString()}</span>}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>{rfi.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>{rfi.question}</div>
                {rfi.answer && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(0,200,100,0.06)', border: '1px solid rgba(0,200,100,0.15)', borderRadius: 6, fontSize: 12, color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif' }}>
                    <span style={{ color: 'var(--accent3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700 }}>RESPONSE · </span>
                    {rfi.answer}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {rfi.status === 'draft' && (
                  <>
                    <button onClick={() => submitRFI(rfi.id)} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,107,43,0.1)', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>SUBMIT</button>
                    <button onClick={() => deleteRFI(rfi.id)} style={{ fontSize: 11, padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)', cursor: 'pointer' }}>✕</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create RFI Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em', color: 'var(--text)', margin: 0 }}>NEW REQUEST FOR INFORMATION</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <form onSubmit={createRFI}>
              {[
                { label: 'Subject *', key: 'subject', type: 'text', placeholder: 'Re-entrant corner reinforcement at Stairwell S1' },
                { label: 'Spec Section', key: 'spec_section', type: 'text', placeholder: '03 30 00' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase' }}>{f.label}</label>
                  <input
                    type={f.type}
                    required={f.label.includes('*')}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase' }}>Question / Description *</label>
                <textarea
                  required
                  value={form.question}
                  onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                  placeholder="Describe the conflict, question, or clarification needed..."
                  rows={4}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase' }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                    {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase' }}>Response Due</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.cost_impact} onChange={e => setForm(p => ({ ...p, cost_impact: e.target.checked }))} />
                  Cost Impact
                </label>
                {form.cost_impact && (
                  <input type="number" placeholder="$ Amount" value={form.cost_impact_amount} onChange={e => setForm(p => ({ ...p, cost_impact_amount: e.target.value }))} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: 12, width: 120, fontFamily: 'DM Sans, sans-serif' }} />
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.schedule_impact} onChange={e => setForm(p => ({ ...p, schedule_impact: e.target.checked }))} />
                  Schedule Impact
                </label>
                {form.schedule_impact && (
                  <input type="number" placeholder="Days" value={form.schedule_impact_days} onChange={e => setForm(p => ({ ...p, schedule_impact_days: e.target.value }))} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: 12, width: 80, fontFamily: 'DM Sans, sans-serif' }} />
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.08em', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'CREATING...' : 'CREATE RFI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
