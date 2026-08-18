import React, { useState, useRef } from 'react';
import { Upload, X, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { uploadSharedBookAsset } from '../../api/reader';
import { showToast } from '../Toast';

interface BookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  bookId: string;
  bookTitle: string;
  isReplacing?: boolean;
  onSuccess: () => void;
}

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const BookUploadModal: React.FC<BookUploadModalProps> = ({
  isOpen,
  onClose,
  groupId,
  bookId,
  bookTitle,
  isReplacing = false,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('يرجى اختيار ملف PDF فقط (صيغة .pdf).');
        setSelectedFile(null);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setErrorMsg(`حجم الملف كبير جداً (${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت). الحد الأقصى المسموح 50 ميجابايت.`);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setErrorMsg(null);
      await uploadSharedBookAsset(groupId, bookId, selectedFile);
      showToast(isReplacing ? 'تم استبدال النسخة المشتركة بنجاح' : 'تم رفع النسخة المشتركة بنجاح', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.';
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center">
      <div className="relative box-border w-full min-w-0 max-w-lg max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-right shadow-2xl sm:p-6">
        {/* Header */}
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="shrink-0 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="min-w-0 text-lg font-bold text-white sm:text-xl">
              {isReplacing ? 'استبدال النسخة المشتركة' : 'رفع نسخة PDF جديدة'}
            </h2>
            <div className="shrink-0 rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
          </div>
        </div>

        <p className="mb-4 min-w-0 text-sm text-zinc-400">
          الكتاب: <span className="font-medium text-white break-words">{bookTitle}</span>
        </p>

        {isReplacing && (
          <div className="mb-4 flex min-w-0 items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="mb-0.5 font-semibold">تنبيه عند استبدال الملف:</p>
              <p className="break-words leading-relaxed text-amber-400/90">
                استبدال ملف الكتاب سيؤدي إلى تصفير تقديم القراءة المحفوظ لكل أعضاء المجموعة لهذا الكتاب لأن أرقام الصفحات قد تختلف.
              </p>
            </div>
          </div>
        )}

        {/* File Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`box-border flex min-h-40 w-full min-w-0 max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-4 text-center transition-all sm:p-6 ${
            selectedFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-zinc-700 bg-zinc-800/40 hover:border-emerald-500/40 hover:bg-zinc-800/80'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-2">
              <FileText className="w-10 h-10 shrink-0 text-emerald-400" />
              <p className="w-full max-w-full truncate px-2 text-sm font-semibold text-white" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-xs text-zinc-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت
              </p>
              <span className="mt-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                انقر لتغيير الملف
              </span>
            </div>
          ) : (
            <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-2">
              <Upload className="w-10 h-10 shrink-0 text-zinc-500" />
              <p className="max-w-full break-words text-sm font-medium text-white">اختر ملف PDF من جهازك</p>
              <p className="text-xs text-zinc-400">الحد الأقصى للحجم: 50 ميجابايت</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 max-w-full break-words rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50 sm:w-auto"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {isReplacing ? 'تأكيد الاستبدال والرفع' : 'رفع الكتاب للمجموعة'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
