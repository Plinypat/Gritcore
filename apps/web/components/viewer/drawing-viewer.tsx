'use client';

import { useReviewStore } from '@/lib/store';
import MarkupOverlay from './markup-overlay';
import type { Sheet } from '@gritcore/types';

interface Props {
  sheet: Sheet;
  zoom: number;
}

export default function DrawingViewer({ sheet, zoom }: Props) {
  const { issues, activeReview } = useReviewStore();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Page badge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 10,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
          }}
        >
          <span
            className="pulse-dot"
            style={{ width: 6, height: 6, background: 'var(--accent3)', borderRadius: '50%' }}
          />
          <span
            style={{
              fontSize: 10,
              color: 'var(--accent3)',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.08em',
            }}
          >
            LIVE
          </span>
        </div>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: 'var(--text)',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.06em',
          }}
        >
          {sheet.sheet_number ?? 'S-101'} — {sheet.name}
        </div>
      </div>

      {/* Zoom badge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 11,
          color: 'var(--text2)',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {zoom}%
      </div>

      {/* SVG Blueprint */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px 16px',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
          }}
        >
          <BlueprintSVG />

          {/* Markup overlay */}
          {issues.length > 0 && (
            <MarkupOverlay issues={issues} />
          )}
        </div>
      </div>
    </div>
  );
}

