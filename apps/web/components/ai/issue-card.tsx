'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useReviewStore } from '@/lib/store';
import { api, issuesApi } from '@/lib/api';
import { formatCurrency, severityLabel } from '@/lib/utils';
import type { Issue } from '@gritcore/types';

interface Props {
  issue: Issue;
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--danger)',
  warning: 'var(--accent2)',
  info: 'var(--accent4)',
  passed: 'var(--accent3)',
};

const SEVERITY_BG: Record<string, string> = {
  critical: 'rgba(255,64,64,0.08)',
  warning: 'rgba(255,179,71,0.08)',
  info: 'rgba(91,163,255,0.08)',
  passed: 'rgba(61,232,160,0.08)',
};

export default function IssueCard({ issue }: Props) {
  const { activeIssue, setActiveIssue, updateIssue, activeReview } = useReviewStore();
  const isActive = activeIssue?.id === issue.id;
  const [hovered, setHovered] = useState(false);
  const [creatingRfi, setCreatingRfi] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function handleCreateRFI() {
    const match = pathname.match(/\/projects\/([^/]+)/);
    const projectId = match?.[1];
    if (!projectId) { console.error('handleCreateRFI: could not extract projectId from', pathname); return; }

    setCreatingRfi(true);
    try {
      await api.post(`/projects/${projectId}/rfis`, {
        subject: issue.title,
        question: `${issue.description}${issue.code_ref ? `\n\nCode Reference: ${issue.code_ref}` : ''}${issue.grid_location ? `\nLocation: ${issue.grid_location}` : ''}`,
        priority: issue.severity === 'critical' ? 'urgent' : issue.severity === 'warning' ? 'high' : 'medium',
        issue_id: issue.id,
        cost_impact: !!(issue.dollar_risk_estimate && issue.dollar_risk_estimate > 0),
        cost_impact_amount: issue.dollar_risk_estimate ?? undefined,
      });
      router.push(`/projects/${projectId}/rfis`);
    } catch (err) {
      console.error('handleCreateRFI error:', err);
    } finally {
      setCreatingRfi(false);
    }
  }

  const color = SEVERITY_COLOR[issue.severity] ?? '#fff';
  const bg = SEVERITY_BG[issue.severity] ?? 'transparent';

  async function handleStatusChange(status: string) {
    try {
      await issuesApi.update(issue.id, { status: status as Issue['status'] });
      updateIssue(issue.id, { status: status as Issue['status'] });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div
      onClick={() => setActiveIssue(isActive ? null : issue)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isActive ? bg : hovered ? 'rgba(255,255,255,0.02)' : 'transparent',
        border: `1px solid ${isActive ? color + '40' : hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 6,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {/* Severity tag */}
        <span
          style={{
            fontSize: 9,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color,
            background: bg,
            border: `1px solid ${color}40`,
            borderRadius: 4,
            padding: '2px 6px',
            flexShrink: 0,
          }}
        >
          {severityLabel(issue.severity)}
        </span>

        {/* Title */}
        <span
          style={{
            fontSize: 12,
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            color: 'var(--text)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {issue.title}
        </span>

        {/* Dollar risk */}
        {issue.dollar_risk_estimate && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              color: issue.severity === 'critical' ? 'var(--danger)' : 'var(--accent2)',
              flexShrink: 0,
            }}
          >
            {formatCurrency(issue.dollar_risk_estimate)}
          </span>
        )}
      </div>

      {/* Description (shown when active) */}
      {isActive && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text2)',
            lineHeight: 1.5,
            margin: '0 0 8px',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {issue.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {issue.grid_location && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text3)',
              fontFamily: 'JetBrains Mono, monospace',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span style={{ opacity: 0.7 }}>⊞</span>
            {issue.grid_location}
          </span>
        )}
        {issue.code_ref && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text3)',
              fontFamily: 'JetBrains Mono, monospace',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span style={{ opacity: 0.7 }}>§</span>
            {issue.code_ref}
          </span>
        )}
      </div>

      {/* Actions (shown when active) */}
      {isActive && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 10,
            borderTop: '1px solid var(--border)',
            paddingTop: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ActionBtn
            label="Flag"
            icon="⚑"
            color="var(--danger)"
            onClick={() => handleStatusChange('acknowledged')}
            active={issue.status === 'acknowledged'}
          />
          <ActionBtn
            label="Resolve"
            icon="✓"
            color="var(--accent3)"
            onClick={() => handleStatusChange('resolved')}
            active={issue.status === 'resolved'}
          />
          <ActionBtn
            label={creatingRfi ? 'Creating...' : 'RFI ↗'}
            icon="📋"
            color="var(--accent4)"
            onClick={handleCreateRFI}
            active={false}
          />
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  icon,
  color,
  onClick,
  active,
}: {
  label: string;
  icon: string;
  color: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: active ? color + '20' : 'transparent',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        borderRadius: 5,
        padding: '3px 8px',
        color: active ? color : 'var(--text2)',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 500,
        transition: 'all 0.1s',
      }}
    >
      <span style={{ fontSize: 10 }}>{icon}</span>
      {label}
    </button>
  );
}
