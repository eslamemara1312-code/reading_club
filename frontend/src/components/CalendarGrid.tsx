import React, { useState } from 'react';
import { Trophy, Info } from 'lucide-react';
import { MonthCalendarResponse } from '../api/calendar';

interface CalendarGridProps {
  calendarData: MonthCalendarResponse;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ calendarData }) => {
  const [hoveredCell, setHoveredCell] = useState<{ memberName: string; day: string; status: string } | null>(null);

  if (!calendarData || calendarData.members.length === 0) {
    return (
      <div className="text-center py-10 text-reader-muted text-xs font-semibold">
        لا توجد بيانات تقويم متاحة لهذا الشهر
      </div>
    );
  }

  const numDays = calendarData.members[0]?.days.length || 30;
  const daysHeader = Array.from({ length: numDays }, (_, i) => i + 1);

  const memberRankings = calendarData.members
    .map((m) => {
      const pastDays = m.days.filter((d) => d.status !== 'future' && d.status !== 'not_joined');
      const presentDays = m.days.filter((d) => d.status === 'present');
      const totalPast = pastDays.length || 1;
      const rate = Math.round((presentDays.length / totalPast) * 100);
      return {
        id: m.user.id,
        name: m.user.name,
        rate,
        presentCount: presentDays.length,
      };
    })
    .sort((a, b) => b.rate - a.rate);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'تمت القراءة بنجاح';
      case 'absent':
        return 'غياب (احتساب غرامة)';
      case 'freeze':
        return 'تجميد مجاني (حماية السلسلة)';
      default:
        return 'يوم قادم';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. COMPETITION SUMMARY ROW */}
      <div className="space-y-2 border-b border-reader-border pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-reader-text">
          <Trophy className="w-4 h-4 text-reader-accent" />
          <span>ترتيب استمرارية الأعضاء هذا الشهر:</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-reader-muted font-mono pt-1">
          {memberRankings.map((r, idx) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <span className="text-reader-subtle font-bold">#{idx + 1}</span>
              <span className="text-reader-text font-sans font-bold">{r.name}</span>
              <span className="text-reader-metric-limeText font-bold">({r.rate}% استمرارية)</span>
              {idx < memberRankings.length - 1 && <span className="text-reader-subtle mr-2">•</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 2. HEATMAP GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-reader-muted">
          <span className="font-medium">الخريطة الحرارية للحضور اليومي</span>
          {hoveredCell ? (
            <span className="text-xs text-reader-accent font-mono font-bold bg-reader-panel px-3 py-1 rounded-lg border border-reader-border shadow-sm">
              {hoveredCell.memberName} • يوم {hoveredCell.day}: {getStatusLabel(hoveredCell.status)}
            </span>
          ) : (
            <span className="text-[11px] font-mono hidden sm:inline">مرر الماوس على أي يوم للتفاصيل</span>
          )}
        </div>

        <div className="overflow-x-auto touch-pan-x pb-2 no-scrollbar">
          <div className="min-w-[700px] border border-reader-border rounded-3xl bg-reader-panel p-5 space-y-4 shadow-xl">
            {/* Days Header */}
            <div className="flex items-center gap-2 border-b border-reader-border pb-3 text-xs text-reader-muted font-mono">
              <div className="w-36 font-sans font-bold text-reader-text text-right shrink-0">العضو</div>
              <div className="flex-1 grid gap-1.5 text-center" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                {daysHeader.map((d) => (
                  <span key={d} className="text-[11px] font-bold">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Heatmap Rows */}
            <div className="space-y-3">
              {calendarData.members.map((m) => (
                <div key={m.user.id} className="flex items-center gap-2 text-xs">
                  <div className="w-36 font-bold text-reader-text truncate text-right shrink-0">{m.user.name}</div>
                  <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                    {m.days.map((d, idx) => {
                      let cellStyle = 'bg-reader-surface border border-reader-border';

                      if (d.status === 'present') {
                        cellStyle = 'bg-reader-metric-limeBg border border-reader-border text-reader-metric-limeText';
                      } else if (d.status === 'absent') {
                        cellStyle = 'bg-red-500/20 border border-red-500/30 text-red-400';
                      } else if (d.status === 'freeze') {
                        cellStyle = 'bg-reader-metric-goldBg border border-reader-border text-reader-metric-goldText';
                      }

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredCell({ memberName: m.user.name, day: d.day, status: d.status })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-6 h-6 rounded-lg transition-transform hover:scale-125 cursor-pointer mx-auto ${cellStyle}`}
                          title={`${m.user.name} - يوم ${d.day}: ${getStatusLabel(d.status)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. LEGEND */}
      <div className="space-y-3 pt-4 border-t border-reader-border">
        <div className="flex flex-wrap items-center gap-6 text-xs text-reader-muted font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-reader-metric-limeBg border border-reader-border" />
            <span>تمت القراءة</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-red-500/20 border border-red-500/30" />
            <span>غياب (غرامة)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-reader-metric-goldBg border border-reader-border" />
            <span>تجميد رصيد</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-reader-surface border border-reader-border" />
            <span>قادم / لم يحل</span>
          </span>
        </div>

        <div className="flex items-start gap-2 text-xs text-reader-muted bg-reader-panel p-4 rounded-2xl border border-reader-border leading-relaxed shadow-sm">
          <Info className="w-4 h-4 text-reader-accent shrink-0 mt-0.5" />
          <p>
            <strong className="text-reader-text">خاصية تجميد السلسلة (Streak Freeze):</strong> تحمي استمراريتك وستريك القراءة عند الاضطرار لأخذ استراحة طارئة دون احتساب غرامة ماليّة على الصندوق.
          </p>
        </div>
      </div>
    </div>
  );
};
