import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, Star, Clock, ChevronDown, X } from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  POPULAR_LANGUAGE_PAIRS, 
  LANGUAGE_GROUPS,
  getLanguageByCode,
  getLanguageOptions,
  getPopularLanguageOptions,
  type Language 
} from '../config/languages';
import { useTranslationStore } from '../store/translationStore';
import { Button } from './ui';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  type: 'source' | 'target';
  className?: string;
  disabled?: boolean;
  showFlag?: boolean;
  showNativeName?: boolean;
  placeholder?: string;
}

export default function LanguageSelector({
  value,
  onChange,
  type,
  className = '',
  disabled = false,
  showFlag = true,
  showNativeName = true,
  placeholder
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'recent' | 'all'>('popular');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { recentLanguagePairs, addRecentLanguagePair } = useTranslationStore();
  
  const selectedLanguage = getLanguageByCode(value);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  // Filter languages based on search query
  const getFilteredLanguages = () => {
    const includeAuto = type === 'source';
    let languages: Array<{ value: string; label: string; searchText: string }>;
    
    switch (activeTab) {
      case 'popular':
        languages = getPopularLanguageOptions(includeAuto);
        break;
      case 'recent':
        const recentCodes = type === 'source' 
          ? recentLanguagePairs.map(pair => pair.source)
          : recentLanguagePairs.map(pair => pair.target);
        const uniqueRecentCodes = [...new Set(recentCodes)].slice(0, 10);
        languages = uniqueRecentCodes.map(code => {
          const lang = getLanguageByCode(code);
          return lang ? {
            value: lang.code,
            label: `${showFlag ? lang.flag + ' ' : ''}${showNativeName ? lang.nativeName : lang.name}`,
            searchText: `${lang.name} ${lang.nativeName}`
          } : null;
        }).filter(Boolean) as Array<{ value: string; label: string; searchText: string }>;
        break;
      case 'all':
      default:
        languages = getLanguageOptions(includeAuto).map(opt => ({
          ...opt,
          label: `${showFlag ? opt.label : opt.label.split(' ').slice(1).join(' ')}`
        }));
        break;
    }
    
    if (!searchQuery) return languages;
    
    return languages.filter(lang => 
      lang.searchText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const handleLanguageSelect = (languageCode: string) => {
    onChange(languageCode);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const filteredLanguages = getFilteredLanguages();
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 
          rounded-lg text-left transition-colors
          ${disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {selectedLanguage ? (
            <>
              {showFlag && <span className="text-lg">{selectedLanguage.flag}</span>}
              <span className="truncate">
                {showNativeName ? selectedLanguage.nativeName : selectedLanguage.name}
              </span>
            </>
          ) : (
            <span className="text-gray-400">
              {placeholder || `选择${type === 'source' ? '源' : '目标'}语言`}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
          isOpen ? 'transform rotate-180' : ''
        }`} />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索语言..."
                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'popular'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              常用
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'recent'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" />
              最近
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-1" />
              全部
            </button>
          </div>
          
          {/* Language List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? '未找到匹配的语言' : '暂无语言'}
              </div>
            ) : (
              <div className="py-1">
                {filteredLanguages.map((lang) => {
                  const isSelected = lang.value === value;
                  return (
                    <button
                      key={lang.value}
                      onClick={() => handleLanguageSelect(lang.value)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getLanguageByCode(lang.value)?.flag}</span>
                        <span className="flex-1">{lang.label.split(' ').slice(1).join(' ')}</span>
                        {isSelected && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          {activeTab === 'popular' && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">快速语言对</div>
              <div className="flex flex-wrap gap-1">
                {POPULAR_LANGUAGE_PAIRS.slice(0, 4).map((pair) => {
                  const isCurrentPair = type === 'source' ? pair.source === value : pair.target === value;
                  return (
                    <button
                      key={`${pair.source}-${pair.target}`}
                      onClick={() => {
                        const targetLang = type === 'source' ? pair.source : pair.target;
                        handleLanguageSelect(targetLang);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        isCurrentPair
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pair.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Language Pair Selector Component
interface LanguagePairSelectorProps {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onSwap?: () => void;
  className?: string;
  disabled?: boolean;
}

export function LanguagePairSelector({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
  className = '',
  disabled = false
}: LanguagePairSelectorProps) {
  const { addRecentLanguagePair } = useTranslationStore();
  
  const handleSourceChange = (value: string) => {
    onSourceChange(value);
    addRecentLanguagePair({ source: value, target: targetLang });
  };
  
  const handleTargetChange = (value: string) => {
    onTargetChange(value);
    addRecentLanguagePair({ source: sourceLang, target: value });
  };
  
  const handleSwap = () => {
    if (onSwap && sourceLang !== 'auto') {
      onSwap();
      addRecentLanguagePair({ source: targetLang, target: sourceLang });
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-1">
        <LanguageSelector
          value={sourceLang}
          onChange={handleSourceChange}
          type="source"
          disabled={disabled}
          placeholder="源语言"
        />
      </div>
      
      {onSwap && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwap}
          disabled={disabled || sourceLang === 'auto'}
          className="px-2 py-2 min-w-0"
          title="交换语言"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </Button>
      )}
      
      <div className="flex-1">
        <LanguageSelector
          value={targetLang}
          onChange={handleTargetChange}
          type="target"
          disabled={disabled}
          placeholder="目标语言"
        />
      </div>
    </div>
  );
}