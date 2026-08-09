import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, Save, ShieldAlert, Clock, DollarSign, Sparkles, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getGroupDetails } from '../api/groups';
import { updateGroupSettings } from '../api/stats';
import { Navbar } from '../components/Navbar';

export function GroupSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const groupId = localStorage.getItem('activeGroupId') || '';

  const { data: group, isLoading } = useQuery({
    queryKey: ['groupDetails', groupId],
    queryFn: () => getGroupDetails(groupId),
    enabled: !!groupId,
  });

  const [fineAmount, setFineAmount] = useState<number>(20);
  const [deadlineTime, setDeadlineTime] = useState<string>('00:00');
  const [graceHours, setGraceHours] = useState<number>(3);
  const [funMode, setFunMode] = useState<boolean>(true);
  const [pageGoal, setPageGoal] = useState<number>(500);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (group) {
      setFineAmount(group.fine_amount ?? 20);
      setDeadlineTime(group.checkin_deadline_time || '00:00');
      setGraceHours(group.grace_period_hours ?? 3);
      setFunMode(group.fun_mode_enabled ?? true);
      setPageGoal(group.monthly_page_goal ?? 500);
    }
  }, [group]);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateGroupSettings>[1]) =>
      updateGroupSettings(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      setSuccessMsg('تم حفظ الإعدادات بنجاح!');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'حدث خطأ أثناء حفظ الإعدادات');
      setSuccessMsg('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      fine_amount: fineAmount,
      checkin_deadline_time: deadlineTime,
      grace_period_hours: graceHours,
      fun_mode_enabled: funMode,
      monthly_page_goal: pageGoal,
    });
  };

  const isOwner = Boolean(
    user?.id && (
      (group?.owner_id && group.owner_id.toLowerCase() === user.id.toLowerCase()) ||
      group?.members?.some((m) => m.user_id.toLowerCase() === user.id.toLowerCase() && m.role === 'owner')
    )
  );

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 pb-32 lg:pb-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="glow-orb w-96 h-96 bg-emerald-500/10 top-0 right-1/4 animate-pulse-subtle" />

      {/* Sticky Navbar */}
      <Navbar />

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings className="text-emerald-400" size={22} />
          <h1 className="font-extrabold text-lg text-white">إعدادات وقواعد المجموعة</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <Loader2 className="animate-spin text-emerald-400 mb-2" size={32} />
            <p>جاري تحميل الإعدادات...</p>
          </div>
        ) : !isOwner ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-3xl border border-amber-500/30 text-amber-400 text-center space-y-2 shadow-xl"
          >
            <ShieldAlert className="mx-auto text-amber-400" size={36} />
            <p className="font-extrabold text-base text-white">تنبيه الصلاحيات</p>
            <p className="text-xs text-slate-300">
              مؤسس وإداري المجموعة فقط هو من يحق له تعديل غرامات ومواعيد القراءة.
            </p>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-5"
          >
            {successMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-md">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-md">
                <ShieldAlert size={18} className="text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Fine Amount */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800/90 space-y-2.5">
              <label className="flex items-center gap-2 font-extrabold text-xs text-emerald-400">
                <DollarSign size={18} />
                قيمة غرامة اليوم الغائب (جنيه / EGP)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={fineAmount}
                onChange={(e) => setFineAmount(Number(e.target.value))}
                className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-emerald-500 outline-none"
              />
              <p className="text-[11px] text-slate-400">
                المبلغ الذي يضاف لخزينة المجموعة فور تخطي اليوم المحدد بدون تسجيل قراءة.
              </p>
            </div>

            {/* Checkin Deadline & Grace Period */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800/90 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-extrabold text-xs text-emerald-400">
                  <Clock size={18} />
                  موعد إغلاق التقرير اليومي
                </label>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-extrabold text-xs text-emerald-400">
                  <Clock size={18} />
                  مهلة السماح الفجرية (بالساعات)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={graceHours}
                  onChange={(e) => setGraceHours(Number(e.target.value))}
                  className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-emerald-500 outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  ساعات إضافية لتسجيل القراءة كـ "متأخر" قبل احتساب الغياب رسمياً وتسجيل الغرامة.
                </p>
              </div>
            </div>

            {/* Monthly Page Goal */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800/90 space-y-2.5">
              <label className="flex items-center gap-2 font-extrabold text-xs text-emerald-400">
                <Target size={18} />
                هدف الصفحات الشهرية الجماعية
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={pageGoal}
                onChange={(e) => setPageGoal(Number(e.target.value))}
                className="w-full bg-obsidian-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-emerald-500 outline-none"
              />
              <p className="text-[11px] text-slate-400">
                مجموع الصفحات التي تسعى كافة أعضاء المجموعة لإنجازها شهرياً.
              </p>
            </div>

            {/* Fun Mode Toggle */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800/90 flex items-center justify-between">
              <div>
                <label className="flex items-center gap-2 font-extrabold text-xs text-emerald-400">
                  <Sparkles size={18} />
                  وضع التنافس والاحتفالات (Fun Mode)
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  إظهار ألعاب الألقاب الأسبوعية، احتفالات الكونفيتي وسجل الأوسمة.
                </p>
              </div>
              <input
                type="checkbox"
                checked={funMode}
                onChange={(e) => setFunMode(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold py-3.5 px-4 rounded-2xl transition shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 text-xs"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>جاري حفظ الإعدادات...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>حفظ قواعد وإعدادات المجموعة</span>
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </main>
    </div>
  );
}

