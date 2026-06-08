'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';

const NAV_TABS = [
  { id: 'review', label: 'AI Review' },
  { id: 'pour', label: 'Pour Sequence' },
  { id: 'rebar', label: 'Rebar Takeoff' },
  { id: 'rfi', label: 'RFIs' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'projects', label: 'Projects' },
];

// Extract project id from pathname like /projects/[id]/...
function getProjectId(pathname: string): string | null {
  const match = pathname.match(/\/projects\/([^/]+)/);
  return match ? match[1] : null;
}

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isDashboard = pathname === '/dashboard';
  const projectId = getProjectId(pathname);

  // Derive active tab from current path
  const activeTab = (() => {
    if (isDashboard) return 'projects';
    if (pathname.endsWith('/rfis') || pathname.includes('/rfis/')) return 'rfi';
    if (pathname.endsWith('/pour-sequence')) return 'pour';
    if (pathname.endsWith('/takeoff')) return 'rebar';
    if (projectId) return 'review';
    return 'projects';
  })();

  function handleTabClick(id: string) {
    if (id === 'projects') { router.push('/dashboard'); return; }
    if (!projectId) return;
    if (id === 'review') router.push(`/projects/${projectId}`);
    else if (id === 'rfi') router.push(`/projects/${projectId}/rfis`);
    else if (id === 'pour') router.push(`/projects/${projectId}/pour-sequence`);
    else if (id === 'rebar') router.push(`/projects/${projectId}/takeoff`);
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header
      style={{
        height: 48,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        paddingInline: '16px',
        gap: 0,
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingRight: 20,
          borderRight: '1px solid var(--border)',
          marginRight: 16,
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => router.push('/dashboard')}
      >
        {/* Hexagon SVG */}
        <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
          <path
            d="M11 0L22 6V18L11 24L0 18V6L11 0Z"
            fill="rgba(255,107,43,0.12)"
            stroke="var(--accent)"
            strokeWidth="1"
          />
          <path d="M11 5L17 8.5V15.5L11 19L5 15.5V8.5L11 5Z" fill="var(--accent)" opacity="0.25" />
          <text
            x="11"
            y="14.5"
            textAnchor="middle"
            fill="var(--accent)"
            fontSize="7"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
          >
            GC
          </text>
        </svg>
        <span
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.08em',
            color: 'var(--text)',
            lineHeight: 1,
          }}
        >
          GRIT<span style={{ color: 'var(--accent)' }}>CORE</span>
        </span>
      </div>

      {/* Org chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          marginRight: 16,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--text)',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em',
          }}
        >
          {user?.email?.split('@')[1]?.toUpperCase() ?? 'MY ORG'}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="var(--text2)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Nav tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 2 }}>
        {NAV_TABS.map((tab) => {
          const isCurrent = tab.id === activeTab || (tab.id === 'projects' && isDashboard);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isCurrent ? '2px solid var(--accent)' : '2px solid transparent',
                padding: '0 14px',
                height: 48,
                color: isCurrent ? 'var(--text)' : 'var(--text2)',
                fontSize: 12,
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'color 0.15s',
                flexShrink: 0,
              }}
            >
              {tab.label.toUpperCase()}
            </button>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* AI Status badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            background: 'rgba(61,232,160,0.08)',
            border: '1px solid rgba(61,232,160,0.2)',
            borderRadius: 20,
          }}
        >
          <span
            className="pulse-dot"
            style={{
              width: 6,
              height: 6,
              background: 'var(--accent3)',
              borderRadius: '50%',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: 'var(--accent3)',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.08em',
            }}
          >
            Claude · CONNECTED
          </span>
        </div>

        {/* Notification bell */}
        <button
          style={{
            background: 'transparent',
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            color: 'var(--text2)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1a5 5 0 00-5 5v3l-1.5 2H14.5L13 9V6a5 5 0 00-5-5zM6.5 13a1.5 1.5 0 003 0"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              width: 30,
              height: 30,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              fontSize: 11,
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {initials}
          </button>

          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 38,
                right: 0,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                minWidth: 160,
                padding: 8,
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  color: 'var(--text2)',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: 6,
                }}
              >
                {user?.email}
              </div>
              <button
                onClick={() => { logout(); router.replace('/login'); setUserMenuOpen(false); }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 12px',
                  textAlign: 'left',
                  color: 'var(--danger)',
                  fontSize: 13,
                  cursor: 'pointer',
                  borderRadius: 4,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
