
export type UserRole = 'user' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export interface Profile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  church?: string;
  role: UserRole;
  status: UserStatus;
  created_at: number;
}

export interface UserSettings {
  preferredFont: 'serif' | 'sans';
  defaultFontSize: 'sm' | 'base' | 'lg' | 'xl';
  autoSync: boolean;
  highlightVerses: boolean;
  darkMode: boolean;
  hapticFeedback: boolean;
  voiceSearchEnabled: boolean;
  ttsEnabled: boolean;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  category: 'Constitution' | 'Standing Orders' | 'Other';
  parentTitle?: string;
}

export interface Hymn {
  id: number;
  collection: string;
  code?: string;
  number: number;
  raw_title?: string;
  title: string;
  author?: string;
  copyright?: string;
  tags?: string;
  reference_number?: string;
  lyrics: string;
  is_favorite?: boolean;
}

export interface Favorite {
  sectionId?: string;
  hymnId?: number;
  itemType?: 'section' | 'hymn';
  createdAt: number;
}

export interface FavoriteHymn {
  hymnId: number;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  sectionId: string;
  textOffset: number;
  snippet: string;
  createdAt: number;
}

export enum AppTab {
  Search = 'search',
  Hymnal = 'hymnal',
  Favorites = 'favorites',
  Bookmarks = 'bookmarks',
  Settings = 'settings',
  Admin = 'admin'
}

export interface SearchResult {
  section: Section;
  matches: { start: number; end: number }[];
  snippet: string;
}

export interface ReadingHistory {
  id: string;
  itemId: string;
  itemType: 'section' | 'hymn';
  title: string;
  lastReadAt: number;
  readCount: number;
}

export interface SearchHistory {
  query: string;
  timestamp: number;
}

export interface ReadingProgress {
  sectionId: string;
  progress: number; // 0-100
  lastPosition: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  itemId: string;
  itemType: 'section' | 'hymn';
  content: string;
  createdAt: number;
  updatedAt: number;
}
