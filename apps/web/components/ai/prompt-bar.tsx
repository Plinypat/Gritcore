'use client';

import { useState } from 'react';

const QUICK_PROMPTS = [
  'Calc total CY',
  'Flag missing rebar specs',
  'Control joint spacing',
  'Thickened edge details',
  'Generate RFI list',
  'Vapor barrier check',
];

interface Props {
  onRun: () => void;
  isRunning: boolean;
  sheetName: string;
}

export default function PromptBar({ onRun, isRunning, sheetName }: Props) {
  const [query, setQuery] = useState('');

  function handleQuickPrompt(prompt: string) {
    setQuery(prompt);
  }

  function handleRun() {
    onRun();
  }

  return (
    <div style={{ padding: '10px 16px' }}>
      {/* Quick chips */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handleQuickPrompt(p)}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '3px 10px',
              color: 'var(--text2)',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.1s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.borderColor = 'var(--accent)';
              (e.target as HTMLElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.borderColor = 'var(--border)';
              (e.target as HTMLElement).style.color = 'var(--text2)';
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '6px 8px 6px 12px',
        }}
      >
        {/* AI tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255,107,43,0.1)',
            border: '1px solid rgba(255,107,43,0.25)',
            borderRadius: 4,
            padding: '2px 7px',
            flexShrink: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 0L9.33 2.5V7.5L5 10L0.67 7.5V2.5L5 0Z"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="0.8"
            />
            <circle cx="5" cy="5" r="2" fill="var(--accent)" opacity="0.5" />
          </svg>
          <span
            style={{
              fontSize: 9,
              color: 'var(--accent)',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            CLAUDE
          </span>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRun()}
          placeholder={`Ask about ${sheetName}...`}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
          }}
        />

        <button
          onClick={handleRun}
          disabled={isRunning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isRunning ? 'rgba(255,107,43,0.3)' : 'var(--accent)',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            color: '#fff',
            fontSize: 12,
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          {isRunning ? (
            <>
              <span
                style={{
                  width: 10,
                  height: 10,
                  border: '1.5px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              ANALYZING...
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              RUN
            </>
          )}
        </button>
      </div>
    </div>
  );
}
