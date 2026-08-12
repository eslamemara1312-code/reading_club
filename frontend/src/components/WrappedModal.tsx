import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Share2, Award, Flame, BookOpen, CheckCircle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { MonthlySummary } from '../api/stats';

interface WrappedModalProps {
  summary: MonthlySummary;
  userName: string;
  onClose: () => void;
}

export function WrappedModal({ summary, userName, onClose }: WrappedModalProps) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { stats } = summary;

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.gsap-stat-card');
    
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.12,
        ease: 'back.out(1.7)',
        delay: 0.2,
      }
    );
  }, { scope: containerRef });

  const monthFormatted = new Date(summary.month).toLocaleDateString('ar-EG', {
    month: 'long',
    year: 'numeric',
  });

  const shareText = `حصادي في نادي القراءة (${monthFormatted}):
نسبة الالتزام: ${stats.commitment_rate}%
إجمالي الصفحات: ${stats.total_pages} صفحة
أطول حماسة: ${stats.longest_streak} يوم متواصل!
#نادي_القراءة`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-reader-panel border border-reader-border rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-reader-surface hover:bg-reader-hover rounded-full text-reader-muted hover:text-reader-text transition"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-6 pt-2">
            <div className="inline-flex items-center gap-1.5 bg-reader-surface border border-reader-borderStrong text-reader-accent text-xs font-bold px-3.5 py-1 rounded-full mb-3 shadow-sm">
              <Sparkles size={14} className="text-reader-accent animate-spin" />
              <span>حصاد الشهر</span>
            </div>
            <h2 className="text-2xl font-black text-reader-text">{userName}</h2>
            <p className="text-xs text-reader-muted mt-1">{monthFormatted}</p>
          </div>

          {/* Highlight Stats Grid */}
          <div ref={containerRef} className="grid grid-cols-2 gap-3 mb-6">
            <div className="gsap-stat-card bg-reader-surface rounded-2xl p-4 text-center border border-reader-border">
              <CheckCircle className="text-reader-metric-limeText mx-auto mb-1" size={24} />
              <p className="text-2xl font-black text-reader-metric-limeText">{stats.commitment_rate}%</p>
              <p className="text-xs text-reader-muted mt-0.5">نسبة الالتزام</p>
            </div>

            <div className="gsap-stat-card bg-reader-surface rounded-2xl p-4 text-center border border-reader-border">
              <BookOpen className="text-reader-metric-skyText mx-auto mb-1" size={24} />
              <p className="text-2xl font-black text-reader-metric-skyText">{stats.total_pages}</p>
              <p className="text-xs text-reader-muted mt-0.5">صفحة مقروءة</p>
            </div>

            <div className="gsap-stat-card bg-reader-surface rounded-2xl p-4 text-center border border-reader-border">
              <Flame className="text-reader-metric-coralText mx-auto mb-1" size={24} />
              <p className="text-2xl font-black text-reader-metric-coralText">{stats.longest_streak}</p>
              <p className="text-xs text-reader-muted mt-0.5">أطول حماسة</p>
            </div>

            <div className="gsap-stat-card bg-reader-surface rounded-2xl p-4 text-center border border-reader-border">
              <Award className="text-reader-metric-violetText mx-auto mb-1" size={24} />
              <p className="text-2xl font-black text-reader-metric-violetText">{stats.total_checkins}</p>
              <p className="text-xs text-reader-muted mt-0.5">أيام القراءة</p>
            </div>
          </div>

          {/* Share / Copy Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCopy}
            className="w-full bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-bold py-3.5 px-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-sm border border-reader-borderStrong"
          >
            {copied ? (
              <>
                <Check size={18} />
                <span>تم النسخ بنجاح!</span>
              </>
            ) : (
              <>
                <Share2 size={18} />
                <span>مشاركة الحصاد الشهري</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
