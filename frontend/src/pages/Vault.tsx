import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, Lock, Loader2, Wallet, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { getGroupVault, settleVault, markFinePaid, FineVault } from '../api/fines';
import { getGroupDetails, Group } from '../api/groups';
import { AppShell } from '../components/layout/AppShell';

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
      <div className="min-h-screen bg-reader-canvas text-reader-text flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-reader-panel p-8 rounded-3xl max-w-md border border-reader-border space-y-4 shadow-2xl">
          <ShieldAlert className="w-10 h-10 text-reader-accent mx-auto" />
          <h2 className="text-xl font-bold text-reader-text">لم تنضم لأي مجموعة بعد</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-reader-accent hover:bg-reader-accentHover font-black rounded-2xl text-reader-accentForeground text-xs transition-colors"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 sm:space-y-12 max-w-4xl mx-auto">
        {/* Pot Card Section */}
        <section className="bg-reader-panel p-8 rounded-3xl border border-reader-border text-center space-y-4 shadow-xl">
          <div className="flex items-center justify-center gap-2 text-reader-muted text-xs font-bold uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-reader-accent" />
            حصيلة صندوق النادي الجماعي
          </div>

          <div className="text-4xl sm:text-5xl font-black text-reader-accent font-mono tracking-tight">
            {vault?.total_amount || 0} <span className="text-base font-bold text-reader-text font-sans">{group?.currency || 'EGP'}</span>
          </div>

          <div className="text-xs text-reader-muted font-medium">
            حالة الصندوق: {vault?.status === 'settled' ? (
              <span className="text-reader-metric-limeText font-bold px-3 py-1 bg-reader-surface rounded-lg border border-reader-border">
                تمت التسوية بنجاح ✅
              </span>
            ) : (
              <span className="text-reader-metric-goldText font-bold px-3 py-1 bg-reader-surface rounded-lg border border-reader-border">
                مفتوح لتجميع الغرامات 🔓
              </span>
            )}
          </div>

          {isOwner && vault?.status === 'open' && (
            <button
              onClick={() => setShowSettleModal(true)}
              className="px-6 py-3 bg-reader-accent hover:bg-reader-accentHover font-black rounded-2xl text-reader-accentForeground text-xs transition-all active:scale-[0.97] mx-auto flex items-center justify-center gap-2 shadow-lg"
            >
              <Lock className="w-4 h-4" />
              تصفية الصندوق وتحديد أوجه الصرف الجماعي
            </button>
          )}

          {vault?.status === 'settled' && vault.settlement_note && (
            <div className="p-4 bg-reader-surface rounded-2xl border border-reader-border text-xs text-reader-text max-w-sm mx-auto leading-relaxed font-medium">
              <strong className="text-reader-accent block mb-1">ملاحظة التسوية:</strong> "{vault.settlement_note}"
            </div>
          )}
        </section>

        {/* Fines Log Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-reader-border pb-4">
            <h2 className="font-bold text-base text-reader-text flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-reader-accent" />
              سجل الغرامات المسجلة لهذا الشهر
            </h2>
            <span className="text-xs text-reader-muted font-mono">
              {vault?.fines?.length || 0} غرامة
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-reader-muted text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-reader-accent" /> جاري تحميل سجل الغرامات...
            </div>
          ) : vault?.fines && vault.fines.length > 0 ? (
            <div className="divide-y divide-reader-border">
              {vault.fines.map((fine) => (
                <div
                  key={fine.id}
                  className="py-3.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-reader-text">{fine.user?.name || 'عضو المجموعة'}</div>
                    <div className="text-[11px] text-reader-muted font-mono mt-0.5">تاريخ الغياب: {fine.fine_date}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold font-mono text-reader-accent">
                      {fine.amount} {group?.currency || 'EGP'}
                    </span>

                    {fine.status === 'paid' ? (
                      <span className="text-reader-metric-limeText font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> مدفوعة
                      </span>
                    ) : isOwner ? (
                      <button
                        onClick={() => markPaidMutation.mutate(fine.id)}
                        disabled={markPaidMutation.isPending}
                        className="px-3 py-1 bg-reader-surface hover:bg-reader-hover text-reader-metric-limeText border border-reader-border text-xs font-bold rounded-lg transition-colors"
                      >
                        تأكيد الدفع
                      </button>
                    ) : (
                      <span className="text-red-400 font-bold text-[11px]">
                        غير مدفوعة
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-reader-muted text-xs font-medium flex flex-col items-center gap-2">
              <Sparkles className="w-6 h-6 text-reader-accent" />
              <p className="font-bold text-reader-text">لا توجد غرامات مسجلة لهذه المجموعة هذا الشهر 🎉</p>
              <p className="text-reader-muted">التزام ممتاز يعكس شغف ومثابرة كافة الأعضاء!</p>
            </div>
          )}
        </section>
      </div>

      {/* Settle Modal */}
      <AnimatePresence>
        {showSettleModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-reader-panel p-6 rounded-3xl max-w-md w-full border border-reader-border space-y-4 shadow-2xl"
            >
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-reader-text">تصفية حصيلة الشهر 🔒</h3>
                <p className="text-reader-muted text-xs">
                  حدد أوجه صرف حصيلة صندوق الغرامات لصالح الأعضاء.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-reader-muted mb-1.5">ملاحظة أو وجهة الصرف</label>
                <textarea
                  required
                  rows={3}
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  className="w-full p-3.5 bg-reader-surface border border-reader-border rounded-xl text-reader-text text-xs focus:border-reader-accent outline-none leading-relaxed"
                  placeholder="مثال: شراء جوائز وتوزيعها على الأعضاء الملتزمين"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="w-1/2 py-2.5 bg-reader-surface text-reader-muted font-semibold rounded-xl text-xs border border-reader-border"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!settlementNote || settleMutation.isPending}
                  onClick={() => settleMutation.mutate(settlementNote)}
                  className="w-1/2 py-2.5 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-black rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {settleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد التصفية'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};
