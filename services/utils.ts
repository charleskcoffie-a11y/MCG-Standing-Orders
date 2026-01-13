// Haptic Feedback
export const haptic = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  }
};

// Share functionality
export const share = async (title: string, text: string): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  }
  return false;
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
};

// Text-to-Speech
export class TTSService {
  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isReading = false;

  constructor() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, rate: number = 0.9) {
    if (!this.synth) return;
    
    this.stop();
    
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = rate;
    this.utterance.pitch = 1;
    this.utterance.volume = 1;
    
    this.synth.speak(this.utterance);
    this.isReading = true;
    
    this.utterance.onend = () => {
      this.isReading = false;
    };
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isReading = false;
    }
  }

  pause() {
    if (this.synth && this.isReading) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth && this.isReading) {
      this.synth.resume();
    }
  }

  isAvailable(): boolean {
    return !!this.synth;
  }

  isSpeaking(): boolean {
    return this.isReading;
  }
}

// Voice Search
export const voiceSearch = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event: any) => {
      reject(new Error(event.error));
    };

    recognition.start();
  });
};

// Pull to refresh handler
export const setupPullToRefresh = (
  element: HTMLElement,
  onRefresh: () => Promise<void>,
  threshold: number = 80
) => {
  let startY = 0;
  let currentY = 0;
  let isPulling = false;

  const handleTouchStart = (e: TouchEvent) => {
    if (element.scrollTop === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return;
    
    currentY = e.touches[0].clientY;
    const pullDistance = currentY - startY;

    if (pullDistance > 0 && element.scrollTop === 0) {
      // Visual feedback could be added here
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    const pullDistance = currentY - startY;
    
    if (pullDistance > threshold) {
      await onRefresh();
    }
    
    isPulling = false;
    startY = 0;
    currentY = 0;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd);

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

// Dark mode utilities
export const applyDarkMode = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Format time ago
export const timeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
};
