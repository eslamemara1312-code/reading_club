import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, FolderOpen, RefreshCw, Trash2 } from 'lucide-react';
import { getBookAssetMetadata, deleteSharedBookAsset, BookAssetWithProgress } from '../../api/reader';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMetadata = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getBookAssetMetadata(groupId, bookId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, bookId]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const handleDelete = async () => {
    if (!window.confirm('هل أنت تأكد من حذف النسخة المشتركة لهذا الكتاب من المجموعة؟')) return;
    try {
      await deleteSharedBookAsset(groupId, bookId);
      showToast('تم حذف النسخة المشتركة بنجاح', 'success');
      fetchMetadata();
    } catch {
      showToast('حدث خطأ أثناء حذف النسخة المشتركة', 'error');
    }
  };

  const handleOpenLocalPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('يرجى اختيار ملف PDF فقط.', 'error');
        return;
      }
      // Store local file in window state or navigation location state
      navigate(`/groups/${groupId}/books/${bookId}/read`, {
        state: { localFile: file }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500 animate-pulse py-2">
        <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        جاري فحص توافر القراءة...
      </div>
    );
  }

  const hasAsset = data?.has_asset;
  const progress = data?.progress;
  const currentPage = progress?.current_page;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-800/80">
      <input
        type="file"
        ref={localFileInputRef}
        onChange={handleOpenLocalPdf}
        accept=".pdf,application/pdf"
        className="hidden"
      />

      {hasAsset ? (
        <>
          {/* Read Shared PDF Button */}
          <button
            onClick={() => navigate(`/groups/${groupId}/books/${bookId}/read`)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-md shadow-emerald-500/10"
          >
            <BookOpen className="w-4 h-4" />
            {currentPage && currentPage > 1
              ? `متابعة القراءة (صفحة ${currentPage})`
              : 'بدء قراءة الكتاب'}
          </button>

          {/* Replace Shared PDF */}
          <button
            onClick={() => {
              setIsReplacing(true);
              setIsUploadOpen(true);
            }}
            title="استبدال النسخة المشتركة"
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Delete Shared PDF */}
          <button
            onClick={handleDelete}
            title="حذف النسخة المشتركة"
            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      ) : (
        /* Upload Shared PDF */
        <button
          onClick={() => {
            setIsReplacing(false);
            setIsUploadOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
        >
          <Upload className="w-4 h-4" />
          رفع نسخة PDF للمجموعة
        </button>
      )}

      {/* Local PDF opening */}
      <button
        onClick={() => localFileInputRef.current?.click()}
        title="فتح ملف PDF محلياً من جهازك بدون رفعه"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/40 hover:bg-zinc-800 transition-all border border-zinc-800"
      >
        <FolderOpen className="w-4 h-4" />
        فتح ملف محلي
      </button>

      {/* Upload Modal */}
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
