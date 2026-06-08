'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { projectsApi, sheetsApi, reviewsApi } from '@/lib/api';
import { useProjectStore, useReviewStore } from '@/lib/store';
import Toolbar from '@/components/viewer/toolbar';
import PromptBar from '@/components/ai/prompt-bar';
import RightPanel from '@/components/panels/right-panel';
import type { Sheet } from '@gritcore/types';

const PDFViewer = dynamic(() => import('@/components/viewer/pdf-viewer'), { ssr: false });

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { setProject, setSheets, sheets, current } = useProjectStore();
  const { setReview, setIssues, setReviewing, isReviewing, activeReview } = useReviewStore();
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.5);

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

  useEffect(() => {
    if (!activeSheet) {
      setSheetUrl(null);
      return;
    }
    sheetsApi.getUrl(activeSheet.id)
      .then((data: { url: string }) => setSheetUrl(data.url))
      .catch(console.error);
  }, [activeSheet]);

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

  const displaySheetName = activeSheet?.name ?? 'No drawing selected';

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
        {/* PDF viewer */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {sheetUrl ? (
            <PDFViewer url={sheetUrl} externalZoom={zoom} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: 'var(--text2)' }}>
              <div style={{ fontSize: 13 }}>Upload a drawing to get started</div>
            </div>
          )}
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
          <Toolbar zoom={zoom * 100} onZoom={(z) => setZoom(z / 100)} />
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
            sheetName={displaySheetName}
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
