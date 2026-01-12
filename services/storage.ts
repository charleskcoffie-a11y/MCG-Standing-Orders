
import { Favorite, Bookmark, Section, Hymn, FavoriteHymn, UserSettings } from '../types';

const KEYS = {
  FAVORITES: 'mcso_favorites',
  HYMN_FAVORITES: 'mcso_hymn_favorites',
  BOOKMARKS: 'mcso_bookmarks',
  SECTIONS: 'mcso_sections_custom',
  HYMNS: 'mcso_hymns',
  SETTINGS: 'mcso_user_settings'
};

const DEFAULT_SETTINGS: UserSettings = {
  preferredFont: 'serif',
  defaultFontSize: 'base',
  autoSync: true
};

export const StorageService = {
  getSettings: (): UserSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: UserSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

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

  getHymnFavorites: (): FavoriteHymn[] => {
    const data = localStorage.getItem(KEYS.HYMN_FAVORITES);
    return data ? JSON.parse(data) : [];
  },
  toggleHymnFavorite: (hymnId: number) => {
    const favs = StorageService.getHymnFavorites();
    const exists = favs.some(f => f.hymnId === hymnId);
    if (exists) {
      localStorage.setItem(KEYS.HYMN_FAVORITES, JSON.stringify(favs.filter(f => f.hymnId !== hymnId)));
    } else {
      localStorage.setItem(KEYS.HYMN_FAVORITES, JSON.stringify([...favs, { hymnId, createdAt: Date.now() }]));
    }
  },
  isHymnFavorite: (hymnId: number): boolean => {
    return StorageService.getHymnFavorites().some(f => f.hymnId === hymnId);
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

  getHymns: (): Hymn[] => {
    const data = localStorage.getItem(KEYS.HYMNS);
    return data ? JSON.parse(data) : [];
  },
  saveHymns: (hymns: Hymn[]) => {
    localStorage.setItem(KEYS.HYMNS, JSON.stringify(hymns));
  },

  clearAll: () => {
    localStorage.clear();
  }
};
