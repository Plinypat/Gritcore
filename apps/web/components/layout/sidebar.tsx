'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProjectStore, useReviewStore } from '@/lib/store';
import { projectsApi } from '@/lib/api';

const TEAM_ONLINE = [
  { name: 'Alex R.', color: '#ff6b2b', initials: 'AR' },
  { name: 'Sam K.', color: '#3de8a0', initials: 'SK' },
  { name: 'Jordan P.', color: '#5ba3ff', initials: 'JP' },
];

const WORKFLOWS = [
  { icon: '⚡', label: 'Auto-RFI Gen' },
  { icon: '📊', label: 'Takeoff Export' },
  { icon: '🔔', label: 'Issue Alerts' },
];

const DISCIPLINES: Record<string, string> = {
  Structural: '🏗',
  Architectural: '🏛',
  Civil: '🛣',
  MEP: '⚙',
  Electrical: '⚡',
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { projects, sheets, current, setProjects, setSheets, setProject } = useProjectStore();
  const { issues } = useReviewStore();

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(console.error);
  }, []);

  const bidProjects = projects.filter((p) => p.phase === 'bid' || p.phase === 'active');
  const otherProjects = projects.filter((p) => p.phase !== 'bid' && p.phase !== 'active');

  // Count issues by severity for sheet badges
  const critCount = issues.filter((i) => i.severity === 'critical').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 0',
        background: 'var(--surface)',
      }}
    >
      {/* Active Bid section */}
      <div style={{ padding: '0 12px', marginBottom: 4 }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            color: 'var(--text3)',
            textTransform: 'uppercase',
            padding: '4px 4px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Active Bid</span>
          <span
            style={{
              background: 'rgba(255,107,43,0.15)',
              color: 'var(--accent)',
              borderRadius: 4,
              padding: '1px 5px',
              fontSize: 9,
            }}
          >
            {bidProjects.length}
          </span>
        </div>

        {/* Sheets for active project */}
        {current && (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text2)',
                padding: '4px 4px',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {current.name}
            </div>

            {sheets.length > 0 ? (
              sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'rgba(255,107,43,0.08)',
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    {DISCIPLINES[sheet.discipline ?? ''] ?? '📄'}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {sheet.sheet_number ?? sheet.name}
                  </span>
                  {critCount > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono, monospace',
                        background: 'rgba(255,64,64,0.15)',
                        color: 'var(--danger)',
                        borderRadius: 4,
                        padding: '1px 5px',
                        fontWeight: 600,
                      }}
                    >
                      {critCount}
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono, monospace',
                        background: 'rgba(255,179,71,0.15)',
                        color: 'var(--accent2)',
                        borderRadius: 4,
                        padding: '1px 5px',
                        fontWeight: 600,
                      }}
                    >
                      {warnCount}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: 'rgba(255,107,43,0.06)',
                  border: '1px dashed rgba(255,107,43,0.2)',
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 14 }}>🏗</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 11,
                    color: 'var(--text2)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  S-101 · SLAB PLAN
                </span>
                {critCount > 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      background: 'rgba(255,64,64,0.15)',
                      color: 'var(--danger)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 600,
                    }}
                  >
                    {critCount} CRIT
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

      {/* All Projects */}
      <div style={{ padding: '0 12px', marginBottom: 4 }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            color: 'var(--text3)',
            textTransform: 'uppercase',
            padding: '4px 4px 8px',
          }}
        >
          All Projects
        </div>

        {projects.slice(0, 8).map((project) => {
          const isActive = pathname.includes(project.id);
          return (
            <div
              key={project.id}
              onClick={() => {
                setProject(project);
                router.push(`/projects/${project.id}`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                background: isActive ? 'rgba(255,107,43,0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(255,107,43,0.2)' : '1px solid transparent',
                marginBottom: 2,
                transition: 'all 0.1s',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {project.name}
              </span>
              <span
                className={
                  project.phase === 'bid'
                    ? 'phase-bid'
                    : project.phase === 'active'
                    ? 'phase-active'
                    : project.phase === 'rfi'
                    ? 'phase-rfi'
                    : ''
                }
                style={{
                  fontSize: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                {project.phase.toUpperCase()}
              </span>
            </div>
          );
        })}

        <button
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px dashed var(--border2)',
            borderRadius: 6,
            padding: '6px',
            color: 'var(--text3)',
            fontSize: 11,
            cursor: 'pointer',
            marginTop: 6,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          + New Project
        </button>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

      {/* Workflows */}
      <div style={{ padding: '0 12px', marginBottom: 4 }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            color: 'var(--text3)',
            textTransform: 'uppercase',
            padding: '4px 4px 8px',
          }}
        >
          Workflows
        </div>
        {WORKFLOWS.map((w) => (
          <div
            key={w.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 6,
              cursor: 'pointer',
              marginBottom: 2,
              color: 'var(--text2)',
              fontSize: 12,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <span>{w.icon}</span>
            <span>{w.label}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

      {/* Team Online */}
      <div style={{ padding: '0 16px' }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            color: 'var(--text3)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Team Online
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {TEAM_ONLINE.map((m) => (
            <div
              key={m.name}
              title={m.name}
              style={{
                width: 28,
                height: 28,
                background: m.color + '22',
                border: `2px solid ${m.color}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: m.color,
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {m.initials}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
