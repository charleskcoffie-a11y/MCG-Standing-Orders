
import { Favorite, Bookmark, Section } from '../types';

const KEYS = {
  FAVORITES: 'mcso_favorites',
  BOOKMARKS: 'mcso_bookmarks',
  SECTIONS: 'mcso_sections_custom'
};

export const StorageService = {
  getFavorites: (): Favorite[] => {
    const data = localStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  },
  saveFavorite: (fav: Favorite) => {
    const favs = StorageService.getFavorites();
    if (!favs.some(f => f.sectionId === fav.sectionId)) {
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify([...favs, fav]));
    }
  },
  removeFavorite: (sectionId: string) => {
    const favs = StorageService.getFavorites();
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs.filter(f => f.sectionId !== sectionId)));
  },
  isFavorite: (sectionId: string): boolean => {
    return StorageService.getFavorites().some(f => f.sectionId === sectionId);
  },

  getBookmarks: (): Bookmark[] => {
    const data = localStorage.getItem(KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  },
  saveBookmark: (bm: Bookmark) => {
    const bms = StorageService.getBookmarks();
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify([...bms, bm]));
  },
  deleteBookmark: (id: string) => {
    const bms = StorageService.getBookmarks();
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bms.filter(b => b.id !== id)));
  },

  getCustomSections: (): Section[] | null => {
    const data = localStorage.getItem(KEYS.SECTIONS);
    return data ? JSON.parse(data) : null;
  },
  saveCustomSections: (sections: Section[]) => {
    localStorage.setItem(KEYS.SECTIONS, JSON.stringify(sections));
  },
  clearCustomSections: () => {
    localStorage.removeItem(KEYS.SECTIONS);
  }
};
