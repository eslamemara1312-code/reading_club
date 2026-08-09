import { useQuery } from '@tanstack/react-query';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { getGroupCalendar, MonthCalendarResponse } from '../api/calendar';
import { getGroupDetails, Group } from '../api/groups';
import { CalendarGrid } from '../components/CalendarGrid';

export const CalendarPage = () => {
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const navigate = useNavigate();

  const { data: group } = useQuery<Group>({
    queryKey: ['group', activeGroupId],
    queryFn: () => getGroupDetails(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: calendarData, isLoading } = useQuery<MonthCalendarResponse>({
    queryKey: ['calendar', activeGroupId],
    queryFn: () => getGroupCalendar(activeGroupId!),
    enabled: !!activeGroupId,
  });

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-2xl max-w-md border border-slate-800 space-y-4">
          <Calendar className="w-12 h-12 text-emerald-400 mx-auto" />
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
                <Calendar className="w-5 h-5 text-emerald-400" />
                تقويم الحضور والالتزام
              </h1>
              <p className="text-xs text-slate-400">{group?.name || 'Reading Club'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        <section className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h2 className="font-bold text-base text-white mb-4">سجل الشهر الحالي</h2>

          {isLoading ? (
            <div className="text-center py-8 text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل التقويم...
            </div>
          ) : calendarData ? (
            <CalendarGrid calendarData={calendarData} />
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              لا توجد بيانات تقويم متاحة
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
