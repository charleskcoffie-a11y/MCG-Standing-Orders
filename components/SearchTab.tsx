
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Section, SearchResult } from '../types';
import { Search, ChevronRight, BookOpen, Mic, X, Clock, TrendingUp } from 'lucide-react';
import { StorageService } from '../services/storage';
import { voiceSearch, haptic } from '../services/utils';

interface SearchTabProps {
  sections: Section[];
  onSelectSection: (section: Section, query: string) => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({ sections, onSelectSection }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState(StorageService.getSearchHistory());
  const [popularSections, setPopularSections] = useState<Section[]>([]);
  const settings = StorageService.getSettings();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get most viewed sections
    const history = StorageService.getReadingHistory();
    const sectionReads = history.filter(h => h.itemType === 'section');
    const topSections = sectionReads
      .sort((a, b) => b.readCount - a.readCount)
      .slice(0, 5)
      .map(h => sections.find(s => s.id === h.itemId))
      .filter((s): s is Section => !!s);
    setPopularSections(topSections);
  }, [sections]);

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

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      StorageService.addSearchHistory(searchQuery);
      setSearchHistory(StorageService.getSearchHistory());
    }
    setShowHistory(false);
  };

  const handleVoiceSearch = async () => {
    if (!settings.voiceSearchEnabled) return;
    
    if (settings.hapticFeedback) haptic.medium();
    setIsListening(true);
    
    try {
      const transcript = await voiceSearch();
      handleSearch(transcript);
      if (settings.hapticFeedback) haptic.success();
    } catch (error) {
      console.error('Voice search error:', error);
      if (settings.hapticFeedback) haptic.error();
    } finally {
      setIsListening(false);
    }
  };

  const clearHistory = () => {
    StorageService.clearSearchHistory();
    setSearchHistory([]);
    if (settings.hapticFeedback) haptic.light();
  };

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
    <div className="flex flex-col h-full bg-[#FBF9F6] dark:bg-slate-900">
      <header className="px-4 pt-6 pb-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-[#E5E1DA] dark:border-slate-700 sticky top-0 z-20">
        <h1 className="serif text-xl font-bold text-[#6B0000] dark:text-[#D4AF37] mb-3">Methodist Law</h1>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#6B0000] dark:group-focus-within:text-[#D4AF37] transition-colors" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="block w-full pl-10 pr-24 py-3 bg-slate-100/50 dark:bg-slate-700/50 border border-transparent rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#6B0000]/20 dark:focus:ring-[#D4AF37]/20 focus:border-[#6B0000] dark:focus:border-[#D4AF37] transition-all outline-none text-sm placeholder-slate-400 shadow-inner text-slate-900 dark:text-slate-100"
            placeholder="Search S.O or keyword..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => !query && setShowHistory(true)}
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            {query && (
              <button
                onClick={() => { setQuery(''); searchInputRef.current?.focus(); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            {settings.voiceSearchEnabled && (
              <button
                onClick={handleVoiceSearch}
                disabled={isListening}
                className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {!query && !showHistory && popularSections.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <TrendingUp className="w-4 h-4 text-[#6B0000] dark:text-[#D4AF37]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Most Viewed</h3>
            </div>
            <div className="space-y-2">
              {popularSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => onSelectSection(section, '')}
                  className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-[#E5E1DA] dark:border-slate-700 hover:border-[#6B0000]/30 dark:hover:border-[#D4AF37]/30 active:scale-[0.98] transition-all"
                >
                  <h4 className="serif text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{section.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{section.category}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {showHistory && searchHistory.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6B0000] dark:text-[#D4AF37]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Searches</h3>
              </div>
              <button
                onClick={clearHistory}
                className="text-xs text-slate-400 hover:text-[#6B0000] dark:hover:text-[#D4AF37] font-medium"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {searchHistory.slice(0, 10).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(item.query)}
                  className="w-full text-left px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-[#E5E1DA] dark:border-slate-700 hover:border-[#6B0000]/30 dark:hover:border-[#D4AF37]/30 transition-all flex items-center gap-2"
                >
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.query}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!query && !showHistory && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <BookOpen className="w-10 h-10 text-[#6B0000] dark:text-[#D4AF37]" />
            </div>
            <p className="text-xl serif font-semibold text-slate-800 dark:text-slate-200">Peace be with you</p>
            <p className="text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto text-sm mt-2">Enter a keyword or Standing Order number to begin your reference.</p>
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
            className="w-full text-left p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#E5E1DA] dark:border-slate-700 hover:border-[#6B0000]/30 dark:hover:border-[#D4AF37]/30 hover:shadow-md active:scale-[0.98] transition-all flex items-start gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                 <span className="px-2 py-0.5 rounded-full bg-[#6B0000]/5 dark:bg-[#D4AF37]/5 text-[#6B0000] dark:text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                  {res.section.category}
                </span>
              </div>
              <h3 className="serif text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1">
                {highlightText(res.section.title, query)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                {highlightText(res.snippet, query)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-[#6B0000]/10 dark:group-hover:bg-[#D4AF37]/10 group-hover:text-[#6B0000] dark:group-hover:text-[#D4AF37] shrink-0 mt-2">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
