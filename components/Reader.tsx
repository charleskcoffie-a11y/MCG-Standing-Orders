
import React, { useState, useEffect } from 'react';
import { Section } from '../types';
import { ArrowLeft, Heart, Bookmark as BookmarkIcon, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { StorageService } from '../services/storage';

interface ReaderProps {
  section: Section;
  searchQuery: string;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const Reader: React.FC<ReaderProps> = ({ section, searchQuery, onBack, onNext, onPrev }) => {
  const [isFav, setIsFav] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    setIsFav(StorageService.isFavorite(section.id));
    // Scroll to top when section changes
    const main = document.getElementById('reader-content');
    if (main) main.scrollTop = 0;
  }, [section.id]);

  const toggleFavorite = () => {
    if (isFav) {
      StorageService.removeFavorite(section.id);
      setIsFav(false);
    } else {
      StorageService.saveFavorite({ sectionId: section.id, createdAt: Date.now() });
      setIsFav(true);
    }
  };

  const addBookmark = () => {
    StorageService.saveBookmark({
      id: Math.random().toString(36).substr(2, 9),
      sectionId: section.id,
      textOffset: 0,
      snippet: section.content.slice(0, 50) + '...',
      createdAt: Date.now()
    });
    triggerToast('Progress Bookmarked');
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const soMatch = highlight.match(/^(s\.?o\.?\s*|standing\s*order\s*)(\d+)/i);
    let regexSource = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (soMatch) {
      const num = soMatch[2];
      regexSource = `(s\\.o\\.?\\s*${num}|standing\\s*order\\s*${num}|\\b${num}\\b)`;
    } else if (/^\d+$/.test(highlight)) {
      regexSource = `(standing\\s*order\\s*${highlight}|s\\.o\\.?\\s*${highlight}|\\b${highlight}\\b)`;
    }
    const parts = text.split(new RegExp(`(${regexSource})`, 'gi'));
    return parts.map((part, i) => 
      new RegExp(regexSource, 'i').test(part)
        ? <mark key={i} className="bg-[#D4AF37]/20 text-[#6B0000] font-semibold rounded px-0.5">{part}</mark> 
        : part
    );
  };

  return (
    <div className="fixed inset-0 bg-[#FBF9F6] z-50 flex flex-col animate-in fade-in slide-in-from-right duration-300">
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#E5E1DA] p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center px-4 flex-1">
           <span className="text-[10px] font-extrabold text-[#6B0000] uppercase tracking-[0.2em]">
            {section.category}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={addBookmark} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-all">
            <BookmarkIcon className="w-5 h-5" />
          </button>
          <button onClick={toggleFavorite} className={`p-2.5 rounded-2xl active:scale-90 transition-all ${isFav ? 'bg-[#6B0000]/10 text-[#6B0000]' : 'bg-slate-50 text-slate-600'}`}>
            <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>
      </header>

      <main id="reader-content" className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full pb-32">
        <h1 className="serif text-3xl font-black text-slate-900 mb-10 leading-[1.2]">
          {highlightText(section.title, searchQuery)}
        </h1>
        <div className="serif text-xl text-slate-800 leading-[1.7] whitespace-pre-wrap font-medium">
          {highlightText(section.content, searchQuery)}
        </div>

        <div className="mt-20 pt-10 border-t border-[#E5E1DA] flex justify-between items-center">
          <button 
            disabled={!onPrev}
            onClick={onPrev}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border font-bold transition-all ${onPrev ? 'bg-white text-slate-700 hover:shadow-lg active:scale-95 border-[#E5E1DA]' : 'text-slate-300 border-slate-100 bg-transparent'}`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button 
             disabled={!onNext}
             onClick={onNext}
             className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border font-bold transition-all ${onNext ? 'bg-white text-slate-700 hover:shadow-lg active:scale-95 border-[#E5E1DA]' : 'text-slate-300 border-slate-100 bg-transparent'}`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white px-6 py-3 rounded-full shadow-2xl text-sm font-semibold z-50 animate-in fade-in slide-in-from-bottom-4">
          {showToast}
        </div>
      )}
    </div>
  );
};
