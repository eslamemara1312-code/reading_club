import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { getAuthorizedReaderUrl, getReadingProgress, updateReadingProgress } from '../api/reader';
import { getBooksCatalog } from '../api/books';
import { PdfReader } from '../components/reader/PdfReader';
import { AppShell } from '../components/layout/AppShell';
import { ThemeToggle } from '../components/layout/ThemeToggle';

export const ReaderPage: React.FC = () => {
  const { groupId, bookId } = useParams<{ groupId: string; bookId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const localFile = (location.state as { localFile?: File })?.localFile;

  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('قراءة الكتاب');
  const [initialPage, setInitialPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(!localFile);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!groupId || !bookId) return;

    if (localFile) {
      setBookTitle(localFile.name.replace(/\.pdf$/i, ''));
      setIsLoading(false);
      return;
    }

    const loadReaderData = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        try {
          const catalog = await getBooksCatalog();
          const found = catalog.find((b) => b.id === bookId);
          if (found) setBookTitle(found.title);
        } catch {
          // The reader can continue with its fallback title when catalog lookup is unavailable.
        }

        try {
          const prog = await getReadingProgress(groupId, bookId);
          if (prog && prog.current_page) {
            setInitialPage(prog.current_page);
          }
        } catch {
          // Reading starts from page one when saved progress cannot be loaded.
        }

        const readerData = await getAuthorizedReaderUrl(groupId, bookId);
        setReaderUrl(readerData.url);
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'تعذر جلب رابط قراءة الكتاب المشترك.';
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadReaderData();
  }, [groupId, bookId, localFile]);

  const handlePageChange = useCallback(
    (page: number, numPages: number) => {
      if (localFile || !groupId || !bookId) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await updateReadingProgress(groupId, bookId, page, numPages);
        } catch {
          // Progress sync is best-effort and must not interrupt the reading session.
        }
      }, 1000);
    },
    [groupId, bookId, localFile]
  );

  return (
    <AppShell isReaderPage={true}>
      <div className="min-h-screen bg-reader-canvas text-reader-text p-3 sm:p-6 dir-rtl font-sans">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Reader Top Navigation Bar */}
          <div className="flex items-center justify-between bg-reader-panel border border-reader-border rounded-2xl px-4 sm:px-6 py-3.5 shadow-lg">
            <button
              onClick={() => navigate('/books')}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-reader-muted hover:text-reader-text transition-colors min-h-[44px] px-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden xs:inline">العودة إلى المكتبة</span>
              <span className="xs:hidden">العودة</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <BookOpen className="w-5 h-5 text-reader-accent shrink-0" />
              <h1 className="text-sm sm:text-base font-bold text-reader-text max-w-xs sm:max-w-md truncate">
                {bookTitle}
              </h1>
            </div>

            <ThemeToggle />
          </div>

          {/* Reader Content Area */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] bg-reader-subdued border border-reader-border rounded-3xl gap-3">
              <Loader2 className="w-10 h-10 text-reader-accent animate-spin" />
              <p className="text-reader-muted text-xs sm:text-sm font-medium">جاري تجهيز القارئ واستعادة الصفحة الأخيرة...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-reader-subdued border border-reader-border rounded-3xl gap-4 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-red-300 font-semibold text-sm sm:text-base">{errorMsg}</p>
              <button
                onClick={() => navigate('/books')}
                className="px-5 py-2.5 rounded-xl bg-reader-surface hover:bg-reader-hover border border-reader-border text-xs sm:text-sm font-bold text-reader-text transition-all"
              >
                العودة إلى قائمة الكتب
              </button>
            </div>
          ) : localFile ? (
            <PdfReader
              fileSource={localFile}
              initialPage={1}
              isLocalFile={true}
            />
          ) : readerUrl ? (
            <PdfReader
              fileSource={readerUrl}
              initialPage={initialPage}
              onPageChange={handlePageChange}
              isLocalFile={false}
            />
          ) : null}
        </div>
      </div>
    </AppShell>
  );
};
