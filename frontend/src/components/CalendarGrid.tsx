import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Snowflake, Minus } from 'lucide-react';
import { MonthCalendarResponse } from '../api/calendar';

interface CalendarGridProps {
  calendarData: MonthCalendarResponse;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ calendarData }) => {
  if (!calendarData || calendarData.members.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 text-xs font-semibold">
        لا توجد بيانات تقويم متاحة لهذا الشهر
      </div>
    );
  }

  const numDays = calendarData.members[0]?.days.length || 30;
  const daysHeader = Array.from({ length: numDays }, (_, i) => i + 1);

  return (
    <div>
      <div className="text-[11px] text-slate-400 mb-2.5 md:hidden flex items-center gap-1.5 font-bold">
        <span>👈 اسحب الجدول أفقياً لمشاهدة بقية أيام الشهر</span>
      </div>
      <div className="overflow-x-auto touch-pan-x pb-2">
        <table className="w-full text-right text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400">
            <th className="p-3.5 sticky right-0 bg-obsidian-900 z-10 w-40 font-extrabold text-xs">العضو</th>
            {daysHeader.map((d) => (
              <th key={d} className="p-2 text-center w-9 font-mono text-[11px] font-bold text-slate-400">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {calendarData.members.map((m, memberIdx) => (
            <motion.tr 
              key={m.user.id} 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: memberIdx * 0.05 }}
              className="hover:bg-slate-900/40"
            >
              <td className="p-3.5 font-bold text-white text-xs sticky right-0 bg-obsidian-900 z-10 shadow-md border-l border-slate-800/60">
                {m.user.name}
              </td>
              {m.days.map((d, idx) => {
                let icon = <Minus className="w-3 h-3 text-slate-700" />;
                let bgClass = 'bg-slate-900/40 border border-slate-800/60 text-slate-600';
                
                if (d.status === 'present') {
                  icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
                  bgClass = 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold shadow-sm';
                } else if (d.status === 'absent') {
                  icon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
                  bgClass = 'bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold shadow-sm';
                } else if (d.status === 'freeze') {
                  icon = <Snowflake className="w-3.5 h-3.5 text-sky-400" />;
                  bgClass = 'bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold shadow-sm';
                }

                return (
                  <td key={idx} className="p-1 text-center" title={`يوم ${d.day}: ${d.status}`}>
                    <motion.div 
                      whileHover={{ scale: 1.25 }}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs mx-auto transition-all ${bgClass}`}
                    >
                      {icon}
                    </motion.div>
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 pt-5 text-xs text-slate-300 border-t border-slate-800/60 mt-5 font-medium">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> تم القراءة
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-400" /> غياب (غرامة)
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300">
          <Snowflake className="w-3.5 h-3.5 text-sky-400" /> تجميد مجاني
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
          <Minus className="w-3.5 h-3.5 text-slate-500" /> قادم / لم ينضم
        </span>
      </div>
    </div>
  );
};


