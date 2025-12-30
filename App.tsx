
import React, { useState, useEffect, useRef } from 'react';
import { AppTab, Section, Favorite, Bookmark, Profile } from './types';
import { SAMPLE_SECTIONS } from './constants';
import { StorageService } from './services/storage';
import { DocxParser } from './services/docxParser';
import { SupabaseService } from './services/supabase';
import { SearchTab } from './components/SearchTab';
import { FavoritesTab } from './components/FavoritesTab';
import { Reader } from './components/Reader';
import { AuthView } from './components/AuthView';
import { PendingView } from './components/PendingView';
import { AdminView } from './components/AdminView';
import { Search, Heart, Bookmark as BookmarkIcon, Settings, RefreshCw, FileText, Loader2, Sparkles, LogOut, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Search);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [sections, setSections] = useState<Section[]>(SAMPLE_SECTIONS);
  const [isImporting, setIsImporting] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial Auth State Check
    const user = SupabaseService.getCurrentUser();
    if (user) setCurrentUser(user);
    setIsInitialized(true);

    const storedSections = StorageService.getCustomSections();
    if (storedSections) setSections(storedSections);
    setFavorites(StorageService.getFavorites());
    setBookmarks(StorageService.getBookmarks());
  }, []);

  const handleAuthenticated = () => {
    const user = SupabaseService.getCurrentUser();
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    SupabaseService.signOut();
    setCurrentUser(null);
  };

  const refreshStorage = () => {
    setFavorites(StorageService.getFavorites());
    setBookmarks(StorageService.getBookmarks());
  };

  const handleSelectSection = (section: Section, query: string = '') => {
    setSearchQuery(query);
    setSelectedSection(section);
  };

  const handleBack = () => {
    setSelectedSection(null);
    refreshStorage();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const parsedSections = await DocxParser.parseFile(file);
      if (parsedSections.length > 0) {
        StorageService.saveCustomSections(parsedSections);
        setSections(parsedSections);
        alert("Imported successfully.");
      }
    } catch (error) {
      alert("Error parsing document.");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isInitialized) return null;

  // 1. Auth Gate
  if (!currentUser) {
    return <AuthView onAuthenticated={handleAuthenticated} />;
  }

  // 2. Pending Access Gate
  if (currentUser.status === 'pending' || currentUser.status === 'rejected') {
    return (
      <PendingView 
        user={currentUser} 
        onStatusUpdate={() => setCurrentUser({...currentUser, status: 'approved'})} 
        onSignOut={handleSignOut} 
      />
    );
  }

  const currentIndex = selectedSection ? sections.findIndex(s => s.id === selectedSection.id) : -1;
  const nextSection = currentIndex !== -1 && currentIndex < sections.length - 1 ? sections[currentIndex + 1] : undefined;
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : undefined;

  const renderTabContent = () => {
    switch (activeTab) {
      case AppTab.Search:
        return <SearchTab sections={sections} onSelectSection={handleSelectSection} />;
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
                 <div className="py-20 text-center text-slate-400">No bookmarks found.</div>
               ) : (
                 bookmarks.map(bm => {
                   const section = sections.find(s => s.id === bm.sectionId);
                   if (!section) return null;
                   return (
                     <button key={bm.id} onClick={() => handleSelectSection(section)} className="w-full text-left p-5 bg-white rounded-2xl shadow-sm border border-[#E5E1DA]">
                        <h3 className="serif font-bold text-slate-800 mb-1">{section.title}</h3>
                        <p className="text-sm text-slate-500 italic">"{bm.snippet}"</p>
                     </button>
                   );
                 })
               )}
             </div>
          </div>
        );
      case AppTab.Settings:
        return (
          <div className="h-full bg-[#FBF9F6] overflow-y-auto">
             <div className="p-6 bg-white border-b border-[#E5E1DA] sticky top-0 z-10">
               <h2 className="serif text-2xl font-bold text-slate-800">Menu</h2>
             </div>
             <div className="p-5 space-y-5">
               <div className="bg-white rounded-2xl shadow-sm border border-[#E5E1DA] overflow-hidden">
                 <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 border-b text-left transition-colors">
                   <FileText className="w-6 h-6 text-blue-600" />
                   <div>
                     <h3 className="font-bold">Update CPD (.docx)</h3>
                     <p className="text-xs text-slate-500">Local document parsing</p>
                   </div>
                 </button>
                 <button onClick={handleSignOut} className="w-full flex items-center gap-4 p-5 hover:bg-red-50 text-left transition-colors">
                   <LogOut className="w-6 h-6 text-red-500" />
                   <div>
                     <h3 className="font-bold">Sign Out</h3>
                     <p className="text-xs text-slate-500">{currentUser.email}</p>
                   </div>
                 </button>
               </div>
               
               <div className="p-4 bg-white rounded-2xl border border-[#E5E1DA]">
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">User Profile</p>
                 <p className="text-sm font-bold text-slate-800">{currentUser.full_name}</p>
                 <p className="text-xs text-slate-500">{currentUser.church}</p>
               </div>
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept=".docx" onChange={handleFileChange} />
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

      <nav className="bg-white/95 backdrop-blur-xl border-t border-[#E5E1DA] flex items-center justify-around h-20 safe-area-bottom px-4">
        <TabButton active={activeTab === AppTab.Search} onClick={() => setActiveTab(AppTab.Search)} icon={<Search />} label="Search" />
        <TabButton active={activeTab === AppTab.Favorites} onClick={() => setActiveTab(AppTab.Favorites)} icon={<Heart />} label="Favs" />
        <TabButton active={activeTab === AppTab.Bookmarks} onClick={() => setActiveTab(AppTab.Bookmarks)} icon={<BookmarkIcon />} label="Marks" />
        {currentUser.role === 'admin' && (
          <TabButton active={activeTab === AppTab.Admin} onClick={() => setActiveTab(AppTab.Admin)} icon={<ShieldAlert />} label="Admin" />
        )}
        <TabButton active={activeTab === AppTab.Settings} onClick={() => setActiveTab(AppTab.Settings)} icon={<Settings />} label="Menu" />
      </nav>

      {selectedSection && (
        <Reader section={selectedSection} searchQuery={searchQuery} onBack={handleBack}
          onNext={nextSection ? () => setSelectedSection(nextSection) : undefined}
          onPrev={prevSection ? () => setSelectedSection(prevSection) : undefined}
        />
      )}

      {isImporting && (
        <div className="absolute inset-0 bg-[#6B0000]/95 backdrop-blur-md z-50 flex items-center justify-center flex-col text-white">
          <Loader2 className="w-16 h-16 animate-spin mb-4" />
          <h2 className="serif text-xl font-bold">Processing Document...</h2>
        </div>
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
  <button onClick={onClick} className="flex flex-col items-center justify-center w-full h-full relative">
    <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-[#6B0000]/10 text-[#6B0000]' : 'text-slate-400'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 mb-0.5' })}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-[#6B0000]' : 'text-slate-400'}`}>{label}</span>
    {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#6B0000] rounded-b-full shadow-[0_0_10px_#6B0000]" />}
  </button>
);

export default App;
