import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { MonthCalendarResponse } from '../api/calendar';

interface CalendarGridProps {
  calendarData: MonthCalendarResponse;
  currentUserId?: string;
}

interface HoveredDay {
  day: string;
  status: string;
  pagesRead?: number;
}

const WEEKDAYS = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({ calendarData, currentUserId }) => {
  const [hoveredDay, setHoveredDay] = useState<HoveredDay | null>(null);

  if (!calendarData || calendarData.members.length === 0) {
    return (
      <div className="text-center py-10 text-reader-muted text-xs font-semibold">
        لا توجد بيانات تقويم متاحة لهذا الشهر
      </div>
    );
  }

  const currentMember = currentUserId
    ? calendarData.members.find((member) => member.user.id === currentUserId)
    : undefined;

  if (!currentMember) {
    return (
      <div className="text-center py-10 text-reader-muted text-xs font-semibold">
        تعذر العثور على بيانات تقويمك الشخصي لهذا الشهر
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'تمت القراءة بنجاح';
      case 'absent':
        return 'غياب (احتساب غرامة)';
      case 'freeze':
        return 'تجميد مجاني (حماية الستريك)';
      case 'not_joined':
        return 'قبل الانضمام للمجموعة';
      default:
        return 'يوم قادم';
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'present':
        return 'border-emerald-400/80 bg-emerald-500/35 text-emerald-100 hover:bg-emerald-500/50';
      case 'absent':
        return 'border-red-400/80 bg-red-500/35 text-red-100 hover:bg-red-500/50';
      case 'freeze':
        return 'border-amber-300/80 bg-amber-400/35 text-amber-100 hover:bg-amber-400/50';
      case 'not_joined':
        return 'border-reader-border bg-reader-surface/50 text-reader-subtle opacity-60';
      default:
        return 'border-reader-border bg-reader-surface text-reader-muted hover:bg-reader-hover';
    }
  };

  const [yearString, monthString] = calendarData.month.split('-');
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  const leadingEmptyCells = Number.isFinite(year) && Number.isFinite(monthIndex)
    ? (new Date(year, monthIndex, 1).getDay() + 1) % 7
    : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-reader-border bg-reader-panel p-4 shadow-xl sm:p-6">
        <div className="mb-5 flex flex-col gap-2 border-b border-reader-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-reader-text">خريطة الإلتزام</h2>
            <p className="mt-1 text-[11px] font-medium text-reader-muted">عرض شهري خاص بك فقط</p>
          </div>
          <span className="self-start rounded-xl border border-reader-border bg-reader-surface px-3 py-1.5 font-mono text-[11px] font-bold text-reader-accent sm:self-auto">
            {calendarData.month}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pb-2 text-center" aria-hidden="true">
          {WEEKDAYS.map((weekday, index) => (
            <span key={`${weekday}-${index}`} className="py-1 text-[11px] font-black text-reader-muted">
              {weekday}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: leadingEmptyCells }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square min-h-10" aria-hidden="true" />
          ))}

          {currentMember.days.map((day, index) => {
            const pagesRead = day.pages_read ?? 0;
            const statusLabel = getStatusLabel(day.status);

            return (
              <button
                key={`${day.day}-${index}`}
                type="button"
                onMouseEnter={() => setHoveredDay({ day: day.day, status: day.status, pagesRead: day.pages_read })}
                onMouseLeave={() => setHoveredDay(null)}
                onFocus={() => setHoveredDay({ day: day.day, status: day.status, pagesRead: day.pages_read })}
                onBlur={() => setHoveredDay(null)}
                className={`group relative flex aspect-square min-h-10 min-w-0 flex-col items-center justify-center rounded-xl border p-1 text-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reader-focus sm:min-h-14 ${getStatusClasses(day.status)}`}
                aria-label={`يوم ${day.day}: ${statusLabel}${pagesRead ? `، ${pagesRead} صفحة` : ''}`}
                title={`يوم ${day.day}: ${statusLabel}${pagesRead ? ` • ${pagesRead} صفحة` : ''}`}
              >
                <span className="font-mono text-xs font-black sm:text-sm">{day.day}</span>
                {day.status === 'present' && pagesRead > 0 && (
                  <span className="mt-0.5 hidden max-w-full truncate text-[9px] font-bold opacity-90 sm:block">
                    {pagesRead} ص
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 min-h-8 border-t border-reader-border pt-4 text-[11px] font-medium text-reader-muted">
          {hoveredDay ? (
            <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-reader-border bg-reader-surface px-3 py-1.5 text-reader-text">
              <strong>يوم {hoveredDay.day}</strong>
              <span>•</span>
              <span>{getStatusLabel(hoveredDay.status)}</span>
              {!!hoveredDay.pagesRead && <span className="font-mono text-reader-accent">• {hoveredDay.pagesRead} صفحة</span>}
            </span>
          ) : (
            <span>مرر الماوس أو ركّز على أي يوم لعرض التفاصيل</span>
          )}
        </div>
      </section>

      <div className="space-y-3 border-t border-reader-border pt-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-reader-muted sm:gap-6">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md border border-emerald-400/80 bg-emerald-500/45" />
            <span className="text-reader-text">تمت القراءة</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md border border-red-400/80 bg-red-500/45" />
            <span className="text-reader-text">غياب (غرامة)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md border border-amber-300/80 bg-amber-400/45" />
            <span className="text-reader-text">تجميد رصيد</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md border border-reader-border bg-reader-surface" />
            <span className="text-reader-text">قادم / لم يحل</span>
          </span>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-reader-border bg-reader-panel p-4 text-xs leading-relaxed text-reader-text shadow-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-reader-accent" />
          <p>
            <strong className="text-reader-text">خاصية تجميد السلسلة (Streak Freeze):</strong> تحمي استمراريتك وستريك القراءة عند الاضطرار لأخذ استراحة طارئة دون احتساب غرامة ماليّة على الصندوق.
          </p>
        </div>
      </div>
    </div>
  );
};
