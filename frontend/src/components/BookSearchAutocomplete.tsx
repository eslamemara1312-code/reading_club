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

        // 1. Fetch from Google Books API (Best for Arabic titles, authors, page counts, and covers)
        try {
          const gbooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            query
          )}&hl=ar&maxResults=6`;
          const gres = await fetch(gbooksUrl);
          const gdata = await gres.json();

          if (gdata.items && gdata.items.length > 0) {
            for (const item of gdata.items) {
              const info = item.volumeInfo || {};
              let rawCover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
              if (rawCover.startsWith('http://')) {
                rawCover = rawCover.replace('http://', 'https://');
              }

              combinedResults.push({
                id: item.id || `gb_${Math.random()}`,
                title: info.title || query,
                author: info.authors ? info.authors.join(', ') : 'مؤلف غير معروف',
                cover_url: rawCover || undefined,
                total_pages: info.pageCount || 200,
                description: info.description ? info.description.slice(0, 100) + '...' : undefined,
              });
            }
          }
        } catch (e) {
          console.warn('Google Books API fetch failed:', e);
        }

        // 2. Fetch from Wikidata API (Supplement with Wikidata entities in Arabic)
        try {
          const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
            query
          )}&language=ar&uselang=ar&type=item&format=json&origin=*`;
          const wres = await fetch(wikidataUrl);
          const wdata = await wres.json();

          if (wdata.search && wdata.search.length > 0) {
            for (const item of wdata.search.slice(0, 5)) {
              // Avoid duplicates if title matches
              const exists = combinedResults.some(
                (r) => r.title.toLowerCase() === (item.label || '').toLowerCase()
              );
              if (!exists) {
                combinedResults.push({
                  id: item.id,
                  title: item.label || query,
                  author: item.description || 'كتاب في ويكيبيديا / ويكيداتا',
                  description: item.description,
                  total_pages: 200,
                });
              }
            }
          }
        } catch (e) {
          console.warn('Wikidata API fetch failed:', e);
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
          placeholder="ابحث بالعنوان أو الكاتب (Wikidata & Google Books)..."
          className="w-full pl-4 pr-10 py-3 rounded-xl bg-obsidian-950 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 outline-none transition-all"
        />
        {loading && <Loader2 className="absolute left-3 w-4 h-4 text-emerald-400 animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto divide-y divide-slate-800">
          <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> نتائج البحث الذكية باللغة العربية مع الأغلفة
          </div>
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectBook(item);
                setQuery(item.title);
                setOpen(false);
              }}
              className="w-full px-3 py-2.5 text-right hover:bg-slate-800/80 transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-11 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-xs shrink-0 overflow-hidden">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{item.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{item.author}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
