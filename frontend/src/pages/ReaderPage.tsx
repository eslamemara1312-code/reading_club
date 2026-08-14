import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Bookmark, BookOpen, Check, Highlighter, Loader2, NotebookPen, Save, X } from 'lucide-react';
import { getAuthorizedReaderUrl, getBookAssetMetadata, updateReadingProgress } from '../api/reader';
import { getActiveGroupBook, getBooksCatalog, GroupBook } from '../api/books';
import { getTodayStatus, logCheckin, MemberTodayStatus } from '../api/checkins';
import { createReaderBookmark, createReaderHighlight, createReaderNote, deleteReaderBookmark, getReaderBookmarks, getReaderHighlights, getReaderNotes, ReaderBookmark, ReaderHighlight, ReaderNote } from '../api/readerAnnotations';
import {
  getSavedLocalBook,
  saveLocalBookFile,
  SavedLocalBook,
  updateSavedLocalBookProgress,
} from '../storage/localReaderStorage';
import { ReadingViewer } from '../components/reader/ReadingViewer';
import { AppShell } from '../components/layout/AppShell';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { useAuthStore } from '../store/authStore';
import { useReadingSession } from '../hooks/useReadingSession';

export const ReaderPage: React.FC = () => {
  const { groupId, bookId } = useParams<{ groupId: string; bookId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const stateFile = (location.state as { localFile?: File } | null)?.localFile;
  const localMode = new URLSearchParams(location.search).get('source') === 'local' || Boolean(stateFile);

  const [savedLocalBook, setSavedLocalBook] = useState<SavedLocalBook | null>(null);
  const [isResolvingLocal, setIsResolvingLocal] = useState(localMode);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('قراءة الكتاب');
  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeGroupBook, setActiveGroupBook] = useState<GroupBook | null>(null);
  const [todayStatus, setTodayStatus] = useState<MemberTodayStatus | null>(null);
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [notes, setNotes] = useState<ReaderNote[]>([]);
  const [highlights, setHighlights] = useState<ReaderHighlight[]>([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  const [annotationError, setAnnotationError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [annotationsOpen, setAnnotationsOpen] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const lastLoadKeyRef = useRef<string | null>(null);

  const effectiveLocalFile = stateFile ?? savedLocalBook?.file;
  const { summary: session, recordPage } = useReadingSession(`${groupId ?? ''}:${bookId ?? ''}`, initialPage);

  useEffect(() => {
    let cancelled = false;

    if (!localMode || !groupId || !bookId) {
      setSavedLocalBook(null);
      setIsResolvingLocal(false);
      return;
    }

    setIsResolvingLocal(true);
    getSavedLocalBook(groupId, bookId)
      .then((savedBook) => {
        if (!cancelled) setSavedLocalBook(savedBook);
      })
      .catch(() => {
        if (!cancelled) setSavedLocalBook(null);
      })
      .finally(() => {
        if (!cancelled) setIsResolvingLocal(false);
      });

    return () => {
      cancelled = true;
    };
  }, [localMode, groupId, bookId, stateFile]);

  useEffect(() => {
    if (!groupId || !bookId) return;

    if (localMode) {
      if (isResolvingLocal) {
        setIsLoading(true);
        return;
      }

      const localLoadKey = effectiveLocalFile
        ? `${groupId}:${bookId}:local:${effectiveLocalFile.name}:${effectiveLocalFile.size}:${effectiveLocalFile.lastModified}`
        : `${groupId}:${bookId}:missing-local`;
      if (lastLoadKeyRef.current === localLoadKey) return;
      lastLoadKeyRef.current = localLoadKey;

      setReaderUrl(null);
      if (effectiveLocalFile) {
        setBookTitle(effectiveLocalFile.name.replace(/\.pdf$/i, ''));
        const restoredPage = savedLocalBook?.currentPage ?? 1;
        setInitialPage(restoredPage);
        setCurrentPage(restoredPage);
        setErrorMsg(null);
      } else {
        setErrorMsg('لم يتم العثور على الملف المحلي المحفوظ. اختر ملف PDF لحفظه على هذا الجهاز.');
      }
      setIsLoading(false);
      return;
    }

    const sharedLoadKey = `${groupId}:${bookId}:shared`;
    if (lastLoadKeyRef.current === sharedLoadKey) return;
    lastLoadKeyRef.current = sharedLoadKey;

    const loadSharedReader = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        try {
          const catalog = await getBooksCatalog();
          const found = catalog.find((book) => book.id === bookId);
          if (found) setBookTitle(found.title);
        } catch {
          // The reader can continue with its fallback title.
        }

        const metadata = await getBookAssetMetadata(groupId, bookId);
        if (!metadata.has_asset) {
          setErrorMsg('لا توجد نسخة PDF مشتركة لهذا الكتاب. ارفع نسخة أو افتح ملفاً محلياً.');
          return;
        }

        if (metadata.progress?.current_page) {
          setInitialPage(metadata.progress.current_page);
          setCurrentPage(metadata.progress.current_page);
        }

        const readerData = await getAuthorizedReaderUrl(groupId, bookId);
        setReaderUrl(readerData.url);
      } catch (error: any) {
        setErrorMsg(error.response?.data?.detail || 'تعذر جلب رابط قراءة الكتاب المشترك.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedReader();
  }, [
    groupId,
    bookId,
    localMode,
    isResolvingLocal,
    effectiveLocalFile,
    savedLocalBook?.currentPage,
  ]);

  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  useEffect(() => {
    if (!groupId || !bookId) return;
    let cancelled = false;
    const loadReaderContext = async () => {
      try {
        const [groupBook, statuses] = await Promise.all([getActiveGroupBook(groupId), getTodayStatus(groupId)]);
        if (!cancelled) {
          setActiveGroupBook(groupBook?.book_id === bookId ? groupBook : null);
          setTodayStatus(statuses.find((status) => status.user.id === user?.id) ?? null);
        }
      } catch {
        // Reading remains available if supporting club data cannot be loaded.
      }
    };
    void loadReaderContext();
    return () => { cancelled = true; };
  }, [groupId, bookId, user?.id]);

  useEffect(() => {
    if (localMode || !groupId || !bookId || !readerUrl) {
      setBookmarks([]); setNotes([]); setHighlights([]); return;
    }
    let cancelled = false;
    setAnnotationsLoading(true);
    Promise.all([getReaderBookmarks(groupId, bookId), getReaderNotes(groupId, bookId), getReaderHighlights(groupId, bookId)])
      .then(([loadedBookmarks, loadedNotes, loadedHighlights]) => {
        if (!cancelled) { setBookmarks(loadedBookmarks); setNotes(loadedNotes); setHighlights(loadedHighlights); setAnnotationError(null); }
      })
      .catch(() => { if (!cancelled) setAnnotationError('تعذر تحميل ملاحظاتك وعلاماتك الآن.'); })
      .finally(() => { if (!cancelled) setAnnotationsLoading(false); });
    return () => { cancelled = true; };
  }, [groupId, bookId, localMode, readerUrl]);

  const handleReselectLocalFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !groupId || !bookId || !file.name.toLowerCase().endsWith('.pdf')) return;

    try {
      setIsLoading(true);
      const savedBook = await saveLocalBookFile(groupId, bookId, file);
      setSavedLocalBook(savedBook);
      lastLoadKeyRef.current = null;
      navigate(`${location.pathname}?source=local`, {
        replace: true,
        state: { localFile: savedBook.file },
      });
    } catch {
      setErrorMsg('تعذر حفظ الملف على هذا الجهاز. تأكد من وجود مساحة تخزين كافية.');
      setIsLoading(false);
    } finally {
      event.target.value = '';
    }
  };

  const handlePageChange = useCallback((page: number, numPages: number) => {
    if (!groupId || !bookId) return;

    setCurrentPage(page);
    setTotalPages(numPages);
    recordPage(page);

    if (localMode) {
      void updateSavedLocalBookProgress(groupId, bookId, page, numPages);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await updateReadingProgress(groupId, bookId, page, numPages);
      } catch {
        // Progress sync is best-effort and must not interrupt reading.
      }
    }, 1000);
  }, [groupId, bookId, localMode, recordPage]);

  const saveCurrentPage = useCallback(async () => {
    if (!groupId || !bookId) return false;

    setSaveState('saving');
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (localMode) {
        await updateSavedLocalBookProgress(groupId, bookId, currentPage, totalPages || undefined);
      } else {
        await updateReadingProgress(groupId, bookId, currentPage, totalPages || undefined);
      }

      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1800);
      return true;
    } catch {
      setSaveState('error');
      return false;
    }
  }, [groupId, bookId, localMode, currentPage, totalPages]);

  const handleBackNavigation = useCallback(async () => {
    try {
      await saveCurrentPage();
    } catch {
      // Progress saving is best-effort and should never block navigation
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/books');
    }
  }, [saveCurrentPage, navigate]);

  const saveAndGoBack = async () => {
    await handleBackNavigation();
  };

  const toggleBookmark = async () => {
    if (localMode || !groupId || !bookId) return;
    const existing = bookmarks.find((bookmark) => bookmark.page_number === currentPage);
    try {
      if (existing) {
        await deleteReaderBookmark(groupId, bookId, existing.id);
        setBookmarks((items) => items.filter((bookmark) => bookmark.id !== existing.id));
      } else {
        const bookmark = await createReaderBookmark(groupId, bookId, currentPage);
        setBookmarks((items) => [...items, bookmark]);
      }
    } catch { setAnnotationError('تعذر حفظ العلامة. حاول مرة أخرى.'); }
  };

  const saveNote = async () => {
    if (localMode || !groupId || !bookId || !noteText.trim()) return;
    try {
      const note = await createReaderNote(groupId, bookId, { page_number: currentPage, note_text: noteText.trim(), selected_text: window.getSelection()?.toString() || undefined });
      setNotes((items) => [...items, note]); setNoteText(''); setNoteOpen(false);
    } catch { setAnnotationError('تعذر حفظ الملاحظة. حاول مرة أخرى.'); }
  };

  const saveSelectionHighlight = async () => {
    if (localMode || !groupId || !bookId) return;
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) { setAnnotationError('حدّد النص داخل الصفحة أولاً ثم اضغط الإبراز.'); return; }
    try {
      const highlight = await createReaderHighlight(groupId, bookId, { page_number: currentPage, selected_text: selectedText, color: 'yellow' });
      setHighlights((items) => [...items, highlight]);
      window.getSelection()?.removeAllRanges();
    } catch { setAnnotationError('تعذر حفظ الإبراز. حاول مرة أخرى.'); }
  };

  const completeTodayReading = async () => {
    if (!groupId || todayStatus?.has_checked_in) return;
    setCheckingIn(true);
    try {
      await logCheckin({ group_id: groupId, pages_read: Math.max(1, session.pagesVisited.length) });
      setTodayStatus((current) => current ? { ...current, has_checked_in: true } : current);
    } catch { setAnnotationError('تعذر تسجيل ورد اليوم. حاول مرة أخرى.'); }
    finally { setCheckingIn(false); }
  };

  const dailyTarget = activeGroupBook?.daily_target_pages ?? 0;
  const dailyProgress = Math.min(dailyTarget || session.pagesVisited.length, session.pagesVisited.length);
  const currentBookProgress = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <AppShell isReaderPage>
      <div className="h-full overflow-hidden bg-reader-canvas p-3 font-sans text-reader-text dir-rtl sm:p-6">
        <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-4">
          <input
            ref={localFileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleReselectLocalFile}
            className="hidden"
          />

          {!isLoading && !errorMsg && (effectiveLocalFile || readerUrl) && (
            <div className="fixed bottom-24 right-3 z-[180] flex items-center gap-2 rounded-2xl border border-reader-border bg-reader-panel/95 p-2 shadow-2xl backdrop-blur-md md:bottom-7 md:right-7 md:z-[500]">
              <span className="hidden rounded-lg bg-reader-surface px-2.5 py-2 text-xs font-bold text-reader-muted sm:inline">
                صفحة {currentPage}{totalPages ? ` / ${totalPages}` : ''}
              </span>
              <button
                type="button"
                onClick={saveCurrentPage}
                disabled={saveState === 'saving'}
                className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60 ${
                  saveState === 'saved' ? 'bg-emerald-600' : saveState === 'error' ? 'bg-red-600' : 'bg-reader-accent'
                }`}
                title="حفظ الصفحة الحالية"
              >
                {saveState === 'saved' ? <Check className="h-4 w-4" /> : saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{saveState === 'saved' ? 'تم الحفظ' : saveState === 'error' ? 'تعذر الحفظ' : 'حفظ'}</span>
              </button>
              {!localMode && (
                <>
                  <button type="button" onClick={toggleBookmark} className={`flex min-h-[44px] items-center justify-center rounded-xl px-3 transition-colors ${bookmarks.some((bookmark) => bookmark.page_number === currentPage) ? 'bg-amber-500 text-white' : 'bg-reader-surface text-reader-text hover:bg-reader-hover'}`} title="حفظ أو إزالة علامة الصفحة">
                    <Bookmark className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={saveSelectionHighlight} className="flex min-h-[44px] items-center justify-center rounded-xl bg-reader-surface px-3 text-reader-text hover:bg-reader-hover" title="إبراز النص المحدد">
                    <Highlighter className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setNoteOpen(true)} className="flex min-h-[44px] items-center justify-center rounded-xl bg-reader-surface px-3 text-reader-text hover:bg-reader-hover" title="إضافة ملاحظة">
                    <NotebookPen className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setAnnotationsOpen(true)} className="flex min-h-[44px] items-center justify-center rounded-xl bg-reader-surface px-3 text-reader-text hover:bg-reader-hover" title="الملاحظات والعلامات">•••</button>
                </>
              )}
              <button
                type="button"
                onClick={saveAndGoBack}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-reader-surface px-3.5 py-2 text-xs font-bold text-reader-text transition-colors hover:bg-reader-hover"
                title="حفظ والعودة إلى الكتب"
              >
                <ArrowRight className="h-4 w-4" />
                <span>رجوع</span>
              </button>
            </div>
          )}

          <div className="flex shrink-0 items-center justify-between rounded-2xl border border-reader-border bg-reader-panel px-4 py-3.5 shadow-lg sm:px-6">
            <button
              onClick={saveAndGoBack}
              className="flex min-h-[44px] items-center gap-2 px-2 text-xs font-bold text-reader-muted transition-colors hover:text-reader-text sm:text-sm"
            >
              <ArrowRight className="h-4 w-4" />
              <span>العودة</span>
            </button>

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <BookOpen className="h-5 w-5 shrink-0 text-reader-accent" />
              <h1 className="max-w-xs truncate text-sm font-bold text-reader-text sm:max-w-md sm:text-base">
                {bookTitle}
              </h1>
              {totalPages > 0 && <span className="hidden rounded-md bg-reader-subdued px-2 py-1 text-[11px] font-bold text-reader-accent lg:inline">{currentPage} / {totalPages} · {currentBookProgress}%</span>}
            </div>

            <ThemeToggle />
          </div>

          {!isLoading && !errorMsg && activeGroupBook && (
            <section className="grid shrink-0 gap-3 rounded-2xl border border-reader-border bg-reader-panel p-3 text-xs sm:grid-cols-[1fr_auto] sm:items-center sm:px-4" aria-label="تقدم القراءة اليومي">
              <div className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-3 font-bold text-reader-text"><span>هدف اليوم</span><span>{dailyTarget ? `${dailyProgress} / ${dailyTarget} صفحات` : `${session.pagesVisited.length} صفحات في هذه الجلسة`}</span></div>
                {dailyTarget > 0 && <div className="h-2 overflow-hidden rounded-full bg-reader-subdued"><div className="h-full rounded-full bg-reader-accent transition-[width]" style={{ width: `${Math.min(100, (dailyProgress / dailyTarget) * 100)}%` }} /></div>}
              </div>
              <button type="button" onClick={completeTodayReading} disabled={todayStatus?.has_checked_in || checkingIn} className={`min-h-[40px] rounded-xl px-4 font-bold transition-colors disabled:cursor-default ${todayStatus?.has_checked_in ? 'bg-emerald-500/15 text-emerald-400' : 'bg-reader-accent text-white'}`}>
                {checkingIn ? 'جارٍ التسجيل…' : todayStatus?.has_checked_in ? `✓ تم ورد اليوم${todayStatus.current_streak ? ` · ${todayStatus.current_streak} يوم` : ''}` : 'إكمال ورد اليوم'}
              </button>
            </section>
          )}

          {isLoading ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-reader-border bg-reader-subdued">
              <Loader2 className="h-10 w-10 animate-spin text-reader-accent" />
              <p className="text-xs font-medium text-reader-muted sm:text-sm">جاري تجهيز القارئ واستعادة آخر صفحة...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-auto rounded-3xl border border-reader-border bg-reader-subdued p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <p className="text-sm font-semibold text-red-300 sm:text-base">{errorMsg}</p>
              {localMode && (
                <button
                  onClick={() => localFileInputRef.current?.click()}
                  className="rounded-xl bg-reader-accent px-5 py-2.5 text-xs font-bold text-white transition-all sm:text-sm"
                >
                  اختيار ملف PDF وحفظه
                </button>
              )}
              <button
                onClick={() => navigate('/books')}
                className="rounded-xl border border-reader-border bg-reader-surface px-5 py-2.5 text-xs font-bold text-reader-text transition-all hover:bg-reader-hover sm:text-sm"
              >
                العودة إلى قائمة الكتب
              </button>
            </div>
          ) : effectiveLocalFile && localMode ? (
            <ReadingViewer
              fileSource={effectiveLocalFile}
              initialPage={initialPage}
              onPageChange={handlePageChange}
              isLocalFile
              onSave={saveCurrentPage}
              onSaveAndBack={saveAndGoBack}
              saveState={saveState}
            />
          ) : readerUrl ? (
            <ReadingViewer
              fileSource={readerUrl}
              initialPage={initialPage}
              onPageChange={handlePageChange}
              isLocalFile={false}
              onSave={saveCurrentPage}
              onSaveAndBack={saveAndGoBack}
              saveState={saveState}
            />
          ) : null}

          {!localMode && (bookmarks.length > 0 || notes.length > 0 || highlights.length > 0 || annotationsLoading) && (
            <p className="sr-only" aria-live="polite">{annotationsLoading ? 'جارٍ تحميل ملاحظات القارئ' : `${bookmarks.length} علامات، ${notes.length} ملاحظات، ${highlights.length} إبرازات محفوظة`}</p>
          )}
        </div>
      </div>

      {annotationsOpen && (
        <div className="fixed inset-0 z-[700] flex items-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="الملاحظات والعلامات">
          <div className="max-h-[80dvh] w-full max-w-lg overflow-auto rounded-3xl border border-reader-border bg-reader-panel p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-reader-text">ملاحظاتي وعلاماتي</h2><button type="button" onClick={() => setAnnotationsOpen(false)} className="rounded-lg p-2 text-reader-muted hover:bg-reader-surface"><X className="h-4 w-4" /></button></div>
            <section className="mb-5"><h3 className="mb-2 text-sm font-bold text-reader-accent">العلامات ({bookmarks.length})</h3>{bookmarks.length ? <div className="flex flex-wrap gap-2">{bookmarks.map((bookmark) => <button key={bookmark.id} type="button" onClick={() => setCurrentPage(bookmark.page_number)} className="rounded-lg bg-reader-surface px-3 py-2 text-xs text-reader-text">صفحة {bookmark.page_number}</button>)}</div> : <p className="text-xs text-reader-muted">لا توجد علامات محفوظة بعد.</p>}</section>
            <section className="mb-5"><h3 className="mb-2 text-sm font-bold text-reader-accent">الملاحظات ({notes.length})</h3>{notes.length ? <div className="space-y-2">{notes.map((note) => <article key={note.id} className="rounded-xl bg-reader-surface p-3 text-sm"><span className="mb-1 block text-xs font-bold text-reader-accent">صفحة {note.page_number}</span>{note.selected_text && <blockquote className="mb-2 border-r-2 border-reader-accent pr-2 text-xs text-reader-muted">{note.selected_text}</blockquote>}<p className="text-reader-text">{note.note_text}</p></article>)}</div> : <p className="text-xs text-reader-muted">لا توجد ملاحظات محفوظة بعد.</p>}</section>
            <section><h3 className="mb-2 text-sm font-bold text-reader-accent">الإبرازات ({highlights.length})</h3>{highlights.length ? <div className="space-y-2">{highlights.map((highlight) => <article key={highlight.id} className="rounded-xl border-r-4 border-amber-400 bg-reader-surface p-3 text-sm text-reader-text"><span className="mb-1 block text-xs font-bold text-reader-accent">صفحة {highlight.page_number}</span>{highlight.selected_text}</article>)}</div> : <p className="text-xs text-reader-muted">حدّد نصاً من الصفحة ثم اضغط زر الإبراز لحفظه.</p>}</section>
          </div>
        </div>
      )}

      {noteOpen && (
        <div className="fixed inset-0 z-[700] flex items-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="إضافة ملاحظة">
          <div className="w-full max-w-md rounded-3xl border border-reader-border bg-reader-panel p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-reader-text">ملاحظة للصفحة {currentPage}</h2><button type="button" onClick={() => setNoteOpen(false)} className="rounded-lg p-2 text-reader-muted hover:bg-reader-surface"><X className="h-4 w-4" /></button></div>
            <textarea autoFocus value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="اكتب فكرتك أو ملخصك…" className="min-h-32 w-full rounded-xl border border-reader-border bg-reader-surface p-3 text-sm text-reader-text outline-none focus:border-reader-accent" />
            <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setNoteOpen(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-reader-muted">إلغاء</button><button type="button" onClick={saveNote} disabled={!noteText.trim()} className="rounded-xl bg-reader-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50">حفظ الملاحظة</button></div>
          </div>
        </div>
      )}

      {showSessionSummary && (
        <div className="fixed inset-0 z-[700] flex items-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="ملخص جلسة القراءة">
          <div className="w-full max-w-md rounded-3xl border border-reader-border bg-reader-panel p-6 text-center shadow-2xl">
            <BookOpen className="mx-auto mb-3 h-9 w-9 text-reader-accent" /><h2 className="text-lg font-extrabold text-reader-text">انتهت جلسة القراءة</h2>
            <div className="my-5 grid grid-cols-3 gap-2 text-sm"><div className="rounded-2xl bg-reader-surface p-3"><strong className="block text-lg text-reader-accent">{session.pagesVisited.length}</strong><span className="text-reader-muted">صفحات زُرت</span></div><div className="rounded-2xl bg-reader-surface p-3"><strong className="block text-lg text-reader-accent">{Math.max(1, Math.round(session.activeSeconds / 60))}</strong><span className="text-reader-muted">دقيقة قراءة</span></div><div className="rounded-2xl bg-reader-surface p-3"><strong className="block text-lg text-reader-accent">{currentBookProgress}%</strong><span className="text-reader-muted">تقدم الكتاب</span></div></div>
            <button type="button" onClick={() => navigate('/books')} className="w-full rounded-xl bg-reader-accent px-4 py-3 text-sm font-bold text-white">العودة إلى الكتب</button>
            <button type="button" onClick={() => setShowSessionSummary(false)} className="mt-3 text-sm font-bold text-reader-muted">متابعة القراءة</button>
          </div>
        </div>
      )}
      {annotationError && <div className="fixed bottom-4 left-4 z-[800] rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-xl" role="status">{annotationError}</div>}
    </AppShell>
  );
};
