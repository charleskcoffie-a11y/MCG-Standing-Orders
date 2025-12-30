
import { Profile, UserStatus } from '../types';
import { ADMIN_PASSCODE } from '../constants';

export const SupabaseService = {
  // Mocking the backend for the interactive preview
  _profiles: [] as Profile[],
  _currentUser: null as Profile | null,

  _seedAdmin() {
    const adminExists = this._profiles.some(p => p.username.toLowerCase() === 'admin');
    if (!adminExists) {
      const adminProfile: Profile = {
        id: 'admin-fixed-id',
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
    
    const emailLower = email.toLowerCase();
    const userLower = username.toLowerCase();

    // Check if email or username already exists
    if (this._profiles.some(p => p.email.toLowerCase() === emailLower)) {
      throw new Error("Email already registered. Please sign in.");
    }
    if (this._profiles.some(p => p.username.toLowerCase() === userLower)) {
      throw new Error("Username already taken. Please choose another.");
    }

    const isAdmin = password === ADMIN_PASSCODE;
    
    const newProfile: Profile = {
      id: Math.random().toString(36).substr(2, 9),
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
    
    // Special case: If user enters 'admin' and the admin passcode, ensure they get in
    if (idLower === 'admin' && password === ADMIN_PASSCODE) {
      let admin = this._profiles.find(p => p.username.toLowerCase() === 'admin');
      if (!admin) {
        this._seedAdmin();
        admin = this._profiles.find(p => p.username.toLowerCase() === 'admin');
      }
      this._currentUser = admin || null;
      this.saveToLocal();
      return this._currentUser;
    }

    // Standard lookup
    const user = this._profiles.find(p => 
      p.email.toLowerCase() === idLower || 
      p.username.toLowerCase() === idLower
    );
    
    if (user) {
      // If the found user is an admin, they MUST use the passcode
      if (user.role === 'admin' && password !== ADMIN_PASSCODE) {
        throw new Error("Invalid admin passcode.");
      }
      
      this._currentUser = user;
      this.saveToLocal();
      return user;
    }
    return null;
  },

  async signOut() {
    this._currentUser = null;
    localStorage.removeItem('mock_current_user');
  },

  getCurrentUser(): Profile | null {
    if (!this._currentUser) this.loadFromLocal();
    return this._currentUser;
  },

  async getPendingProfiles(): Promise<Profile[]> {
    this.loadFromLocal();
    return this._profiles.filter(p => p.status === 'pending');
  },

  async updateStatus(userId: string, status: UserStatus) {
    const idx = this._profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      this._profiles[idx].status = status;
      this.saveToLocal();
    }
  },

  subscribeToStatus(userId: string, callback: (status: UserStatus) => void) {
    const interval = setInterval(() => {
      this.loadFromLocal();
      const user = this._profiles.find(p => p.id === userId);
      if (user) callback(user.status);
    }, 2000);
    return () => clearInterval(interval);
  },

  saveToLocal() {
    localStorage.setItem('mock_profiles', JSON.stringify(this._profiles));
    if (this._currentUser) localStorage.setItem('mock_current_user', JSON.stringify(this._currentUser));
  },

  loadFromLocal() {
    const p = localStorage.getItem('mock_profiles');
    if (p) {
      this._profiles = JSON.parse(p);
    } else {
      this._seedAdmin();
    }
    const u = localStorage.getItem('mock_current_user');
    if (u) this._currentUser = JSON.parse(u);
  }
};
