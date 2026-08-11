/*
===============================================================================
 خريطة الوظائف المحفوظة (Preserved Functionality Map) — CalendarPage.tsx
===============================================================================
1. State Store & Router:
   - activeGroupId: useUIStore((state) => state.activeGroupId)
   - navigate: useNavigate()

2. Queries:
   - group: getGroupDetails(activeGroupId!) [Key: 'group', activeGroupId]
   - calendarData: getGroupCalendar(activeGroupId!) [Key: 'calendar', activeGroupId]

3. Conditional Logic:
   - if (!activeGroupId): render onboarding redirect prompt
   - isLoading: render loading spinner
===============================================================================
*/

import { useQuery } from '@tanstack/react-query';
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
      <div className="min-h-screen bg-apple-bg text-apple-text flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-apple-surface p-8 rounded-2xl max-w-md border border-apple-border space-y-4 shadow-2xl">
          <Calendar className="w-10 h-10 text-apple-gold mx-auto" />
          <h2 className="text-xl font-bold text-apple-text">لم تنضم لأي مجموعة بعد</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-apple-gold hover:opacity-90 font-black rounded-xl text-black text-xs transition-colors"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text pb-32 lg:pb-16 relative dir-rtl font-sans transition-colors duration-300">
      {/* Quiet Header Navbar */}
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-12 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-apple-border pb-6">
          <div>
            <span className="text-xs text-apple-gold font-bold tracking-wider uppercase block mb-1">
              إيقاع القراءة الشهرية 📅
            </span>
            <h1 className="font-black text-3xl text-apple-text tracking-tight">
              تقويم الالتزام والحضور
            </h1>
            <p className="text-apple-muted text-xs mt-1 font-medium">
              خريطة حرارية تفصيلية لاستمرارية أعضاء {group?.name || 'المجموعة'}
            </p>
          </div>
          <span className="text-xs text-apple-secondary font-mono font-medium px-3 py-1 bg-apple-surface rounded-lg border border-apple-border shrink-0 self-start sm:self-auto">
            {group?.members_count || 1} أعضاء
          </span>
        </div>

        {/* Calendar Content */}
        {isLoading ? (
          <div className="text-center py-16 text-apple-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-apple-gold" /> جاري تحميل خريطة إيقاع القراءة...
          </div>
        ) : calendarData ? (
          <CalendarGrid calendarData={calendarData} />
        ) : (
          <div className="text-center py-12 text-apple-muted text-xs font-medium">
            لا توجد بيانات تقويم متاحة حالياً
          </div>
        )}
      </main>
    </div>
  );
};
