import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [pageInput, setPageInput] = useState<string>(String(initialPage));
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPageInput(String(pageNumber));
    if (numPages && onPageChange) {
      onPageChange(pageNumber, numPages);
    }
  }, [pageNumber, numPages, onPageChange]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    const startPage = Math.min(Math.max(1, initialPage), numPages);
    setPageNumber(startPage);
    setPageInput(String(startPage));
    if (onLoadSuccess) {
      onLoadSuccess(numPages);
    }
  };

  const changePage = (offset: number) => {
    if (!numPages) return;
    setPageNumber((prev) => {
      const next = Math.min(Math.max(1, prev + offset), numPages);
      return next;
    });
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numPages) return;
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setPageNumber(parsed);
    } else {
      setPageInput(String(pageNumber));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-zinc-950 text-white rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full min-h-[650px]'
      }`}
    >
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 sticky top-0 z-20 backdrop-blur-md">
        {/* Local File indicator */}
        <div className="flex items-center gap-2">
          {isLocalFile ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
              ملف محلي (خاص)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
              كتاب مشترك
            </span>
          )}
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="الصفحة السابقة"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 text-sm font-medium">
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputSubmit}
              className="w-12 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-center font-mono focus:border-emerald-500 outline-none"
            />
            <span className="text-zinc-400">/ {numPages || '...'}</span>
          </form>

          <button
            onClick={() => changePage(1)}
            disabled={!numPages || pageNumber >= numPages}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            title="الصفحة التالية"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-zinc-400 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setScale(1.0)}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-colors"
            title="إعادة ضبط العرض"
          >
            ملائمة
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors mr-2"
            title={isFullscreen ? 'خروج من الشاشة الكاملة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PDF View Canvas */}
      <div className="flex-1 overflow-auto flex justify-center items-start p-4 bg-zinc-950 min-h-[550px]">
        <Document
          file={fileSource}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">جاري تحميل ملف الكتاب...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-red-400">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-medium">تعذر تحميل ملف الـ PDF. يرجى التأكد من صحة الملف وصلاحيات الوصول.</p>
            </div>
          }
        >
          {numPages && (
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={Math.min(containerWidth, 900)}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl rounded-lg overflow-hidden border border-zinc-800"
            />
          )}
        </Document>
      </div>
    </div>
  );
};
