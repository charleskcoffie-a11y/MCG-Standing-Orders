
import { Profile, UserStatus, Section, Hymn, Favorite } from '../types';
import { ADMIN_PASSCODE } from '../constants';

const SUPABASE_URL = 'https://wapaycqvzjthsplfjawz.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcGF5Y3F2emp0aHNwbGZqYXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjAwNTQsImV4cCI6MjA4MzgzNjA1NH0.8LvqQB3fElq8RQjX24zKMqYJQxskxiJLc3iHgsHPEME';

async function sbFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers as Record<string, string>)
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Database error (${response.status}): ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
      console.error("Supabase Detailed Error:", JSON.stringify(errorJson, null, 2));
      
      // Special handling for duplicate keys
      if (errorJson.code === "23505") {
        return { _isDuplicate: true, message: errorJson.message };
      }
    } catch (e) {
      console.error("Supabase Raw Error:", errorText);
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const SupabaseService = {
  _profiles: [] as Profile[],
  _currentUser: null as Profile | null,

  _seedAdmin() {
    const adminExists = this._profiles.some(p => p.username.toLowerCase() === 'admin');
    if (!adminExists) {
      const adminProfile: Profile = {
        id: 'admin-001',
        email: 'admin@methodist.org.uk',
        username: 'admin',
        full_name: 'Conference Admin',
        church: 'Methodist Conference',
        role: 'admin',
        status: 'approved',
        created_at: Date.now()
      };
      this._profiles.push(adminProfile);
      this.saveToLocal();
    }
  },

  async signUp(email: string, username: string, fullName: string, church: string, password?: string): Promise<Profile> {
    this.loadFromLocal();
    const isAdmin = password === ADMIN_PASSCODE;
    const newProfile: Profile = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      email,
      username,
      full_name: fullName,
      church,
      role: isAdmin ? 'admin' : 'user',
      status: isAdmin ? 'approved' : 'pending',
      created_at: Date.now()
    };
    this._profiles.push(newProfile);
    this._currentUser = newProfile;
    this.saveToLocal();
    return newProfile;
  },

  async signIn(identifier: string, password?: string): Promise<Profile | null> {
    this.loadFromLocal();
    const idLower = identifier.toLowerCase();
    if (idLower === 'admin' && password === ADMIN_PASSCODE) {
      this._seedAdmin();
      this._currentUser = this._profiles.find(p => p.username === 'admin') || null;
    } else {
      const user = this._profiles.find(p => p.email.toLowerCase() === idLower || p.username.toLowerCase() === idLower);
      if (user) this._currentUser = user;
    }
    this.saveToLocal();
    return this._currentUser;
  },

  signOut() {
    this._currentUser = null;
    localStorage.removeItem('mock_current_user');
  },

  getCurrentUser(): Profile | null {
    if (!this._currentUser) this.loadFromLocal();
    return this._currentUser;
  },

  async getSections(): Promise<Section[]> {
    const data = await sbFetch('sections?select=*&order=order_index.asc');
    return data.map((s: any) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      category: s.category,
      orderIndex: s.order_index
    }));
  },

  async uploadSections(sections: Section[]) {
    // Upsert logic to prevent duplicate primary keys
    const payload = sections.map(s => ({
      title: s.title,
      content: s.content,
      category: s.category,
      order_index: s.orderIndex
    }));
    
    return await sbFetch('sections', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates, return=representation' },
      body: JSON.stringify(payload)
    });
  },

  async getHymns(): Promise<Hymn[]> {
    return await sbFetch('hymns?select=*&order=number.asc');
  },

  async uploadHymns(hymns: any[]) {
    const payload = hymns.map(h => ({
      collection: h.collection,
      code: h.code,
      number: h.number,
      title: h.title,
      author: h.author,
      lyrics: h.lyrics,
      tags: h.tags
    }));

    // Use Upsert behavior to avoid 23505 error if record already exists
    const result = await sbFetch('hymns', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates, return=representation' },
      body: JSON.stringify(payload)
    });

    if (result && result._isDuplicate) {
       // If standard POST with resolution header fails for some reason, 
       // we still return a friendly indication that the operation was redundant
       return { success: true, message: "Records already existed." };
    }
    return result;
  },

  async getFavorites(userId: string): Promise<Favorite[]> {
    try {
      const data = await sbFetch(`favorites?user_id=eq.${userId}&select=*`);
      return data.map((f: any) => ({ 
        sectionId: f.section_id, 
        hymnId: f.hymn_id,
        itemType: f.item_type,
        createdAt: new Date(f.created_at).getTime() 
      }));
    } catch (e) {
      return [];
    }
  },

  async addFavorite(userId: string, targetId: string | number, type: 'section' | 'hymn') {
    const body: any = { user_id: userId, item_type: type };
    if (type === 'section') body.section_id = targetId;
    else body.hymn_id = targetId;
    
    return await sbFetch('favorites', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates, return=representation' },
      body: JSON.stringify(body)
    });
  },

  async removeFavorite(userId: string, targetId: string | number, type: 'section' | 'hymn') {
    const col = type === 'section' ? 'section_id' : 'hymn_id';
    const url = `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&${col}=eq.${targetId}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
  },

  saveToLocal() {
    localStorage.setItem('mock_profiles', JSON.stringify(this._profiles));
    if (this._currentUser) localStorage.setItem('mock_current_user', JSON.stringify(this._currentUser));
  },

  loadFromLocal() {
    const p = localStorage.getItem('mock_profiles');
    this._profiles = p ? JSON.parse(p) : [];
    const u = localStorage.getItem('mock_current_user');
    if (u) this._currentUser = JSON.parse(u);
  },

  async updateStatus(userId: string, status: UserStatus) {
    this.loadFromLocal();
    const idx = this._profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      this._profiles[idx].status = status;
      this.saveToLocal();
    }
  },

  async getPendingProfiles(): Promise<Profile[]> {
    this.loadFromLocal();
    return this._profiles.filter(p => p.status === 'pending');
  },

  subscribeToStatus(userId: string, callback: (status: UserStatus) => void) {
    const interval = setInterval(() => {
      this.loadFromLocal();
      const user = this._profiles.find(p => p.id === userId);
      if (user) callback(user.status);
    }, 2000);
    return () => clearInterval(interval);
  }
};
