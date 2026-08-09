import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { getGroupCalendar, MonthCalendarResponse } from '../api/calendar';
import { getGroupDetails, Group } from '../api/groups';
import { CalendarGrid } from '../components/CalendarGrid';
import { Navbar } from '../components/Navbar';

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
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-3xl max-w-md border border-slate-800 space-y-4">
          <Calendar className="w-12 h-12 text-emerald-400 mx-auto" />
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
    <div className="min-h-screen bg-obsidian-950 text-slate-100 pb-32 lg:pb-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="glow-orb w-96 h-96 bg-emerald-500/10 top-0 left-1/4 animate-pulse-subtle" />

      {/* Navbar Header */}
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-3xl border border-slate-800/90 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="font-extrabold text-base text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              تقويم الحضور وسجل القراءة الشهرية
            </h2>
            <span className="text-xs text-slate-400 font-mono">{group?.name}</span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> جاري تحميل نتائج التقويم...
            </div>
          ) : calendarData ? (
            <CalendarGrid calendarData={calendarData} />
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              لا توجد بيانات تقويم متاحة حالياً
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

