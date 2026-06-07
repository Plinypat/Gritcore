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
  const [history, setHistory] = useState<string[]>([]);

  function zoomIn() { onZoom(Math.min(zoom + 10, 200)); }
  function zoomOut() { onZoom(Math.max(zoom - 10, 30)); }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '6px 8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Zoom controls */}
      <ToolBtn
        icon="−"
        label="Zoom Out"
        active={false}
        onClick={zoomOut}
        mono
      />
      <div
        style={{
          minWidth: 44,
          textAlign: 'center',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text2)',
          padding: '0 4px',
        }}
      >
        {zoom}%
      </div>
      <ToolBtn icon="+" label="Zoom In" active={false} onClick={zoomIn} mono />

      <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

      {/* Tools */}
      {TOOLS.map((t) => (
        <ToolBtn
          key={t.id}
          icon={t.icon}
          label={t.label}
          active={activeTool === t.id}
          onClick={() => setActiveTool(t.id)}
        />
      ))}

      <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

      {/* Undo/Redo */}
      <ToolBtn
        icon="↩"
        label="Undo"
        active={false}
        onClick={() => {}}
      />
      <ToolBtn
        icon="↪"
        label="Redo"
        active={false}
        onClick={() => {}}
      />
    </div>
  );
}

function ToolBtn({
  icon,
  label,
  active,
  onClick,
  mono,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  mono?: boolean;
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
          ? 'rgba(255,107,43,0.15)'
          : hovered
          ? 'rgba(255,255,255,0.05)'
          : 'transparent',
        border: active ? '1px solid rgba(255,107,43,0.3)' : '1px solid transparent',
        borderRadius: 6,
        color: active ? 'var(--accent)' : 'var(--text2)',
        fontSize: mono ? 16 : 14,
        cursor: 'pointer',
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        transition: 'all 0.1s',
      }}
    >
      {icon}
    </button>
  );
}
