import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ArrowRight, Plus, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { getGroupDiscussions, createDiscussionThread, addDiscussionReply, Discussion } from '../api/discussions';
import { getGroupDetails, Group } from '../api/groups';

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-2xl max-w-md border border-slate-800 space-y-4">
          <MessageSquare className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">لم تنضم لأي مجموعة بعد</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-white"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-base text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                ساحة النقاشات الجماعية
              </h1>
              <p className="text-xs text-slate-400">{group?.name || 'Reading Club'}</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewThreadModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            موضوع جديد
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل النقاشات...
          </div>
        ) : discussions && discussions.length > 0 ? (
          <div className="space-y-4">
            {discussions.map((d) => (
              <article key={d.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                      {d.user.name[0]}
                    </div>
                    <span className="font-bold text-sm text-white">{d.user.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{d.discussion_date}</span>
                </div>

                <h3 className="font-bold text-base text-emerald-300">{d.title}</h3>
                <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{d.content}</p>

                {/* Replies */}
                <div className="pt-3 border-t border-slate-800/60 space-y-2">
                  {d.replies.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-semibold">
                        <span>{r.user.name}</span>
                      </div>
                      <p className="text-slate-200">{r.content}</p>
                    </div>
                  ))}

                  {/* Add Reply Input */}
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
                      placeholder="اكتب رداً..."
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <button
                      type="submit"
                      disabled={!replyInputs[d.id] || replyMutation.isPending}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">لا توجد مواضيع نقاش بعد</h3>
            <p className="text-slate-400 text-sm">كن أول من يشارك فائدة أو يطرح تساؤلاً حول القراءة الحالية.</p>
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
            >
              طرح موضوع جديد
            </button>
          </div>
        )}
      </main>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white text-center">طرح موضوع نقاش جديد 💬</h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">عنوان الموضوع</label>
              <input
                type="text"
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                placeholder="مثال: فكرة إعجاب في الفصل الأول"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">المحتوى والتفاصيل</label>
              <textarea
                rows={4}
                value={threadContent}
                onChange={(e) => setThreadContent(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                placeholder="اكتب أفكارك وفائدتك بالتفصيل..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewThreadModal(false)}
                className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-lg text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!threadTitle || !threadContent || createThreadMutation.isPending}
                onClick={() => createThreadMutation.mutate()}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createThreadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'نشر الموضوع'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
