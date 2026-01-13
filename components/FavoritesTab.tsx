
import React, { useState } from 'react';
import { Section, Favorite, Hymn } from '../types';
import { Heart, ChevronRight, Book, Music, ArrowLeft, Type } from 'lucide-react';
import { StorageService } from '../services/storage';

interface FavoritesTabProps {
  favorites: Favorite[];
  sections: Section[];
  hymns: Hymn[];
  onSelectSection: (section: Section) => void;
  onToggleFavorite: (id: string | number, type: 'section' | 'hymn') => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({ favorites, sections, hymns, onSelectSection, onToggleFavorite }) => {
  const [filter, setFilter] = useState<'ALL' | 'LAW' | 'HYMNS'>('ALL');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl' | 'xxl'>('base');
  const settings = StorageService.getSettings();

  const favoriteSections = favorites
    .filter(f => f.itemType === 'section' || f.sectionId)
    .map(f => sections.find(s => s.id === f.sectionId))
    .filter((s): s is Section => !!s);

  const favoriteHymns = favorites
    .filter(f => f.itemType === 'hymn' || f.hymnId)
    .map(f => hymns.find(h => h.id === f.hymnId))
    .filter((h): h is Hymn => !!h);

  const hasAnyFavorites = favoriteSections.length > 0 || favoriteHymns.length > 0;

  const formatLyrics = (text: string) => {
    // Split by double newlines to get verses
    const verses = text.split(/\n\n+/);
    
    return (
      <div className="space-y-3">
        {verses.map((verse, vIndex) => {
          const lines = verse.trim().split('\n');
          const firstLine = lines[0];
          
          // Check if first line is a verse number
          const verseNumberMatch = firstLine.match(/^(\d+[\.\)])\s*(.*)/);
          
          if (verseNumberMatch) {
            const [, number, restOfLine] = verseNumberMatch;
            return (
              <div key={vIndex} className="border-l-4 border-blue-500 dark:border-blue-400 pl-3 py-1">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-black text-xl leading-none shrink-0">
                    {number}
                  </span>
                  <div className="flex-1 space-y-0">
                    {restOfLine && <div className="leading-tight">{restOfLine}</div>}
                    {lines.slice(1).map((line, lIndex) => (
                      <div key={lIndex} className="leading-tight">{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          
          // Verse without number
          return (
            <div key={vIndex} className="border-l-4 border-blue-500 dark:border-blue-400 pl-3 py-1 space-y-0">
              {lines.map((line, lIndex) => (
                <div key={lIndex} className="leading-tight">{line}</div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  if (selectedHymn) {
    const fontSizeClass = { base: 'text-xl', lg: 'text-2xl', xl: 'text-3xl', xxl: 'text-4xl' }[fontSize];
    
    const cycleFontSize = () => {
      const sizes: ('base' | 'lg' | 'xl' | 'xxl')[] = ['base', 'lg', 'xl', 'xxl'];
      const nextIndex = (sizes.indexOf(fontSize) + 1) % sizes.length;
      setFontSize(sizes[nextIndex]);
    };
    
    return (
      <div className="fixed inset-0 bg-[#FBF9F6] dark:bg-slate-900 z-[60] flex flex-col animate-in fade-in slide-in-from-right duration-300">
        <header className="bg-white dark:bg-slate-800 border-b border-[#E5E1DA] dark:border-slate-700 p-3 flex items-center gap-2 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setSelectedHymn(null)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-200 active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-[#6B0000] dark:text-[#D4AF37] uppercase tracking-widest leading-none mb-0.5">{selectedHymn.collection} {selectedHymn.number}</p>
            <h2 className="serif text-sm font-bold truncate text-slate-800 dark:text-slate-100 leading-tight">{selectedHymn.title}</h2>
          </div>
          <button onClick={cycleFontSize} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Type className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">{fontSize}</span>
          </button>
          <button 
            onClick={() => {
              onToggleFavorite(selectedHymn.id, 'hymn');
              setSelectedHymn(null);
            }} 
            className="p-2 bg-[#6B0000]/10 dark:bg-[#D4AF37]/10 text-[#6B0000] dark:text-[#D4AF37] rounded-xl"
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-6 pb-24">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="serif text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 leading-tight">{selectedHymn.title}</h1>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  {selectedHymn.collection} {selectedHymn.number}
                </span>
                {selectedHymn.author && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">By {selectedHymn.author}</p>
                )}
              </div>
            </div>
            <div className={`serif ${fontSizeClass} text-slate-900 dark:text-slate-100 leading-[1.2] font-normal`}>
              {formatLyrics(selectedHymn.lyrics)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!hasAnyFavorites) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-[#FBF9F6]">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-6">
          <Heart className="w-10 h-10 text-slate-200" />
        </div>
        <p className="text-xl serif font-semibold text-slate-800">No Favorites</p>
        <p className="text-slate-500 max-w-[240px] mx-auto text-sm mt-2">Tap the heart on any Law section or Hymn to store it here for your private access.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#FBF9F6] dark:bg-slate-900 overflow-y-auto pb-24">
      <div className="p-6 bg-white dark:bg-slate-800 border-b border-[#E5E1DA] dark:border-slate-700 sticky top-0 z-10">
        <h2 className="serif text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Your Private Favorites</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${filter === 'ALL' ? 'bg-[#6B0000] text-white' : 'bg-slate-100 text-slate-400'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('LAW')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${filter === 'LAW' ? 'bg-[#6B0000] text-white' : 'bg-slate-100 text-slate-400'}`}
          >
            Law ({favoriteSections.length})
          </button>
          <button 
            onClick={() => setFilter('HYMNS')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${filter === 'HYMNS' ? 'bg-[#6B0000] text-white' : 'bg-slate-100 text-slate-400'}`}
          >
            Hymns ({favoriteHymns.length})
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {(filter === 'ALL' || filter === 'LAW') && favoriteSections.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
               <Book className="w-3.5 h-3.5 text-[#6B0000]" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Constitution & Law</h3>
            </div>
            <div className="space-y-3">
              {favoriteSections.map((section) => (
                <button
                  key={`fav-sec-${section.id}`}
                  onClick={() => onSelectSection(section)}
                  className="w-full text-left p-4 bg-white rounded-2xl shadow-sm border border-[#E5E1DA] flex items-center justify-between group"
                >
                  <div className="flex-1 pr-4">
                    <span className="text-[9px] font-extrabold text-[#6B0000] uppercase block mb-0.5">{section.category}</span>
                    <h3 className="serif text-base font-bold text-slate-800 leading-tight">{section.title}</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </section>
        )}

        {(filter === 'ALL' || filter === 'HYMNS') && favoriteHymns.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
               <Music className="w-3.5 h-3.5 text-[#6B0000]" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hymnal Favorites</h3>
            </div>
            <div className="space-y-3">
              {favoriteHymns.map((hymn) => (
                <button
                  key={`fav-hymn-${hymn.id}`}
                  onClick={() => setSelectedHymn(hymn)}
                  className="w-full text-left p-4 bg-white rounded-2xl shadow-sm border border-[#E5E1DA] flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#6B0000]/5 flex flex-col items-center justify-center shrink-0 group-hover:bg-[#6B0000]/10 transition-colors">
                    <span className="text-[7px] font-black text-[#6B0000] leading-none uppercase mb-0.5">{hymn.collection}</span>
                    <span className="text-xs font-bold text-[#6B0000]">{hymn.number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="serif text-base font-bold text-slate-800 truncate">{hymn.title}</h3>
                    <p className="text-[10px] text-slate-400 truncate italic">Ref: {hymn.code}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
