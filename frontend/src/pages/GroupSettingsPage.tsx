/*
===============================================================================
 خريطة الوظائف المحفوظة (Preserved Functionality Map) — GroupSettingsPage.tsx
===============================================================================
1. State Store & Router:
   - queryClient: useQueryClient()
   - user: useAuthStore((state) => state.user)
   - activeGroupId: useUIStore((state) => state.activeGroupId)
   - fineAmount, deadlineTime, graceHours, funMode, pageGoal, successMsg, errorMsg

2. Queries:
   - group: getGroupDetails(groupId) [Key: 'groupDetails', groupId]

3. Computed Values & Permissions:
   - isOwner: checks if user.id matches group.owner_id or has 'owner' role in group.members

4. Mutations:
   - mutation: updateGroupSettings(groupId, data)
   - handleSubmit: triggers mutation with number conversions for inputs
===============================================================================
*/

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, ShieldAlert, Clock, DollarSign, Sparkles, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getGroupDetails } from '../api/groups';
import { updateGroupSettings } from '../api/stats';
import { Navbar } from '../components/Navbar';

export function GroupSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const groupId = activeGroupId || '';

  const { data: group, isLoading } = useQuery({
    queryKey: ['groupDetails', groupId],
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
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
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
    <div className="min-h-screen bg-apple-bg text-apple-text pb-32 lg:pb-16 relative dir-rtl font-sans transition-colors duration-300">
      {/* Quiet Header Navbar */}
      <Navbar />

      <main className="max-w-xl mx-auto px-4 sm:px-8 pt-8 space-y-8 relative z-10">
        <div className="flex items-center gap-2.5 border-b border-apple-border pb-4">
          <Settings className="text-apple-gold" size={22} />
          <div>
            <h1 className="font-black text-2xl text-apple-text tracking-tight">إعدادات وقواعد المجموعة</h1>
            <p className="text-apple-muted text-xs mt-0.5 font-medium">{group?.name || 'النادي'}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-apple-muted text-xs">
            <Loader2 className="animate-spin text-apple-gold mb-2" size={28} />
            <p className="font-medium">جاري تحميل إعدادات المجموعة...</p>
          </div>
        ) : !isOwner ? (
          <div className="bg-apple-surface p-6 rounded-2xl border border-apple-gold/30 text-apple-gold text-center space-y-2 shadow-lg">
            <ShieldAlert className="mx-auto text-apple-gold" size={32} />
            <p className="font-bold text-base text-apple-text">تنبيه الصلاحيات الإدارية</p>
            <p className="text-xs text-apple-secondary font-medium leading-relaxed">
              مؤسس وإداري المجموعة فقط هو من يحق له تعديل قيمة الغرامات، مواعيد الإغلاق، وهدف القراءة الجماعي.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {successMsg && (
              <div className="bg-apple-green/15 border border-apple-green/30 text-apple-green p-4 rounded-xl flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 size={16} className="text-apple-green" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-apple-red/15 border border-apple-red/30 text-apple-red p-4 rounded-xl flex items-center gap-2 text-xs font-bold">
                <ShieldAlert size={16} className="text-apple-red" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Fine Amount */}
            <div className="bg-apple-surface p-5 rounded-2xl border border-apple-border space-y-2.5 shadow-md">
              <label className="flex items-center gap-2 font-bold text-xs text-apple-text">
                <DollarSign size={16} className="text-apple-gold" />
                قيمة غرامة اليوم الغائب (جنيه / EGP)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                className="w-full bg-apple-bg border border-apple-border rounded-xl px-4 py-3 text-apple-text text-xs font-mono focus:border-apple-gold outline-none"
              />
              <p className="text-[11px] text-apple-muted font-medium">
                المبلغ الذي يضاف لغرامات العضو فور تخطي الموعد المحدد بدون تسجيل القراءة اليومية.
              </p>
            </div>

            {/* Checkin Deadline & Grace Period */}
            <div className="bg-apple-surface p-5 rounded-2xl border border-apple-border space-y-4 shadow-md">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-xs text-apple-text">
                  <Clock size={16} className="text-apple-gold" />
                  موعد إغلاق التقرير اليومي
                </label>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full bg-apple-bg border border-apple-border rounded-xl px-4 py-3 text-apple-text text-xs font-mono focus:border-apple-gold outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-xs text-apple-text">
                  <Clock size={16} className="text-apple-gold" />
                  مهلة السماح الفجرية (بالساعات)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={graceHours}
                  onChange={(e) => setGraceHours(e.target.value)}
                  className="w-full bg-apple-bg border border-apple-border rounded-xl px-4 py-3 text-apple-text text-xs font-mono focus:border-apple-gold outline-none"
                />
                <p className="text-[11px] text-apple-muted font-medium">
                  ساعات إضافية لتسجيل القراءة كـ "متأخر" قبل احتساب الغياب رسمياً وتسجيل الغرامة.
                </p>
              </div>
            </div>

            {/* Monthly Page Goal */}
            <div className="bg-apple-surface p-5 rounded-2xl border border-apple-border space-y-2.5 shadow-md">
              <label className="flex items-center gap-2 font-bold text-xs text-apple-text">
                <Target size={16} className="text-apple-gold" />
                هدف الصفحات الشهرية الجماعية
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={pageGoal}
                onChange={(e) => setPageGoal(e.target.value)}
                className="w-full bg-apple-bg border border-apple-border rounded-xl px-4 py-3 text-apple-text text-xs font-mono focus:border-apple-gold outline-none"
              />
              <p className="text-[11px] text-apple-muted font-medium">
                مجموع الصفحات التي تسعى كافة أعضاء المجموعة لإنجازها شهرياً.
              </p>
            </div>

            {/* Fun Mode Toggle */}
            <div className="bg-apple-surface p-5 rounded-2xl border border-apple-border flex items-center justify-between shadow-md">
              <div>
                <label className="flex items-center gap-2 font-bold text-xs text-apple-text">
                  <Sparkles size={16} className="text-apple-gold" />
                  وضع التنافس والاحتفالات 🎮
                </label>
                <p className="text-[11px] text-apple-muted mt-1 leading-relaxed max-w-sm font-medium">
                  إظهار الألقاب الأسبوعية والتأثيرات الحماسية عند تسجيل القراءة وسجل الأوسمة.
                </p>
              </div>
              <input
                type="checkbox"
                checked={funMode}
                onChange={(e) => setFunMode(e.target.checked)}
                className="w-5 h-5 accent-apple-gold rounded cursor-pointer"
              />
            </div>

            {/* SINGLE SOLID ACCENT FILL BUTTON ON THIS PAGE */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-apple-gold hover:opacity-90 text-black font-black py-3.5 px-4 rounded-xl transition-all active:scale-[0.97] flex items-center justify-center gap-2 text-xs border border-apple-gold/40 disabled:opacity-50 shadow-lg"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" />
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
      </main>
    </div>
  );
}
