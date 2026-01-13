
import { Favorite, Bookmark, Section, Hymn, FavoriteHymn, UserSettings, ReadingHistory, SearchHistory, ReadingProgress, Note } from '../types';

const KEYS = {
  FAVORITES: 'mcso_favorites',
  HYMN_FAVORITES: 'mcso_hymn_favorites',
  BOOKMARKS: 'mcso_bookmarks',
  SECTIONS: 'mcso_sections_custom',
  HYMNS: 'mcso_hymns',
  SETTINGS: 'mcso_user_settings',
  READING_HISTORY: 'mcso_reading_history',
  SEARCH_HISTORY: 'mcso_search_history',
  READING_PROGRESS: 'mcso_reading_progress',
  NOTES: 'mcso_notes'
};

const DEFAULT_SETTINGS: UserSettings = {
  preferredFont: 'serif',
  defaultFontSize: 'base',
  autoSync: true,
  highlightVerses: true,
  darkMode: false,
  hapticFeedback: true,
  voiceSearchEnabled: true,
  ttsEnabled: true
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
  },

  // Reading History
  getReadingHistory: (): ReadingHistory[] => {
    const data = localStorage.getItem(KEYS.READING_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  addToReadingHistory: (itemId: string | number, itemType: 'section' | 'hymn', title: string) => {
    const history = StorageService.getReadingHistory();
    const existing = history.find(h => h.itemId === itemId && h.itemType === itemType);
    
    if (existing) {
      existing.lastReadAt = Date.now();
      existing.readCount++;
    } else {
      history.unshift({ id: Math.random().toString(36).substr(2, 9), itemId, itemType, title, lastReadAt: Date.now(), readCount: 1 });
    }
    
    localStorage.setItem(KEYS.READING_HISTORY, JSON.stringify(history.slice(0, 50)));
  },
  clearReadingHistory: () => {
    localStorage.removeItem(KEYS.READING_HISTORY);
  },

  // Search History
  getSearchHistory: (): SearchHistory[] => {
    const data = localStorage.getItem(KEYS.SEARCH_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  addSearchHistory: (query: string) => {
    if (!query.trim()) return;
    const history = StorageService.getSearchHistory();
    const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
    filtered.unshift({ query, timestamp: Date.now() });
    localStorage.setItem(KEYS.SEARCH_HISTORY, JSON.stringify(filtered.slice(0, 20)));
  },
  clearSearchHistory: () => {
    localStorage.removeItem(KEYS.SEARCH_HISTORY);
  },

  // Reading Progress
  getReadingProgress: (sectionId: string): ReadingProgress | null => {
    const data = localStorage.getItem(KEYS.READING_PROGRESS);
    const all: ReadingProgress[] = data ? JSON.parse(data) : [];
    return all.find(p => p.sectionId === sectionId) || null;
  },
  saveReadingProgress: (progress: ReadingProgress) => {
    const data = localStorage.getItem(KEYS.READING_PROGRESS);
    const all: ReadingProgress[] = data ? JSON.parse(data) : [];
    const index = all.findIndex(p => p.sectionId === progress.sectionId);
    
    if (index >= 0) {
      all[index] = progress;
    } else {
      all.push(progress);
    }
    
    localStorage.setItem(KEYS.READING_PROGRESS, JSON.stringify(all));
  },

  // Notes
  getNotes: (itemId?: string | number, itemType?: 'section' | 'hymn'): Note[] => {
    const data = localStorage.getItem(KEYS.NOTES);
    const all: Note[] = data ? JSON.parse(data) : [];
    
    if (itemId && itemType) {
      return all.filter(n => n.itemId === itemId && n.itemType === itemType);
    }
    
    return all;
  },
  saveNote: (note: Note) => {
    const notes = StorageService.getNotes();
    const index = notes.findIndex(n => n.id === note.id);
    
    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.push(note);
    }
    
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  },
  deleteNote: (id: string) => {
    const notes = StorageService.getNotes();
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes.filter(n => n.id !== id)));
  }
};
