import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Key, Loader2, Sparkles } from 'lucide-react';
import { createGroup, joinGroup } from '../api/groups';
import { useUIStore } from '../store/uiStore';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-obsidian-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="glow-orb w-96 h-96 bg-emerald-500/20 top-1/4 -right-20 animate-pulse-subtle" />
      <div className="glow-orb w-96 h-96 bg-amber-500/15 bottom-1/4 -left-20 animate-pulse-subtle" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg p-8 rounded-3xl glass-panel shadow-2xl border border-slate-800/80 relative z-10 backdrop-blur-xl"
      >
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3 shadow-glow-amber">
            <Sparkles className="w-4 h-4 text-amber-400" />
            خطوة واحدة للبدء
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">مرحباً بك في نادي القراءة</h1>
          <p className="text-slate-400 text-xs mt-1">أنشئ مجتمع قراءة خاص أو انضم لمجموعة أصحابك</p>
        </div>

        {/* Segmented Mode Control */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1.5 bg-obsidian-900/90 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`relative flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-xs transition-all ${
              mode === 'create'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            إنشاء مجموعة جديدة
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`relative flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-xs transition-all ${
              mode === 'join'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            الانضمام بكود الدعوة
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center leading-relaxed"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'create' ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المجموعة</label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-xs font-medium placeholder-slate-500 outline-none"
                    placeholder="مثال: نادي أبطال القراءة"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>قيمة الغرامة اليومية للغائب</span>
                    <span className="text-amber-400 text-[11px] font-normal">تودع بالخزينة عند التخلف</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-xs font-mono placeholder-slate-500 outline-none"
                    placeholder="20"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">كود الدعوة الخاص بالمجموعة</label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm tracking-widest text-center uppercase font-mono font-bold outline-none"
                    placeholder="X7K2P9"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 font-extrabold rounded-xl text-white text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : mode === 'create' ? (
              'إنشاء المجموعة والانطلاق'
            ) : (
              'الانضمام إلى المجموعة'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

