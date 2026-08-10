import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { getGroupDiscussions, createDiscussionThread, addDiscussionReply, Discussion } from '../api/discussions';
import { getGroupDetails, Group } from '../api/groups';
import { Navbar } from '../components/Navbar';

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
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-3xl max-w-md border border-slate-800 space-y-4">
          <MessageSquare className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">لم تنضم لأي مجموعة بعد</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl text-white"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 pb-32 lg:pb-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="glow-orb w-96 h-96 bg-teal-500/10 top-0 left-1/4 animate-pulse-subtle" />

      {/* Sticky Header Navbar */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-black text-lg text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              ساحة النقاشات الجماعية
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{group?.name}</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewThreadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
          >
            <Plus className="w-4 h-4" />
            موضوع جديد
          </motion.button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> جاري تحميل النقاشات...
          </div>
        ) : discussions && discussions.length > 0 ? (
          <div className="space-y-4">
            {discussions.map((d, idx) => (
              <motion.article
                key={d.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-6 rounded-3xl border border-slate-800/90 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                      {d.user.name[0]}
                    </div>
                    <span className="font-extrabold text-sm text-white">{d.user.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{d.discussion_date}</span>
                </div>

                <h3 className="font-extrabold text-base text-emerald-300">{d.title}</h3>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{d.content}</p>

                {/* Replies */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  {d.replies.map((r) => (
                    <div key={r.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-bold">
                        <span>{r.user.name}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{r.content}</p>
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
                      placeholder="اكتب رداً على هذا الموضوع..."
                      className="flex-1 px-4 py-2 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-emerald-500"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!replyInputs[d.id] || replyMutation.isPending}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50 transition-colors shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </motion.button>
                  </form>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 rounded-3xl border border-slate-800/90 text-center space-y-4 shadow-xl"
          >
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-extrabold text-white">لا توجد مواضيع نقاش بعد</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">كن أول من يشارك فائدة أو يطرح تساؤلاً حول القراءة الحالية.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewThreadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/50"
            >
              طرح موضوع جديد 💬
            </motion.button>
          </motion.div>
        )}
      </main>

      {/* New Thread Modal */}
      <AnimatePresence>
        {showNewThreadModal && (
          <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700/80 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-extrabold text-white text-center">طرح موضوع نقاش جديد 💬</h3>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الموضوع</label>
                <input
                  type="text"
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 outline-none"
                  placeholder="مثال: فكرة ملفتة في الفصل الأول"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">المحتوى والتفاصيل</label>
                <textarea
                  rows={4}
                  value={threadContent}
                  onChange={(e) => setThreadContent(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 outline-none leading-relaxed"
                  placeholder="اكتب أفكارك وفائدتك بالتفصيل..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="w-1/2 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!threadTitle || !threadContent || createThreadMutation.isPending}
                  onClick={() => createThreadMutation.mutate()}
                  className="w-1/2 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {createThreadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'نشر الموضوع'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

