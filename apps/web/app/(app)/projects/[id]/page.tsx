'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectsApi, sheetsApi, reviewsApi } from '@/lib/api';
import { useProjectStore, useReviewStore } from '@/lib/store';
import DrawingViewer from '@/components/viewer/drawing-viewer';
import Toolbar from '@/components/viewer/toolbar';
import PromptBar from '@/components/ai/prompt-bar';
import RightPanel from '@/components/panels/right-panel';
import type { Sheet } from '@gritcore/types';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { setProject, setSheets, sheets, current } = useProjectStore();
  const { setReview, setIssues, setReviewing, isReviewing, activeReview } = useReviewStore();
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!id) return;
    projectsApi.get(id).then((p) => {
      setProject(p);
      return sheetsApi.list(id);
    }).then((s) => {
      setSheets(s);
      if (s.length > 0) setActiveSheet(s[0]);
    }).catch(console.error);
  }, [id]);

  async function handleRunReview() {
    if (!activeSheet || isReviewing) return;
    setReviewing(true);
    try {
      const result = await reviewsApi.trigger(activeSheet.id);
      setReview(result.review);
      setIssues(result.issues);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  }

  // Mock a sheet for the pilot drawing viewer if no sheets uploaded
  const displaySheet = activeSheet ?? {
    id: 'demo',
    name: 'S-101 LEVEL P1 SLAB PLAN',
    sheet_number: 'S-101',
    discipline: 'Structural',
  } as Sheet;

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Main drawing area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Drawing viewer */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <DrawingViewer sheet={displaySheet} zoom={zoom} />
        </div>

        {/* Toolbar */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <Toolbar zoom={zoom} onZoom={setZoom} />
        </div>

        {/* Prompt bar */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <PromptBar
            onRun={handleRunReview}
            isRunning={isReviewing}
            sheetName={displaySheet.name}
          />
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          height: '100%',
          overflow: 'hidden',
          background: 'var(--surface)',
        }}
      >
        <RightPanel />
      </div>
    </div>
  );
}
