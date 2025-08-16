import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface TranslationRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  type: 'text' | 'image' | 'audio' | 'interface';
  model: string;
  confidence: number;
  timestamp: Date;
  isFavorite: boolean;
  metadata?: any;
}

export interface UserSettings {
  defaultSourceLang: string;
  defaultTargetLang: string;
  preferredModel: 'baidu' | 'google' | 'openai' | 'azure';
  overlayOpacity: number;
  autoDetect: boolean;
  saveHistory: boolean;
  offlineMode: boolean;
  smartSuggestions: boolean;
}

interface TranslationState {
  // Translation History
  history: TranslationRecord[];
  addTranslation: (translation: Omit<TranslationRecord, 'id' | 'timestamp'>) => void;
  removeTranslation: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearHistory: () => void;
  getHistoryByType: (type: TranslationRecord['type']) => TranslationRecord[];
  getFavorites: () => TranslationRecord[];
  searchHistory: (query: string) => TranslationRecord[];

  // User Settings
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;

  // Current Translation State
  currentTranslation: {
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    isTranslating: boolean;
    error: string | null;
  };
  setCurrentTranslation: (translation: Partial<TranslationState['currentTranslation']>) => void;
  resetCurrentTranslation: () => void;

  // Language Pairs
  recentLanguagePairs: Array<{ source: string; target: string }>;
  addRecentLanguagePair: (pair: { source: string; target: string }) => void;
  clearRecentLanguagePairs: () => void;
  removeRecentLanguagePair: (index: number) => void;

  // Statistics
  getStats: () => {
    totalTranslations: number;
    translationsByType: Record<string, number>;
    translationsByLanguage: Record<string, number>;
    favoriteCount: number;
    streakDays: number;
  };
}

const defaultSettings: UserSettings = {
  defaultSourceLang: 'auto',
  defaultTargetLang: 'en',
  preferredModel: 'baidu',
  autoDetect: true,
  saveHistory: true,
  offlineMode: false,
  overlayOpacity: 0.8,
  smartSuggestions: true
};

const defaultCurrentTranslation = {
  sourceText: '',
  translatedText: '',
  sourceLang: 'auto',
  targetLang: 'en',
  isTranslating: false,
  error: null
};

export const useTranslationStore = create<TranslationState>()
  (persist(
    (set, get) => ({
      // Translation History
      history: [],
      
      addTranslation: (translation) => {
        const newTranslation: TranslationRecord = {
          ...translation,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        
        set((state) => ({
          history: [newTranslation, ...state.history].slice(0, 1000) // Keep only last 1000 translations
        }));
      },
      
      removeTranslation: (id) => {
        set((state) => ({
          history: state.history.filter(t => t.id !== id)
        }));
      },
      
      toggleFavorite: (id) => {
        set((state) => ({
          history: state.history.map(t => 
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
          )
        }));
      },
      
      clearHistory: () => {
        set({ history: [] });
      },
      
      getHistoryByType: (type) => {
        const state = get() as TranslationState;
        return state.history.filter(t => t.type === type);
      },
      
      getFavorites: () => {
        const state = get() as TranslationState;
        return state.history.filter(t => t.isFavorite);
      },
      
      searchHistory: (query) => {
        const state = get() as TranslationState;
        const lowerQuery = query.toLowerCase();
        return state.history.filter(t => 
          t.sourceText.toLowerCase().includes(lowerQuery) ||
          t.translatedText.toLowerCase().includes(lowerQuery)
        );
      },

      // User Settings
      settings: defaultSettings,
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },
      
      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      // Current Translation State
      currentTranslation: defaultCurrentTranslation,
      
      setCurrentTranslation: (translation) => {
        set((state) => ({
          currentTranslation: { ...state.currentTranslation, ...translation }
        }));
      },
      
      resetCurrentTranslation: () => {
        set({ currentTranslation: defaultCurrentTranslation });
      },

      // Language Pairs
      recentLanguagePairs: [],
      
      addRecentLanguagePair: (pair) => {
        set((state) => {
          const existing = state.recentLanguagePairs.find(
            p => p.source === pair.source && p.target === pair.target
          );
          
          if (existing) return state;
          
          return {
            recentLanguagePairs: [
              pair,
              ...state.recentLanguagePairs.slice(0, 9) // Keep only 10 recent pairs
            ]
          };
        });
      },
      
      clearRecentLanguagePairs: () => {
        set((state) => ({ ...state, recentLanguagePairs: [] }));
      },
      
      removeRecentLanguagePair: (index: number) => {
        set((state) => ({
          ...state,
          recentLanguagePairs: state.recentLanguagePairs.filter((_, i) => i !== index)
        }));
      },

      // Statistics
      getStats: () => {
        const { history } = get();
        
        const translationsByType = history.reduce((acc, t) => {
          acc[t.type] = (acc[t.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const translationsByLanguage = history.reduce((acc, t) => {
          const key = `${t.sourceLang}-${t.targetLang}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const favoriteCount = history.filter(t => t.isFavorite).length;
        
        // Calculate streak days (simplified)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const hasTranslationToday = history.some(t => {
          const translationDate = new Date(t.timestamp);
          return translationDate.toDateString() === today.toDateString();
        });
        
        const hasTranslationYesterday = history.some(t => {
          const translationDate = new Date(t.timestamp);
          return translationDate.toDateString() === yesterday.toDateString();
        });
        
        let streakDays = 0;
        if (hasTranslationToday) {
          streakDays = 1;
          if (hasTranslationYesterday) {
            // In a real app, you'd calculate the full streak
            streakDays = Math.min(15, history.length); // Simplified calculation
          }
        }
        
        return {
          totalTranslations: history.length,
          translationsByType,
          translationsByLanguage,
          favoriteCount,
          streakDays
        };
      },

      updateStatistics: () => {
        const state = get() as TranslationState;
        const { history } = state;
        const stats = {
          totalTranslations: history.length,
          translationsByType: {
            text: history.filter(t => t.type === 'text').length,
            image: history.filter(t => t.type === 'image').length,
            audio: history.filter(t => t.type === 'audio').length,
            interface: history.filter(t => t.type === 'interface').length
          },
          translationsByLanguage: history.reduce((acc, t) => {
            const key = `${t.sourceLang}-${t.targetLang}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          favoriteCount: history.filter(t => t.isFavorite).length,
          streakDays: 0 // Calculate streak based on dates
        };
        
        set((state) => ({ ...state, statistics: stats }));
      }
    }),
    {
      name: 'translation-store',
      partialize: (state) => {
        const typedState = state as TranslationState;
        return {
          history: typedState.history,
          settings: typedState.settings,
          recentLanguagePairs: typedState.recentLanguagePairs
        };
      }
    }
   ))

// Selectors for better performance
export const useTranslationHistory = () => useTranslationStore(state => state.history);
export const useTranslationSettings = () => useTranslationStore(state => state.settings);
export const useCurrentTranslation = () => useTranslationStore(state => state.currentTranslation);
export const useRecentLanguagePairs = () => useTranslationStore(state => state.recentLanguagePairs);