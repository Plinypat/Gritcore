'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

interface QuantityEstimate {
  concrete_cy?: number;
  pt_strand_lf?: number;
  mild_rebar_tons?: number;
  formwork_sf?: number;
  [key: string]: number | undefined;
}

interface ReviewSummary {
  id: string;
  created_at: string;
  quantity_estimate?: QuantityEstimate;
}

const QUANTITY_ROWS = [
  { key: 'concrete_cy', label: 'Concrete', unit: 'CY' },
  { key: 'pt_strand_lf', label: 'PT Strand', unit: 'LF' },
  { key: 'mild_rebar_tons', label: 'Mild Rebar', unit: 'Tons' },
  { key: 'formwork_sf', label: 'Formwork', unit: 'SF' },
];

export default function TakeoffPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const token = useAuthStore(s => s.token);
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get(`/projects/${projectId}/reviews?limit=1`)
      .then(r => {
        const reviews: ReviewSummary[] = r.data.data;
        setReview(reviews[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, token]);

  const exportCsv = () => {
    if (!review?.quantity_estimate) return;
    const rows = [
      ['Item', 'Quantity', 'Unit'],
      ...QUANTITY_ROWS.map(r => [
        r.label,
        String(review.quantity_estimate![r.key] ?? '—'),
        r.unit,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takeoff-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const qty = review?.quantity_estimate;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', color: 'var(--text)', margin: 0 }}>
            REBAR TAKEOFF
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            Quantity estimates from latest AI review
          </p>
        </div>
        {qty && (
          <button
            onClick={exportCsv}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', cursor: 'pointer', fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.06em' }}
          >
            EXPORT CSV
          </button>
        )}
      </div>

      {loading && (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 40, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>LOADING...</div>
      )}

      {!loading && !qty && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>No quantity data yet</p>
          <p style={{ fontSize: 12 }}>Run an AI review to generate takeoff estimates</p>
        </div>
      )}

      {qty && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', letterSpacing: '0.1em', fontWeight: 600 }}>ITEM</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', letterSpacing: '0.1em', fontWeight: 600 }}>QUANTITY</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', letterSpacing: '0.1em', fontWeight: 600 }}>UNIT</th>
              </tr>
            </thead>
            <tbody>
              {QUANTITY_ROWS.map((row, i) => {
                const val = qty[row.key];
                return (
                  <tr key={row.key} style={{ borderBottom: i < QUANTITY_ROWS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{row.label}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: val != null ? 'var(--accent)' : 'var(--text3)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                      {val != null ? val.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>{row.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {review?.created_at && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Sans, sans-serif' }}>
              From review on {new Date(review.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
