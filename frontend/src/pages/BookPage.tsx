import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Calendar, Target, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { getActiveGroupBook, getBooksCatalog, setGroupBookPlan, createBookInCatalog, GroupBook, Book } from '../api/books';
import { getGroupDetails, Group } from '../api/groups';
import { Navbar } from '../components/Navbar';

export const BookPage = () => {
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showSetPlanModal, setShowSetPlanModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [targetDays, setTargetDays] = useState('15');

  // New Book Form
  const [showCreateBookModal, setShowCreateBookModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPages, setNewPages] = useState('200');

  const { data: group } = useQuery<Group>({
    queryKey: ['group', activeGroupId],
    queryFn: () => getGroupDetails(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: activeBook, isLoading } = useQuery<GroupBook | null>({
    queryKey: ['activeBook', activeGroupId],
    queryFn: () => getActiveGroupBook(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: catalog } = useQuery<Book[]>({
    queryKey: ['booksCatalog'],
    queryFn: getBooksCatalog,
  });

  const isOwner = Boolean(
    user?.id && (
      (group?.owner_id && group.owner_id.toLowerCase() === user.id.toLowerCase()) ||
      group?.members?.some((m) => m.user_id.toLowerCase() === user.id.toLowerCase() && m.role === 'owner')
    )
  );

  const setPlanMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + parseInt(targetDays, 10));

      return setGroupBookPlan(activeGroupId!, {
        book_id: selectedBookId,
        start_date: today.toISOString().split('T')[0],
        target_end_date: targetDate.toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBook', activeGroupId] });
      setShowSetPlanModal(false);
    },
  });

  const createBookMutation = useMutation({
    mutationFn: () =>
      createBookInCatalog({
        title: newTitle,
        author: newAuthor,
        total_pages: parseInt(newPages, 10),
      }),
    onSuccess: (newBook) => {
      queryClient.invalidateQueries({ queryKey: ['booksCatalog'] });
      setSelectedBookId(newBook.id);
      setShowCreateBookModal(false);
      setNewTitle('');
      setNewAuthor('');
    },
  });

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-3xl max-w-md border border-slate-800 space-y-4">
          <BookOpen className="w-12 h-12 text-emerald-400 mx-auto" />
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
      <div className="glow-orb w-96 h-96 bg-emerald-500/10 top-0 right-1/4 animate-pulse-subtle" />

      {/* Navbar Header */}
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="font-extrabold text-lg text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            كتاب المجموعة الحالي
          </h1>

          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSetPlanModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
            >
              <Plus className="w-4 h-4" />
              تغيير أو تحديد كتاب
            </motion.button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> جاري تحميل كتاب المجموعة...
          </div>
        ) : activeBook ? (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800/90 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden"
          >
            <motion.div
              whileHover={{ rotateY: -10, scale: 1.05 }}
              className="w-36 h-52 bg-gradient-to-br from-slate-800 via-slate-900 to-obsidian-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center text-5xl shrink-0"
            >
              📖
            </motion.div>

            <div className="flex-1 text-center md:text-right space-y-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-glow-emerald">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                كتاب حالي نشط
              </span>
              <h2 className="text-2xl font-black text-white">{activeBook.book.title}</h2>
              <p className="text-slate-400 text-xs font-medium">تأليف: {activeBook.book.author}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1 mb-1 font-semibold">
                    <Target className="w-3.5 h-3.5 text-emerald-400" /> المعدل اليومي
                  </div>
                  <div className="font-black text-emerald-400 font-mono text-lg">
                    {activeBook.daily_target_pages} <span className="text-xs font-normal">ص/يوم</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1 mb-1 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" /> إجمالي الصفحات
                  </div>
                  <div className="font-black text-amber-400 font-mono text-lg">
                    {activeBook.book.total_pages} <span className="text-xs font-normal">صفحة</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-400 flex items-center gap-1 mb-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" /> التكثيف حتى
                  </div>
                  <div className="font-black text-sky-400 font-mono text-xs mt-1">
                    {activeBook.target_end_date}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 rounded-3xl border border-slate-800/90 text-center space-y-4 shadow-xl"
          >
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-extrabold text-white">لم يتم اختيار كتاب للمجموعة بعد</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
              قم بتحديد كتاب من الكتالوج أو إضافة كتاب جديد لبدء خطة القراءة الجماعية.
            </p>

            {isOwner && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSetPlanModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/50"
              >
                تحديد كتاب الآن 🚀
              </motion.button>
            )}
          </motion.div>
        )}
      </main>

      {/* Set Plan Modal */}
      <AnimatePresence>
        {showSetPlanModal && (
          <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700/80 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-extrabold text-white text-center">اختيار كتاب للمجموعة 📚</h3>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اختر من الكتالوج المتاح</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 outline-none"
                >
                  <option value="">-- اختر كتاباً --</option>
                  {catalog?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.author}) - {b.total_pages} صفحة
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateBookModal(true)}
                className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                + إضافة كتاب جديد للكتالوج
              </button>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">مدة القراءة المخططة (بالأيام)</label>
                <input
                  type="number"
                  min="1"
                  value={targetDays}
                  onChange={(e) => setTargetDays(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSetPlanModal(false)}
                  className="w-1/2 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!selectedBookId || setPlanMutation.isPending}
                  onClick={() => setPlanMutation.mutate()}
                  className="w-1/2 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {setPlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'تأكيد الخطة'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Book Modal */}
      <AnimatePresence>
        {showCreateBookModal && (
          <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700/80 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-extrabold text-white text-center">إضافة كتاب جديد للكتالوج 📖</h3>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الكتاب</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 outline-none"
                  placeholder="مثال: كتاب التفكير الفاست والسلول"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">المؤلف</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 outline-none"
                  placeholder="مثال: دانيال كانمان"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">عدد الصفحات الإجمالي</label>
                <input
                  type="number"
                  min="1"
                  value={newPages}
                  onChange={(e) => setNewPages(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBookModal(false)}
                  className="w-1/2 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!newTitle || !newAuthor || createBookMutation.isPending}
                  onClick={() => createBookMutation.mutate()}
                  className="w-1/2 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {createBookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'إضافة للكتالوج'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

