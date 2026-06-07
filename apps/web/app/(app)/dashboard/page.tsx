'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { useProjectStore } from '@/lib/store';
import type { Project } from '@gritcore/types';
import { formatDate, phaseLabel } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { projects, setProjects, setLoading, isLoading, addProject } = useProjectStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    projectsApi
      .list()
      .then((data) => setProjects(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function createProject() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const p = await projectsApi.create({ name: newName.trim(), phase: 'bid' });
      addProject(p);
      setShowNew(false);
      setNewName('');
      router.push(`/projects/${p.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  const phaseColors: Record<string, string> = {
    bid: 'phase-bid',
    active: 'phase-active',
    rfi: 'phase-rfi',
    complete: 'phase-active',
    archived: '',
  };

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: '24px',
        background: 'var(--bg)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '0.05em',
              color: 'var(--text)',
              margin: 0,
            }}
          >
            PROJECT HUB
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
            {projects.length} active projects
          </p>
        </div>

        <button
          onClick={() => setShowNew(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            color: '#fff',
            fontSize: 13,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> NEW PROJECT
        </button>
      </div>

      {/* New project modal */}
      {showNew && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 28,
              width: 400,
            }}
          >
            <h3
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: '0.05em',
                marginBottom: 16,
                color: 'var(--text)',
              }}
            >
              NEW PROJECT
            </h3>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              placeholder="Project name..."
              style={{
                width: '100%',
                background: 'var(--bg2)',
                border: '1px solid var(--accent)',
                borderRadius: 6,
                padding: '10px 14px',
                color: 'var(--text)',
                fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                outline: 'none',
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNew(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 16px',
                  color: 'var(--text2)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={creating || !newName.trim()}
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  color: '#fff',
                  fontSize: 13,
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating || !newName.trim() ? 0.5 : 1,
                }}
              >
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--text2)',
            padding: '40px 0',
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              border: '2px solid var(--accent)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 0',
            color: 'var(--text2)',
          }}
        >
          <p style={{ fontSize: 16, marginBottom: 8 }}>No projects yet</p>
          <p style={{ fontSize: 13 }}>Click New Project to get started</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              phaseColors={phaseColors}
              onClick={() => router.push(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  phaseColors,
  onClick,
}: {
  project: Project;
  phaseColors: Record<string, string>;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {/* Phase badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span
          className={phaseColors[project.phase] ?? ''}
          style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {phaseLabel(project.phase)}
        </span>
        {project.gcr_number && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text3)',
            }}
          >
            {project.gcr_number}
          </span>
        )}
      </div>

      {/* Name */}
      <h3
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: '0.03em',
          color: 'var(--text)',
          margin: '0 0 6px',
          lineHeight: 1.3,
        }}
      >
        {project.name}
      </h3>

      {project.description && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text2)',
            margin: '0 0 14px',
            lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {project.description}
        </p>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          marginTop: project.description ? 0 : 14,
        }}
      >
        {project.location && (
          <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>📍</span>
            {project.location}
          </span>
        )}
        {project.bid_due_date && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--accent2)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            BID {formatDate(project.bid_due_date)}
          </span>
        )}
      </div>
    </div>
  );
}
