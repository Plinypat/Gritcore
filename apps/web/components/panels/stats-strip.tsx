'use client';

import { useReviewStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';

export default function StatsStrip() {
  const { issues, activeReview } = useReviewStore();

  const critical = issues.filter((i) => i.severity === 'critical').length;
  const warning = issues.filter((i) => i.severity === 'warning').length;
  const info = issues.filter((i) => i.severity === 'info').length;
  const passed = issues.filter((i) => i.severity === 'passed').length;

  const totalRisk = issues.reduce((sum, i) => sum + (i.dollar_risk_estimate ?? 0), 0);

  const stats = [
    { label: 'CRITICAL', value: critical, color: 'var(--danger)' },
    { label: 'WARNING', value: warning, color: 'var(--accent2)' },
    { label: 'INFO', value: info, color: 'var(--accent4)' },
    { label: 'PASSED', value: passed, color: 'var(--accent3)' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--border)',
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: 'var(--surface)',
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              color: s.color,
              lineHeight: 1,
              marginBottom: 3,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontSize: 8,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.1em',
              color: 'var(--text3)',
              textTransform: 'uppercase',
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
