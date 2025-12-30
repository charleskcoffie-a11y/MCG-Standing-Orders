
import React from 'react';
import { Section, Favorite } from '../types';
import { Heart, ChevronRight } from 'lucide-react';

interface FavoritesTabProps {
  favorites: Favorite[];
  sections: Section[];
  onSelectSection: (section: Section) => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({ favorites, sections, onSelectSection }) => {
  const favoriteSections = favorites
    .map(f => sections.find(s => s.id === f.sectionId))
    .filter((s): s is Section => !!s);

  if (favoriteSections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-[#FBF9F6]">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-6">
          <Heart className="w-10 h-10 text-slate-200" />
        </div>
        <p className="text-xl serif font-semibold text-slate-800">No Favorites</p>
        <p className="text-slate-500 max-w-[240px] mx-auto text-sm mt-2">Tap the heart on any section to store it here for quick access.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#FBF9F6] overflow-y-auto">
      <div className="p-6 bg-white/80 backdrop-blur-md border-b border-[#E5E1DA] sticky top-0 z-10">
        <h2 className="serif text-2xl font-bold text-slate-800">Your Favorites</h2>
      </div>
      <div className="p-5 space-y-4">
        {favoriteSections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSelectSection(section)}
            className="w-full text-left p-5 bg-white rounded-2xl shadow-sm border border-[#E5E1DA] hover:border-[#6B0000]/20 transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex-1 pr-4">
              <span className="text-[10px] font-extrabold text-[#6B0000] uppercase tracking-widest mb-1 block">
                {section.category}
              </span>
              <h3 className="serif text-lg font-bold text-slate-800 leading-snug group-hover:text-[#6B0000]">{section.title}</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
