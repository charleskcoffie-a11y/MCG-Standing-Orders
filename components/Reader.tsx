
import React, { useState, useEffect } from 'react';
import { Section, UserSettings } from '../types';
import { ArrowLeft, Heart, Bookmark as BookmarkIcon, ChevronLeft, ChevronRight, Type, Share2, Copy, Volume2, VolumeX, FileText, Save } from 'lucide-react';
import { StorageService } from '../services/storage';
import { haptic, share, copyToClipboard, TTSService } from '../services/utils';

interface ReaderProps {
  section: Section;
  searchQuery: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const ttsService = new TTSService();

export const Reader: React.FC<ReaderProps> = ({ section, searchQuery, isFavorite, onToggleFavorite, onBack, onNext, onPrev }) => {
  const [showToast, setShowToast] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    // Scroll to top when section changes
    const main = document.getElementById('reader-content');
    if (main) main.scrollTop = 0;
    
    // Add to reading history
    StorageService.addToReadingHistory(section.id, 'section', section.title);
    
    // Stop TTS if speaking
    return () => {
      ttsService.stop();
      setIsSpeaking(false);
    };
  }, [section.id]);

  const addBookmark = () => {
    if (settings.hapticFeedback) haptic.light();
    StorageService.saveBookmark({
      id: Math.random().toString(36).substr(2, 9),
      sectionId: section.id,
      textOffset: 0,
      snippet: section.content.slice(0, 50) + '...',
      createdAt: Date.now()
    });
    triggerToast('Progress Bookmarked');
  };

  const toggleFont = () => {
    if (settings.hapticFeedback) haptic.light();
    const newSettings = { ...settings, preferredFont: settings.preferredFont === 'serif' ? 'sans' : 'serif' as any };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleShare = async () => {
    if (settings.hapticFeedback) haptic.light();
    const success = await share(section.title, `${section.title}\n\n${section.content.slice(0, 200)}...`);
    if (success) {
      triggerToast('Shared successfully');
    } else {
      // Fallback to copy
      await handleCopy();
    }
  };

  const handleCopy = async () => {
    if (settings.hapticFeedback) haptic.light();
    const success = await copyToClipboard(`${section.title}\n\n${section.content}`);
    if (success) {
      if (settings.hapticFeedback) haptic.success();
      triggerToast('Copied to clipboard');
    } else {
      triggerToast('Failed to copy');
    }
  };

  const toggleTTS = () => {
    if (!settings.ttsEnabled) {
      triggerToast('Text-to-speech is disabled');
      return;
    }

    if (settings.hapticFeedback) haptic.medium();
    
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
    } else {
      ttsService.speak(`${section.title}. ${section.content}`);
      setIsSpeaking(true);
    }
  };

  const saveNote = () => {
    if (!noteText.trim()) return;
    
    if (settings.hapticFeedback) haptic.success();
    StorageService.saveNote({
      id: Math.random().toString(36).substr(2, 9),
      itemId: section.id,
      itemType: 'section',
      content: noteText,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    setNoteText('');
    setShowNoteDialog(false);
    triggerToast('Note saved');
  };

  const handleFavorite = () => {
    if (settings.hapticFeedback) {
      if (isFavorite) haptic.light();
      else haptic.success();
    }
    onToggleFavorite();
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const soMatch = highlight.match(/^(s\.?o\.?\s*|standing\s*order\s*)(\d+)/i);
    let regexSource = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (soMatch) {
      const num = soMatch[2];
      regexSource = `(s\\.o\\.?\\s*${num}|standing\\s*order\\s*${num}|\\b${num}\\b)`;
    } else if (/^\d+$/.test(highlight)) {
      regexSource = `(standing\\s*order\\s*${highlight}|s\\.o\\.?\\s*${highlight}|\\b${highlight}\\b)`;
    }
    const parts = text.split(new RegExp(`(${regexSource})`, 'gi'));
    return parts.map((part, i) => 
      new RegExp(regexSource, 'i').test(part)
        ? <mark key={i} className="bg-[#D4AF37]/20 text-[#6B0000] font-semibold rounded px-0.5">{part}</mark> 
        : part
    );
  };

  const fontSizeClass = {
    sm: 'text-base',
    base: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }[settings.defaultFontSize];

  return (
    <div className="fixed inset-0 bg-[#FBF9F6] dark:bg-slate-900 z-50 flex flex-col animate-in fade-in slide-in-from-right duration-300">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-[#E5E1DA] dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-2xl text-slate-600 dark:text-slate-200 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center px-4 flex-1">
           <span className="text-[10px] font-extrabold text-[#6B0000] dark:text-[#D4AF37] uppercase tracking-[0.2em]">
            {section.category}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleFont} className="p-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-2xl text-slate-600 dark:text-slate-200 active:scale-90 transition-all">
            <Type className="w-5 h-5" />
          </button>
          {settings.ttsEnabled && ttsService.isAvailable() && (
            <button onClick={toggleTTS} className={`p-2.5 rounded-2xl active:scale-90 transition-all ${isSpeaking ? 'bg-[#6B0000]/10 dark:bg-[#D4AF37]/10 text-[#6B0000] dark:text-[#D4AF37]' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200'}`}>
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          <button onClick={handleShare} className="p-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-2xl text-slate-600 dark:text-slate-200 active:scale-90 transition-all">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={handleCopy} className="p-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-2xl text-slate-600 dark:text-slate-200 active:scale-90 transition-all">
            <Copy className="w-5 h-5" />
          </button>
          <button onClick={addBookmark} className="p-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-2xl text-slate-600 dark:text-slate-200 active:scale-90 transition-all">
            <BookmarkIcon className="w-5 h-5" />
          </button>
          <button onClick={() => setShowNoteDialog(true)} className="p-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-2xl text-slate-600 dark:text-slate-200 active:scale-90 transition-all">
            <FileText className="w-5 h-5" />
          </button>
          <button onClick={handleFavorite} className={`p-2.5 rounded-2xl active:scale-90 transition-all ${isFavorite ? 'bg-[#6B0000]/10 dark:bg-[#D4AF37]/10 text-[#6B0000] dark:text-[#D4AF37]' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200'}`}>
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </header>

      <main id="reader-content" className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full pb-32">
        <h1 className={`${settings.preferredFont === 'serif' ? 'serif' : ''} text-3xl font-black text-slate-900 dark:text-slate-100 mb-10 leading-[1.2]`}>
          {highlightText(section.title, searchQuery)}
        </h1>
        <div className={`${settings.preferredFont === 'serif' ? 'serif' : ''} ${fontSizeClass} text-slate-800 dark:text-slate-200 leading-[1.7] whitespace-pre-wrap font-medium`}>
          {highlightText(section.content, searchQuery)}
        </div>

        <div className="mt-20 pt-10 border-t border-[#E5E1DA] dark:border-slate-700 flex justify-between items-center">
          <button 
            disabled={!onPrev}
            onClick={onPrev}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border font-bold transition-all ${onPrev ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:shadow-lg active:scale-95 border-[#E5E1DA] dark:border-slate-600' : 'text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 bg-transparent'}`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button 
             disabled={!onNext}
             onClick={onNext}
             className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border font-bold transition-all ${onNext ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:shadow-lg active:scale-95 border-[#E5E1DA] dark:border-slate-600' : 'text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 bg-transparent'}`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {showNoteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md animate-in slide-in-from-bottom duration-300">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Add Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your thoughts..."
              className="w-full h-32 p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#6B0000] dark:focus:ring-[#D4AF37] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowNoteDialog(false); setNoteText(''); }}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={!noteText.trim()}
                className="flex-1 py-3 rounded-xl bg-[#6B0000] dark:bg-[#D4AF37] text-white dark:text-slate-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#1A1A1A] dark:bg-slate-700 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-semibold z-50 animate-in fade-in slide-in-from-bottom-4">
          {showToast}
        </div>
      )}
    </div>
  );
};
