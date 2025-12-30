
import React, { useState, useMemo } from 'react';
import { Section, SearchResult } from '../types';
import { Search, ChevronRight, BookOpen } from 'lucide-react';

interface SearchTabProps {
  sections: Section[];
  onSelectSection: (section: Section, query: string) => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({ sections, onSelectSection }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query || query.length < 1) return [];
    const lowerQuery = query.toLowerCase().trim();
    const isNumberOnly = /^\d+$/.test(lowerQuery);
    const soRegex = /^(s\.?o\.?\s*|standing\s*order\s*)(\d+)/i;
    const soMatch = lowerQuery.match(soRegex);
    
    const searchTerms: string[] = [lowerQuery];
    if (soMatch) {
      searchTerms.push(`standing order ${soMatch[2]}`);
      searchTerms.push(`so ${soMatch[2]}`);
    } else if (isNumberOnly) {
      searchTerms.push(`standing order ${lowerQuery}`);
    }

    const matches: SearchResult[] = [];
    sections.forEach(section => {
      let isMatch = false;
      let titleScore = 0;
      for (const term of searchTerms) {
        if (section.title.toLowerCase().includes(term)) {
          isMatch = true;
          titleScore = 2;
          break;
        }
        if (section.content.toLowerCase().includes(term)) {
          isMatch = true;
          titleScore = 1;
          break;
        }
      }

      if (isMatch) {
        const matchingTerm = searchTerms.find(t => section.content.toLowerCase().includes(t)) || searchTerms[0];
        const index = section.content.toLowerCase().indexOf(matchingTerm);
        let snippet = '';
        if (index !== -1) {
          const start = Math.max(0, index - 40);
          const end = Math.min(section.content.length, index + 80);
          snippet = (start > 0 ? '...' : '') + section.content.slice(start, end).replace(/\n/g, ' ') + (end < section.content.length ? '...' : '');
        } else {
          snippet = section.content.slice(0, 100).replace(/\n/g, ' ') + '...';
        }

        matches.push({
          section,
          matches: [], 
          snippet,
          // @ts-ignore
          score: titleScore
        });
      }
    });

    return matches.sort((a, b) => (b as any).score - (a as any).score);
  }, [query, sections]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const soMatch = highlight.match(/^(s\.?o\.?\s*|standing\s*order\s*)(\d+)/i);
    let regexSource = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (soMatch) {
      const num = soMatch[2];
      regexSource = `(s\\.o\\.?\\s*${num}|standing\\s*order\\s*${num}|\\b${num}\\b)`;
    } else if (/^\d+$/.test(highlight)) {
      regexSource = `(standing\\s*order\\s*${highlight}|s\\.o\\.?\\s*${highlight}|\\b${highlight}\\b)`;
    }

    const parts = text.split(new RegExp(`(${regexSource})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          new RegExp(regexSource, 'i').test(part)
            ? <mark key={i} className="bg-[#D4AF37]/30 text-[#6B0000] rounded px-0.5 font-semibold">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FBF9F6]">
      <header className="px-5 pt-8 pb-4 bg-white/80 backdrop-blur-md border-b border-[#E5E1DA] sticky top-0 z-20">
        <h1 className="serif text-2xl font-bold text-[#6B0000] mb-4">Methodist Church Law</h1>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#6B0000] transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3.5 bg-slate-100/50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none text-base placeholder-slate-400 shadow-inner"
            placeholder="Search S.O, Constitution or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {!query && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <BookOpen className="w-10 h-10 text-[#6B0000]" />
            </div>
            <p className="text-xl serif font-semibold text-slate-800">Peace be with you</p>
            <p className="text-slate-500 max-w-[240px] mx-auto text-sm mt-2">Enter a keyword or Standing Order number to begin your reference.</p>
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <p className="text-lg serif italic">No matches found for "{query}"</p>
          </div>
        )}

        {results.map((res, idx) => (
          <button
            key={res.section.id + idx}
            onClick={() => onSelectSection(res.section, query)}
            className="w-full text-left p-5 bg-white rounded-2xl shadow-sm border border-[#E5E1DA] hover:border-[#6B0000]/30 hover:shadow-md active:scale-[0.98] transition-all flex items-start gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                 <span className="px-2 py-0.5 rounded-full bg-[#6B0000]/5 text-[#6B0000] text-[10px] font-bold uppercase tracking-wider">
                  {res.section.category}
                </span>
              </div>
              <h3 className="serif text-lg font-bold text-slate-900 leading-snug mb-1">
                {highlightText(res.section.title, query)}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                {highlightText(res.snippet, query)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#6B0000]/10 group-hover:text-[#6B0000] shrink-0 mt-2">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
