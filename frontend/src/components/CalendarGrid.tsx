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
      <div className="text-center py-10 text-[#777168] text-xs font-semibold">
        لا توجد بيانات تقويم متاحة لهذا الشهر
      </div>
    );
  }

  const numDays = calendarData.members[0]?.days.length || 30;
  const daysHeader = Array.from({ length: numDays }, (_, i) => i + 1);

  // Compute monthly consistency percentage for each member & sort ranking
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
      {/* 1. COMPETITION SUMMARY ROW ABOVE GRID (Plain text summary ranking) */}
      <div className="space-y-2 border-b border-apple-border pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-apple-text">
          <Trophy className="w-4 h-4 text-apple-gold" />
          <span>ترتيب استمرارية الأعضاء هذا الشهر:</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-apple-secondary font-mono pt-1">
          {memberRankings.map((r, idx) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <span className="text-apple-muted font-bold">#{idx + 1}</span>
              <span className="text-apple-text font-sans font-bold">{r.name}</span>
              <span className="text-apple-green font-bold">({r.rate}% استمرارية)</span>
              {idx < memberRankings.length - 1 && <span className="text-apple-muted mr-2">•</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 2. REAL HEATMAP GRID (Small squares per day + Hover Tooltip) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-apple-muted">
          <span className="font-medium">الخريطة الحرارية للحضور اليومي</span>
          {hoveredCell ? (
            <span className="text-xs text-apple-gold font-mono font-bold bg-apple-surface px-3 py-1 rounded-lg border border-apple-border shadow-sm">
              {hoveredCell.memberName} • يوم {hoveredCell.day}: {getStatusLabel(hoveredCell.status)}
            </span>
          ) : (
            <span className="text-[11px] font-mono hidden sm:inline">مرر الماوس على أي يوم للتفاصيل</span>
          )}
        </div>

        <div className="overflow-x-auto touch-pan-x pb-2">
          <div className="min-w-[700px] border border-apple-border rounded-2xl bg-apple-surface p-4 space-y-4 shadow-xl">
            {/* Days header numbers */}
            <div className="flex items-center gap-2 border-b border-apple-border pb-3 text-xs text-apple-muted font-mono">
              <div className="w-36 font-sans font-bold text-apple-text text-right shrink-0">العضو</div>
              <div className="flex-1 grid gap-1.5 text-center" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                {daysHeader.map((d) => (
                  <span key={d} className="text-[11px] font-bold">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Members Heatmap Rows */}
            <div className="space-y-3">
              {calendarData.members.map((m) => (
                <div key={m.user.id} className="flex items-center gap-2 text-xs">
                  <div className="w-36 font-bold text-apple-text truncate text-right shrink-0">{m.user.name}</div>
                  <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(0, 1fr))` }}>
                    {m.days.map((d, idx) => {
                      let cellStyle = 'bg-apple-card border border-apple-border';

                      if (d.status === 'present') {
                        cellStyle = 'bg-apple-green border border-apple-green';
                      } else if (d.status === 'absent') {
                        cellStyle = 'bg-apple-red border border-apple-red';
                      } else if (d.status === 'freeze') {
                        cellStyle = 'bg-apple-gold/40 border border-apple-gold/60';
                      }

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredCell({ memberName: m.user.name, day: d.day, status: d.status })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-6 h-6 rounded-md transition-transform hover:scale-125 cursor-pointer mx-auto ${cellStyle}`}
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

      {/* 3. LEGEND & STREAK FREEZE PROTECTION FEATURE EXPLANATION */}
      <div className="space-y-3 pt-4 border-t border-apple-border">
        <div className="flex flex-wrap items-center gap-6 text-xs text-apple-secondary font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-apple-green" />
            <span>تمت القراءة</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-apple-red" />
            <span>غياب (غرامة)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-apple-gold/50 border border-apple-gold" />
            <span>تجميد رصيد</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-apple-card" />
            <span>قادم / لم يحل</span>
          </span>
        </div>

        {/* Feature Note: Streak Freeze Protection */}
        <div className="flex items-start gap-2 text-xs text-apple-muted bg-apple-surface p-3.5 rounded-xl border border-apple-border leading-relaxed shadow-sm">
          <Info className="w-4 h-4 text-apple-gold shrink-0 mt-0.5" />
          <p>
            <strong className="text-apple-text">خاصية تجميد السلسلة (Streak Freeze):</strong> تحمي استمراريتك وستريك القراءة عند الاضطرار لأخذ استراحة طارئة دون احتساب غرامة ماليّة على الصندوق.
          </p>
        </div>
      </div>
    </div>
  );
};

