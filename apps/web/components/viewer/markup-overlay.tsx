'use client';

import { useReviewStore } from '@/lib/store';
import type { Issue } from '@gritcore/types';
import { severityLabel } from '@/lib/utils';

// Static markup positions keyed to demo issues
const MARKUP_POSITIONS: { x: number; y: number; w: number; h: number }[] = [
  { x: 62, y: 62, w: 78, h: 98 },   // S1 re-entrant corner
  { x: 415, y: 205, w: 60, h: 75 }, // S2 re-entrant
  { x: 575, y: 375, w: 58, h: 65 }, // S3 re-entrant
  { x: 150, y: 150, w: 80, h: 60 }, // MEP sleeves
  { x: 40, y: 235, w: 640, h: 25 }, // Control joints
  { x: 320, y: 355, w: 120, h: 55 }, // Column pedestal conflict
  { x: 240, y: 100, w: 100, h: 40 }, // Lap splice
  { x: 400, y: 100, w: 80, h: 40 },  // LW concrete info
  { x: 620, y: 40, w: 60, h: 30 },   // PT stressing info
  { x: 480, y: 200, w: 70, h: 40 },  // Shear stud info
  { x: 100, y: 350, w: 120, h: 80 }, // PT spacing PASSED
  { x: 340, y: 240, w: 60, h: 55 },  // Drop cap PASSED
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff4040',
  warning: '#ffb347',
  info: '#5ba3ff',
  passed: '#3de8a0',
};

interface Props {
  issues: Issue[];
}

export default function MarkupOverlay({ issues }: Props) {
  const { activeIssue, setActiveIssue } = useReviewStore();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {issues.slice(0, MARKUP_POSITIONS.length).map((issue, idx) => {
        const pos = MARKUP_POSITIONS[idx];
        const color = SEVERITY_COLORS[issue.severity] ?? '#fff';
        const isActive = activeIssue?.id === issue.id;
        const label = `${severityLabel(issue.severity)}-${String(idx + 1).padStart(2, '0')}`;

        return (
          <div
            key={issue.id}
            className="fade-in"
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: pos.w,
              height: pos.h,
              border: `1.5px solid ${color}`,
              background: `${color}18`,
              borderRadius: 3,
              pointerEvents: 'all',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: isActive ? `0 0 12px ${color}60` : 'none',
              animationDelay: `${idx * 0.04}s`,
            }}
            onClick={() => setActiveIssue(isActive ? null : issue)}
          >
            {/* Label pill */}
            <div
              style={{
                position: 'absolute',
                top: -10,
                left: 4,
                background: color,
                color: '#000',
                fontSize: 8,
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 3,
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>

            {/* Tooltip on active */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: pos.h + 6,
                  left: 0,
                  background: 'var(--surface2)',
                  border: `1px solid ${color}60`,
                  borderRadius: 6,
                  padding: '8px 10px',
                  minWidth: 180,
                  maxWidth: 240,
                  zIndex: 20,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color,
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text)',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 600,
                    marginBottom: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {issue.title}
                </div>
                {issue.grid_location && (
                  <div
                    style={{
                      fontSize: 9,
                      color: 'var(--text2)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {issue.grid_location}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
