
import React, { useState, useMemo } from 'react';
import { Hymn, Favorite } from '../types';
import { Search, Music, ChevronRight, ArrowLeft, BookOpen, Heart, Type, Share2, Copy, Volume2, VolumeX } from 'lucide-react';
import { StorageService } from '../services/storage';
import { haptic, share, copyToClipboard, TTSService } from '../services/utils';

const ttsService = new TTSService();

interface HymnalTabProps {
  hymns: Hymn[];
  favorites: Favorite[];
  onToggleFavorite: (hymnId: number) => void;
}

type CollectionType = 'ALL' | 'MHB' | 'CAN' | 'CANTICLE';
type FontSize = 'sm' | 'base' | 'lg' | 'xl' | 'xxl';

export const HymnalTab: React.FC<HymnalTabProps> = ({ hymns, favorites, onToggleFavorite }) => {
  const [query, setQuery] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [activeCollection, setActiveCollection] = useState<CollectionType>('ALL');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const settings = StorageService.getSettings();

  const isHymnFav = (id: number) => favorites.some(f => f.hymnId === id);

  const cycleFontSize = () => {
    const sizes: FontSize[] = ['base', 'lg', 'xl', 'xxl'];
    const nextIndex = (sizes.indexOf(fontSize) + 1) % sizes.length;
    setFontSize(sizes[nextIndex]);
    if (settings.hapticFeedback) haptic.light();
  };

  const formatLyrics = (text: string) => {
    // Split by double newlines to get verses
    const verses = text.split(/\n\n+/);
    
    return (
      <div className="space-y-6">
        {verses.map((verse, vIndex) => {
          const lines = verse.trim().split('\n');
          const firstLine = lines[0];
          
          // Check if first line is a verse number
          const verseNumberMatch = firstLine.match(/^(\d+[\.\)])\s*(.*)/);
          
          if (verseNumberMatch) {
            const [, number, restOfLine] = verseNumberMatch;
            return (
              <div key={vIndex} className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-[#6B0000] dark:text-[#D4AF37] font-black text-2xl leading-none shrink-0 mt-1">
                    {number}
                  </span>
                  <div className="flex-1 space-y-1">
                    {restOfLine && <div className="leading-relaxed">{restOfLine}</div>}
                    {lines.slice(1).map((line, lIndex) => (
                      <div key={lIndex} className="leading-relaxed">{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          
          // Verse without number
          return (
            <div key={vIndex} className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 backdrop-blur-sm space-y-1">
              {lines.map((line, lIndex) => (
                <div key={lIndex} className="leading-relaxed">{line}</div>
              ))}
            </div>
          );
        })}
      </div>
    );
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
      base: 'text-xl',
      lg: 'text-2xl',
      xl: 'text-3xl',
      xxl: 'text-4xl'
    }[fontSize];

    const isFav = isHymnFav(selectedHymn.id);

    const handleShare = async () => {
      if (settings.hapticFeedback) haptic.light();
      await share(selectedHymn.title, `${selectedHymn.title}\n${selectedHymn.collection} ${selectedHymn.number}\n\n${selectedHymn.lyrics}`);
    };

    const handleCopy = async () => {
      if (settings.hapticFeedback) haptic.light();
      const success = await copyToClipboard(`${selectedHymn.title}\n${selectedHymn.collection} ${selectedHymn.number}\n\n${selectedHymn.lyrics}`);
      if (success) {
        if (settings.hapticFeedback) haptic.success();
        setShowToast('Copied to clipboard');
        setTimeout(() => setShowToast(null), 2000);
      }
    };

    const toggleTTS = () => {
      if (!settings.ttsEnabled) return;
      if (settings.hapticFeedback) haptic.medium();
      
      if (isSpeaking) {
        ttsService.stop();
        setIsSpeaking(false);
      } else {
        ttsService.speak(`${selectedHymn.title}. ${selectedHymn.lyrics}`);
        setIsSpeaking(true);
      }
    };

    return (
      <div className="fixed inset-0 bg-[#FBF9F6] dark:bg-slate-900 z-50 flex flex-col animate-in fade-in slide-in-from-right duration-300">
        <header className="bg-white dark:bg-slate-800 border-b border-[#E5E1DA] dark:border-slate-700 p-3 flex items-center gap-2 sticky top-0 z-10 shadow-sm">
          <button onClick={() => { setSelectedHymn(null); ttsService.stop(); setIsSpeaking(false); }} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-200 active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-[#6B0000] dark:text-[#D4AF37] uppercase tracking-widest leading-none mb-0.5">{selectedHymn.collection} {selectedHymn.number}</p>
            <h2 className="serif text-sm font-bold truncate text-slate-800 dark:text-slate-100 leading-tight">{selectedHymn.title}</h2>
          </div>
          <div className="flex gap-1">
            <button onClick={cycleFontSize} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 flex items-center gap-1 active:bg-slate-100 dark:active:bg-slate-600">
              <Type className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">{fontSize}</span>
            </button>
            {settings.ttsEnabled && ttsService.isAvailable() && (
              <button onClick={toggleTTS} className={`p-2 rounded-xl transition-all ${isSpeaking ? 'bg-[#6B0000]/10 dark:bg-[#D4AF37]/10 text-[#6B0000] dark:text-[#D4AF37]' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'}`}>
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <button onClick={handleShare} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 active:bg-slate-100 dark:active:bg-slate-600">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handleCopy} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 active:bg-slate-100 dark:active:bg-slate-600">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => {
              onToggleFavorite(selectedHymn.id);
              if (settings.hapticFeedback) {
                if (isFav) haptic.light();
                else haptic.success();
              }
            }} className={`p-2 rounded-xl transition-all ${isFav ? 'bg-[#6B0000]/10 dark:bg-[#D4AF37]/10 text-[#6B0000] dark:text-[#D4AF37]' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'}`}>
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-6 pb-24">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="serif text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 leading-tight">{selectedHymn.title}</h1>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs font-black text-[#6B0000] dark:text-[#D4AF37] uppercase tracking-wider bg-[#6B0000]/10 dark:bg-[#D4AF37]/10 px-3 py-1 rounded-full">
                  {selectedHymn.collection} {selectedHymn.number}
                </span>
                {selectedHymn.author && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">By {selectedHymn.author}</p>
                )}
              </div>
            </div>
            <div className={`serif ${fontSizeClass} text-slate-900 dark:text-slate-100 leading-[1.7] font-normal`}>
              {formatLyrics(selectedHymn.lyrics)}
            </div>
          </div>
        </main>
        {showToast && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#1A1A1A] dark:bg-slate-700 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-semibold z-50 animate-in fade-in slide-in-from-bottom-4">
            {showToast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FBF9F6] dark:bg-slate-900">
      <header className="px-5 pt-8 pb-0 bg-white dark:bg-slate-800 border-b border-[#E5E1DA] dark:border-slate-700 sticky top-0 z-20">
        <div className="flex items-center gap-2 mb-4">
          <Music className="w-5 h-5 text-[#6B0000] dark:text-[#D4AF37]" />
          <h1 className="serif text-2xl font-bold text-[#6B0000] dark:text-[#D4AF37]">Hymnal</h1>
        </div>
        
        <div className="relative group mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-slate-100/50 dark:bg-slate-700/50 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#6B0000]/20 dark:focus:ring-[#D4AF37]/20 focus:border-[#6B0000] dark:focus:border-[#D4AF37] transition-all outline-none text-base shadow-inner text-slate-900 dark:text-slate-100 placeholder-slate-400"
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
                ? 'bg-[#6B0000] dark:bg-[#D4AF37] text-white dark:text-slate-900 border-[#6B0000] dark:border-[#D4AF37] shadow-md shadow-[#6B0000]/20 dark:shadow-[#D4AF37]/20' 
                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
               <BookOpen className="w-8 h-8 text-slate-200 dark:text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium text-sm">No Hymnal data imported.</p>
            <p className="text-xs text-slate-400 mt-1">Go to Menu to import your JSON file.</p>
          </div>
        )}

        {filteredHymns.map(hymn => (
          <button
            key={hymn.id}
            onClick={() => {
              setSelectedHymn(hymn);
              StorageService.addToReadingHistory(hymn.id, 'hymn', hymn.title);
              if (settings.hapticFeedback) haptic.light();
            }}
            className="w-full text-left p-3.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#E5E1DA] dark:border-slate-700 flex items-center gap-4 active:scale-[0.98] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#6B0000]/5 dark:bg-[#D4AF37]/5 flex flex-col items-center justify-center shrink-0 group-hover:bg-[#6B0000]/10 dark:group-hover:bg-[#D4AF37]/10 transition-colors">
               <span className="text-[7px] font-black text-[#6B0000] dark:text-[#D4AF37] leading-none uppercase mb-0.5">{hymn.collection || 'Hymn'}</span>
               <span className="text-xs font-bold text-[#6B0000] dark:text-[#D4AF37]">{hymn.number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="serif text-base font-bold text-slate-800 dark:text-slate-100 truncate leading-tight mb-0.5">{hymn.title}</h3>
              <p className="text-[10px] text-slate-400 truncate italic">
                {hymn.lyrics.split('\n').find(l => l.trim().length > 0) || '...'}
              </p>
            </div>
            {isHymnFav(hymn.id) && (
              <Heart className="w-3 h-3 text-[#6B0000] dark:text-[#D4AF37] fill-current mr-1" />
            )}
            <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-600 group-hover:text-[#6B0000] dark:group-hover:text-[#D4AF37] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
