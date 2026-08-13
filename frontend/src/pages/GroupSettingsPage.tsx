import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, ShieldAlert, Clock, DollarSign, Sparkles, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getGroupDetails } from '../api/groups';
import { updateGroupSettings } from '../api/stats';
import { AppShell } from '../components/layout/AppShell';

export function GroupSettingsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const groupId = activeGroupId || '';

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroupDetails(groupId),
    enabled: !!groupId,
  });

  const [fineAmount, setFineAmount] = useState<string>('20');
  const [deadlineTime, setDeadlineTime] = useState<string>('00:00');
  const [graceHours, setGraceHours] = useState<string>('3');
  const [funMode, setFunMode] = useState<boolean>(true);
  const [pageGoal, setPageGoal] = useState<string>('500');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (group) {
      setFineAmount(String(group.fine_amount ?? 20));
      setDeadlineTime(group.checkin_deadline_time || '00:00');
      setGraceHours(String(group.grace_period_hours ?? 3));
      setFunMode(group.fun_mode_enabled ?? true);
      setPageGoal(String(group.monthly_page_goal ?? 500));
    }
  }, [group]);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateGroupSettings>[1]) =>
      updateGroupSettings(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      setSuccessMsg('تم حفظ قواعد وإعدادات المجموعة بنجاح!');
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
      fine_amount: Number(fineAmount) || 0,
      checkin_deadline_time: deadlineTime,
      grace_period_hours: Number(graceHours) || 0,
      fun_mode_enabled: funMode,
      monthly_page_goal: Number(pageGoal) || 0,
    });
  };

  const isOwner = Boolean(
    user?.id && (
      (group?.owner_id && group.owner_id.toLowerCase() === user.id.toLowerCase()) ||
      group?.members?.some((m) => m.user_id.toLowerCase() === user.id.toLowerCase() && m.role === 'owner')
    )
  );

  return (
    <AppShell>
      <div className="space-y-8 sm:space-y-12 max-w-xl mx-auto">
        <div className="flex items-center gap-2.5 border-b border-reader-border pb-4">
          <Settings className="text-reader-accent" size={22} />
          <div>
            <h1 className="font-black text-2xl text-reader-text tracking-tight">إعدادات وقواعد المجموعة</h1>
            <p className="text-reader-muted text-xs mt-0.5 font-medium">{group?.name || 'النادي'}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-reader-muted text-xs">
            <Loader2 className="animate-spin text-reader-accent mb-2" size={28} />
            <p className="font-medium">جاري تحميل إعدادات المجموعة...</p>
          </div>
        ) : !isOwner ? (
          <div className="bg-reader-panel p-6 rounded-3xl border border-reader-borderStrong text-reader-accent text-center space-y-2 shadow-lg">
            <ShieldAlert className="mx-auto text-reader-accent" size={32} />
            <p className="font-bold text-base text-reader-text">تنبيه الصلاحيات الإدارية</p>
            <p className="text-xs text-reader-muted font-medium leading-relaxed">
              مؤسس وإداري المجموعة فقط هو من يحق له تعديل قيمة الغرامات، مواعيد الإغلاق، وهدف القراءة الجماعي.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {successMsg && (
              <div className="bg-reader-panel border border-reader-borderStrong text-reader-metric-limeText p-4 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-md">
                <CheckCircle2 size={16} className="text-reader-metric-limeText" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-reader-panel border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-md">
                <ShieldAlert size={16} className="text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Fine Amount */}
            <div className="bg-reader-panel p-5 rounded-3xl border border-reader-border space-y-2.5 shadow-md">
              <label className="flex items-center gap-2 font-bold text-xs text-reader-text">
                <DollarSign size={16} className="text-reader-accent" />
                قيمة غرامة اليوم الغائب (جنيه / EGP)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                className="w-full bg-reader-surface border border-reader-border rounded-xl px-4 py-3 text-reader-text text-xs font-mono focus:border-reader-accent outline-none"
              />
              <p className="text-[11px] text-reader-muted font-medium">
                المبلغ الذي يضاف لغرامات العضو فور تخطي الموعد المحدد بدون تسجيل القراءة اليومية.
              </p>
            </div>

            {/* Checkin Deadline & Grace Period */}
            <div className="bg-reader-panel p-5 rounded-3xl border border-reader-border space-y-4 shadow-md">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-xs text-reader-text">
                  <Clock size={16} className="text-reader-accent" />
                  موعد إغلاق التقرير اليومي
                </label>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full bg-reader-surface border border-reader-border rounded-xl px-4 py-3 text-reader-text text-xs font-mono focus:border-reader-accent outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-xs text-reader-text">
                  <Clock size={16} className="text-reader-accent" />
                  مهلة السماح الفجرية (بالساعات)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={graceHours}
                  onChange={(e) => setGraceHours(e.target.value)}
                  className="w-full bg-reader-surface border border-reader-border rounded-xl px-4 py-3 text-reader-text text-xs font-mono focus:border-reader-accent outline-none"
                />
                <p className="text-[11px] text-reader-muted font-medium">
                  ساعات إضافية لتسجيل القراءة كـ "متأخر" قبل احتساب الغياب رسمياً وتسجيل الغرامة.
                </p>
              </div>
            </div>

            {/* Monthly Page Goal */}
            <div className="bg-reader-panel p-5 rounded-3xl border border-reader-border space-y-2.5 shadow-md">
              <label className="flex items-center gap-2 font-bold text-xs text-reader-text">
                <Target size={16} className="text-reader-accent" />
                هدف الصفحات الشهرية الجماعية
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={pageGoal}
                onChange={(e) => setPageGoal(e.target.value)}
                className="w-full bg-reader-surface border border-reader-border rounded-xl px-4 py-3 text-reader-text text-xs font-mono focus:border-reader-accent outline-none"
              />
              <p className="text-[11px] text-reader-muted font-medium">
                مجموع الصفحات التي تسعى كافة أعضاء المجموعة لإنجازها شهرياً.
              </p>
            </div>

            {/* Fun Mode Toggle */}
            <div className="bg-reader-panel p-5 rounded-3xl border border-reader-border flex items-center justify-between shadow-md">
              <div>
                <label className="flex items-center gap-2 font-bold text-xs text-reader-text">
                  <Sparkles size={16} className="text-reader-accent" />
                  وضع التنافس والاحتفالات 🎮
                </label>
                <p className="text-[11px] text-reader-muted mt-1 leading-relaxed max-w-sm font-medium">
                  إظهار الألقاب الأسبوعية والتأثيرات الحماسية عند تسجيل القراءة وسجل الأوسمة.
                </p>
              </div>
              <input
                type="checkbox"
                checked={funMode}
                onChange={(e) => setFunMode(e.target.checked)}
                className="w-5 h-5 accent-reader-accent rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-black py-3.5 px-4 rounded-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-2 text-xs border border-reader-borderStrong disabled:opacity-50 shadow-lg"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin text-reader-accentForeground" />
                  <span>جاري حفظ الإعدادات...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>حفظ قواعد وإعدادات المجموعة</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
