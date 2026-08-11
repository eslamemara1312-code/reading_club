/*
===============================================================================
 خريطة الوظائف المحفوظة (Preserved Functionality Map) — BookPage.tsx
===============================================================================
1. State Store & Router:
   - activeGroupId: useUIStore((state) => state.activeGroupId)
   - user: useAuthStore((state) => state.user)
   - navigate: useNavigate()
   - queryClient: useQueryClient()
   - showSetPlanModal, selectedBookId, targetDays
   - searchTerm, selectedFilter ('all' | 'active' | 'upcoming' | 'completed')
   - showCreateBookModal, newTitle, newAuthor, newPages, newCoverUrl

2. Queries:
   - group: getGroupDetails(activeGroupId!) [Key: 'group', activeGroupId]
   - allGroupBooks: getAllGroupBooks(activeGroupId!) [Key: 'allGroupBooks', activeGroupId]
   - catalogBooks: getBooksCatalog() [Key: 'booksCatalog']

3. Computed Values & Permissions:
   - isOwner: group?.owner_id === user?.id
   - activeGroupBook: allGroupBooks?.find(b => b.status === 'active')
   - filteredGroupBooks: filtered by selectedFilter and searchTerm

4. Mutations:
   - setPlanMutation: setGroupBookPlan(activeGroupId!, data)
   - createBookMutation: createBookInCatalog(data)
   - deleteGroupBookMutation: deleteGroupBook(activeGroupId!, groupBookId)
   - deleteCatalogBookMutation: deleteBookFromCatalog(bookId)
===============================================================================
*/

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Loader2, Sparkles, Layers, Bookmark,
  Search, ChevronLeft
} from 'lucide-react';
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
import { ThreeDBookCard } from '../components/3DBookCard';
import { BookAssetActions } from '../components/reader/BookAssetActions';

