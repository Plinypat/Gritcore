'use client';

import { useReviewStore } from '@/lib/store';
import StatsStrip from './stats-strip';
import IssueCard from '@/components/ai/issue-card';
import { formatCurrency } from '@/lib/utils';
import type { Issue } from '@gritcore/types';

type Filter = 'all' | 'critical' | 'warning' | 'info' | 'passed';

const FILTERS: { id: Filter; label: string; color: string }[] = [
  { id: 'all', label: 'ALL', color: 'var(--text2)' },
  { id: 'critical', label: 'CRIT', color: 'var(--danger)' },
  { id: 'warning', label: 'WARN', color: 'var(--accent2)' },
  { id: 'info', label: 'INFO', color: 'var(--accent4)' },
  { id: 'passed', label: 'OK', color: 'var(--accent3)' },
];

export default function RightPanel() {
  const { issues, activeReview, filter, setFilter, isReviewing } = useReviewStore();

  const filteredIssues =
    filter === 'all' ? issues : issues.filter((i) => i.severity === filter);

  const totalRisk = issues.reduce((sum, i) => sum + (i.dollar_risk_estimate ?? 0), 0);

  const qtyEst = activeReview?.quantity_estimate as Record<string, unknown> | null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Stats strip */}
      {issues.length > 0 && <StatsStrip />}

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {isReviewing && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px',
              background: 'rgba(255,107,43,0.06)',
              border: '1px solid rgba(255,107,43,0.2)',
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                border: '2px solid var(--accent)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                flexShrink: 0,
              }}
            />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.06em' }}>
                ANALYZING DRAWING
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                Claude is reviewing for structural issues...
              </div>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {activeReview?.summary && (
          <div
            style={{
              background: 'rgba(255,107,43,0.05)',
              border: '1px solid rgba(255,107,43,0.15)',
              borderRadius: 8,
              padding: '12px',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}
            >
              <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                <path d="M6 0L11.2 3V9L6 12L0.8 9V3L6 0Z" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
                <circle cx="6" cy="6" r="2.5" fill="var(--accent)" opacity="0.4" />
              </svg>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.1em',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                AI SUMMARY · CLAUDE
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text2)',
                lineHeight: 1.5,
                margin: 0,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {activeReview.summary}
            </p>
          </div>
        )}

        {/* Quantity estimate */}
        {qtyEst && (
          <div
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em',
                color: 'var(--text3)',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              Quantity Estimate
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {qtyEst.concrete_cy && (
                <QtyRow label="Concrete" value={`${qtyEst.concrete_cy} CY`} />
              )}
              {qtyEst.pt_strand_lf && (
                <QtyRow label="PT Strand" value={`${Number(qtyEst.pt_strand_lf).toLocaleString()} LF`} />
              )}
              {qtyEst.mild_rebar_tons && (
                <QtyRow label="Mild Rebar" value={`${qtyEst.mild_rebar_tons} tons`} />
              )}
              {qtyEst.formwork_sf && (
                <QtyRow label="Formwork" value={`${Number(qtyEst.formwork_sf).toLocaleString()} SF`} />
              )}
            </div>
            {qtyEst.total_estimated_value && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif' }}>
                  Est. Value
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700,
                    color: 'var(--accent3)',
                  }}
                >
                  {formatCurrency(Number(qtyEst.total_estimated_value))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Risk total */}
        {totalRisk > 0 && (
          <div
            style={{
              background: 'rgba(255,64,64,0.06)',
              border: '1px solid rgba(255,64,64,0.15)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'DM Sans, sans-serif' }}>
              Total Risk Exposure
            </span>
            <span
              style={{
                fontSize: 16,
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                color: 'var(--danger)',
              }}
            >
              {formatCurrency(totalRisk)}
            </span>
          </div>
        )}

        {/* Filter chips */}
        {issues.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            {FILTERS.map((f) => {
              const count = f.id === 'all' ? issues.length : issues.filter((i) => i.severity === f.id).length;
              const isActive = filter === f.id;

              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: isActive ? f.color + '15' : 'transparent',
                    border: `1px solid ${isActive ? f.color : 'var(--border)'}`,
                    borderRadius: 20,
                    padding: '3px 9px',
                    color: isActive ? f.color : 'var(--text3)',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.1s',
                  }}
                >
                  {f.label}
                  <span style={{ opacity: 0.7 }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Issues list */}
        {filteredIssues.length === 0 && !isReviewing && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: 'var(--text3)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏗</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
              No issues yet
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
              Click RUN to start AI review
            </p>
          </div>
        )}

        {filteredIssues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
}

function QtyRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}
