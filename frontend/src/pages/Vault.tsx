import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, Lock, Loader2, Wallet, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { getGroupVault, settleVault, markFinePaid, FineVault } from '../api/fines';
import { getGroupDetails, Group } from '../api/groups';
import { Navbar } from '../components/Navbar';

export const VaultPage = () => {
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [settlementNote, setSettlementNote] = useState('');
  const [showSettleModal, setShowSettleModal] = useState(false);

  const { data: group } = useQuery<Group>({
    queryKey: ['group', activeGroupId],
    queryFn: () => getGroupDetails(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: vault, isLoading } = useQuery<FineVault>({
    queryKey: ['vault', activeGroupId],
    queryFn: () => getGroupVault(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const isOwner = Boolean(
    user?.id && (
      (group?.owner_id && group.owner_id.toLowerCase() === user.id.toLowerCase()) ||
      group?.members?.some((m) => m.user_id.toLowerCase() === user.id.toLowerCase() && m.role === 'owner')
    )
  );

  const markPaidMutation = useMutation({
    mutationFn: (fineId: string) => markFinePaid(fineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', activeGroupId] });
    },
  });

  const settleMutation = useMutation({
    mutationFn: (note: string) => settleVault(activeGroupId!, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', activeGroupId] });
      setShowSettleModal(false);
      setSettlementNote('');
    },
  });

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-3xl max-w-md border border-slate-800 space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">لم تنضم لأي مجموعة بعد</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl text-white"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 pb-20 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="glow-orb w-96 h-96 bg-amber-500/10 top-0 right-1/4 animate-pulse-subtle" />

      {/* Sticky Navbar Header */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Pot Card */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-3xl border border-amber-500/30 text-center relative overflow-hidden bg-gradient-to-b from-amber-950/20 via-slate-900/60 to-obsidian-950 shadow-2xl shadow-amber-950/20"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-center gap-2 text-slate-300 text-xs font-bold mb-2 uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-amber-400" />
            إجمالي حصيلة غرامات الغياب لهذا الشهر
          </div>

          <div className="text-5xl font-black gradient-text-gold my-3 tracking-tight">
            {vault?.total_amount || 0} <span className="text-lg font-bold text-amber-400">{group?.currency || 'EGP'}</span>
          </div>

          <div className="text-xs text-slate-400 mb-6">
            حالة الخزينة: {vault?.status === 'settled' ? <span className="text-emerald-400 font-extrabold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">تمت التسوية ✅</span> : <span className="text-amber-400 font-extrabold px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">مفتوحة للجمع 🔓</span>}
          </div>

          {isOwner && vault?.status === 'open' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowSettleModal(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 via-flame-500 to-amber-600 hover:from-amber-400 hover:to-flame-400 font-extrabold rounded-2xl text-white text-xs shadow-xl shadow-amber-950/50 transition-all mx-auto flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              تصفية الخزينة وتحديد وجهة الصرف
            </motion.button>
          )}

          {vault?.status === 'settled' && vault.settlement_note && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-slate-300 max-w-sm mx-auto shadow-inner leading-relaxed">
              <strong>ملاحظة التسوية:</strong> "{vault.settlement_note}"
            </div>
          )}
        </motion.section>

        {/* Fines List */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-3xl border border-slate-800/90 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
            <h2 className="font-extrabold text-base text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              سجل الغرامات المسجلة لهذا الشهر
            </h2>
            <span className="text-xs text-slate-400 font-mono">{vault?.fines?.length || 0} غرامة</span>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> جاري تحميل السجل...
            </div>
          ) : vault?.fines && vault.fines.length > 0 ? (
            <div className="space-y-3">
              {vault.fines.map((fine, idx) => (
                <motion.div
                  key={fine.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/20 transition-all"
                >
                  <div>
                    <div className="font-bold text-sm text-white">{fine.user?.name || 'عضو المجموعة'}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">تاريخ الغياب: {fine.fine_date}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-black font-mono text-amber-300 text-sm">
                      {fine.amount} {group?.currency || 'EGP'}
                    </span>

                    {fine.status === 'paid' ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> مدفوعة
                      </span>
                    ) : isOwner ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => markPaidMutation.mutate(fine.id)}
                        disabled={markPaidMutation.isPending}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-colors shadow-md"
                      >
                        تأكيد الدفع
                      </motion.button>
                    ) : (
                      <span className="px-3 py-1 bg-rose-500/10 text-rose-300 text-xs font-bold rounded-full border border-rose-500/20">
                        غير مدفوعة
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs font-semibold flex flex-col items-center gap-2">
              <Sparkles className="w-6 h-6 text-slate-600" />
              لا توجد غرامات مسجلة لهذه المجموعة هذا الشهر 🎉
            </div>
          )}
        </motion.section>
      </main>

      {/* Settle Modal */}
      <AnimatePresence>
        {showSettleModal && (
          <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700/80 space-y-4 shadow-2xl"
            >
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-white">تصفية خزينة الشهر 🔒</h3>
                <p className="text-slate-400 text-xs">
                  اكتب أين ستقوم المجموعة بصرف حصيلة الغرامات (عزومة، شراء كتب للمجموعة...).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">ملاحظة أو وجهة الصرف</label>
                <textarea
                  required
                  rows={3}
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  className="w-full p-3.5 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-amber-500 outline-none leading-relaxed"
                  placeholder="مثال: تم شراء 3 كتب كجوائز للمجموعة"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="w-1/2 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!settlementNote || settleMutation.isPending}
                  onClick={() => settleMutation.mutate(settlementNote)}
                  className="w-1/2 py-3 bg-gradient-to-r from-amber-500 to-flame-500 hover:from-amber-400 hover:to-flame-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 disabled:opacity-50"
                >
                  {settleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'تأكيد التصفية'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

