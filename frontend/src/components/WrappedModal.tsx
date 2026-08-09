import { useState } from 'react';
import { X, Sparkles, Share2, Award, Flame, BookOpen, CheckCircle, Check } from 'lucide-react';
import { MonthlySummary } from '../api/stats';

interface WrappedModalProps {
  summary: MonthlySummary;
  userName: string;
  onClose: () => void;
}

export function WrappedModal({ summary, userName, onClose }: WrappedModalProps) {
  const [copied, setCopied] = useState(false);
  const { stats } = summary;

  const monthFormatted = new Date(summary.month).toLocaleDateString('ar-EG', {
    month: 'long',
    year: 'numeric',
  });

  const shareText = `📚 حصادي في نادي القراءة (${monthFormatted}):
✨ نسبة الالتزام: ${stats.commitment_rate}%
📖 إجمالي الصفحات: ${stats.total_pages} صفحة
🔥 أطول سلسلة: ${stats.longest_streak} يوم متواصل!
#نادي_القراءة 🚀`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Decorative Glow background */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-full text-slate-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Sparkles size={14} className="text-amber-400" />
            <span>حصاد الشهر Wrapped 🎁</span>
          </div>
          <h2 className="text-2xl font-black text-white">{userName}</h2>
          <p className="text-xs text-slate-400 mt-1">{monthFormatted}</p>
        </div>

        {/* Highlight Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
            <CheckCircle className="text-emerald-400 mx-auto mb-1" size={24} />
            <p className="text-2xl font-black text-emerald-400">{stats.commitment_rate}%</p>
            <p className="text-xs text-slate-400 mt-0.5">نسبة الالتزام</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
            <BookOpen className="text-blue-400 mx-auto mb-1" size={24} />
            <p className="text-2xl font-black text-blue-400">{stats.total_pages}</p>
            <p className="text-xs text-slate-400 mt-0.5">صفحة مقروءة</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
            <Flame className="text-amber-400 mx-auto mb-1" size={24} />
            <p className="text-2xl font-black text-amber-400">{stats.longest_streak}</p>
            <p className="text-xs text-slate-400 mt-0.5">أطول سلسلة أيام</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
            <Award className="text-purple-400 mx-auto mb-1" size={24} />
            <p className="text-2xl font-black text-purple-400">{stats.total_checkins}</p>
            <p className="text-xs text-slate-400 mt-0.5">أيام القراءة الحضور</p>
          </div>
        </div>

        {/* Share / Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
        >
          {copied ? (
            <>
              <Check size={18} />
              <span>تم النسخ بنجاح! 🎉</span>
            </>
          ) : (
            <>
              <Share2 size={18} />
              <span>مشاركة الحصاد الشهرى 🚀</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