export const BookPage = () => {
  const activeGroupId = useUIStore((state) => state.activeGroupId);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showSetPlanModal, setShowSetPlanModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [targetDays, setTargetDays] = useState('15');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

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

  const { data: catalogBooks, isLoading: loadingCatalog } = useQuery<Book[]>({
    queryKey: ['booksCatalog'],
    queryFn: getBooksCatalog,
  });

  const setPlanMutation = useMutation({
    mutationFn: (data: { book_id: string; start_date: string; target_end_date: string }) =>
      setGroupBookPlan(activeGroupId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGroupBooks', activeGroupId] });
      queryClient.invalidateQueries({ queryKey: ['activeBook', activeGroupId] });
      setShowSetPlanModal(false);
      setSelectedBookId('');
    },
  });

  const createBookMutation = useMutation({
    mutationFn: (data: { title: string; author: string; total_pages: number; cover_url?: string }) =>
      createBookInCatalog(data),
    onSuccess: (createdBook) => {
      queryClient.invalidateQueries({ queryKey: ['booksCatalog'] });
      setShowCreateBookModal(false);
      setNewTitle('');
      setNewAuthor('');
      setNewPages('200');
      setNewCoverUrl('');

      setSelectedBookId(createdBook.id);
      setShowSetPlanModal(true);
    },
  });

  const deleteGroupBookMutation = useMutation({
    mutationFn: (groupBookId: string) => deleteGroupBook(activeGroupId!, groupBookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGroupBooks', activeGroupId] });
      queryClient.invalidateQueries({ queryKey: ['activeBook', activeGroupId] });
    },
  });

  const deleteCatalogBookMutation = useMutation({
    mutationFn: (bookId: string) => deleteBookFromCatalog(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booksCatalog'] });
    },
  });

  const isOwner = group?.owner_id === user?.id;

  const handleSelectWikidataBook = (wb: WikidataBookResult) => {
    setNewTitle(wb.title);
    setNewAuthor(wb.author);
    setNewPages(wb.total_pages?.toString() || '200');
    if (wb.cover_url) {
      setNewCoverUrl(wb.cover_url);
    }
  };

  const handleSetPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) return;

    const days = parseInt(targetDays, 10) || 15;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    setPlanMutation.mutate({
      book_id: selectedBookId,
      start_date: start.toISOString().split('T')[0],
      target_end_date: end.toISOString().split('T')[0],
    });
  };

  const handleCreateBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBookMutation.mutate({
      title: newTitle,
      author: newAuthor,
      total_pages: parseInt(newPages, 10) || 200,
      cover_url: newCoverUrl || undefined,
    });
  };

  const activeGroupBook = allGroupBooks?.find((b) => b.status === 'active');

  const filteredGroupBooks = allGroupBooks?.filter((b) => {
    if (selectedFilter !== 'all' && b.status !== selectedFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return b.book.title.toLowerCase().includes(q) || b.book.author.toLowerCase().includes(q);
    }
    return true;
  });

  if (!activeGroupId) {
    return (
      <div className="min-h-screen bg-apple-bg text-apple-text flex items-center justify-center p-4">
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4 bg-apple-surface rounded-2xl border border-apple-border shadow-xl">
          <BookOpen className="w-10 h-10 text-apple-gold mx-auto" />
          <h2 className="text-xl font-bold text-apple-text">يرجى الانضمام إلى مجموعة لتصفح رف الكتب</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-apple-gold hover:opacity-90 text-black rounded-xl text-xs font-black transition-colors"
          >
            الانتقال للمجموعات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text pb-32 relative dir-rtl font-sans transition-colors duration-300">
      {/* Quiet Header Navbar */}
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-12 relative z-10">
        
        {/* HEADER GREETING & PRIMARY ACTION BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-apple-border pb-6">
          <div className="space-y-1">
            <span className="text-xs text-apple-gold font-bold tracking-wider uppercase block">
              مكتبة النادي • Bookshelf 📚
            </span>
            <h1 className="font-black text-3xl text-apple-text tracking-tight">
              أهلاً بك، {user?.name || 'القارئ'}
            </h1>
            <p className="text-apple-muted text-xs font-medium">
              تصفح كتب مجموعتك، واكتشف كتب الكتالوج المتاحة للقراءة.
            </p>
          </div>

          {/* SINGLE SOLID ACCENT FILL BUTTON ON THIS PAGE */}
          <button
            onClick={() => setShowCreateBookModal(true)}
            className="px-5 py-3 bg-apple-gold hover:opacity-90 text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] shrink-0 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            إضافة كتاب للكتالوج
          </button>
        </div>

        {/* 1. CURRENTLY READING HERO SPOTLIGHT (LARGE STANDALONE COVER, NO CARD FRAME) */}
        {activeGroupBook && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-apple-gold">
              <Sparkles className="w-4 h-4 text-apple-gold" />
              <span>تقرأ حالياً • Currently Reading</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-apple-border pb-8">
              {/* Standalone Large Cover (No Card Frame Around It) */}
              <div className="md:col-span-3 flex justify-center md:justify-start">
                <div className="w-36 h-56 bg-apple-surface rounded-lg overflow-hidden shadow-2xl flex items-center justify-center border border-apple-border">
                  {activeGroupBook.book.cover_url ? (
                    <img
                      src={getProxiedCoverUrl(activeGroupBook.book.cover_url)}
                      alt={activeGroupBook.book.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-apple-muted" />
                  )}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="md:col-span-9 space-y-3 text-right">
                <span className="text-[11px] font-mono text-apple-green font-bold">
                  {activeGroupBook.book.category || 'كتاب رئيسي'}
                </span>

                <h2 className="text-3xl font-black text-apple-text leading-snug">
                  {activeGroupBook.book.title}
                </h2>
                
                <p className="text-xs text-apple-secondary font-medium">
                  المؤلف: {activeGroupBook.book.author} • إجمالي {activeGroupBook.book.total_pages} صفحة
                </p>

                <div className="text-xs text-apple-gold font-mono font-bold pt-1">
                  الهدف اليومي للمجموعة: {activeGroupBook.daily_target_pages} صفحة / يوم
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-5 py-2.5 bg-apple-card hover:bg-apple-elevated text-apple-gold border border-apple-gold/30 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm self-start"
                  >
                    <span>تكملة الورد اليومي 📖</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {activeGroupId && (
                    <BookAssetActions
                      groupId={activeGroupId}
                      bookId={activeGroupBook.book.id}
                      bookTitle={activeGroupBook.book.title}
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. MY BOOKSHELF SECTION & FILTERS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-apple-gold" />
              <h2 className="text-lg font-bold text-apple-text">رف كتب المجموعة</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-apple-surface p-1 rounded-xl border border-apple-border text-xs font-semibold shadow-sm">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${selectedFilter === 'all' ? 'bg-apple-card text-apple-gold border border-apple-gold/30 shadow-sm' : 'text-apple-secondary hover:text-apple-text'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setSelectedFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition ${selectedFilter === 'active' ? 'bg-apple-card text-apple-gold border border-apple-gold/30 shadow-sm' : 'text-apple-secondary hover:text-apple-text'}`}
              >
                حالي 🔥
              </button>
              <button
                onClick={() => setSelectedFilter('upcoming')}
                className={`px-3 py-1.5 rounded-lg transition ${selectedFilter === 'upcoming' ? 'bg-apple-card text-apple-gold border border-apple-gold/30 shadow-sm' : 'text-apple-secondary hover:text-apple-text'}`}
              >
                قادم ⏳
              </button>
              <button
                onClick={() => setSelectedFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition ${selectedFilter === 'completed' ? 'bg-apple-card text-apple-gold border border-apple-gold/30 shadow-sm' : 'text-apple-secondary hover:text-apple-text'}`}
              >
                مكتمل ✅
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-apple-muted absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الكتاب أو المؤلف..."
              className="w-full pl-4 pr-11 py-3 bg-apple-surface border border-apple-border rounded-xl text-apple-text text-xs font-medium focus:border-apple-gold outline-none shadow-sm"
            />
          </div>

          {/* Group Books Horizontal Shelf */}
          {loadingGroupBooks ? (
            <div className="text-center py-12 text-apple-muted text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-apple-gold" /> جاري تحميل رف الكتب...
            </div>
          ) : filteredGroupBooks && filteredGroupBooks.length > 0 ? (
            <div className="overflow-x-auto pb-4 pt-1 no-scrollbar flex items-center gap-4 scroll-smooth">
              {filteredGroupBooks.map((gb) => (
                <ThreeDBookCard
                  key={gb.id}
                  book={gb.book}
                  groupBook={gb}
                  status={gb.status}
                  dailyTargetPages={gb.daily_target_pages}
                  isOwner={isOwner}
                  groupId={activeGroupId || undefined}
                  onDeleteGroupBook={(groupBookId) => deleteGroupBookMutation.mutate(groupBookId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-apple-surface rounded-2xl border border-apple-border space-y-3 shadow-md">
              <BookOpen className="w-8 h-8 text-apple-muted mx-auto" />
              <h3 className="text-xs font-bold text-apple-text">لا توجد كتب مضافة لهذا الرف بعد</h3>
              {isOwner && (
                <button
                  onClick={() => setShowSetPlanModal(true)}
                  className="px-4 py-2 bg-apple-card hover:bg-apple-elevated text-apple-gold border border-apple-gold/30 font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  حدد كتاباً من الكتالوج للخطة
                </button>
              )}
            </div>
          )}
        </section>

        {/* 3. CATALOG GRID SECTION WITH HAIRLINE BORDERS */}
        <section className="space-y-4 pt-4 border-t border-apple-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-apple-gold" />
              <h2 className="text-base font-bold text-apple-text">كتالوج الكتب المتاحة للمجموعة</h2>
            </div>

            {isOwner && (
              <button
                onClick={() => setShowSetPlanModal(true)}
                className="px-3.5 py-2 bg-apple-card hover:bg-apple-elevated text-apple-gold border border-apple-gold/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Bookmark className="w-3.5 h-3.5" />
                تحديد كتاب كخطة
              </button>
            )}
          </div>

          {loadingCatalog ? (
            <div className="text-center py-8 text-apple-muted text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-apple-gold" /> جاري تحميل الكتالوج...
            </div>
          ) : catalogBooks && catalogBooks.length > 0 ? (
            <div className="overflow-x-auto pb-4 pt-1 no-scrollbar flex items-center gap-4 scroll-smooth">
              {catalogBooks.map((b) => (
                <ThreeDBookCard
                  key={b.id}
                  book={b}
                  isOwner={isOwner}
                  groupId={activeGroupId || undefined}
                  onDeleteCatalogBook={(bookId) => deleteCatalogBookMutation.mutate(bookId)}
                  onSelectForPlan={(bookId) => {
                    setSelectedBookId(bookId);
                    setShowSetPlanModal(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-apple-muted text-xs font-medium">
              الكتالوج فارغ حالياً. يمكنك إضافة كتب جديدة عبر زر "إضافة كتاب للكتالوج".
            </div>
          )}
        </section>

      </main>

      {/* Set Plan Modal */}
      <AnimatePresence>
        {showSetPlanModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-apple-surface p-6 rounded-2xl max-w-md w-full border border-apple-border space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-apple-text text-center">تحديد خطة كتاب للمجموعة 📖</h3>

              <form onSubmit={handleSetPlanSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-apple-secondary mb-1.5">اختر كتاباً من الكتالوج</label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-medium outline-none focus:border-apple-gold"
                  >
                    <option value="">-- اختر الكتاب --</option>
                    {catalogBooks?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} - {b.author} ({b.total_pages} ص)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-apple-secondary mb-1.5">مدّة القراءة بالـ (أيام)</label>
                  <input
                    type="number"
                    min="1"
                    value={targetDays}
                    onChange={(e) => setTargetDays(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-mono outline-none focus:border-apple-gold text-center"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSetPlanModal(false)}
                    className="w-1/2 py-2.5 bg-apple-card text-apple-secondary font-semibold rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={setPlanMutation.isPending}
                    className="w-1/2 py-2.5 bg-apple-gold hover:opacity-90 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    {setPlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'تأكيد الخطة'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Book Modal */}
      <AnimatePresence>
        {showCreateBookModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-apple-surface p-6 rounded-2xl max-w-md w-full border border-apple-border space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <h3 className="text-base font-bold text-apple-text text-center">إضافة كتاب جديد للكتالوج 📚</h3>

              {/* Wikidata Smart Search */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-apple-gold">البحث الذكي عن كتاب أوتوماتيكياً</label>
                <BookSearchAutocomplete onSelectBook={handleSelectWikidataBook} />
              </div>

              <form onSubmit={handleCreateBookSubmit} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-apple-secondary mb-1">عنوان الكتاب</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-medium outline-none focus:border-apple-gold"
                    placeholder="مثال: مقدمة ابن خلدون"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-apple-secondary mb-1">اسم المؤلف</label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-medium outline-none focus:border-apple-gold"
                    placeholder="مثال: ابن خلدون"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-apple-secondary mb-1">إجمالي عدد الصفحات</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPages}
                    onChange={(e) => setNewPages(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-mono outline-none focus:border-apple-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-apple-secondary mb-1">رابط صورة الغلاف (اختياري)</label>
                  <input
                    type="url"
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-mono outline-none focus:border-apple-gold"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateBookModal(false)}
                    className="w-1/2 py-2.5 bg-apple-card text-apple-secondary font-semibold rounded-xl text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={createBookMutation.isPending}
                    className="w-1/2 py-2.5 bg-[#FFD60A] hover:bg-[#E5C000] text-[#000000] font-black rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    {createBookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-[#000000]" /> : 'حفظ الكتاب'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
