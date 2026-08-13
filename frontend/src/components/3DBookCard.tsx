import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trash2, RefreshCw, Bookmark, CheckCircle2 } from 'lucide-react';
import { getProxiedCoverUrl, Book, GroupBook } from '../api/books';
import { buttonPressAnimation } from '../utils/animationUtils';
import { BookAssetActions } from './reader/BookAssetActions';

interface ThreeDBookCardProps {
  book: Book;
  groupBook?: GroupBook;
  status?: 'active' | 'upcoming' | 'completed';
  dailyTargetPages?: number;
  isOwner?: boolean;
  groupId?: string;
  onDeleteGroupBook?: (groupBookId: string) => void;
  onDeleteCatalogBook?: (bookId: string) => void;
  onSelectForPlan?: (bookId: string) => void;
}

export function ThreeDBookCard({
  book,
  groupBook,
  status,
  dailyTargetPages,
  isOwner,
  groupId,
  onDeleteGroupBook,
  onDeleteCatalogBook,
  onSelectForPlan,
}: ThreeDBookCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="perspective-1000 w-32 sm:w-44 lg:w-48 shrink-0 py-2">
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full h-64 sm:h-72 rounded-2xl relative style-preserve-3d cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Face */}
        <div className="absolute inset-0 backface-hidden rounded-2xl bg-reader-panel border border-reader-border p-2.5 sm:p-3 flex flex-col justify-between overflow-hidden group shadow-lg">
          <div className="w-full h-40 sm:h-44 rounded-xl overflow-hidden bg-reader-surface border border-reader-border relative flex items-center justify-center">
            {!imgError && book.cover_url ? (
              <img
                src={getProxiedCoverUrl(book.cover_url)}
                alt={book.title}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full p-3 flex flex-col items-center justify-center text-center bg-reader-raised">
                <BookOpen className="w-8 h-8 text-reader-accent mb-1.5" />
                <span className="text-[10px] font-bold text-reader-text line-clamp-2 leading-tight">{book.title}</span>
                <span className="text-[9px] text-reader-muted line-clamp-1 mt-0.5">{book.author}</span>
              </div>
            )}

            {/* Status Badge */}
            {status && (
              <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                status === 'active' ? 'bg-reader-metric-limeBg text-reader-metric-limeText border-reader-border' :
                status === 'completed' ? 'bg-reader-metric-goldBg text-reader-metric-goldText border-reader-border' :
                'bg-reader-surface text-reader-muted border-reader-border'
              }`}>
                {status === 'active' ? 'أقرأ الآن' : status === 'completed' ? 'مكتمل' : 'قادم'}
              </span>
            )}

            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-medium text-white flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 text-reader-accent" />
              اقلب التفاصيل
            </div>
          </div>

          <div className="space-y-0.5 pt-1">
            <h4 className="font-bold text-xs text-reader-text truncate group-hover:text-reader-accent transition-colors">
              {book.title}
            </h4>
            <p className="text-[11px] text-reader-muted truncate font-medium">
              {book.author}
            </p>
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-reader-raised border border-reader-border p-4 flex flex-col justify-between overflow-hidden shadow-lg">
          <div className="space-y-3 text-right">
            <div className="flex items-center justify-between border-b border-reader-border pb-2">
              <span className="text-[10px] font-bold text-reader-accent">تفاصيل الكتاب</span>
              <span className="text-[10px] font-mono text-reader-text font-bold">{book.total_pages} صفحة</span>
            </div>

            <div>
              <h4 className="font-bold text-xs text-reader-text leading-snug">{book.title}</h4>
              <p className="text-[11px] text-reader-muted font-medium mt-0.5">{book.author}</p>
            </div>

            {dailyTargetPages && (
              <div className="bg-reader-metric-limeBg border border-reader-border p-2 rounded-xl text-[11px] text-reader-metric-limeText font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-reader-metric-limeText shrink-0" />
                <span>الهدف: {dailyTargetPages} ص/يوم</span>
              </div>
            )}

            {groupId && (
              <div onClick={(e) => e.stopPropagation()}>
                <BookAssetActions groupId={groupId} bookId={book.id} bookTitle={book.title} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-reader-border" onClick={(e) => e.stopPropagation()}>
            {onSelectForPlan && (
              <motion.button
                {...buttonPressAnimation}
                onClick={() => onSelectForPlan(book.id)}
                className="px-3 py-1.5 bg-reader-surface hover:bg-reader-hover text-reader-accent border border-reader-borderStrong rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm"
              >
                <Bookmark className="w-3 h-3" />
                تحديد كخطة
              </motion.button>
            )}

            {isOwner && (groupBook ? onDeleteGroupBook : onDeleteCatalogBook) && (
              <motion.button
                {...buttonPressAnimation}
                onClick={() => {
                  if (groupBook && onDeleteGroupBook) onDeleteGroupBook(groupBook.id);
                  else if (!groupBook && onDeleteCatalogBook) onDeleteCatalogBook(book.id);
                }}
                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="حذف الكتاب"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
