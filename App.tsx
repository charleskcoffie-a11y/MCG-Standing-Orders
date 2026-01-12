
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
import { Search, Heart, Bookmark as BookmarkIcon, Settings, RefreshCw, FileText, Loader2, LogOut, ShieldAlert, AlertCircle, CheckCircle2, Music, Database, Type, Eye, Globe, Cloud, Landmark } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Search);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [sections, setSections] = useState<Section[]>(SAMPLE_SECTIONS);
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [isImporting, setIsImporting] = useState(false);
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

  const handleAuthenticated = async () => {
    const user = SupabaseService.getCurrentUser();
    setCurrentUser(user);
    if (user) await syncCloudData(user.id);
  };

  const handleSignOut = () => {
    SupabaseService.signOut();
    setCurrentUser(null);
  };

  const handleBack = () => {
    setSelectedSection(null);
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

  const toggleFavorite = async (id: string | number, type: 'section' | 'hymn') => {
    if (!currentUser) return;
    const isCurrentlyFav = type === 'section' 
      ? favorites.some(f => f.sectionId === id)
      : favorites.some(f => f.hymnId === id);
    
    const newFavs = isCurrentlyFav 
      ? favorites.filter(f => type === 'section' ? f.sectionId !== id : f.hymnId !== id)
      : [...favorites, type === 'section' ? { sectionId: id as string, createdAt: Date.now() } : { hymnId: id as number, createdAt: Date.now() }];
    
    setFavorites(newFavs as any);

    try {
      if (isCurrentlyFav) {
        await SupabaseService.removeFavorite(currentUser.id, id, type);
      } else {
        await SupabaseService.addFavorite(currentUser.id, id, type);
      }
    } catch (e) {
      console.error("Fav sync failed", e);
      setFavorites(favorites);
    }
  };

  const handleCheckUpdates = async () => {
    if (!currentUser) return;
    setImportStatus({ message: "Syncing with cloud...", type: 'info' });
    await syncCloudData(currentUser.id);
    setImportStatus({ message: "Cloud sync complete!", type: 'success' });
    setTimeout(() => setImportStatus(null), 2000);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStatus({ message: "Parsing & Uploading to Cloud...", type: 'info' });
    try {
      const parsedSections = await DocxParser.parseFile(file);
      if (parsedSections.length > 0) {
        await SupabaseService.uploadSections(parsedSections);
        const updated = await SupabaseService.getSections();
        setSections(updated);
        setImportStatus({ message: `Success! Loaded ${parsedSections.length} sections.`, type: 'success' });
        setTimeout(() => setImportStatus(null), 4000);
      }
    } catch (error: any) {
      setImportStatus({ message: error.message || "Upload failed. Check SQL Policies.", type: 'error' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleHymnImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStatus({ message: "Syncing Hymnal to Cloud...", type: 'info' });
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        await SupabaseService.uploadHymns(parsed);
        const updated = await SupabaseService.getHymns();
        setHymns(updated);
        setImportStatus({ message: `Hymnal cloud sync successful.`, type: 'success' });
        setTimeout(() => setImportStatus(null), 4000);
      }
    } catch (error: any) {
      setImportStatus({ message: "Hymn sync failed. Check SQL Policies.", type: 'error' });
    } finally {
      setIsImporting(false);
      if (hymnInputRef.current) hymnInputRef.current.value = '';
    }
  };

  if (!isInitialized) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FBF9F6]">
      <Landmark className="w-12 h-12 text-[#6B0000] animate-pulse mb-4" />
      <p className="serif text-lg font-bold text-slate-400">Opening the Law...</p>
    </div>
  );
  
  if (!currentUser) return <AuthView onAuthenticated={handleAuthenticated} />;

  if (currentUser.status === 'pending' || currentUser.status === 'rejected') {
    return <PendingView user={currentUser} onStatusUpdate={() => setCurrentUser({...currentUser, status: 'approved'})} onSignOut={handleSignOut} />;
  }

  const currentIndex = selectedSection ? sections.findIndex(s => s.id === selectedSection.id) : -1;
  const nextSection = currentIndex !== -1 && currentIndex < sections.length - 1 ? sections[currentIndex + 1] : undefined;
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : undefined;

  const renderTabContent = () => {
    switch (activeTab) {
      case AppTab.Search:
        return <SearchTab sections={sections} onSelectSection={handleSelectSection} />;
      case AppTab.Hymnal:
        return <HymnalTab hymns={hymns} favorites={favorites} onToggleFavorite={(id) => toggleFavorite(id, 'hymn')} />;
      case AppTab.Favorites:
        return <FavoritesTab favorites={favorites} sections={sections} onSelectSection={(s) => handleSelectSection(s)} />;
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
                 <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                       <Cloud className="w-4 h-4 text-slate-400 shrink-0" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase truncate">Sync Active</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-100 text-[9px] font-black uppercase text-slate-400 shrink-0">{currentUser.role}</span>
                 </div>
               </div>

               {importStatus && (
                 <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                   importStatus.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 
                   importStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                   'bg-blue-50 border-blue-100 text-blue-600'
                 }`}>
                   {importStatus.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : 
                    importStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : 
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />}
                   <p className="text-sm font-bold">{importStatus.message}</p>
                 </div>
               )}

               <section>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <Eye className="w-4 h-4 text-[#6B0000]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Reading Preference</h3>
                 </div>
                 <div className="bg-white rounded-3xl shadow-sm border border-[#E5E1DA] divide-y divide-slate-50">
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
                         <div className="w-5 h-5 flex items-center justify-center font-bold text-slate-400">A</div>
                         <span className="text-sm font-bold text-slate-700">Default Size</span>
                       </div>
                       <div className="flex bg-slate-100 p-1 rounded-xl">
                          {(['sm', 'base', 'lg', 'xl'] as const).map(s => (
                            <button key={s} onClick={() => updateSetting('defaultFontSize', s)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${userSettings.defaultFontSize === s ? 'bg-white shadow-sm text-[#6B0000]' : 'text-slate-400'}`}>
                              {s}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
               </section>

               <section>
                 <div className="flex items-center gap-2 mb-3 px-1">
                    <Globe className="w-4 h-4 text-[#6B0000]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Data Management</h3>
                 </div>
                 <div className="bg-white rounded-3xl shadow-sm border border-[#E5E1DA] overflow-hidden">
                   <button onClick={handleCheckUpdates} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 border-b text-left transition-colors">
                     <RefreshCw className="w-5 h-5 text-emerald-500" />
                     <div className="flex-1">
                       <h3 className="text-sm font-bold text-slate-900">Force Cloud Refresh</h3>
                       <p className="text-[10px] text-slate-400">Pull latest Law and Hymnal from Supabase</p>
                     </div>
                   </button>
                   <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 border-b text-left transition-colors">
                     <FileText className="w-5 h-5 text-blue-500" />
                     <div className="flex-1">
                       <h3 className="text-sm font-bold text-slate-900">Upload Law to Cloud (.docx)</h3>
                     </div>
                   </button>
                   <button onClick={() => hymnInputRef.current?.click()} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 border-b text-left transition-colors">
                     <Music className="w-5 h-5 text-[#6B0000]" />
                     <div className="flex-1">
                       <h3 className="text-sm font-bold text-slate-900">Upload Hymnal to Cloud (JSON)</h3>
                     </div>
                   </button>
                 </div>
               </section>

               <button onClick={handleSignOut} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-red-100">
                 <LogOut className="w-5 h-5" />
                 Sign Out from Device
               </button>
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept=".docx" onChange={handleFileChange} />
             <input type="file" ref={hymnInputRef} className="hidden" accept=".json" onChange={handleHymnImport} />
          </div>
        );
      default: return null;
    }
  };

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
          onBack={handleBack}
          onNext={nextSection ? () => setSelectedSection(nextSection) : undefined}
          onPrev={prevSection ? () => setSelectedSection(prevSection) : undefined}
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
