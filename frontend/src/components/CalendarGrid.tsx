import React from 'react';
import { MonthCalendarResponse } from '../api/calendar';

interface CalendarGridProps {
  calendarData: MonthCalendarResponse;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ calendarData }) => {
  if (!calendarData || calendarData.members.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        لا توجد بيانات تقويم متاحة لهذا الشهر
      </div>
    );
  }

  const numDays = calendarData.members[0]?.days.length || 30;
  const daysHeader = Array.from({ length: numDays }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400">
            <th className="p-3 sticky right-0 bg-slate-900 z-10 w-36 font-semibold">العضو</th>
            {daysHeader.map((d) => (
              <th key={d} className="p-2 text-center w-8 font-mono text-[10px]">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {calendarData.members.map((m) => (
            <tr key={m.user.id} className="hover:bg-slate-900/40">
              <td className="p-3 font-medium text-white sticky right-0 bg-slate-900 z-10 shadow-md">
                {m.user.name}
              </td>
              {m.days.map((d, idx) => {
                let badge = '⬜';
                let bgClass = 'bg-slate-900/30 text-slate-600';
                
                if (d.status === 'present') {
                  badge = '🟩';
                  bgClass = 'bg-emerald-500/20 text-emerald-400 font-bold';
                } else if (d.status === 'absent') {
                  badge = '🟥';
                  bgClass = 'bg-rose-500/20 text-rose-400 font-bold';
                } else if (d.status === 'freeze') {
                  badge = '❄️';
                  bgClass = 'bg-sky-500/20 text-sky-400 font-bold';
                }

                return (
                  <td key={idx} className="p-1 text-center" title={`${d.day}: ${d.status}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs mx-auto ${bgClass}`}>
                      {badge}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-center gap-4 pt-4 text-xs text-slate-400 border-t border-slate-800/60 mt-4">
        <span className="flex items-center gap-1">🟩 قرأ اليوم</span>
        <span className="flex items-center gap-1">🟥 غياب وغرامة</span>
        <span className="flex items-center gap-1">❄️ تجميد استُهلك</span>
        <span className="flex items-center gap-1">⬜ قادم / لم ينضم</span>
      </div>
    </div>
  );
};
