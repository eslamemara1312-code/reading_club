import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Key, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { createGroup, joinGroup } from '../api/groups';
import { useUIStore } from '../store/uiStore';
import { ThemeToggle } from '../components/layout/ThemeToggle';

export const Onboarding = () => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [fineAmount, setFineAmount] = useState('20');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const setActiveGroupId = useUIStore((state) => state.setActiveGroupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'create') {
        const amount = parseFloat(fineAmount) || 20;
        const group = await createGroup({ name: groupName, fine_amount: amount });
        setActiveGroupId(group.id);
      } else {
        const group = await joinGroup(inviteCode);
        setActiveGroupId(group.id);
      }
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'حدث خطأ أثناء معالجة الطلب. تحقق وحاول مرة أخرى.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-reader-canvas text-reader-text dir-rtl font-sans transition-colors duration-300 relative">
      <div className="absolute top-4 left-4 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg p-8 rounded-3xl bg-reader-panel border border-reader-border relative z-10 space-y-6 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-reader-surface border border-reader-borderStrong text-reader-accent flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-reader-text tracking-tight">مرحباً بك في نادي القراءة</h1>
          <p className="text-reader-muted text-xs font-medium">أنشئ مجتمع قراءة خاص بك أو انضم لرفاقك بكود الدعوة</p>
        </div>

        {/* Segmented Mode Control */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-reader-surface rounded-2xl border border-reader-border shadow-inner">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-colors ${
              mode === 'create'
                ? 'bg-reader-panel text-reader-accent border border-reader-borderStrong shadow-sm'
                : 'text-reader-muted hover:text-reader-text'
            }`}
          >
            <Users className="w-4 h-4" />
            إنشاء مجموعة جديدة
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-colors ${
              mode === 'join'
                ? 'bg-reader-panel text-reader-accent border border-reader-borderStrong shadow-sm'
                : 'text-reader-muted hover:text-reader-text'
            }`}
          >
            <Key className="w-4 h-4" />
            الانضمام بكود الدعوة
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'create' ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-reader-muted mb-1.5">اسم المجموعة أو النادي</label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-medium outline-none focus:border-reader-accent"
                    placeholder="مثال: أبطال القراءة اليومية 📚"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-reader-muted mb-1.5 flex items-center justify-between">
                    <span>قيمة الغرامة اليومية عند التخلف (EGP)</span>
                    <span className="text-reader-accent text-[11px] font-medium">تودع بالخزينة عند التخلف</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-mono outline-none focus:border-reader-accent"
                    placeholder="20"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-reader-muted mb-1.5">كود الدعوة الخاص بالمجموعة</label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-mono tracking-widest text-center uppercase outline-none focus:border-reader-accent"
                    placeholder="مثال: ABC123XYZ"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.97] border border-reader-borderStrong disabled:opacity-50 mt-4 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-reader-accentForeground" />
                <span>جاري معالجة الطلب...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{mode === 'create' ? 'إنشاء البدء فوراً' : 'الانضمام للمجموعة'}</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