function BlueprintSVG() {
  const gridColor = '#1a3a5c';
  const lineColor = '#2a5a8c';
  const textColor = '#4a8abf';
  const dimColor = '#3a6a9c';

  return (
    <svg
      width="720"
      height="520"
      viewBox="0 0 720 520"
      style={{
        background: '#030d1a',
        borderRadius: 8,
        border: '1px solid #0a2040',
        display: 'block',
      }}
    >
      {/* Background */}
      <rect width="720" height="520" fill="#030d1a" />

      {/* Grid lines - major */}
      {[0, 80, 160, 240, 320, 400, 480, 560, 640, 720].map((x) => (
        <line key={`vg${x}`} x1={x} y1={0} x2={x} y2={520} stroke={gridColor} strokeWidth="0.5" opacity="0.6" />
      ))}
      {[0, 65, 130, 195, 260, 325, 390, 455, 520].map((y) => (
        <line key={`hg${y}`} x1={0} y1={y} x2={720} y2={y} stroke={gridColor} strokeWidth="0.5" opacity="0.6" />
      ))}

      {/* Slab outline */}
      <rect x={40} y={40} width={640} height={440} fill="none" stroke={lineColor} strokeWidth="2" />

      {/* Interior grid lines */}
      {[120, 200, 280, 360, 440, 520, 600].map((x) => (
        <line key={`vs${x}`} x1={x} y1={40} x2={x} y2={480} stroke={lineColor} strokeWidth="0.8" strokeDasharray="4,3" />
      ))}
      {[113, 187, 260, 333, 407].map((y) => (
        <line key={`hs${y}`} x1={40} y1={y} x2={680} y2={y} stroke={lineColor} strokeWidth="0.8" strokeDasharray="4,3" />
      ))}

      {/* Band beams */}
      <rect x={40} y={240} width={640} height={20} fill="rgba(42,90,140,0.2)" stroke={lineColor} strokeWidth="1.2" />
      <rect x={40} y={370} width={640} height={20} fill="rgba(42,90,140,0.2)" stroke={lineColor} strokeWidth="1.2" />

      {/* Column dots */}
      {[120, 200, 280, 360, 440, 520, 600].flatMap((x) =>
        [113, 187, 260, 333, 407].map((y) => (
          <g key={`col-${x}-${y}`}>
            <rect x={x - 6} y={y - 6} width={12} height={12} fill="#0a2a4a" stroke={lineColor} strokeWidth="1.5" />
            <rect x={x - 9} y={y - 9} width={18} height={18} fill="none" stroke={dimColor} strokeWidth="0.6" strokeDasharray="3,2" />
          </g>
        ))
      )}

      {/* Stairwell openings */}
      <rect x={80} y={80} width={60} height={80} fill="#020a14" stroke="#3de8a0" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x={110} y={124} textAnchor="middle" fill="#3de8a0" fontSize="8" fontFamily="JetBrains Mono, monospace">S1</text>

      <rect x={420} y={210} width={50} height={70} fill="#020a14" stroke="#3de8a0" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x={445} y={248} textAnchor="middle" fill="#3de8a0" fontSize="8" fontFamily="JetBrains Mono, monospace">S2</text>

      <rect x={580} y={380} width={50} height={60} fill="#020a14" stroke="#3de8a0" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x={605} y={413} textAnchor="middle" fill="#3de8a0" fontSize="8" fontFamily="JetBrains Mono, monospace">S3</text>

      {/* PT tendons - horizontal banded */}
      {[70, 90, 110, 150, 170, 190, 230, 250, 270, 310, 330, 350, 390, 410, 430, 470, 490, 510, 550, 570, 590, 630, 650, 670].map((x) => (
        <line key={`pt-h${x}`} x1={x} y1={40} x2={x} y2={480} stroke="#5ba3ff" strokeWidth="0.4" opacity="0.3" />
      ))}

      {/* PT tendons - vertical distributed */}
      {[60, 90, 120, 150, 180, 220, 255, 290, 340, 375, 415, 450, 480].map((y) => (
        <line key={`pt-v${y}`} x1={40} y1={y} x2={680} y2={y} stroke="#5ba3ff" strokeWidth="0.4" opacity="0.25" />
      ))}

      {/* Zone labels */}
      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((z, i) => (
        <g key={`zone-${z}`}>
          <text
            x={80 + i * 80}
            y={30}
            textAnchor="middle"
            fill={textColor}
            fontSize="11"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            letterSpacing="1"
          >
            {z}
          </text>
        </g>
      ))}
      {['1', '2', '3', '4', '5', '6'].map((n, i) => (
        <text
          key={`row-${n}`}
          x={28}
          y={75 + i * 73}
          textAnchor="middle"
          fill={textColor}
          fontSize="11"
          fontFamily="Rajdhani, sans-serif"
          fontWeight="700"
        >
          {n}
        </text>
      ))}

      {/* Dimension lines */}
      <line x1={40} y1={500} x2={680} y2={500} stroke={dimColor} strokeWidth="0.8" />
      <line x1={40} y1={495} x2={40} y2={505} stroke={dimColor} strokeWidth="0.8" />
      <line x1={680} y1={495} x2={680} y2={505} stroke={dimColor} strokeWidth="0.8" />
      <text x={360} y={514} textAnchor="middle" fill={dimColor} fontSize="9" fontFamily="JetBrains Mono, monospace">
        180&apos;-0&quot; TYP (CONC SLAB)
      </text>

      {/* Title block area */}
      <rect x={500} y={450} width={168} height={48} fill="#020a14" stroke={lineColor} strokeWidth="0.8" />
      <text x={584} y={464} textAnchor="middle" fill={textColor} fontSize="8" fontFamily="JetBrains Mono, monospace">GritCore PILOT · DRAWING</text>
      <text x={584} y={478} textAnchor="middle" fill="#dce4f0" fontSize="11" fontFamily="Rajdhani, sans-serif" fontWeight="700" letterSpacing="1">S-101 SLAB PLAN</text>
      <text x={584} y={491} textAnchor="middle" fill={dimColor} fontSize="7" fontFamily="JetBrains Mono, monospace">SCALE 1:50 · REV 03</text>

      {/* North arrow */}
      <g transform="translate(670, 60)">
        <circle cx={0} cy={0} r={14} fill="#020a14" stroke={lineColor} strokeWidth="0.8" />
        <path d="M0 -10 L4 6 L0 2 L-4 6 Z" fill={textColor} />
        <text x={0} y={-13} textAnchor="middle" fill={textColor} fontSize="7" fontFamily="JetBrains Mono, monospace">N</text>
      </g>

      {/* Annotation notes */}
      <text x={46} y={96} fill={dimColor} fontSize="7" fontFamily="JetBrains Mono, monospace">8&quot; PT SLAB (TYP)</text>
      <text x={46} y={106} fill={dimColor} fontSize="7" fontFamily="JetBrains Mono, monospace">f&apos;c=5000psi LW(115pcf)</text>
    </svg>
  );
}
