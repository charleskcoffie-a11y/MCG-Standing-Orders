
import React, { useState, useEffect, useRef } from 'react';
import { AppTab, Section, Favorite, Bookmark, Profile, Hymn, UserSettings } from './types';
import { SAMPLE_SECTIONS } from './constants';
import { StorageService } from './services/storage';
import { DocxParser } from './services/docxParser';
import { SupabaseService } from './services/supabase';
import { SearchTab } from './components/SearchTab';
import { HymnalTab } from './components/HymnalTab';
import { FavoritesTab } from './components/FavoritesTab';
import { Reader } from './components/Reader';
import { AuthView } from './components/AuthView';
import { PendingView } from './components/PendingView';
import { AdminView } from './components/AdminView';
import { Search, Heart, Bookmark as BookmarkIcon, Settings, RefreshCw, FileText, Loader2, LogOut, ShieldAlert, AlertCircle, CheckCircle2, Music, Database, Type, Eye, Globe, Cloud, Landmark, Hash, UploadCloud, ChevronRight, Moon, Sun, Smartphone, Volume2, Mic } from 'lucide-react';
import { applyDarkMode, haptic } from './services/utils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Search);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [sections, setSections] = useState<Section[]>(SAMPLE_SECTIONS);
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importStatus, setImportStatus] = useState<{message: string, type: 'info' | 'error' | 'success'} | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(StorageService.getSettings());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hymnInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const user = SupabaseService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await syncCloudData(user.id);
      }
      setIsInitialized(true);
      setBookmarks(StorageService.getBookmarks());
      
      // Apply dark mode on load
      const settings = StorageService.getSettings();
      applyDarkMode(settings.darkMode);
      setUserSettings(settings);
    };
    init();
  }, []);

  const syncCloudData = async (userId: string) => {
    setIsSyncing(true);
    try {
      const [cloudSections, cloudHymns, cloudFavs] = await Promise.all([
        SupabaseService.getSections(),
        SupabaseService.getHymns(),
        SupabaseService.getFavorites(userId)
      ]);
      
      if (cloudSections.length > 0) setSections(cloudSections);
      if (cloudHymns.length > 0) setHymns(cloudHymns);
      setFavorites(cloudFavs);
    } catch (e) {
      console.error("Cloud sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleFavorite = async (id: string | number, type: 'section' | 'hymn') => {
    if (!currentUser) return;
    const isCurrentlyFav = type === 'section' 
      ? favorites.some(f => f.sectionId === id)
      : favorites.some(f => f.hymnId === id);
    
    const newFavs = isCurrentlyFav 
      ? favorites.filter(f => type === 'section' ? f.sectionId !== id : f.hymnId !== id)
      : [...favorites, type === 'section' 
          ? { sectionId: id as string, itemType: 'section', createdAt: Date.now() } 
          : { hymnId: id as number, itemType: 'hymn', createdAt: Date.now() }
        ];
    
    setFavorites(newFavs as Favorite[]);

    try {
      if (isCurrentlyFav) {
        await SupabaseService.removeFavorite(currentUser.id, id, type);
      } else {
        await SupabaseService.addFavorite(currentUser.id, id, type);
      }
    } catch (e) {
      console.error("Fav sync failed", e);
      await syncCloudData(currentUser.id);
    }
  };

  const handleImportLaw = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus({ message: 'Parsing document...', type: 'info' });
    try {
      const parsed = await DocxParser.parseFile(file);
      setSections(parsed);
      setImportStatus({ message: `Successfully parsed ${parsed.length} sections locally.`, type: 'success' });
      if (currentUser?.role === 'admin') {
        const result = await SupabaseService.uploadSections(parsed);
        const fresh = await SupabaseService.getSections();
        setSections(fresh);
        setImportStatus({ message: `Cloud database updated successfully.`, type: 'success' });
      }
    } catch (err: any) {
      setImportStatus({ message: err.message, type: 'error' });
    }
  };

  const handleImportHymnal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus({ message: 'Processing Hymnal JSON...', type: 'info' });
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (currentUser?.role === 'admin') {
        const result = await SupabaseService.uploadHymns(data);
        const fresh = await SupabaseService.getHymns();
        setHymns(fresh);
        const msg = (result && result._isDuplicate) 
          ? "Hymns already existed in cloud." 
          : `Successfully imported ${data.length} hymns to cloud.`;
        setImportStatus({ message: msg, type: 'success' });
      } else {
        setHymns(data);
        setImportStatus({ message: `Loaded ${data.length} hymns locally.`, type: 'success' });
      }
    } catch (err: any) {
      setImportStatus({ message: err.message || 'Invalid JSON format', type: 'error' });
    }
  };

  const handleAuthenticated = async () => {
    const user = SupabaseService.getCurrentUser();
    setCurrentUser(user);
    if (user) await syncCloudData(user.id);
  };

  const handleSignOut = () => {
    SupabaseService.signOut();
    setCurrentUser(null);
  };

  const handleSelectSection = (section: Section, query: string = '') => {
    setSearchQuery(query);
    setSelectedSection(section);
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...userSettings, [key]: value };
    setUserSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case AppTab.Search:
        return <SearchTab sections={sections} onSelectSection={handleSelectSection} />;
      case AppTab.Hymnal:
        return <HymnalTab hymns={hymns} favorites={favorites} onToggleFavorite={(id) => toggleFavorite(id, 'hymn')} />;
      case AppTab.Favorites:
        return (
          <FavoritesTab 
            favorites={favorites} 
            sections={sections} 
            hymns={hymns}
            onSelectSection={(s) => handleSelectSection(s)} 
            onToggleFavorite={toggleFavorite}
          />
        );
      case AppTab.Admin:
        return <AdminView />;
      case AppTab.Bookmarks:
        return (
          <div className="h-full bg-[#FBF9F6] overflow-y-auto">
             <div className="p-6 bg-white border-b border-[#E5E1DA] sticky top-0 z-10">
               <h2 className="serif text-2xl font-bold text-slate-800">Bookmarks</h2>
             </div>
             <div className="p-5 space-y-4">
               {bookmarks.length === 0 ? (
                 <div className="py-20 text-center text-slate-400">No bookmarks saved yet.</div>
               ) : (
                 bookmarks.map(bm => {
                   const section = sections.find(s => s.id === bm.sectionId);
                   if (!section) return null;
                   return (
                     <button key={bm.id} onClick={() => handleSelectSection(section)} className="w-full text-left p-5 bg-white rounded-2xl shadow-sm border border-[#E5E1DA] hover:border-[#6B0000]/20 transition-all">
                        <span className="text-[10px] font-black text-[#6B0000] uppercase block mb-1">{section.category}</span>
                        <h3 className="serif font-bold text-slate-800 mb-1">{section.title}</h3>
                        <p className="text-sm text-slate-500 italic line-clamp-2">"{bm.snippet}"</p>
                     </button>
                   );
                 })
               )}
             </div>
          </div>
        );
      case AppTab.Settings:
        return (
          <div className="h-full bg-[#FBF9F6] dark:bg-slate-900 overflow-y-auto pb-20">
             <div className="p-6 bg-white dark:bg-slate-800 border-b border-[#E5E1DA] dark:border-slate-700 sticky top-0 z-10 flex items-center justify-between">
               <h2 className="serif text-2xl font-bold text-slate-800 dark:text-slate-100">Menu</h2>
               <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                  <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">
                    {isSyncing ? 'Syncing...' : 'Cloud Ready'}
                  </span>
               </div>
             </div>

             <div className="p-5 space-y-6">
               {/* Profile Section */}
               <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-[#E5E1DA] dark:border-slate-700 shadow-sm">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#6B0000] dark:bg-[#D4AF37] text-white dark:text-slate-900 flex items-center justify-center font-bold text-xl serif uppercase">
                      {currentUser.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">{currentUser.full_name}</p>
                      <p className="text-xs text-slate-400">{currentUser.church}</p>
                    </div>
                 </div>
               </div>

               {/* Import Status Alert */}
               {importStatus && (
                 <div className={`p-4 rounded-2xl flex items-start gap-3 border animate-in slide-in-from-top-2 duration-300 ${
                   importStatus.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400' : 
                   importStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 
                   'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                 }`}>
                   {importStatus.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                   <p className="text-xs font-bold leading-tight">{importStatus.message}</p>
                 </div>
               )}

               {/* Reading Preferences */}
               <section>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <Eye className="w-4 h-4 text-[#6B0000] dark:text-[#D4AF37]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Reading Preference</h3>
                 </div>
                 <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-[#E5E1DA] dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700 overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Moon className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Dark Mode</span>
                       </div>
                       <button 
                         onClick={() => {
                           const newValue = !userSettings.darkMode;
                           updateSetting('darkMode', newValue);
                           applyDarkMode(newValue);
                           if (userSettings.hapticFeedback) haptic.light();
                         }}
                         className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${userSettings.darkMode ? 'bg-[#6B0000] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-600'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${userSettings.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Smartphone className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Haptic Feedback</span>
                       </div>
                       <button 
                         onClick={() => {
                           updateSetting('hapticFeedback', !userSettings.hapticFeedback);
                           if (!userSettings.hapticFeedback) haptic.success();
                         }}
                         className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${userSettings.hapticFeedback ? 'bg-[#6B0000] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-600'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${userSettings.hapticFeedback ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Type className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Display Font</span>
                       </div>
                       <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                          {(['serif', 'sans'] as const).map(f => (
                            <button key={f} onClick={() => {
                              updateSetting('preferredFont', f);
                              if (userSettings.hapticFeedback) haptic.light();
                            }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${userSettings.preferredFont === f ? 'bg-white dark:bg-slate-600 shadow-sm text-[#6B0000] dark:text-[#D4AF37]' : 'text-slate-400'}`}>
                              {f}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Hash className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Verse Highlighting</span>
                       </div>
                       <button 
                         onClick={() => {
                           updateSetting('highlightVerses', !userSettings.highlightVerses);
                           if (userSettings.hapticFeedback) haptic.light();
                         }}
                         className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${userSettings.highlightVerses ? 'bg-[#6B0000] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-600'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${userSettings.highlightVerses ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Volume2 className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Text-to-Speech</span>
                       </div>
                       <button 
                         onClick={() => {
                           updateSetting('ttsEnabled', !userSettings.ttsEnabled);
                           if (userSettings.hapticFeedback) haptic.light();
                         }}
                         className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${userSettings.ttsEnabled ? 'bg-[#6B0000] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-600'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${userSettings.ttsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Mic className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Voice Search</span>
                       </div>
                       <button 
                         onClick={() => {
                           updateSetting('voiceSearchEnabled', !userSettings.voiceSearchEnabled);
                           if (userSettings.hapticFeedback) haptic.light();
                         }}
                         className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${userSettings.voiceSearchEnabled ? 'bg-[#6B0000] dark:bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-600'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${userSettings.voiceSearchEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                 </div>
               </section>

               {/* Data Management Section */}
               <section>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <Database className="w-4 h-4 text-[#6B0000] dark:text-[#D4AF37]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Cloud Management</h3>
                 </div>
                 <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-[#E5E1DA] dark:border-slate-700 overflow-hidden">
                    <button 
                      onClick={() => {
                        if (currentUser) syncCloudData(currentUser.id);
                        if (userSettings.hapticFeedback) haptic.medium();
                      }}
                      disabled={isSyncing}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:bg-slate-100 dark:active:bg-slate-600"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className={`w-5 h-5 text-slate-400 ${isSyncing ? 'animate-spin text-[#6B0000] dark:text-[#D4AF37]' : ''}`} />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Refresh Data Sync</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                 </div>
               </section>

               <section>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <UploadCloud className="w-4 h-4 text-[#6B0000] dark:text-[#D4AF37]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Data & Import</h3>
                 </div>
                 <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-[#E5E1DA] dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700 overflow-hidden">
                    <button onClick={() => { fileInputRef.current?.click(); if (userSettings.hapticFeedback) haptic.light(); }} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                       <div className="flex items-center gap-3">
                         <FileText className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Import Law (.docx)</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={() => { hymnInputRef.current?.click(); if (userSettings.hapticFeedback) haptic.light(); }} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                       <div className="flex items-center gap-3">
                         <Music className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Import Hymnal (.json)</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={() => { setSections(SAMPLE_SECTIONS); if (userSettings.hapticFeedback) haptic.success(); }} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                       <div className="flex items-center gap-3">
                         <Landmark className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Load Sample Law Data</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                 </div>
               </section>

               <button onClick={handleSignOut} className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-red-100 dark:border-red-800">
                 <LogOut className="w-5 h-5" />
                 Sign Out from Device
               </button>
             </div>

             <input ref={fileInputRef} type="file" accept=".docx" className="hidden" onChange={handleImportLaw} />
             <input ref={ hymnInputRef } type="file" accept=".json" className="hidden" onChange={handleImportHymnal} />
          </div>
        );
      default: return null;
    }
  };

  if (!isInitialized) return null;
  if (!currentUser) return <AuthView onAuthenticated={handleAuthenticated} onGuestLogin={() => {
    const guestUser: Profile = {
      id: 'guest-' + Date.now(),
      username: 'Guest User',
      email: 'guest@local',
      fullName: 'Guest',
      church: 'Local',
      role: 'user',
      status: 'approved',
      createdAt: Date.now(),
      passcode: ''
    };
    setCurrentUser(guestUser);
  }} />;
  if (currentUser.status === 'pending' || currentUser.status === 'rejected') {
    return <PendingView user={currentUser} onStatusUpdate={() => setCurrentUser({...currentUser, status: 'approved'})} onSignOut={handleSignOut} />;
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-[430px] mx-auto bg-white dark:bg-slate-900 relative shadow-2xl">
      <div className="flex-1 overflow-hidden relative">
        {renderTabContent()}
      </div>

      <nav className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-t border-[#E5E1DA] dark:border-slate-700 flex items-center justify-around px-2 z-50 fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto" style={{height: 'calc(5rem + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <TabButton active={activeTab === AppTab.Search} onClick={() => { setActiveTab(AppTab.Search); if (userSettings.hapticFeedback) haptic.light(); }} icon={<Search />} label="Law" />
        <TabButton active={activeTab === AppTab.Hymnal} onClick={() => { setActiveTab(AppTab.Hymnal); if (userSettings.hapticFeedback) haptic.light(); }} icon={<Music />} label="Hymns" />
        <TabButton active={activeTab === AppTab.Favorites} onClick={() => { setActiveTab(AppTab.Favorites); if (userSettings.hapticFeedback) haptic.light(); }} icon={<Heart />} label="Favs" />
        <TabButton active={activeTab === AppTab.Bookmarks} onClick={() => { setActiveTab(AppTab.Bookmarks); if (userSettings.hapticFeedback) haptic.light(); }} icon={<BookmarkIcon />} label="Marks" />
        {currentUser.role === 'admin' && (
          <TabButton active={activeTab === AppTab.Admin} onClick={() => { setActiveTab(AppTab.Admin); if (userSettings.hapticFeedback) haptic.light(); }} icon={<ShieldAlert />} label="Admin" />
        )}
        <TabButton active={activeTab === AppTab.Settings} onClick={() => { setActiveTab(AppTab.Settings); if (userSettings.hapticFeedback) haptic.light(); }} icon={<Settings />} label="Menu" />
      </nav>

      {selectedSection && (
        <Reader 
          section={selectedSection} 
          searchQuery={searchQuery} 
          isFavorite={favorites.some(f => f.sectionId === selectedSection.id)}
          onToggleFavorite={() => toggleFavorite(selectedSection.id, 'section')}
          onBack={() => setSelectedSection(null)}
        />
      )}
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center w-full h-full relative group">
    <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-[#6B0000]/10 dark:bg-[#D4AF37]/10 text-[#6B0000] dark:text-[#D4AF37]' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 mb-0.5' })}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-[#6B0000] dark:text-[#D4AF37]' : 'text-slate-400'}`}>{label}</span>
    {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#6B0000] dark:bg-[#D4AF37] rounded-b-full shadow-[0_0_10px_#6B0000] dark:shadow-[0_0_10px_#D4AF37]" />}
  </button>
);

export default App;
