import { Activity, BookOpen, CheckCircle2, Clock3, Flame, MessageCircle, Trophy } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { LeaderboardEntry, MemberTodayStatus } from '../../api/checkins';

interface DashboardActivityRailProps {
  memberStatuses?: MemberTodayStatus[];
  leaderboard?: LeaderboardEntry[];
}

export function DashboardActivityRail({ memberStatuses = [], leaderboard = [] }: DashboardActivityRailProps) {
  const recentMembers = [...memberStatuses]
    .sort((a, b) => Number(b.has_checked_in) - Number(a.has_checked_in))
    .slice(0, 6);

  return (
    <div className="space-y-6" aria-label="نشاط النادي اليوم">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-reader-accent">مباشر الآن</p>
          <h2 className="mt-1 text-xl font-black text-reader-text">النشاط</h2>
        </div>
        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-reader-borderStrong bg-reader-accentSoft text-reader-accent">
          <Activity className="h-5 w-5" />
          <span className="absolute -left-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-reader-success ring-2 ring-reader-panel" />
        </div>
      </div>

      <div className="space-y-4">
        {recentMembers.length > 0 ? recentMembers.map((status) => {
          const pages = status.checkin?.pages_read ?? 0;
          const initial = status.user.name?.charAt(0).toUpperCase() || 'ق';

          return (
            <article key={status.user.id} className="rounded-[30px] border border-reader-border bg-reader-surface p-5 shadow-lg transition-colors hover:bg-reader-hover">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-reader-borderStrong bg-reader-raised font-black text-reader-accent">
                  {status.user.avatar_url ? (
                    <img src={status.user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : initial}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-black text-reader-text">{status.user.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-reader-muted">
                      {status.has_checked_in ? <CheckCircle2 className="h-3.5 w-3.5 text-reader-success" /> : <Clock3 className="h-3.5 w-3.5" />}
                      اليوم
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium leading-relaxed text-reader-text">
                    {status.has_checked_in
                      ? `أنهى ورده وقرأ ${pages || 'عدة'} صفحة.`
                      : 'لم يسجل ورده بعد — أرسل له تذكيرًا لطيفًا.'}
                  </p>

                  {status.checkin?.note && (
                    <p className="mt-3 line-clamp-3 rounded-2xl bg-reader-subdued px-3 py-2.5 text-xs leading-relaxed text-reader-text">
                      “{status.checkin.note}”
                    </p>
                  )}
                  <NavLink to="/discussions" className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 text-[11px] font-black text-reader-text hover:text-reader-accent">
                    <MessageCircle className="h-3.5 w-3.5" />
                    رد
                  </NavLink>
                </div>
              </div>
            </article>
          );
        }) : (
          <div className="rounded-3xl border border-dashed border-reader-borderStrong bg-reader-subdued px-5 py-8 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-reader-accent" />
            <p className="mt-3 text-xs font-bold text-reader-text">بانتظار أول قراءة اليوم</p>
            <p className="mt-1 text-[11px] text-reader-muted">سيظهر نشاط أعضاء النادي هنا فور تسجيل الورد.</p>
          </div>
        )}
      </div>

      {leaderboard.length > 0 && (
        <section className="rounded-[30px] border border-reader-borderStrong bg-reader-accentSoft p-5">
          <div className="mb-3 flex items-center gap-2 text-reader-metric-goldText">
            <Trophy className="h-4 w-4" />
            <h3 className="text-xs font-black">الأكثر التزامًا</h3>
          </div>
          <div className="space-y-2.5">
            {leaderboard.slice(0, 3).map((entry, index) => (
              <div key={entry.user.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-reader-surface font-mono font-black text-reader-accent">{index + 1}</span>
                  <span className="truncate font-bold text-reader-text">{entry.user.name}</span>
                </div>
                <div className="shrink-0 text-left font-mono text-[10px] font-black leading-4">
                  <span className="block text-reader-metric-coralText">🔥 {entry.current_streak} ي</span>
                  <span className="block text-reader-metric-goldText">📚 {entry.total_pages_read} ص</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1 border-t border-reader-border pt-3 text-[10px] font-bold text-reader-muted">
            <Flame className="h-3.5 w-3.5 text-reader-metric-coralText" />
            الترتيب يتحدث تلقائيًا مع كل ورد
          </div>
        </section>
      )}

      <NavLink to="/discussions" className="flex min-h-[44px] items-center justify-center rounded-2xl border border-reader-border bg-reader-surface px-4 text-xs font-black text-reader-accent transition-colors hover:bg-reader-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reader-focus">
        فتح نقاشات النادي
      </NavLink>
    </div>
  );
}
