import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ArrowRight, Plus, Calendar, Target, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { getActiveGroupBook, getBooksCatalog, setGroupBookPlan, createBookInCatalog, GroupBook, Book } from '../api/books';
import { getGroupDetails, Group } from '../api/groups';

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

  const isOwner = group?.owner_id === user?.id;

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-2xl max-w-md border border-slate-800 space-y-4">
          <BookOpen className="w-12 h-12 text-emerald-400 mx-auto" />
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
                <BookOpen className="w-5 h-5 text-emerald-400" />
                كتاب المجموعة الحالي
              </h1>
              <p className="text-xs text-slate-400">{group?.name || 'Reading Club'}</p>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowSetPlanModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              تغيير الكتاب
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل كتاب المجموعة...
          </div>
        ) : activeBook ? (
          <section className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-44 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl flex items-center justify-center text-4xl">
              📖
            </div>

            <div className="flex-1 text-center md:text-right space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                كتاب حلي نشط 🟢
              </span>
              <h2 className="text-2xl font-bold text-white">{activeBook.book.title}</h2>
              <p className="text-slate-400 text-sm">تأليف: {activeBook.book.author}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <Target className="w-3.5 h-3.5 text-emerald-400" /> المعدل اليومي
                  </div>
                  <div className="font-bold text-emerald-400 font-mono text-lg">
                    {activeBook.daily_target_pages} صفحة/يوم
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" /> إجمالي الصفحات
                  </div>
                  <div className="font-bold text-amber-400 font-mono text-lg">
                    {activeBook.book.total_pages} صفحة
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" /> التكثيف حتى
                  </div>
                  <div className="font-bold text-sky-400 font-mono text-sm">
                    {activeBook.target_end_date}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">لم يتم اختيار كتاب للمجموعة بعد</h3>
            <p className="text-slate-400 text-sm">قم بتحديد كتاب من الكتالوج أو إضافة كتاب جديد لبدء خطة القراءة الجماعية.</p>

            {isOwner && (
              <button
                onClick={() => setShowSetPlanModal(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
              >
                تحديد كتاب الآن
              </button>
            )}
          </div>
        )}
      </main>

      {/* Set Plan Modal */}
      {showSetPlanModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white text-center">اختيار كتاب للمجموعة 📚</h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">اختر من الكتالوج</label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
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
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              + إضافة كتاب جديد للكتالوج
            </button>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">مدة القراءة المخططة (بالأيام)</label>
              <input
                type="number"
                min="1"
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSetPlanModal(false)}
                className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-lg text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!selectedBookId || setPlanMutation.isPending}
                onClick={() => setPlanMutation.mutate()}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {setPlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الخطة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Book Modal */}
      {showCreateBookModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white text-center">إضافة كتاب جديد للكتالوج 📖</h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">عنوان الكتاب</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                placeholder="مثال: التفكير الفاست والسلول"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">المؤلف</label>
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                placeholder="مثال: دانيال كانمان"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">عدد الصفحات الإجمالي</label>
              <input
                type="number"
                min="1"
                value={newPages}
                onChange={(e) => setNewPages(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateBookModal(false)}
                className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-lg text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!newTitle || !newAuthor || createBookMutation.isPending}
                onClick={() => createBookMutation.mutate()}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createBookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة الكتالوج'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
