
import React, { useState, useMemo } from 'react';
import { Hymn, Favorite } from '../types';
import { Search, Music, ChevronRight, ArrowLeft, BookOpen, Heart, Type } from 'lucide-react';

interface HymnalTabProps {
  hymns: Hymn[];
  favorites: Favorite[];
  onToggleFavorite: (hymnId: number) => void;
}

type CollectionType = 'ALL' | 'MHB' | 'CAN' | 'CANTICLE';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export const HymnalTab: React.FC<HymnalTabProps> = ({ hymns, favorites, onToggleFavorite }) => {
  const [query, setQuery] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [activeCollection, setActiveCollection] = useState<CollectionType>('ALL');
  const [fontSize, setFontSize] = useState<FontSize>('base');

  const isHymnFav = (id: number) => favorites.some(f => f.hymnId === id);

  const cycleFontSize = () => {
    const sizes: FontSize[] = ['sm', 'base', 'lg', 'xl'];
    const nextIndex = (sizes.indexOf(fontSize) + 1) % sizes.length;
    setFontSize(sizes[nextIndex]);
  };

  const filteredHymns = useMemo(() => {
    let baseList = hymns;

    if (activeCollection !== 'ALL') {
      baseList = baseList.filter(h => {
        const coll = h.collection?.toUpperCase() || '';
        const code = h.code?.toUpperCase() || '';
        if (activeCollection === 'MHB') return coll === 'MHB' || code.startsWith('MHB');
        if (activeCollection === 'CAN') return coll === 'CAN' || code.startsWith('CAN');
        if (activeCollection === 'CANTICLE') return coll.includes('CANT') || code.includes('CANT');
        return true;
      });
    }

    if (!query.trim()) return baseList.slice(0, 100);

    const q = query.toLowerCase().trim();
    return baseList.filter(h => 
      h.title.toLowerCase().includes(q) ||
      h.number.toString() === q ||
      h.code.toLowerCase().includes(q) ||
      h.lyrics.toLowerCase().includes(q) ||
      (h.author && h.author.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [query, hymns, activeCollection]);

  if (selectedHymn) {
    const fontSizeClass = {
      sm: 'text-base',
      base: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl'
    }[fontSize];

    const isFav = isHymnFav(selectedHymn.id);

    return (
      <div className="fixed inset-0 bg-[#FBF9F6] z-50 flex flex-col animate-in fade-in slide-in-from-right duration-300">
        <header className="bg-white border-b border-[#E5E1DA] p-3 flex items-center gap-2 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setSelectedHymn(null)} className="p-2 bg-slate-50 rounded-xl text-slate-600 active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-[#6B0000] uppercase tracking-widest leading-none mb-0.5">{selectedHymn.collection} {selectedHymn.number}</p>
            <h2 className="serif text-sm font-bold truncate text-slate-800 leading-tight">{selectedHymn.title}</h2>
          </div>
          <div className="flex gap-1">
            <button onClick={cycleFontSize} className="p-2 bg-slate-50 rounded-xl text-slate-500 flex items-center gap-1 active:bg-slate-100">
              <Type className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">{fontSize}</span>
            </button>
            <button onClick={() => onToggleFavorite(selectedHymn.id)} className={`p-2 rounded-xl transition-all ${isFav ? 'bg-[#6B0000]/10 text-[#6B0000]' : 'bg-slate-50 text-slate-400'}`}>
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          <div className="max-w-xl mx-auto">
            <div className="mb-6 pb-3 border-b border-slate-100">
              <h1 className="serif text-2xl font-black text-slate-900 mb-1 leading-tight">{selectedHymn.title}</h1>
              <div className="flex items-center justify-between">
                {selectedHymn.author && <p className="text-xs text-slate-400 font-medium italic">By {selectedHymn.author}</p>}
                <span className="text-[9px] text-[#6B0000] font-black uppercase tracking-tighter bg-[#6B0000]/5 px-2 py-0.5 rounded">Ref: {selectedHymn.code}</span>
              </div>
            </div>
            {/* Reduced line-height from leading-snug to leading-[1.3] for a tighter, classic hymnal feel */}
            <div className={`serif ${fontSizeClass} text-slate-800 leading-[1.35] whitespace-pre-wrap font-normal`}>
              {selectedHymn.lyrics}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FBF9F6]">
      <header className="px-5 pt-8 pb-0 bg-white border-b border-[#E5E1DA] sticky top-0 z-20">
        <div className="flex items-center gap-2 mb-4">
          <Music className="w-5 h-5 text-[#6B0000]" />
          <h1 className="serif text-2xl font-bold text-[#6B0000]">Hymnal</h1>
        </div>
        
        <div className="relative group mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-slate-100/50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none text-base shadow-inner"
            placeholder={`Search ${activeCollection === 'ALL' ? 'hymns' : activeCollection}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {(['ALL', 'MHB', 'CAN', 'CANTICLE'] as CollectionType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveCollection(type)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeCollection === type 
                ? 'bg-[#6B0000] text-white border-[#6B0000] shadow-md shadow-[#6B0000]/20' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
              }`}
            >
              {type === 'CANTICLE' ? 'Canticles' : type}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {hymns.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
               <BookOpen className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium text-sm">No Hymnal data imported.</p>
            <p className="text-xs text-slate-400 mt-1">Go to Menu to import your JSON file.</p>
          </div>
        )}

        {filteredHymns.map(hymn => (
          <button
            key={hymn.id}
            onClick={() => setSelectedHymn(hymn)}
            className="w-full text-left p-3.5 bg-white rounded-2xl shadow-sm border border-[#E5E1DA] flex items-center gap-4 active:scale-[0.98] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#6B0000]/5 flex flex-col items-center justify-center shrink-0 group-hover:bg-[#6B0000]/10 transition-colors">
               <span className="text-[7px] font-black text-[#6B0000] leading-none uppercase mb-0.5">{hymn.collection || 'Hymn'}</span>
               <span className="text-xs font-bold text-[#6B0000]">{hymn.number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="serif text-base font-bold text-slate-800 truncate leading-tight mb-0.5">{hymn.title}</h3>
              <p className="text-[10px] text-slate-400 truncate italic">
                {hymn.lyrics.split('\n').find(l => l.trim().length > 0) || '...'}
              </p>
            </div>
            {isHymnFav(hymn.id) && (
              <Heart className="w-3 h-3 text-[#6B0000] fill-current mr-1" />
            )}
            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-[#6B0000] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
