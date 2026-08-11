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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              {isReplacing ? 'استبدال النسخة المشتركة' : 'رفع نسخة PDF جديدة'}
            </h2>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
          </div>
        </div>

        <p className="text-sm text-zinc-400 mb-4">
          الكتاب: <span className="text-white font-medium">{bookTitle}</span>
        </p>

        {isReplacing && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-4">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">تنبيه عند استبدال الملف:</p>
              <p className="text-amber-400/90 leading-relaxed">
                استبدال ملف الكتاب سيؤدي إلى تصفير تقديم القراءة المحفوظ لكل أعضاء المجموعة لهذا الكتاب لأن أرقام الصفحات قد تختلف.
              </p>
            </div>
          </div>
        )}

        {/* File Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            selectedFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-zinc-700 hover:border-emerald-500/40 bg-zinc-800/40 hover:bg-zinc-800/80'
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
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-emerald-400" />
              <p className="font-semibold text-white text-sm">{selectedFile.name}</p>
              <p className="text-xs text-zinc-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت
              </p>
              <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full mt-1">
                انقر لتغيير الملف
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-zinc-500" />
              <p className="font-medium text-white text-sm">اختر ملف PDF من جهازك</p>
              <p className="text-xs text-zinc-400">الحد الأقصى للحجم: 50 ميجابايت</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-black font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
