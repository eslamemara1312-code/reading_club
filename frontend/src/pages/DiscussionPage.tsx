import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Send, Loader2, Flame, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { getGroupDiscussions, createDiscussionThread, addDiscussionReply, Discussion } from '../api/discussions';
import { getGroupDetails, Group } from '../api/groups';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { AppShell } from '../components/layout/AppShell';

export const DiscussionPage = () => {
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');

  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const { data: group } = useQuery<Group>({
    queryKey: ['group', activeGroupId],
    queryFn: () => getGroupDetails(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: discussions, isLoading } = useQuery<Discussion[]>({
    queryKey: ['discussions', activeGroupId],
    queryFn: () => getGroupDiscussions(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: leaderboard, isLoading: loadingLb } = useLeaderboard(activeGroupId);

  const createThreadMutation = useMutation({
    mutationFn: () =>
      createDiscussionThread(activeGroupId!, {
        title: threadTitle,
        content: threadContent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', activeGroupId] });
      setShowNewThreadModal(false);
      setThreadTitle('');
      setThreadContent('');
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ discussionId, content }: { discussionId: string; content: string }) =>
      addDiscussionReply(discussionId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussions', activeGroupId] });
      setReplyInputs((prev) => ({ ...prev, [variables.discussionId]: '' }));
    },
  });

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-reader-canvas flex flex-col items-center justify-center p-4 text-center text-reader-text">
        <div className="bg-reader-panel p-8 rounded-3xl max-w-md border border-reader-border space-y-4 shadow-2xl">
          <MessageSquare className="w-10 h-10 text-reader-accent mx-auto" />
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
        {/* Page Header & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-reader-border pb-6">
          <div>
            <span className="text-xs text-reader-accent font-bold tracking-wider uppercase block mb-1">
              مجتمع القراءة والتفاعل 💬
            </span>
            <h1 className="font-black text-2xl sm:text-3xl text-reader-text tracking-tight">
              ساحة النادي
            </h1>
            <p className="text-reader-muted text-xs mt-1 font-medium">
              {group?.name} • {group?.members_count || 1} أعضاء بالمجموعة
            </p>
          </div>

          <button
            onClick={() => setShowNewThreadModal(true)}
            className="px-5 py-3 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] shrink-0 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            طرح موضوع نقاش جديد
          </button>
        </div>

        {/* COMPETITION & MEMBER COMMITMENT RANKINGS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold text-reader-text flex items-center gap-2">
              <Trophy className="w-4 h-4 text-reader-accent" />
              ترتيب التزام الأعضاء
            </h2>
            <span className="text-xs text-reader-muted font-mono">حسب نسبة الاستمرارية</span>
          </div>

          {loadingLb ? (
            <div className="py-4 text-xs text-reader-muted flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-reader-accent" /> جاري تحميل ترتيب الأعضاء...
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="divide-y divide-reader-border">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user.id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-reader-muted font-bold w-6 text-sm">#{entry.rank}</span>
                    <span className="font-bold text-reader-text">{entry.user.name}</span>
                    <span className="text-reader-muted font-mono">🔥 {entry.current_streak} يوم</span>
                  </div>
                  <div className="font-mono text-reader-metric-limeText font-bold">
                    {entry.commitment_rate}% استمرارية
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-reader-muted border-t border-reader-border pt-3">
              لا يوجد سجلات ترتيب متاحة حالياً.
            </p>
          )}
        </section>

        {/* DISCUSSIONS FEED SECTION */}
        <section className="space-y-6 pt-4 border-t border-reader-border">
          <h2 className="text-base font-bold text-reader-text">
            نقاشات وأفكار النادي
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-reader-muted text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-reader-accent" /> جاري تحميل مواضيع النادي...
            </div>
          ) : discussions && discussions.length > 0 ? (
            <div className="space-y-6">
              {discussions.map((d) => (
                <article
                  key={d.id}
                  className="bg-reader-panel p-6 rounded-3xl border border-reader-border space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-reader-border pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-reader-surface border border-reader-border text-reader-accent font-bold flex items-center justify-center text-xs overflow-hidden">
                        {d.user.avatar_url ? (
                          <img src={d.user.avatar_url} alt={d.user.name} className="w-full h-full object-cover" />
                        ) : (
                          d.user.name[0]
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-reader-text block">{d.user.name}</span>
                        <span className="text-[10px] text-reader-muted">مستوى {d.user.level || 1}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-reader-muted font-mono">{d.discussion_date}</span>
                  </div>

                  <h3 className="font-bold text-base text-reader-text leading-snug">{d.title}</h3>
                  <p className="text-xs text-reader-muted whitespace-pre-line leading-relaxed">{d.content}</p>

                  <div className="flex items-center gap-4 pt-1 text-reader-muted text-xs">
                    <button className="flex items-center gap-1.5 hover:text-reader-accent transition-colors">
                      <Flame className="w-3.5 h-3.5 text-reader-accent" /> <span>مثير للإلهام</span>
                    </button>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> <span>{d.replies.length} ردود</span>
                    </span>
                  </div>

                  {/* Thread Replies */}
                  <div className="pt-3 border-t border-reader-border space-y-2.5">
                    {d.replies.map((r) => (
                      <div key={r.id} className="p-3.5 rounded-2xl bg-reader-surface border border-reader-border text-xs space-y-1">
                        <div className="flex items-center justify-between text-reader-muted">
                          <span className="text-reader-accent font-bold">{r.user.name}</span>
                          <span className="text-[10px] font-mono">
                            {new Date(r.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-reader-text leading-relaxed">{r.content}</p>
                      </div>
                    ))}

                    {/* Add Reply Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const content = replyInputs[d.id];
                        if (content) {
                          replyMutation.mutate({ discussionId: d.id, content });
                        }
                      }}
                      className="flex gap-2 pt-2"
                    >
                      <input
                        type="text"
                        value={replyInputs[d.id] || ''}
                        onChange={(e) => setReplyInputs({ ...replyInputs, [d.id]: e.target.value })}
                        placeholder="اكتب رداً تشجيعياً أو تساؤلاً..."
                        className="flex-1 px-4 py-2.5 bg-reader-surface border border-reader-border rounded-xl text-reader-text text-xs outline-none focus:border-reader-accent transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!replyInputs[d.id] || replyMutation.isPending}
                        className="px-4 py-2.5 bg-reader-surface hover:bg-reader-hover text-reader-accent border border-reader-borderStrong rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-reader-panel p-10 rounded-3xl border border-reader-border text-center space-y-4 shadow-lg">
              <MessageSquare className="w-10 h-10 text-reader-muted mx-auto" />
              <h3 className="text-base font-bold text-reader-text">لا توجد مواضيع نقاش بعد</h3>
              <p className="text-reader-muted text-xs max-w-sm mx-auto leading-relaxed">
                كن أول من يشارك فائدة أو يطرح تساؤلاً ملهمًا حول كتب النادي.
              </p>
              <button
                onClick={() => setShowNewThreadModal(true)}
                className="px-6 py-2.5 bg-reader-surface hover:bg-reader-hover text-reader-accent border border-reader-borderStrong font-bold text-xs rounded-xl transition-colors"
              >
                طرح موضوع جديد 💬
              </button>
            </div>
          )}
        </section>
      </div>

      {/* New Thread Modal */}
      <AnimatePresence>
        {showNewThreadModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-reader-panel p-6 rounded-3xl max-w-md w-full border border-reader-border space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-reader-text text-center">طرح موضوع نقاش جديد 💬</h3>

              <div>
                <label className="block text-xs font-semibold text-reader-muted mb-1.5">عنوان الموضوع</label>
                <input
                  type="text"
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  className="w-full p-3 bg-reader-surface border border-reader-border rounded-xl text-reader-text text-xs focus:border-reader-accent outline-none"
                  placeholder="مثال: فكرة ملهمة في الفصل الأول من كتاب اليوم"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-reader-muted mb-1.5">المحتوى والتفاصيل</label>
                <textarea
                  rows={4}
                  value={threadContent}
                  onChange={(e) => setThreadContent(e.target.value)}
                  className="w-full p-3 bg-reader-surface border border-reader-border rounded-xl text-reader-text text-xs focus:border-reader-accent outline-none leading-relaxed"
                  placeholder="اكتب أفكارك وفائدتك بالتفصيل بالنادي..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="w-1/2 py-2.5 bg-reader-surface text-reader-muted font-semibold rounded-xl text-xs border border-reader-border"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!threadTitle || !threadContent || createThreadMutation.isPending}
                  onClick={() => createThreadMutation.mutate()}
                  className="w-1/2 py-2.5 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-black rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {createThreadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'نشر الموضوع'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};
