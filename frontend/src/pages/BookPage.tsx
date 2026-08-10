import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Loader2, Trash2, Sparkles, Layers, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import {
  getAllGroupBooks,
  getBooksCatalog,
  setGroupBookPlan,
  createBookInCatalog,
  deleteGroupBook,
  deleteBookFromCatalog,
  getProxiedCoverUrl,
  GroupBook,
  Book,
} from '../api/books';
import { getGroupDetails, Group } from '../api/groups';
import { Navbar } from '../components/Navbar';
import { BookSearchAutocomplete, WikidataBookResult } from '../components/BookSearchAutocomplete';

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
  const [newCoverUrl, setNewCoverUrl] = useState('');

  const { data: group } = useQuery<Group>({
    queryKey: ['group', activeGroupId],
    queryFn: () => getGroupDetails(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const { data: allGroupBooks, isLoading: loadingGroupBooks } = useQuery<GroupBook[]>({
    queryKey: ['allGroupBooks', activeGroupId],
    queryFn: () => getAllGroupBooks(activeGroupId!),
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
      queryClient.invalidateQueries({ queryKey: ['allGroupBooks', activeGroupId] });
      setShowSetPlanModal(false);
    },
  });

  const createBookMutation = useMutation({
    mutationFn: () =>
      createBookInCatalog({
        title: newTitle,
        author: newAuthor,
        total_pages: parseInt(newPages, 10) || 200,
        cover_url: newCoverUrl || undefined,
      }),
    onSuccess: (newBook) => {
      queryClient.invalidateQueries({ queryKey: ['booksCatalog'] });
      setSelectedBookId(newBook.id);
      setShowCreateBookModal(false);
      setNewTitle('');
      setNewAuthor('');
      setNewPages('200');
      setNewCoverUrl('');
    },
  });

  const deleteGroupBookMutation = useMutation({
    mutationFn: (gbId: string) => deleteGroupBook(activeGroupId!, gbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBook', activeGroupId] });
      queryClient.invalidateQueries({ queryKey: ['allGroupBooks', activeGroupId] });
    },
  });

  const deleteCatalogBookMutation = useMutation({
    mutationFn: (bookId: string) => deleteBookFromCatalog(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booksCatalog'] });
      if (selectedBookId) setSelectedBookId('');
    },
  });

  const handleSelectWikidataBook = (wikidataBook: WikidataBookResult) => {
    setNewTitle(wikidataBook.title);
    setNewAuthor(wikidataBook.author || '');
    setNewPages(String(wikidataBook.total_pages || 200));
    setNewCoverUrl(wikidataBook.cover_url || '');
    setShowCreateBookModal(true);
  };

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

  const activeBooks = allGroupBooks?.filter((b) => b.status === 'active') || [];
  const otherBooks = allGroupBooks?.filter((b) => b.status !== 'active') || [];

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 pb-32 lg:pb-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="glow-orb w-96 h-96 bg-emerald-500/10 top-0 right-1/4 animate-pulse-subtle" />

      {/* Navbar Header */}
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-xl text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              مكتبة وقائمة كتب المجموعة
            </h1>
            <p className="text-slate-400 text-xs mt-1">تصفح وتحديد كتب القراءة الجماعية النشطة والمقترحة</p>
          </div>

          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSetPlanModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
            >
              <Plus className="w-4 h-4" />
              إضافة أو تحديد كتاب
            </motion.button>
          )}
        </div>

        {/* Section 1: Active Reading Books (Horizontal Slider) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-sm text-white">الكتب الحالية قيد القراءة</h2>
            <span className="text-[11px] text-emerald-400 font-mono">({activeBooks.length})</span>
          </div>

          {loadingGroupBooks ? (
            <div className="text-center py-8 text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> جاري تحميل الكتب...
            </div>
          ) : activeBooks.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
              {activeBooks.map((gb) => (
                <motion.div
                  key={gb.id}
                  whileHover={{ scale: 1.02 }}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[340px] glass-card p-5 rounded-3xl border border-slate-800/90 snap-start flex flex-col justify-between shrink-0 relative group"
                >
                  {isOwner && (
                    <button
                      onClick={() => deleteGroupBookMutation.mutate(gb.id)}
                      className="absolute top-3 left-3 p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-rose-500/30 z-10"
                      title="إيقاف قراءة هذا الكتاب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-16 h-24 bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg flex items-center justify-center shrink-0">
                      {gb.book.cover_url ? (
                        <img
                          src={getProxiedCoverUrl(gb.book.cover_url)}
                          alt={gb.book.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-7 h-7 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/25 mb-1.5 inline-block">
                        نشط الآن
                      </span>
                      <h3 className="font-extrabold text-sm text-white truncate">{gb.book.title}</h3>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{gb.book.author}</p>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold block mt-1">
                        {gb.book.total_pages} صفحة
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block font-semibold">المعدل اليومي</span>
                      <span className="font-bold text-emerald-400 font-mono">{gb.daily_target_pages} ص/يوم</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-400 block font-semibold">الإنهاء في</span>
                      <span className="font-bold text-sky-400 font-mono">{gb.target_end_date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-card border border-slate-800/80 text-center text-slate-500 text-xs">
              لا توجد كتب نشطة قيد القراءة حالياً.
            </div>
          )}
        </section>

        {/* Section 2: Catalog / Suggested Books (Horizontal Slider) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-sm text-white">الكتب المقترحة في الكتالوج</h2>
            <span className="text-[11px] text-amber-400 font-mono">({catalog?.length || 0})</span>
          </div>

          {catalog && catalog.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
              {catalog.map((book) => (
                <div
                  key={book.id}
                  className="min-w-[220px] max-w-[240px] glass-card p-4 rounded-2xl border border-slate-800/80 snap-start flex flex-col justify-between shrink-0 relative group"
                >
                  <button
                    onClick={() => deleteCatalogBookMutation.mutate(book.id)}
                    className="absolute top-2 left-2 p-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-all border border-rose-500/40 z-10 flex items-center justify-center"
                    title="حذف الكتاب من الكتالوج"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-16 bg-slate-800 rounded-xl border border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0">
                      {book.cover_url ? (
                        <img
                          src={getProxiedCoverUrl(book.cover_url)}
                          alt={book.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{book.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{book.author}</p>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold block mt-1">
                        {book.total_pages} صفحة
                      </span>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setSelectedBookId(book.id);
                        setShowSetPlanModal(true);
                      }}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 rounded-xl text-[11px] font-bold transition-colors"
                    >
                      تحديد لخطة القراءة
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl glass-card border border-slate-800/80 text-center text-slate-500 text-xs">
              الكتالوج فارغ حالياً. قم بإضافة كتب جديدة عبر البحث الذكي!
            </div>
          )}
        </section>

        {/* Section 3: Completed / Archive Books */}
        {otherBooks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <h2 className="font-bold text-sm text-slate-400">سجل الكتب السابقة والمكتملة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {otherBooks.map((gb) => (
                <div key={gb.id} className="glass-panel p-3.5 rounded-2xl border border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <div>
                      <h5 className="font-bold text-xs text-slate-300">{gb.book.title}</h5>
                      <p className="text-[10px] text-slate-500">{gb.book.author}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => deleteGroupBookMutation.mutate(gb.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Set Plan Modal with Wikidata Search */}
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
              <h3 className="text-lg font-extrabold text-white text-center">اختيار أو بحث عن كتاب للمجموعة</h3>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">البحث الذكي عن كتاب (Wikidata API)</label>
                <BookSearchAutocomplete onSelectBook={handleSelectWikidataBook} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">أو اختر من الكتالوج المتاح</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 outline-none"
                >
                  <option value="">-- اختر كتاباً من القائمة --</option>
                  {catalog?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.author}) - {b.total_pages} صفحة
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewTitle('');
                  setNewAuthor('');
                  setNewPages('200');
                  setNewCoverUrl('');
                  setShowCreateBookModal(true);
                }}
                className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                + إضافة كتاب كتابةً للكتالوج
              </button>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">عدد أيام القراءة المستهدفة</label>
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

      {/* Create / Edit Book Modal */}
      <AnimatePresence>
        {showCreateBookModal && (
          <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700/80 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-extrabold text-white text-center">مراجعة وإضافة تفاصيل الكتاب</h3>

              {newCoverUrl && (
                <div className="flex justify-center my-2">
                  <div className="w-20 h-28 rounded-xl border border-slate-700 overflow-hidden shadow-md">
                    <img src={getProxiedCoverUrl(newCoverUrl)} alt={newTitle} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان الكتاب</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 outline-none"
                  placeholder="مثال: التفكير السريع والبطيء"
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

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                  <ImageIcon size={14} className="text-emerald-400" /> رابط صورة الغلاف (اختياري)
                </label>
                <input
                  type="text"
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  className="w-full p-3 bg-obsidian-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-emerald-500 outline-none"
                  placeholder="https://example.com/cover.jpg"
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
                  disabled={!newTitle || createBookMutation.isPending}
                  onClick={() => createBookMutation.mutate()}
                  className="w-1/2 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {createBookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'إضافة وتحديد الكتاب'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


