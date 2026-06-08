'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Dynamically import pdfjs to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

interface PDFViewerProps {
  url: string;
  onDimensionsChange?: (width: number, height: number) => void;
  externalZoom?: number;
}

export default function PDFViewer({ url, onDimensionsChange, externalZoom }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const activeZoom = externalZoom ?? zoom;

  const renderPage = useCallback(async (pdf: any, pageNum: number, scale: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any in-flight render and wait for it to fully stop
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      try { await renderTaskRef.current.promise; } catch (_) {}
      renderTaskRef.current = null;
    }

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      onDimensionsChange?.(viewport.width, viewport.height);

      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') {
        console.error('PDF render error:', e);
      }
    }
  }, [onDimensionsChange]);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!pdfjsLib) {
          pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        }

        const loadingTask = pdfjsLib.getDocument({ url, withCredentials: true });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
        await renderPage(pdf, 1, activeZoom);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Failed to load PDF');
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (pdfRef.current && !loading) {
      renderPage(pdfRef.current, currentPage, activeZoom);
    }
  }, [currentPage, activeZoom, loading, renderPage]);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 13 }}>Failed to load drawing</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Page controls */}
      {numPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', color: 'var(--text2)', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1 }}
          >
            ‹
          </button>
          <span>PAGE {currentPage} / {numPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', color: 'var(--text2)', cursor: currentPage >= numPages ? 'not-allowed' : 'pointer', opacity: currentPage >= numPages ? 0.4 : 1 }}
          >
            ›
          </button>
        </div>
      )}

      {/* Canvas area */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: loading ? 'center' : 'flex-start', padding: 16 }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text2)' }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>LOADING DRAWING...</span>
          </div>
        )}
        <div style={{ position: 'relative', display: loading ? 'none' : 'block' }}>
          <canvas ref={canvasRef} style={{ display: 'block', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }} />
        </div>
      </div>
    </div>
  );
}
