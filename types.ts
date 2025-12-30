
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

export interface Section {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  category: 'Constitution' | 'Standing Orders' | 'Other';
  parentTitle?: string;
}

export interface Favorite {
  sectionId: string;
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
