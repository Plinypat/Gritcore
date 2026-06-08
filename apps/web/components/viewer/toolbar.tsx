'use client';

import { useState } from 'react';

interface Props {
  zoom: number;
  onZoom: (z: number) => void;
}

const TOOLS = [
  { id: 'select', icon: '↖', label: 'Select' },
  { id: 'measure', icon: '📐', label: 'Measure' },
  { id: 'takeoff', icon: '🔢', label: 'Takeoff' },
  { id: 'markup', icon: '✏', label: 'Markup' },
  { id: 'rfi', icon: '📋', label: 'RFI' },
];

export default function Toolbar({ zoom, onZoom }: Props) {
  const [activeTool, setActiveTool] = useState('select');
  const [hovered, setHovered] = useState(false);

  function zoomIn() { onZoom(Math.min(zoom + 10, 200)); }
  function zoomOut() { onZoom(Math.max(zoom - 10, 30)); }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: hovered ? 'rgba(15,16,20,0.92)' : 'rgba(15,16,20,0.35)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 10,
        padding: '6px 8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: hovered ? 1 : 0.45,
        transition: 'opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Zoom controls */}
      <ToolBtn icon="−" label="Zoom Out" active={false} onClick={zoomOut} mono parentHovered={hovered} />
      <div
        style={{
          minWidth: 44,
          textAlign: 'center',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          color: hovered ? 'var(--text2)' : 'rgba(255,255,255,0.4)',
          padding: '0 4px',
          transition: 'color 0.2s',
        }}
      >
        {zoom}%
      </div>
      <ToolBtn icon="+" label="Zoom In" active={false} onClick={zoomIn} mono parentHovered={hovered} />

      <div style={{ width: 1, height: 24, background: hovered ? 'var(--border)' : 'rgba(255,255,255,0.06)', margin: '0 4px', transition: 'background 0.2s' }} />

      {TOOLS.map((t) => (
        <ToolBtn
          key={t.id}
          icon={t.icon}
          label={t.label}
          active={activeTool === t.id}
          onClick={() => setActiveTool(t.id)}
          parentHovered={hovered}
        />
      ))}

      <div style={{ width: 1, height: 24, background: hovered ? 'var(--border)' : 'rgba(255,255,255,0.06)', margin: '0 4px', transition: 'background 0.2s' }} />

      <ToolBtn icon="↩" label="Undo" active={false} onClick={() => {}} parentHovered={hovered} />
      <ToolBtn icon="↪" label="Redo" active={false} onClick={() => {}} parentHovered={hovered} />
    </div>
  );
}

function ToolBtn({
  icon,
  label,
  active,
  onClick,
  mono,
  parentHovered,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  mono?: boolean;
  parentHovered: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active
          ? 'rgba(255,107,43,0.2)'
          : hovered
          ? 'rgba(255,255,255,0.08)'
          : 'transparent',
        border: active ? '1px solid rgba(255,107,43,0.4)' : '1px solid transparent',
        borderRadius: 6,
        color: active
          ? 'var(--accent)'
          : parentHovered
          ? 'var(--text2)'
          : 'rgba(255,255,255,0.3)',
        fontSize: mono ? 16 : 14,
        cursor: 'pointer',
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        transition: 'all 0.15s',
      }}
    >
      {icon}
    </button>
  );
}
