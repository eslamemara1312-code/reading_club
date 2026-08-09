import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Settings, Save, ShieldAlert, Clock, DollarSign, Sparkles, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getGroupDetails } from '../api/groups';
import { updateGroupSettings } from '../api/stats';

export function GroupSettingsPage() {
  const navigate = useNavigate();
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

  const isOwner = group?.owner_id === user?.id;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Settings className="text-emerald-400" size={20} />
          <h1 className="font-bold text-base">إعدادات المجموعة</h1>
        </div>
        <div className="w-9" />
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>جاري تحميل البيانات...</p>
          </div>
        ) : !isOwner ? (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-xl text-center">
            <ShieldAlert className="mx-auto mb-2" size={32} />
            <p className="font-bold">تنبيه صلاحيات</p>
            <p className="text-sm text-slate-300 mt-1">
              مؤسس المجموعة فقط هو من يملك صلاحية تعديل هذه الإعدادات.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                <ShieldAlert size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Fine Amount */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-sm text-emerald-400">
                <DollarSign size={18} />
                قيمة غرامة اليوم الغائب (جنيه)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={fineAmount}
                onChange={(e) => setFineAmount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-slate-400">
                المبلغ الذي يدخل خزينة المجموعة عند تخطي مهلة القراءة اليومية.
              </p>
            </div>

            {/* Checkin Deadline & Grace Period */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-sm text-emerald-400">
                  <Clock size={18} />
                  موعد إغلاق اليوم (التوقيت)
                </label>
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-sm text-emerald-400">
                  <Clock size={18} />
                  ساعات السماح بعد منتصف الليل
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={graceHours}
                  onChange={(e) => setGraceHours(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-400">
                  ساعات إضافية لتسجيل القراءة كـ "متأخر" قبل احتساب الغياب رسمياً.
                </p>
              </div>
            </div>

            {/* Monthly Page Goal */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-sm text-emerald-400">
                <Target size={18} />
                هدف الصفحات الشهرية للمجموعة
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={pageGoal}
                onChange={(e) => setPageGoal(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-slate-400">
                مجموع الصفحات التي تسعى المجموعة ككل لقراءتها شهرياً.
              </p>
            </div>

            {/* Fun Mode Toggle */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="flex items-center gap-2 font-semibold text-sm text-emerald-400">
                  <Sparkles size={18} />
                  تفعيل وضع الاحتفال (Fun Mode)
                </label>
                <p className="text-xs text-slate-400 mt-1">
                  إظهار المؤثرات والألقاب الأسبوعية وألعاب الأوسمة.
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
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>حفظ التغييرات</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
