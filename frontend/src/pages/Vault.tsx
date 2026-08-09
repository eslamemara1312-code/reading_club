import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle2, Lock, Loader2, ArrowRight, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { getGroupVault, settleVault, markFinePaid, FineVault } from '../api/fines';
import { getGroupDetails, Group } from '../api/groups';

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

  const isOwner = group?.owner_id === user?.id;

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-2xl max-w-md border border-slate-800 space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">لم تنضم لأي مجموعة بعد</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-white"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                خزينة الغرامات (The Fine Vault)
              </h1>
              <p className="text-xs text-slate-400">{group?.name || 'Reading Club'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Pot Card */}
        <section className="glass-panel p-6 rounded-2xl border border-slate-800 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            إجمالي حصيلة غرامات الشهر
          </div>

          <div className="text-4xl font-extrabold text-amber-400 font-mono my-2">
            {vault?.total_amount || 0} {group?.currency || 'EGP'}
          </div>

          <div className="text-xs text-slate-400 mb-6">
            حالة الخزينة: {vault?.status === 'settled' ? <span className="text-emerald-400 font-bold">تمت التسوية ✅</span> : <span className="text-amber-400 font-bold">مفتوحة 🔓</span>}
          </div>

          {isOwner && vault?.status === 'open' && (
            <button
              onClick={() => setShowSettleModal(true)}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 font-semibold rounded-xl text-white text-sm shadow-lg shadow-amber-900/30 transition-all mx-auto flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              تسوية الخزينة وتصفيتها
            </button>
          )}

          {vault?.status === 'settled' && vault.settlement_note && (
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 max-w-sm mx-auto">
              ملاحظة التسوية: "{vault.settlement_note}"
            </div>
          )}
        </section>

        {/* Fines List */}
        <section className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-base text-white mb-4">سجل الغرامات المسجلة لهذا الشهر</h2>

          {isLoading ? (
            <div className="text-center py-6 text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل السجل...
            </div>
          ) : vault?.fines && vault.fines.length > 0 ? (
            <div className="space-y-3">
              {vault.fines.map((fine) => (
                <div
                  key={fine.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
                >
                  <div>
                    <div className="font-semibold text-sm text-white">{fine.user?.name || 'عضو'}</div>
                    <div className="text-xs text-slate-400 font-mono">تاريخ الغياب: {fine.fine_date}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold font-mono text-amber-400 text-sm">
                      {fine.amount} {group?.currency || 'EGP'}
                    </span>

                    {fine.status === 'paid' ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> مدفوعة
                      </span>
                    ) : isOwner ? (
                      <button
                        onClick={() => markPaidMutation.mutate(fine.id)}
                        disabled={markPaidMutation.isPending}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        تأكيد الدفع
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 text-xs rounded-full border border-rose-500/20">
                        معلقة
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              لا توجد غرامات مسجلة لهذه المجموعة هذا الشهر 🎉
            </div>
          )}
        </section>
      </main>

      {/* Settle Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white text-center">تصفية خزينة الشهر 🔒</h3>
            <p className="text-slate-400 text-xs text-center">
              اكتب أين ستقوم المجموعة بصرف حصيلة الغرامات (عزومة قهوة، شراء كتاب للمجموعة...).
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">ملاحظة التسوية</label>
              <textarea
                required
                rows={3}
                value={settlementNote}
                onChange={(e) => setSettlementNote(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder="مثال: تم شراء 3 كتب لهدايا المسابقة الجماعية"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-lg text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!settlementNote || settleMutation.isPending}
                onClick={() => settleMutation.mutate(settlementNote)}
                className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {settleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد التسوية'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
