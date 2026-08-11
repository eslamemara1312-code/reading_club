import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { getAuthorizedReaderUrl, getReadingProgress, updateReadingProgress } from '../api/reader';
import { getBooksCatalog } from '../api/books';
import { PdfReader } from '../components/reader/PdfReader';

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

        // Fetch catalog title
        try {
          const catalog = await getBooksCatalog();
          const found = catalog.find((b) => b.id === bookId);
          if (found) setBookTitle(found.title);
        } catch {}

        // Fetch saved reading progress
        try {
          const prog = await getReadingProgress(groupId, bookId);
          if (prog && prog.current_page) {
            setInitialPage(prog.current_page);
          }
        } catch {}

        // Fetch short-lived signed reader URL
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

  // Debounced progress saver for shared files
  const handlePageChange = useCallback(
    (page: number, numPages: number) => {
      if (localFile || !groupId || !bookId) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await updateReadingProgress(groupId, bookId, page, numPages);
        } catch {}
      }, 1000);
    },
    [groupId, bookId, localFile]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 dir-rtl font-sans">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 shadow-lg">
          <button
            onClick={() => navigate('/books')}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة إلى المكتبة
          </button>

          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold text-white max-w-md truncate">{bookTitle}</h1>
          </div>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-900/50 border border-zinc-800 rounded-2xl gap-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-zinc-400 text-sm font-medium">جاري تجهيز القارئ واستعادة الصفحة الأخيرة...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-zinc-900/50 border border-zinc-800 rounded-2xl gap-4 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-300 font-semibold text-base">{errorMsg}</p>
            <button
              onClick={() => navigate('/books')}
              className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white transition-all"
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
  );
};
