'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { api, projectsApi, sheetsApi, reviewsApi } from '@/lib/api';
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Fetch as authenticated blob to avoid 401 — pdf.js can't send JWT headers
    let objectUrl: string | null = null;
    api.get(`/sheets/${activeSheet.id}/file`, { responseType: 'blob' })
      .then(res => {
        objectUrl = URL.createObjectURL(res.data);
        setSheetUrl(objectUrl);
      })
      .catch(console.error);

    // Load the latest completed review for this sheet from the DB
    reviewsApi.listForSheet(activeSheet.id)
      .then((reviews: any[]) => {
        const latest = reviews.find((r: any) => r.status === 'complete');
        if (latest) {
          setReview(latest);
          return reviewsApi.get(latest.id).then((full: any) => {
            setIssues(full.issues ?? []);
          });
        }
      })
      .catch(console.error);

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeSheet]);

  async function handleRunReview() {
    if (!activeSheet || isReviewing) return;
    // Clear existing results so the spinner shows
    setReview(null);
    setIssues([]);
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      const sheet = await sheetsApi.upload(id, file);
      const updatedSheets = [...sheets, sheet];
      setSheets(updatedSheets);
      setActiveSheet(sheet);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        {/* PDF viewer — toolbar floats over the drawing */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Upload button — always visible top-right */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, display: 'flex', gap: 8 }}>
            {sheets.length > 1 && (
              <select
                value={activeSheet?.id ?? ''}
                onChange={e => setActiveSheet(sheets.find(s => s.id === e.target.value) ?? null)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', color: 'var(--text)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
              >
                {sheets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ background: uploading ? 'rgba(255,107,43,0.4)' : 'var(--accent)', border: 'none', borderRadius: 6, padding: '6px 14px', color: '#fff', fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.08em', cursor: uploading ? 'not-allowed' : 'pointer' }}
            >
              {uploading ? 'UPLOADING...' : '+ UPLOAD DRAWING'}
            </button>
          </div>

          {sheetUrl ? (
            <PDFViewer url={sheetUrl} externalZoom={zoom} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, color: 'var(--text2)' }}>
              <div style={{ fontSize: 32 }}>📐</div>
              <div style={{ fontSize: 14, color: 'var(--text2)' }}>No drawing loaded</div>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '10px 20px', color: '#fff', fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer' }}
              >
                + UPLOAD DRAWING
              </button>
            </div>
          )}
        </div>

        {/* Toolbar — overlaid on drawing, bottom-center */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
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
