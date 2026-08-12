import React, { useState, useEffect, useRef } from 'react';
import { PDFViewer, ScrollStrategy } from '@embedpdf/react-pdf-viewer';

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
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const numPagesReportedRef = useRef<boolean>(false);

  useEffect(() => {
    numPagesReportedRef.current = false;
  }, [fileSource]);

  useEffect(() => {
    if (fileSource instanceof File) {
      const url = URL.createObjectURL(fileSource);
      setLocalUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setLocalUrl(null);
    }
  }, [fileSource]);

  const resolvedSrc = typeof fileSource === 'string' ? fileSource : localUrl;

  const handleReady = (registry: any) => {
    try {
      const scroll = registry.getPlugin('scroll').provides();
      const ui = registry.getPlugin('ui')?.provides();

      if (ui && typeof ui.setDisabledCategories === 'function') {
        ui.setDisabledCategories(['annotation', 'redaction', 'signature']);
      }

      scroll.onLayoutReady((event: any) => {
        if (event.isInitial) {
          scroll.forDocument(event.documentId).scrollToPage({
            pageNumber: initialPage,
            behavior: 'instant',
          });
        }
      });

      scroll.onPageChange((event: any) => {
        onPageChange?.(event.pageNumber, event.totalPages);
        if (!numPagesReportedRef.current) {
          numPagesReportedRef.current = true;
          onLoadSuccess?.(event.totalPages);
        }
      });
    } catch (err) {
      console.error('Failed to initialize EmbedPDF plugins:', err);
    }
  };

  return (
    <div className="flex flex-col bg-zinc-950 text-white rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl w-full min-h-[650px]">
      {/* Header bar with file status badge */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-md">
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
      </div>

      {/* EmbedPDF Viewer */}
      <div className="flex-1 w-full h-full min-h-[600px] relative bg-zinc-950">
        {resolvedSrc && (
          <PDFViewer
            config={{
              src: resolvedSrc,
              scroll: { defaultStrategy: ScrollStrategy.Vertical, defaultPageGap: 20 },
              theme: {
                preference: 'dark',
                dark: { accent: { primary: '#E5B24A' } },
              },
              tabBar: 'never',
            }}
            onReady={handleReady}
            style={{ height: '100%', minHeight: 600 }}
          />
        )}
      </div>
    </div>
  );
};
