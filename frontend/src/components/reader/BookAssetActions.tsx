import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FolderOpen, RefreshCw, Trash2, Upload } from 'lucide-react';
import {
  BookAssetWithProgress,
  deleteSharedBookAsset,
  getBookAssetMetadata,
} from '../../api/reader';
import {
  getSavedLocalBook,
  saveLocalBookFile,
  SavedLocalBook,
} from '../../storage/localReaderStorage';
import { BookUploadModal } from './BookUploadModal';
import { showToast } from '../Toast';

interface BookAssetActionsProps {
  groupId: string;
  bookId: string;
  bookTitle: string;
}

export const BookAssetActions: React.FC<BookAssetActionsProps> = ({
  groupId,
  bookId,
  bookTitle,
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<BookAssetWithProgress | null>(null);
  const [savedLocalBook, setSavedLocalBook] = useState<SavedLocalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMetadata = useCallback(async () => {
    try {
      setIsLoading(true);
      setData(await getBookAssetMetadata(groupId, bookId));
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, bookId]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    let cancelled = false;
    getSavedLocalBook(groupId, bookId)
      .then((savedBook) => {
        if (!cancelled) setSavedLocalBook(savedBook);
      })
      .catch(() => {
        if (!cancelled) setSavedLocalBook(null);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, bookId]);

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف النسخة المشتركة لهذا الكتاب من المجموعة؟')) return;

    try {
      await deleteSharedBookAsset(groupId, bookId);
      showToast('تم حذف النسخة المشتركة بنجاح', 'success');
      fetchMetadata();
    } catch {
      showToast('حدث خطأ أثناء حذف النسخة المشتركة', 'error');
    }
  };

  const handleOpenLocalPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('يرجى اختيار ملف PDF فقط.', 'error');
      event.target.value = '';
      return;
    }

    try {
      setIsSavingLocal(true);
      const savedBook = await saveLocalBookFile(groupId, bookId, file);
      setSavedLocalBook(savedBook);
      navigate(`/groups/${groupId}/books/${bookId}/read?source=local`, {
        state: { localFile: savedBook.file },
      });
    } catch {
      showToast('تعذر حفظ الملف على هذا الجهاز. تأكد من وجود مساحة تخزين كافية.', 'error');
    } finally {
      setIsSavingLocal(false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-zinc-500 animate-pulse">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        جاري فحص توافر القراءة...
      </div>
    );
  }

  const hasAsset = data?.has_asset;
  const sharedCurrentPage = data?.progress?.current_page;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-3">
      <input
        ref={localFileInputRef}
        type="file"
        onChange={handleOpenLocalPdf}
        accept=".pdf,application/pdf"
        className="hidden"
      />

      {hasAsset ? (
        <>
          <button
            onClick={() => navigate(`/groups/${groupId}/books/${bookId}/read`)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-black shadow-md shadow-emerald-500/10 transition-all hover:bg-emerald-400"
          >
            <BookOpen className="h-4 w-4" />
            {sharedCurrentPage && sharedCurrentPage > 1
              ? `متابعة النسخة المشتركة (صفحة ${sharedCurrentPage})`
              : 'قراءة النسخة المشتركة'}
          </button>

          <button
            onClick={() => {
              setIsReplacing(true);
              setIsUploadOpen(true);
            }}
            title="استبدال النسخة المشتركة"
            className="rounded-xl bg-zinc-800/60 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={handleDelete}
            title="حذف النسخة المشتركة"
            className="rounded-xl bg-zinc-800/60 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            setIsReplacing(false);
            setIsUploadOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
        >
          <Upload className="h-4 w-4" />
          رفع نسخة PDF للمجموعة
        </button>
      )}

      {savedLocalBook && (
        <button
          onClick={() => navigate(`/groups/${groupId}/books/${bookId}/read?source=local`)}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-black shadow-md shadow-amber-500/10 transition-all hover:bg-amber-400"
        >
          <BookOpen className="h-4 w-4" />
          {savedLocalBook.currentPage > 1
            ? `متابعة الملف المحلي (صفحة ${savedLocalBook.currentPage})`
            : 'قراءة الملف المحلي المحفوظ'}
        </button>
      )}

      <button
        onClick={() => localFileInputRef.current?.click()}
        disabled={isSavingLocal}
        title="حفظ ملف PDF محلياً على هذا الجهاز"
        className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-800/40 px-3 py-2 text-xs font-medium text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50"
      >
        <FolderOpen className="h-4 w-4" />
        {isSavingLocal
          ? 'جاري حفظ الملف...'
          : savedLocalBook
            ? 'استبدال الملف المحلي'
            : 'فتح ملف محلي وحفظه'}
      </button>

      <BookUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        groupId={groupId}
        bookId={bookId}
        bookTitle={bookTitle}
        isReplacing={isReplacing}
        onSuccess={fetchMetadata}
      />
    </div>
  );
};
