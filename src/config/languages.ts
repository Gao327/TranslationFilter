// Language Configuration
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export interface LanguagePair {
  source: string;
  target: string;
  label: string;
  isPopular?: boolean;
}

// Supported Languages
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: '自动检测', flag: '🌐' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskera', flag: '🏴󠁥󠁳󠁰󠁶󠁿' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🏴󠁥󠁳󠁧󠁡󠁿' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇱🇰' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', flag: '🇰🇿' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргыз', flag: '🇰🇬' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', flag: '🇺🇿' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'me', name: 'Montenegrin', nativeName: 'Crnogorski', flag: '🇲🇪' }
];

// Popular Language Pairs
export const POPULAR_LANGUAGE_PAIRS: LanguagePair[] = [
  { source: 'auto', target: 'en', label: '自动检测 → 英语', isPopular: true },
  { source: 'auto', target: 'zh', label: '自动检测 → 中文', isPopular: true },
  { source: 'en', target: 'zh', label: '英语 → 中文', isPopular: true },
  { source: 'zh', target: 'en', label: '中文 → 英语', isPopular: true },
  { source: 'ja', target: 'zh', label: '日语 → 中文', isPopular: true },
  { source: 'ko', target: 'zh', label: '韩语 → 中文', isPopular: true },
  { source: 'fr', target: 'en', label: '法语 → 英语', isPopular: true },
  { source: 'de', target: 'en', label: '德语 → 英语', isPopular: true },
  { source: 'es', target: 'en', label: '西班牙语 → 英语', isPopular: true },
  { source: 'ru', target: 'en', label: '俄语 → 英语', isPopular: true }
];

// Language Groups for better organization
export const LANGUAGE_GROUPS = {
  popular: ['auto', 'zh', 'en', 'ja', 'ko', 'fr', 'de', 'es'],
  european: ['en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'pl', 'nl', 'sv', 'da', 'no', 'fi'],
  asian: ['zh', 'ja', 'ko', 'hi', 'th', 'vi', 'id', 'ms', 'tl'],
  middleEast: ['ar', 'he', 'fa', 'tr'],
  african: ['sw', 'am', 'yo', 'ig', 'ha', 'zu', 'af']
};

// Utility functions
export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const getLanguageOptions = (includeAuto: boolean = true) => {
  const languages = includeAuto 
    ? SUPPORTED_LANGUAGES 
    : SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto');
  
  return languages.map(lang => ({
    value: lang.code,
    label: `${lang.flag} ${lang.nativeName}`,
    searchText: `${lang.name} ${lang.nativeName}`
  }));
};

export const getPopularLanguageOptions = (includeAuto: boolean = true) => {
  const popularCodes = includeAuto 
    ? LANGUAGE_GROUPS.popular 
    : LANGUAGE_GROUPS.popular.filter(code => code !== 'auto');
  
  return popularCodes.map(code => {
    const lang = getLanguageByCode(code);
    return lang ? {
      value: lang.code,
      label: `${lang.flag} ${lang.nativeName}`,
      searchText: `${lang.name} ${lang.nativeName}`
    } : null;
  }).filter(Boolean) as Array<{ value: string; label: string; searchText: string }>;
};

export const isLanguagePairSupported = (source: string, target: string): boolean => {
  const sourceExists = source === 'auto' || SUPPORTED_LANGUAGES.some(lang => lang.code === source);
  const targetExists = SUPPORTED_LANGUAGES.some(lang => lang.code === target && lang.code !== 'auto');
  return sourceExists && targetExists && source !== target;
};

export const getLanguagePairLabel = (source: string, target: string): string => {
  const sourceLang = getLanguageByCode(source);
  const targetLang = getLanguageByCode(target);
  
  if (!sourceLang || !targetLang) return '';
  
  return `${sourceLang.nativeName} → ${targetLang.nativeName}`;
};

export const detectLanguageFromText = (text: string): string => {
  // Simple language detection based on character patterns
  // In a real app, you'd use a proper language detection library
  
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Russian
  if (/[\u0900-\u097f]/.test(text)) return 'hi'; // Hindi
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th'; // Thai
  
  // Default to auto for other languages
  return 'auto';
};