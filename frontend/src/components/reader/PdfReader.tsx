import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// LEGACY PDF READER - This is the original react-pdf implementation
// Kept as fallback during migration to EmbedPDF (ReadingViewer.tsx)
// TODO: Remove after EmbedPDF migration passes compatibility testing

// Bundle the worker with Vite. A local worker avoids CDN/CORS failures and
// guarantees that its PDF.js version always matches react-pdf.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfReaderProps {
  fileSource: string | File;
  initialPage?: number;
  onPageChange?: (page: number, numPages: number) => void;
  onLoadSuccess?: (numPages: number) => void;
  isLocalFile?: boolean;
}

export const PdfReader: React.FC<PdfReaderProps> = ({
  fileSource,
  initialPage = 1,
  onPageChange,
  onLoadSuccess,
  isLocalFile = false,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(900);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNumPages(null);
    setPageNumber(initialPage);
    setPageInput(String(initialPage));
    setLoadError(null);
  }, [fileSource, initialPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setContainerWidth(Math.max(280, container.clientWidth - 32));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPageInput(String(pageNumber));
    if (numPages) onPageChange?.(pageNumber, numPages);
  }, [pageNumber, numPages, onPageChange]);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  const handleDocumentLoadSuccess = ({ numPages: loadedPages }: { numPages: number }) => {
    const safePage = Math.min(Math.max(1, initialPage), loadedPages);
    setNumPages(loadedPages);
    setPageNumber(safePage);
    setPageInput(String(safePage));
    setLoadError(null);
    onLoadSuccess?.(loadedPages);
  };

  const handleLoadError = (error: Error) => {
    console.error('PDF loading failed:', error);
    setLoadError('تعذر فتح ملف الـPDF. قد يكون الملف تالفًا أو لم يعد متاحًا.');
  };

  const changePage = (offset: number) => {
    if (!numPages) return;
    setPageNumber((current) => Math.min(Math.max(1, current + offset), numPages));
  };

  const submitPage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!numPages) return;
    const requestedPage = Number.parseInt(pageInput, 10);
    if (Number.isFinite(requestedPage) && requestedPage >= 1 && requestedPage <= numPages) {
      setPageNumber(requestedPage);
    } else {
      setPageInput(String(pageNumber));
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col overflow-hidden border border-reader-border bg-reader-panel text-reader-text shadow-2xl ${
        isFullscreen
          ? 'fixed inset-0 z-[100] rounded-none'
          : 'min-h-[650px] w-full rounded-2xl'
      }`}
    >
      <div className="z-20 flex flex-wrap items-center justify-between gap-3 border-b border-reader-border bg-reader-raised px-3 py-3 sm:px-4">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
          isLocalFile
            ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
            : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
        }`}>
          {isLocalFile ? 'ملف محلي (خاص)' : 'كتاب مشترك'}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="rounded-lg bg-reader-surface p-2 disabled:opacity-35"
            title="الصفحة السابقة"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <form onSubmit={submitPage} className="flex items-center gap-1 text-xs text-reader-muted">
            <input
              aria-label="رقم الصفحة"
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={submitPage}
              className="h-8 w-12 rounded-lg border border-reader-border bg-reader-surface text-center font-mono text-reader-text outline-none focus:border-reader-accent"
              inputMode="numeric"
            />
            <span>/ {numPages ?? '...'}</span>
          </form>
          <button
            type="button"
            onClick={() => changePage(1)}
            disabled={!numPages || pageNumber >= numPages}
            className="rounded-lg bg-reader-surface p-2 disabled:opacity-35"
            title="الصفحة التالية"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setScale((value) => Math.max(0.6, value - 0.15))} className="rounded-lg bg-reader-surface p-2" title="تصغير">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-11 text-center font-mono text-[11px] text-reader-muted">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => setScale((value) => Math.min(2.5, value + 0.15))} className="rounded-lg bg-reader-surface p-2" title="تكبير">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setScale(1)} className="rounded-lg bg-reader-surface p-2" title="إعادة ضبط التكبير">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button type="button" onClick={toggleFullscreen} className="rounded-lg bg-reader-surface p-2" title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex min-h-[580px] flex-1 items-start justify-center overflow-auto bg-reader-canvas p-4">
        {loadError ? (
          <div className="m-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm font-bold text-red-300">{loadError}</p>
          </div>
        ) : (
          <Document
            file={fileSource}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleLoadError}
            onSourceError={handleLoadError}
            loading={(
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-reader-muted">
                <Loader2 className="h-9 w-9 animate-spin text-reader-accent" />
                <p className="text-sm font-bold">جاري تحميل صفحات الكتاب...</p>
              </div>
            )}
          >
            {numPages && (
              <Page
                pageNumber={pageNumber}
                width={Math.min(containerWidth, 960)}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer
                className="overflow-hidden rounded-lg border border-reader-border shadow-2xl"
              />
            )}
          </Document>
        )}
      </div>
    </div>
  );
};
