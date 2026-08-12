import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import {
  Viewport,
  ViewportPluginPackage,
  useViewportCapability,
} from '@embedpdf/plugin-viewport/react';
import { Scroller, ScrollPluginPackage, ScrollStrategy, useScroll, useScrollCapability } from '@embedpdf/plugin-scroll/react';
import {
  DocumentContent,
  DocumentManagerPluginPackage,
  useDocumentManagerCapability,
} from '@embedpdf/plugin-document-manager/react';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react';
import { ThumbnailPluginPackage, ThumbnailsPane, ThumbImg } from '@embedpdf/plugin-thumbnail/react';
import { BookmarkPluginPackage, useBookmarkCapability } from '@embedpdf/plugin-bookmark/react';
import { ZoomMode, ZoomPluginPackage, useZoom } from '@embedpdf/plugin-zoom/react';
import { InteractionManagerPluginPackage } from '@embedpdf/plugin-interaction-manager/react';
import { SearchLayer, SearchPluginPackage, useSearch } from '@embedpdf/plugin-search/react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface ReadingViewerProps {
  fileSource: string | File;
  initialPage?: number;
  onPageChange?: (page: number, numPages: number) => void;
  onLoadSuccess?: (numPages: number) => void;
  isLocalFile?: boolean;
}

type InitialDocument =
  | { url: string; documentId: string }
  | { buffer: ArrayBuffer; name: string; documentId: string };

