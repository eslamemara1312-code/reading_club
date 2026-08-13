import { useState, useEffect } from 'react';
import { Search, BookOpen, Loader2, Sparkles } from 'lucide-react';

export interface WikidataBookResult {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  description?: string;
  total_pages?: number;
}

interface BookSearchAutocompleteProps {
  onSelectBook: (book: WikidataBookResult) => void;
}

export function BookSearchAutocomplete({ onSelectBook }: BookSearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WikidataBookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const combinedResults: WikidataBookResult[] = [];

        // 1. PRIMARY: Google Books API (Best for Arabic titles, authors, real page counts, & covers)
        try {
          const gbooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            query
          )}&hl=ar&maxResults=7`;
          const gres = await fetch(gbooksUrl);
          const gdata = await gres.json();

          if (gdata.items && gdata.items.length > 0) {
            for (const item of gdata.items) {
              const info = item.volumeInfo || {};
              const gTitle = info.title || query;

              // Construct reliable HTTPS cover URL
              const rawCover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
              let coverUrl: string | undefined;

              if (rawCover) {
                coverUrl = rawCover.replace('http://', 'https://').replace('&edge=curl', '');
              } else if (item.id) {
                coverUrl = `https://books.google.com/books/publisher/content/images/frontcover/${item.id}?fife=w400-h600&source=gbs_api`;
              }

              combinedResults.push({
                id: item.id || `gb_${Math.random()}`,
                title: gTitle,
                author: info.authors ? info.authors.join(', ') : 'مؤلف غير معروف',
                cover_url: coverUrl,
                total_pages: info.pageCount || undefined,
                description: info.description ? info.description.slice(0, 80) + '...' : undefined,
              });
            }
          }
        } catch (e) {
          console.warn('Google Books API fetch failed:', e);
        }

        // 2. SECONDARY: OpenLibrary Search API (supplement extra books)
        try {
          const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
            query
          )}&limit=5&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year`;
          const olRes = await fetch(olUrl);
          const olData = await olRes.json();

          if (olData.docs && olData.docs.length > 0) {
            for (const doc of olData.docs) {
              const olTitle = doc.title || '';
              // Avoid duplicates
              const exists = combinedResults.some(
                (r) => r.title.toLowerCase() === olTitle.toLowerCase()
              );
              if (exists) continue;

              const coverUrl = doc.cover_i
                ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                : undefined;

              combinedResults.push({
                id: doc.key || `ol_${Math.random()}`,
                title: olTitle || query,
                author: doc.author_name ? doc.author_name.join(', ') : 'مؤلف غير معروف',
                cover_url: coverUrl,
                total_pages: doc.number_of_pages_median || undefined,
                description: doc.first_publish_year ? `نشر عام ${doc.first_publish_year}` : undefined,
              });
            }
          }
        } catch (e) {
          console.warn('OpenLibrary search failed:', e);
        }

        setResults(combinedResults);
        setOpen(true);
      } catch (err) {
        console.error('Book search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute right-3 w-4 h-4 text-apple-gold pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="ابحث بالعنوان أو الكاتب..."
          className="w-full pl-4 pr-10 py-3 rounded-xl bg-apple-bg border border-apple-border text-apple-text text-xs font-medium placeholder:text-apple-muted focus:border-apple-gold outline-none transition-all shadow-sm"
        />
        {loading && <Loader2 className="absolute left-3 w-4 h-4 text-apple-gold animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-apple-surface border border-apple-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto divide-y divide-apple-border">
          <div className="px-3 py-1.5 bg-apple-card text-[10px] font-bold text-apple-gold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> نتائج البحث الذكية باللغة العربية مع الأغلفة
          </div>
          {results.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              type="button"
              onClick={() => {
                onSelectBook(item);
                setQuery(item.title);
                setOpen(false);
              }}
              className="w-full px-3 py-2.5 text-right hover:bg-apple-card-elevated transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-14 bg-apple-card rounded-lg border border-apple-border flex items-center justify-center shrink-0 overflow-hidden relative">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback gracefully on broken images
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = (e.target as HTMLImageElement).nextElementSibling;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`flex flex-col items-center justify-center p-1 text-center ${item.cover_url ? 'hidden' : ''}`}>
                  <BookOpen className="w-4 h-4 text-apple-gold mb-0.5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-apple-text truncate">{item.title}</p>
                <p className="text-[11px] text-apple-secondary truncate mt-0.5">{item.author}</p>
                {item.total_pages && (
                  <p className="text-[10px] text-apple-gold font-mono font-semibold mt-0.5">
                    {item.total_pages} صفحة
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
