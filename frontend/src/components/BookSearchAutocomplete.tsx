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
        const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
          query
        )}&language=ar&type=item&format=json&origin=*`;
        const res = await fetch(wikidataUrl);
        const data = await res.json();

        const searchResults: WikidataBookResult[] = (data.search || []).slice(0, 7).map((item: any) => {
          return {
            id: item.id,
            title: item.label || query,
            author: item.description || 'كتاب / مؤلف غير معروف',
            description: item.description,
            cover_url: `https://covers.openlibrary.org/b/isbn/${item.id}-M.jpg`,
          };
        });

        setResults(searchResults);
        setOpen(true);
      } catch (err) {
        console.error('Wikidata search error:', err);
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
          placeholder="ابحث عن كتاب بـ Wikidata API (عنوان الكتاب أو الكاتب)..."
          className="w-full pl-4 pr-10 py-3 rounded-xl bg-obsidian-950 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 outline-none transition-all"
        />
        {loading && <Loader2 className="absolute left-3 w-4 h-4 text-emerald-400 animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto divide-y divide-slate-800">
          <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> نتائج البحث الذكية من Wikidata API
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
