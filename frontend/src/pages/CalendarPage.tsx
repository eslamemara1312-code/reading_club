import { useQuery } from '@tanstack/react-query';
import { Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { getGroupCalendar, MonthCalendarResponse } from '../api/calendar';
import { CalendarGrid } from '../components/CalendarGrid';
import { AppShell } from '../components/layout/AppShell';

export const CalendarPage = () => {
  const user = useAuthStore((state) => state.user);
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const navigate = useNavigate();

  const { data: calendarData, isLoading } = useQuery<MonthCalendarResponse>({
    queryKey: ['calendar', activeGroupId],
    queryFn: () => getGroupCalendar(activeGroupId!),
    enabled: !!activeGroupId,
  });

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-reader-canvas text-reader-text flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-reader-panel p-8 rounded-3xl max-w-md border border-reader-border space-y-4 shadow-2xl">
          <Calendar className="w-10 h-10 text-reader-accent mx-auto" />
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
        <div className="border-b border-reader-border pb-6">
          <span className="text-xs text-reader-accent font-bold tracking-wider uppercase block mb-1">
            إيقاع قراءتك الشهرية 📅
          </span>
          <h1 className="font-black text-2xl sm:text-3xl text-reader-text tracking-tight">
            تقويم الالتزام الشخصي
          </h1>
          <p className="text-reader-muted text-xs mt-1 font-medium">
            تابع أيام قراءتك وغيابك وتجميد الستريك خلال الشهر الحالي.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-reader-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-reader-accent" /> جاري تحميل خريطة الالتزام...
          </div>
        ) : calendarData ? (
          <CalendarGrid calendarData={calendarData} currentUserId={user?.id} />
        ) : (
          <div className="text-center py-12 text-reader-muted text-xs font-medium">
            لا توجد بيانات تقويم متاحة حالياً
          </div>
        )}
      </div>
    </AppShell>
  );
};