export const ReadingViewer: React.FC<ReadingViewerProps> = ({
  fileSource,
  initialPage = 1,
  onPageChange,
  onLoadSuccess,
  isLocalFile = false,
}) => {
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialDocument, setInitialDocument] = useState<InitialDocument | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { engine, isLoading: engineLoading } = usePdfiumEngine();

  useEffect(() => {
    setTotalPages(0);
    setCurrentPage(initialPage);
    setPageInput(String(initialPage));
  }, [fileSource, initialPage]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  useEffect(() => {
    if (totalPages > 0) onPageChange?.(currentPage, totalPages);
  }, [currentPage, totalPages, onPageChange]);

  useEffect(() => {
    let cancelled = false;
    setInitialDocument(null);

    if (typeof fileSource === 'string') {
      setInitialDocument({ url: fileSource, documentId: 'main-doc' });
      return () => {
        cancelled = true;
      };
    }

    fileSource.arrayBuffer().then((buffer) => {
      if (!cancelled) {
        setInitialDocument({ buffer, name: fileSource.name, documentId: 'main-doc' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fileSource]);

  const plugins = useMemo(() => [
    createPluginRegistration(DocumentManagerPluginPackage),
    createPluginRegistration(ViewportPluginPackage),
    createPluginRegistration(ScrollPluginPackage),
    createPluginRegistration(RenderPluginPackage),
    createPluginRegistration(InteractionManagerPluginPackage),
    createPluginRegistration(ThumbnailPluginPackage, { width: 120 }),
    createPluginRegistration(BookmarkPluginPackage),
    createPluginRegistration(SearchPluginPackage),
    createPluginRegistration(ZoomPluginPackage, { defaultZoomLevel: ZoomMode.FitWidth }),
  ], []);

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleLoadSuccess = useCallback((numPages: number) => {
    setTotalPages(numPages);
    onLoadSuccess?.(numPages);
  }, [onLoadSuccess]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  };

  if (engineLoading) {
    return <ReaderStatus message="جاري تحميل محرك القراءة..." />;
  }

  if (!engine) {
    return <ReaderStatus error message="فشل تحميل محرك القراءة." />;
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col overflow-hidden border border-reader-border bg-reader-panel text-reader-text shadow-2xl ${
        isFullscreen
          ? 'fixed inset-0 z-[100] h-dvh rounded-none'
          : 'min-h-0 w-full flex-1 rounded-2xl'
      }`}
    >
      {initialDocument ? (
        <EmbedPDF engine={engine} plugins={plugins}>
          <ReaderDocumentLoader document={initialDocument} />
          <ReaderChrome
            currentPage={currentPage}
            totalPages={totalPages}
            pageInput={pageInput}
            setCurrentPage={setCurrentPage}
            setPageInput={setPageInput}
            initialPage={initialPage}
            onPageChange={handlePageChange}
            onLoadSuccess={handleLoadSuccess}
            isLocalFile={isLocalFile}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </EmbedPDF>
      ) : (
        <ReaderStatus message="جاري تجهيز ملف الكتاب..." />
      )}
    </div>
  );
};

const ReaderStatus: React.FC<{ message: string; error?: boolean }> = ({ message, error = false }) => (
  <div className={`flex min-h-[580px] flex-1 flex-col items-center justify-center gap-3 ${error ? 'text-red-300' : 'text-reader-muted'}`}>
    {error ? <AlertCircle className="h-9 w-9" /> : <Loader2 className="h-9 w-9 animate-spin text-reader-accent" />}
    <p className="text-sm font-bold">{message}</p>
  </div>
);

const ReaderDocumentLoader: React.FC<{ document: InitialDocument }> = ({ document }) => {
  const { provides: documentManager } = useDocumentManagerCapability();

  useEffect(() => {
    if (!documentManager) return;
    if (documentManager.isDocumentOpen(document.documentId)) return;

    const task = 'url' in document
      ? documentManager.openDocumentUrl(document)
      : documentManager.openDocumentBuffer(document);

    task.wait(
      ({ task: loadTask }) => {
        loadTask.wait(
          () => undefined,
          (error) => console.error('PDF engine failed to load document:', error),
        );
      },
      (error) => console.error('PDF loading failed:', error),
    );
  }, [document, documentManager]);

  return null;
};

interface ReaderChromeProps {
  currentPage: number;
  totalPages: number;
  pageInput: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setPageInput: React.Dispatch<React.SetStateAction<string>>;
  initialPage: number;
  onPageChange: (page: number) => void;
  onLoadSuccess: (pages: number) => void;
  isLocalFile: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => Promise<void>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ReaderChrome: React.FC<ReaderChromeProps> = ({
  currentPage,
  totalPages,
  pageInput,
  setCurrentPage,
  setPageInput,
  initialPage,
  onPageChange,
  onLoadSuccess,
  isLocalFile,
  isFullscreen,
  onToggleFullscreen,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'outline' | 'search' | 'display'>('thumbnails');
  const [readingMode, setReadingMode] = useState<'continuous' | 'single'>('continuous');
  const { provides: scrollCapability } = useScrollCapability();
  const zoom = useZoom('main-doc');
  const sheetCloseButtonRef = useRef<HTMLButtonElement>(null);

  const navigateToPage = useCallback((pageNumber: number) => {
    scrollCapability?.forDocument('main-doc').scrollToPage({ pageNumber, behavior: 'smooth' });
  }, [scrollCapability]);

  const selectPageFromPanel = useCallback((pageNumber: number) => {
    navigateToPage(pageNumber);
    if (window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false);
  }, [navigateToPage, setSidebarOpen]);

  const changePage = (offset: number) => {
    const nextPage = Math.min(Math.max(1, currentPage + offset), totalPages);
    setCurrentPage(nextPage);
    navigateToPage(nextPage);
  };

  const submitPage = (event: React.FormEvent) => {
    event.preventDefault();
    const requestedPage = Number.parseInt(pageInput, 10);
    if (Number.isFinite(requestedPage) && requestedPage >= 1 && requestedPage <= totalPages) {
      setCurrentPage(requestedPage);
      navigateToPage(requestedPage);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const setReaderMode = (mode: 'continuous' | 'single') => {
    setReadingMode(mode);
    scrollCapability?.forDocument('main-doc').setScrollStrategy(mode === 'continuous' ? ScrollStrategy.Vertical : ScrollStrategy.Horizontal);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setActiveTab('search');
        setSidebarOpen(true);
        return;
      }

      switch (e.key) {
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); void onToggleFullscreen(); }
          break;
        case '+':
          zoom.provides?.zoomIn();
          break;
        case '-':
          zoom.provides?.zoomOut();
          break;
        case '0':
          zoom.provides?.requestZoom(ZoomMode.FitPage);
          break;
        case 'w':
        case 'W':
          zoom.provides?.requestZoom(ZoomMode.FitWidth);
          break;
        case 'PageUp':
        case 'ArrowLeft':
          if (currentPage > 1) {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            scrollCapability?.forDocument('main-doc').scrollToPage({ pageNumber: newPage, behavior: 'smooth' });
          }
          break;
        case 'PageDown':
        case 'ArrowRight':
          if (currentPage < totalPages) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            scrollCapability?.forDocument('main-doc').scrollToPage({ pageNumber: newPage, behavior: 'smooth' });
          }
          break;
        case 'Escape':
          setSidebarOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, scrollCapability, setCurrentPage, setSidebarOpen, onToggleFullscreen, zoom.provides]);

  useEffect(() => {
    if (!sidebarOpen || !window.matchMedia('(max-width: 767px)').matches) return;
    const frameId = window.requestAnimationFrame(() => sheetCloseButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(frameId);
  }, [sidebarOpen]);

  return (
    <>
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-reader-border bg-reader-raised px-3 py-3 sm:px-4">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${isLocalFile ? 'border-amber-500/25 bg-amber-500/10 text-amber-400' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'}`}>
          {isLocalFile ? 'ملف محلي (خاص)' : 'كتاب مشترك'}
        </span>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => changePage(-1)} disabled={currentPage <= 1} className="rounded-lg bg-reader-surface p-2 disabled:opacity-35" title="الصفحة السابقة">
            <ChevronRight className="h-4 w-4" />
          </button>
          <form onSubmit={submitPage} className="flex items-center gap-1 text-xs text-reader-muted">
            <input aria-label="رقم الصفحة" value={pageInput} onChange={(event) => setPageInput(event.target.value)} onBlur={submitPage} className="h-8 w-12 rounded-lg border border-reader-border bg-reader-surface text-center font-mono text-reader-text outline-none focus:border-reader-accent" inputMode="numeric" />
            <span className="hidden sm:inline">/ {totalPages || '...'}</span>
          </form>
          <button type="button" onClick={() => changePage(1)} disabled={!totalPages || currentPage >= totalPages} className="rounded-lg bg-reader-surface p-2 disabled:opacity-35" title="الصفحة التالية">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setReaderMode(readingMode === 'continuous' ? 'single' : 'continuous')} className="hidden rounded-lg bg-reader-surface px-2 text-[10px] font-bold md:block" title="Toggle reading mode">{readingMode === 'continuous' ? '1P' : 'Scroll'}</button>
          <button type="button" onClick={() => zoom.provides?.zoomOut()} className="hidden rounded-lg bg-reader-surface p-2 md:block" title="تصغير"><ZoomOut className="h-4 w-4" /></button>
          <span className="hidden w-11 text-center font-mono text-[11px] text-reader-muted md:block">{Math.round((zoom.state?.currentZoomLevel ?? 1) * 100)}%</span>
          <button type="button" onClick={() => zoom.provides?.zoomIn()} className="hidden rounded-lg bg-reader-surface p-2 md:block" title="تكبير"><ZoomIn className="h-4 w-4" /></button>
          <button type="button" onClick={() => zoom.provides?.requestZoom(1)} className="hidden rounded-lg bg-reader-surface p-2 md:block" title="إعادة ضبط التكبير"><RotateCcw className="h-4 w-4" /></button>
          <button type="button" onClick={() => setSidebarOpen((open) => !open)} aria-expanded={sidebarOpen} aria-controls="reader-tools-panel" className={`hidden rounded-lg p-2 md:block ${sidebarOpen ? 'bg-reader-accent text-white' : 'bg-reader-surface'}`} title="القائمة الجانبية"><Layers className="h-4 w-4" /></button>
          <button type="button" onClick={onToggleFullscreen} className="rounded-lg bg-reader-surface p-2" title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-reader-canvas">
        {sidebarOpen && (
          <>
            <button
              type="button"
              aria-label="إغلاق أدوات القارئ"
              onClick={() => setSidebarOpen(false)}
              className="reader-mobile-backdrop fixed inset-0 z-[190] bg-black/55 backdrop-blur-[2px] md:hidden"
            />
            <aside
              id="reader-tools-panel"
              role="dialog"
              aria-modal="true"
              aria-label="أدوات القارئ"
              className="reader-mobile-sheet fixed inset-x-0 bottom-0 z-[200] flex h-[72dvh] max-h-[680px] flex-col overflow-hidden rounded-t-[28px] border-t border-reader-borderStrong bg-reader-panel pb-[env(safe-area-inset-bottom)] shadow-2xl md:relative md:inset-auto md:z-auto md:h-full md:max-h-none md:w-72 md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:border-reader-border md:pb-0 md:shadow-none"
            >
              <div className="flex h-7 shrink-0 items-center justify-center md:hidden" aria-hidden="true">
                <span className="h-1.5 w-12 rounded-full bg-reader-borderStrong" />
              </div>
              <div className="flex shrink-0 items-center justify-between border-b border-reader-border px-3 pb-3 md:py-3">
                <div className="flex min-w-0 flex-1 gap-1 rounded-xl bg-reader-subdued p-1" role="tablist" aria-label="أقسام أدوات القارئ">
                  <button type="button" role="tab" aria-selected={activeTab === 'thumbnails'} onClick={() => setActiveTab('thumbnails')} className={`min-h-[40px] flex-1 rounded-lg px-2 text-xs font-bold transition-colors ${activeTab === 'thumbnails' ? 'bg-reader-raised text-reader-accent shadow-sm' : 'text-reader-muted hover:text-reader-text'}`}>
                    الصفحات
                  </button>
                  <button type="button" role="tab" aria-selected={activeTab === 'outline'} onClick={() => setActiveTab('outline')} className={`min-h-[40px] flex-1 rounded-lg px-2 text-xs font-bold transition-colors ${activeTab === 'outline' ? 'bg-reader-raised text-reader-accent shadow-sm' : 'text-reader-muted hover:text-reader-text'}`}>
                    المحتويات
                  </button>
                  <button type="button" role="tab" aria-selected={activeTab === 'search'} onClick={() => setActiveTab('search')} className={`min-h-[40px] flex-1 rounded-lg px-2 text-xs font-bold transition-colors ${activeTab === 'search' ? 'bg-reader-raised text-reader-accent shadow-sm' : 'text-reader-muted hover:text-reader-text'}`}>
                    Search
                  </button>
                  <button type="button" role="tab" aria-selected={activeTab === 'display'} onClick={() => setActiveTab('display')} className={`min-h-[40px] flex-1 rounded-lg px-2 text-xs font-bold transition-colors ${activeTab === 'display' ? 'bg-reader-raised text-reader-accent shadow-sm' : 'text-reader-muted hover:text-reader-text'}`}>
                    العرض
                  </button>
                </div>
                <button ref={sheetCloseButtonRef} type="button" onClick={() => setSidebarOpen(false)} className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-reader-surface text-reader-muted hover:text-reader-text" aria-label="إغلاق أدوات القارئ">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1" role="tabpanel">
                {activeTab === 'thumbnails' && <ReaderSidebarThumbnails documentId="main-doc" onPageSelect={selectPageFromPanel} />}
                {activeTab === 'outline' && <ReaderSidebarOutline documentId="main-doc" onPageSelect={selectPageFromPanel} />}
                {activeTab === 'search' && <ReaderSearch documentId="main-doc" onPageSelect={selectPageFromPanel} />}
                {activeTab === 'display' && (
                  <div className="grid grid-cols-3 gap-3 p-4">
                    <button type="button" onClick={() => zoom.provides?.zoomOut()} className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-reader-surface text-xs font-bold text-reader-text">
                      <ZoomOut className="h-5 w-5" /> تصغير
                    </button>
                    <div className="flex min-h-[64px] items-center justify-center rounded-2xl bg-reader-subdued font-mono text-sm font-bold text-reader-accent">{Math.round((zoom.state?.currentZoomLevel ?? 1) * 100)}%</div>
                    <button type="button" onClick={() => zoom.provides?.zoomIn()} className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-reader-surface text-xs font-bold text-reader-text">
                      <ZoomIn className="h-5 w-5" /> تكبير
                    </button>
                    <button type="button" onClick={() => zoom.provides?.requestZoom(ZoomMode.FitWidth)} className="col-span-2 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-reader-surface text-xs font-bold text-reader-text">
                      <RotateCcw className="h-5 w-5" /> ملاءمة عرض الصفحة
                    </button>
                    <button type="button" onClick={onToggleFullscreen} aria-label="تبديل ملء الشاشة" className="flex min-h-[52px] items-center justify-center rounded-2xl bg-reader-accent text-white">
                      {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
        <main className="h-full min-h-0 flex-1 overflow-hidden p-2 pb-24 sm:p-4 sm:pb-24 md:p-4">
          <DocumentContent documentId="main-doc">
            {({ isLoading, isError, isLoaded }) => (
              <>
                {isLoading && <ReaderStatus message="جاري تحميل صفحات الكتاب..." />}
                {isError && <ReaderStatus error message="تعذر فتح ملف PDF." />}
                {isLoaded && (
                  <>
                    <ReaderDocumentViewport
                      documentId="main-doc"
                      initialPage={initialPage}
                      onPageChange={onPageChange}
                      onLoadSuccess={onLoadSuccess}
                    />
                    {/* Mobile bottom navigation bar */}
                    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-reader-border bg-reader-panel/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl md:hidden">
                      <button
                        onClick={() => changePage(-1)}
                        disabled={currentPage <= 1}
                        className="p-3 rounded-full bg-reader-surface disabled:opacity-35"
                        aria-label="الصفحة السابقة"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <span className="text-sm font-medium">{currentPage} / {totalPages || '...'}</span>
                      <button
                        onClick={() => setSidebarOpen(true)}
                        aria-expanded={sidebarOpen}
                        aria-controls="reader-tools-panel"
                        className="p-3 rounded-full bg-reader-surface"
                        aria-label="الأدوات"
                      >
                        <Layers className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => changePage(1)}
                        disabled={!totalPages || currentPage >= totalPages}
                        className="p-3 rounded-full bg-reader-surface disabled:opacity-35"
                        aria-label="الصفحة التالية"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </DocumentContent>
        </main>
      </div>
    </>
  );
};

const ReaderDocumentViewport: React.FC<ReadingViewerContentProps> = (props) => {
  const { documentId } = props;
  const zoom = useZoom(documentId);
  const { provides: viewport } = useViewportCapability();

  useEffect(() => {
    let timeoutId: number | undefined;
    let attempts = 0;

    const initializeZoom = () => {
      zoom.provides?.requestZoom(ZoomMode.FitWidth);
      attempts += 1;

      if (viewport?.isGated(documentId) && attempts < 20) {
        timeoutId = window.setTimeout(initializeZoom, 50);
      }
    };

    timeoutId = window.setTimeout(initializeZoom, 0);
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [documentId, viewport, zoom.provides]);

  return (
    <Viewport documentId={documentId} className="h-full min-h-0 overscroll-contain">
      <ReadingViewerContent {...props} />
    </Viewport>
  );
};

interface ReadingViewerContentProps {
  documentId: string;
  initialPage: number;
  onPageChange: (page: number) => void;
  onLoadSuccess: (numPages: number) => void;
}

const ReadingViewerContent: React.FC<ReadingViewerContentProps> = ({ documentId, initialPage, onPageChange, onLoadSuccess }) => {
  const scroll = useScroll(documentId);
  const { provides: scrollCapability } = useScrollCapability();
  const restoredInitialPageRef = useRef(false);
  const notifiedLoadRef = useRef(false);
  const restoreTargetRef = useRef<number | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<number | null>(null);

  useEffect(() => {
    restoredInitialPageRef.current = false;
    notifiedLoadRef.current = false;
    restoreTargetRef.current = null;
    setRestoreTarget(null);
  }, [documentId, initialPage]);

  useEffect(() => {
    if (!scrollCapability) return;

    return scrollCapability.onLayoutReady((event) => {
      if (event.documentId !== documentId) return;

      if (!notifiedLoadRef.current) {
        notifiedLoadRef.current = true;
        onLoadSuccess(event.totalPages);
      }

      if (restoredInitialPageRef.current || restoreTargetRef.current !== null) return;

      const safeInitialPage = Math.min(Math.max(1, initialPage), event.totalPages);
      restoreTargetRef.current = safeInitialPage;
      setRestoreTarget(safeInitialPage);
      scrollCapability.forDocument(documentId).scrollToPage({
        pageNumber: safeInitialPage,
        behavior: 'instant',
      });
    });
  }, [scrollCapability, documentId, initialPage, onLoadSuccess]);

  useEffect(() => {
    if (restoreTarget === null || scroll.state.currentPage !== restoreTarget) return;
    restoredInitialPageRef.current = true;
    onPageChange(restoreTarget);
  }, [restoreTarget, scroll.state.currentPage, onPageChange]);

  useEffect(() => {
    if (!restoredInitialPageRef.current) return;
    onPageChange(scroll.state.currentPage);
  }, [scroll.state.currentPage, onPageChange]);

  return <Scroller documentId={documentId} renderPage={(pageLayout: any) => <><RenderLayer documentId={documentId} pageIndex={pageLayout.pageIndex} /><SearchLayer documentId={documentId} pageIndex={pageLayout.pageIndex} /></>} />;
};

const ReaderSearch: React.FC<{ documentId: string; onPageSelect: (pageNumber: number) => void }> = ({ documentId, onPageSelect }) => {
  const { state, provides } = useSearch(documentId);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const value = query.trim();
    if (!provides) return;
    if (!value) { provides.stopSearch(); return; }
    const timer = window.setTimeout(() => { provides.startSearch(); provides.searchAllPages(value); }, 250);
    return () => window.clearTimeout(timer);
  }, [query, provides]);

  return (
    <div className="h-full overflow-auto p-3">
      <label className="relative block"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-reader-muted" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this book" className="h-10 w-full rounded-xl border border-reader-border bg-reader-surface pr-10 pl-3 text-sm text-reader-text outline-none focus:border-reader-accent" /></label>
      <p className="my-3 text-xs text-reader-muted">{state.loading ? 'Searching…' : query.trim() ? `${state.total} result(s)` : 'Ctrl + F'}</p>
      <div className="space-y-2">{state.results.map((result: any, index: number) => <button key={`${result.pageIndex}-${result.charIndex}-${index}`} type="button" onClick={() => { provides?.goToResult(index); onPageSelect(result.pageIndex + 1); }} className="w-full rounded-xl bg-reader-surface p-3 text-right text-xs text-reader-text hover:bg-reader-hover"><b className="block text-reader-accent">Page {result.pageIndex + 1}</b><span className="mt-1 block line-clamp-2 text-reader-muted">{result.context || 'Matching text'}</span></button>)}</div>
    </div>
  );
};

const ReaderSidebarThumbnails: React.FC<{ documentId: string; onPageSelect: (pageNumber: number) => void }> = ({ documentId, onPageSelect }) => (
  <div className="h-full p-4">
    <ThumbnailsPane documentId={documentId}>
      {(meta: any) => (
        <button
          key={meta.pageIndex}
          type="button"
          style={{ position: 'absolute', top: meta.top, height: meta.wrapperHeight, width: '100%' }}
          onClick={() => onPageSelect(meta.pageIndex + 1)}
          className="cursor-pointer text-right transition-opacity hover:opacity-80"
        >
          <span style={{ width: meta.width, height: meta.height }} className="block overflow-hidden rounded border border-reader-border">
            <ThumbImg documentId={documentId} meta={meta} />
          </span>
          <span className="mt-1 block text-center text-xs text-reader-muted">{meta.pageIndex + 1}</span>
        </button>
      )}
    </ThumbnailsPane>
  </div>
);



const ReaderSidebarOutline: React.FC<{
  documentId: string;
  onPageSelect: (pageNumber: number) => void;
}> = ({ documentId, onPageSelect }) => {
  const { provides: bookmarksCapability } = useBookmarkCapability();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!bookmarksCapability) return;

    const task = bookmarksCapability.forDocument(documentId).getBookmarks();
    task.wait(
      ({ bookmarks: loadedBookmarks }) => {
        setBookmarks(loadedBookmarks);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );
  }, [bookmarksCapability, documentId]);

  const getPageNumber = (bookmark: any) => {
    if (bookmark.target?.type === 'destination') {
      return bookmark.target.destination.pageIndex + 1;
    }
    if (bookmark.target?.type === 'action' && bookmark.target.action.destination) {
      return bookmark.target.action.destination.pageIndex + 1;
    }
    return null;
  };

  const renderBookmarks = (items: any[], depth = 0): React.ReactNode => items.map((bookmark, index) => {
    const pageNumber = getPageNumber(bookmark);
    return (
      <div key={`${depth}-${index}-${bookmark.title}`}>
        <button
          type="button"
          disabled={!pageNumber}
          onClick={() => pageNumber && onPageSelect(pageNumber)}
          style={{ paddingInlineStart: `${12 + depth * 14}px` }}
          className="w-full rounded-lg px-3 py-2 text-start text-xs text-reader-muted transition-colors hover:bg-reader-hover hover:text-reader-text disabled:cursor-default"
        >
          {bookmark.title || `الصفحة ${pageNumber ?? ''}`}
        </button>
        {bookmark.children?.length ? renderBookmarks(bookmark.children, depth + 1) : null}
      </div>
    );
  });

  if (isLoading) {
    return <ReaderStatus message="جاري تحميل المحتويات..." />;
  }

  return (
    <div className="h-full overflow-auto p-2">
      {bookmarks.length ? renderBookmarks(bookmarks) : (
        <p className="p-4 text-center text-xs text-reader-muted">لا يحتوي هذا الملف على جدول محتويات.</p>
      )}
    </div>
  );
};
