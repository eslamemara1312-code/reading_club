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

        // 1. PRIMARY: OpenLibrary Search API
        // Covers work directly (no CORS/referrer issues), real page counts, author names
        try {
          const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year,isbn`;
          const olRes = await fetch(olUrl);
          const olData = await olRes.json();

          if (olData.docs && olData.docs.length > 0) {
            for (const doc of olData.docs) {
              const coverUrl = doc.cover_i
                ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
                : undefined;

              combinedResults.push({
                id: doc.key || `ol_${Math.random()}`,
                title: doc.title || query,
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

        // 2. SECONDARY: Google Books API (fill gaps, especially for Arabic-only books)
        try {
          const gbooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&hl=ar&maxResults=5`;
          const gres = await fetch(gbooksUrl);
          const gdata = await gres.json();

          if (gdata.items && gdata.items.length > 0) {
            for (const item of gdata.items) {
              const info = item.volumeInfo || {};
              const gTitle = info.title || '';

              // Skip if we already have this title from OpenLibrary
              const exists = combinedResults.some(
                (r) => r.title.toLowerCase() === gTitle.toLowerCase()
              );
              if (exists) continue;

              // Try to get ISBN for OpenLibrary cover (more reliable than Google's CDN)
              let coverUrl: string | undefined;
              const isbn = info.industryIdentifiers?.find(
                (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
              )?.identifier;

              if (isbn) {
                coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
              }

              combinedResults.push({
                id: item.id || `gb_${Math.random()}`,
                title: gTitle || query,
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
        <Search className="absolute right-3 w-4 h-4 text-emerald-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="ابحث بالعنوان أو الكاتب..."
          className="w-full pl-4 pr-10 py-3 rounded-xl bg-obsidian-950 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 outline-none transition-all"
        />
        {loading && <Loader2 className="absolute left-3 w-4 h-4 text-emerald-400 animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto divide-y divide-slate-800">
          <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> نتائج البحث باللغة العربية مع الأغلفة
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
              className="w-full px-3 py-2.5 text-right hover:bg-slate-800/80 transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-12 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-xs shrink-0 overflow-hidden">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <BookOpen className={`w-4 h-4 text-emerald-400 ${item.cover_url ? 'hidden' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{item.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{item.author}</p>
                {item.total_pages && (
                  <p className="text-[10px] text-emerald-400 font-mono">{item.total_pages} صفحة</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
