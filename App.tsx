
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
import { Search, Heart, Bookmark as BookmarkIcon, Settings, RefreshCw, FileText, Loader2, LogOut, ShieldAlert, AlertCircle, CheckCircle2, Music, Database, Type, Eye, Globe, Cloud, Landmark, Hash, UploadCloud, ChevronRight } from 'lucide-react';

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
          <div className="h-full bg-[#FBF9F6] overflow-y-auto pb-20">
             <div className="p-6 bg-white border-b border-[#E5E1DA] sticky top-0 z-10 flex items-center justify-between">
               <h2 className="serif text-2xl font-bold text-slate-800">Menu</h2>
               <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">
                    {isSyncing ? 'Syncing...' : 'Cloud Ready'}
                  </span>
               </div>
             </div>

             <div className="p-5 space-y-6">
               {/* Profile Section */}
               <div className="p-5 bg-white rounded-3xl border border-[#E5E1DA] shadow-sm">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#6B0000] text-white flex items-center justify-center font-bold text-xl serif uppercase">
                      {currentUser.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800 leading-none mb-1">{currentUser.full_name}</p>
                      <p className="text-xs text-slate-400">{currentUser.church}</p>
                    </div>
                 </div>
               </div>

               {/* Import Status Alert */}
               {importStatus && (
                 <div className={`p-4 rounded-2xl flex items-start gap-3 border animate-in slide-in-from-top-2 duration-300 ${
                   importStatus.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 
                   importStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                   'bg-blue-50 border-blue-100 text-blue-700'
                 }`}>
                   {importStatus.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                   <p className="text-xs font-bold leading-tight">{importStatus.message}</p>
                 </div>
               )}

               {/* Reading Preferences */}
               <section>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <Eye className="w-4 h-4 text-[#6B0000]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Reading Preference</h3>
                 </div>
                 <div className="bg-white rounded-3xl shadow-sm border border-[#E5E1DA] divide-y divide-slate-50 overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Type className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700">Display Font</span>
                       </div>
                       <div className="flex bg-slate-100 p-1 rounded-xl">
                          {(['serif', 'sans'] as const).map(f => (
                            <button key={f} onClick={() => updateSetting('preferredFont', f)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${userSettings.preferredFont === f ? 'bg-white shadow-sm text-[#6B0000]' : 'text-slate-400'}`}>
                              {f}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Hash className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700">Verse Highlighting</span>
                       </div>
                       <button 
                         onClick={() => updateSetting('highlightVerses', !userSettings.highlightVerses)}
                         className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${userSettings.highlightVerses ? 'bg-[#6B0000]' : 'bg-slate-200'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${userSettings.highlightVerses ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                 </div>
               </section>

               {/* Data Management Section */}
               <section>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <Database className="w-4 h-4 text-[#6B0000]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Cloud Management</h3>
                 </div>
                 <div className="bg-white rounded-3xl shadow-sm border border-[#E5E1DA] overflow-hidden">
                    <button 
                      onClick={() => currentUser && syncCloudData(currentUser.id)}
                      disabled={isSyncing}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all active:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className={`w-5 h-5 text-slate-400 ${isSyncing ? 'animate-spin text-[#6B0000]' : ''}`} />
                        <span className="text-sm font-bold text-slate-700">Refresh Data Sync</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                 </div>
               </section>

               <section>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <UploadCloud className="w-4 h-4 text-[#6B0000]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Data & Import</h3>
                 </div>
                 <div className="bg-white rounded-3xl shadow-sm border border-[#E5E1DA] divide-y divide-slate-50 overflow-hidden">
                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                       <div className="flex items-center gap-3">
                         <FileText className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700">Import Law (.docx)</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={() => hymnInputRef.current?.click()} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                       <div className="flex items-center gap-3">
                         <Music className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700">Import Hymnal (.json)</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                    <button onClick={() => setSections(SAMPLE_SECTIONS)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                       <div className="flex items-center gap-3">
                         <Landmark className="w-5 h-5 text-slate-400" />
                         <span className="text-sm font-bold text-slate-700">Load Sample Law Data</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                 </div>
               </section>

               <button onClick={handleSignOut} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-red-100">
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
  if (!currentUser) return <AuthView onAuthenticated={handleAuthenticated} />;
  if (currentUser.status === 'pending' || currentUser.status === 'rejected') {
    return <PendingView user={currentUser} onStatusUpdate={() => setCurrentUser({...currentUser, status: 'approved'})} onSignOut={handleSignOut} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white relative overflow-hidden shadow-2xl">
      <div className="flex-1 overflow-hidden relative">
        {renderTabContent()}
      </div>

      <nav className="bg-white/95 backdrop-blur-xl border-t border-[#E5E1DA] flex items-center justify-around h-20 safe-area-bottom px-2 z-40">
        <TabButton active={activeTab === AppTab.Search} onClick={() => setActiveTab(AppTab.Search)} icon={<Search />} label="Law" />
        <TabButton active={activeTab === AppTab.Hymnal} onClick={() => setActiveTab(AppTab.Hymnal)} icon={<Music />} label="Hymns" />
        <TabButton active={activeTab === AppTab.Favorites} onClick={() => setActiveTab(AppTab.Favorites)} icon={<Heart />} label="Favs" />
        <TabButton active={activeTab === AppTab.Bookmarks} onClick={() => setActiveTab(AppTab.Bookmarks)} icon={<BookmarkIcon />} label="Marks" />
        {currentUser.role === 'admin' && (
          <TabButton active={activeTab === AppTab.Admin} onClick={() => setActiveTab(AppTab.Admin)} icon={<ShieldAlert />} label="Admin" />
        )}
        <TabButton active={activeTab === AppTab.Settings} onClick={() => setActiveTab(AppTab.Settings)} icon={<Settings />} label="Menu" />
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
    <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-[#6B0000]/10 text-[#6B0000]' : 'text-slate-400 group-hover:text-slate-600'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 mb-0.5' })}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-[#6B0000]' : 'text-slate-400'}`}>{label}</span>
    {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#6B0000] rounded-b-full shadow-[0_0_10px_#6B0000]" />}
  </button>
);

export default App;
