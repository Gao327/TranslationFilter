// 百度翻译服务动态导入
let baiduTranslationService: any = null;
let baiduImportError: Error | null = null;
let baiduImportPromise: Promise<any> | null = null;

// 动态导入百度翻译服务
async function loadBaiduTranslationService() {
  if (baiduImportPromise) {
    return baiduImportPromise;
  }
  
  baiduImportPromise = (async () => {
    try {
      console.log('🔄 开始导入百度翻译服务...');
      const baiduModule = await import('./baiduTranslationService');
      baiduTranslationService = baiduModule.baiduTranslationService;
      console.log('✅ 百度翻译服务导入成功:', baiduTranslationService);
      return baiduTranslationService;
    } catch (error) {
      baiduImportError = error as Error;
      console.error('❌ 百度翻译服务导入失败:', error);
      console.error('- 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  })();
  
  return baiduImportPromise;
}

// Translation Service Types
export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  model?: 'baidu' | 'google' | 'openai' | 'azure';
}

export interface TranslationResponse {
  translatedText: string;
  confidence: number;
  model: string;
  detectedLanguage?: string;
}

export interface TranslationError {
  code: string;
  message: string;
  details?: any;
}

// Language definitions
export const SUPPORTED_LANGUAGES = {
  auto: { code: 'auto', name: '自动检测', flag: '🌐' },
  zh: { code: 'zh', name: '中文', flag: '🇨🇳' },
  en: { code: 'en', name: '英语', flag: '🇺🇸' },
  ja: { code: 'ja', name: '日语', flag: '🇯🇵' },
  ko: { code: 'ko', name: '韩语', flag: '🇰🇷' },
  fr: { code: 'fr', name: '法语', flag: '🇫🇷' },
  de: { code: 'de', name: '德语', flag: '🇩🇪' },
  es: { code: 'es', name: '西班牙语', flag: '🇪🇸' },
  it: { code: 'it', name: '意大利语', flag: '🇮🇹' },
  pt: { code: 'pt', name: '葡萄牙语', flag: '🇵🇹' },
  ru: { code: 'ru', name: '俄语', flag: '🇷🇺' },
  ar: { code: 'ar', name: '阿拉伯语', flag: '🇸🇦' },
  hi: { code: 'hi', name: '印地语', flag: '🇮🇳' },
  th: { code: 'th', name: '泰语', flag: '🇹🇭' },
  vi: { code: 'vi', name: '越南语', flag: '🇻🇳' }
};

// Mock translation service (for development)
class MockTranslationService {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    // Simulate API delay
    await this.delay(800 + Math.random() * 1200);

    // Mock translation logic
    const mockTranslations: Record<string, Record<string, string>> = {
      'Hello': {
        'zh': '你好',
        'ja': 'こんにちは',
        'ko': '안녕하세요',
        'fr': 'Bonjour',
        'de': 'Hallo',
        'es': 'Hola'
      },
      'How are you?': {
        'zh': '你好吗？',
        'ja': '元気ですか？',
        'ko': '어떻게 지내세요?',
        'fr': 'Comment allez-vous?',
        'de': 'Wie geht es dir?',
        'es': '¿Cómo estás?'
      },
      'Thank you': {
        'zh': '谢谢',
        'ja': 'ありがとう',
        'ko': '감사합니다',
        'fr': 'Merci',
        'de': 'Danke',
        'es': 'Gracias'
      },
      'Good morning': {
        'zh': '早上好',
        'ja': 'おはよう',
        'ko': '좋은 아침',
        'fr': 'Bonjour',
        'de': 'Guten Morgen',
        'es': 'Buenos días'
      },
      'Goodbye': {
        'zh': '再见',
        'ja': 'さようなら',
        'ko': '안녕히 가세요',
        'fr': 'Au revoir',
        'de': 'Auf Wiedersehen',
        'es': 'Adiós'
      }
    };

    // Find exact match or use AI-style translation
    let translatedText = mockTranslations[request.text]?.[request.targetLang];
    
    if (!translatedText) {
      // Generate mock translation for unknown text
      if (request.targetLang === 'zh') {
        translatedText = `[中文翻译] ${request.text}`;
      } else if (request.targetLang === 'ja') {
        translatedText = `[日本語翻訳] ${request.text}`;
      } else if (request.targetLang === 'ko') {
        translatedText = `[한국어 번역] ${request.text}`;
      } else {
        translatedText = `[${request.targetLang.toUpperCase()} Translation] ${request.text}`;
      }
    }

    // Simulate detection of source language
    const detectedLanguage = request.sourceLang === 'auto' ? 'en' : request.sourceLang;

    return {
      translatedText,
      confidence: 0.85 + Math.random() * 0.15, // Random confidence between 0.85-1.0
      model: request.model || 'google',
      detectedLanguage
    };
  }

  async detectLanguage(text: string): Promise<string> {
    await this.delay(300);
    
    // Simple language detection based on character patterns
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    if (/[\u0900-\u097f]/.test(text)) return 'hi';
    
    return 'en'; // Default to English
  }
}

// Google Translate Service (placeholder for real implementation)
class GoogleTranslateService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    // TODO: Implement actual Google Translate API call
    // For now, fall back to mock service
    const mockService = new MockTranslationService();
    return mockService.translate(request);
  }

  async detectLanguage(text: string): Promise<string> {
    // TODO: Implement actual Google Translate language detection
    const mockService = new MockTranslationService();
    return mockService.detectLanguage(text);
  }
}

// OpenAI Translation Service (placeholder for real implementation)
class OpenAITranslationService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    // TODO: Implement actual OpenAI API call
    // For now, fall back to mock service
    const mockService = new MockTranslationService();
    const result = await mockService.translate(request);
    return { ...result, model: 'openai' };
  }

  async detectLanguage(text: string): Promise<string> {
    // TODO: Implement actual OpenAI language detection
    const mockService = new MockTranslationService();
    return mockService.detectLanguage(text);
  }
}

// Baidu Translation Service Adapter
class BaiduTranslationServiceAdapter {
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    console.log('🔄 BaiduTranslationServiceAdapter.translate 被调用');
    console.log('- 请求参数:', request);
    
    // 动态加载百度翻译服务
    try {
      await loadBaiduTranslationService();
    } catch (error) {
      console.error('❌ 百度翻译服务加载失败，无法进行翻译');
      console.error('- 加载错误:', error.message);
      throw new Error(`百度翻译服务加载失败: ${error.message}`);
    }
    
    if (!baiduTranslationService) {
      console.error('❌ 百度翻译服务实例不存在');
      throw new Error('百度翻译服务实例不存在');
    }
    
    console.log('- 百度翻译服务实例:', baiduTranslationService);
    
    // 记录环境变量可见性，但不要阻断，因为服务内部有默认配置回退
    const appId = import.meta.env.VITE_BAIDU_APP_ID;
    const apiKey = import.meta.env.VITE_BAIDU_API_KEY;
    console.log('- 环境变量检查:');
    console.log('  - VITE_BAIDU_APP_ID:', appId ? '已设置' : '未设置');
    console.log('  - VITE_BAIDU_API_KEY:', apiKey ? '已设置' : '未设置');
    
    try {
      console.log('📞 正在调用百度翻译服务...');
      const result = await baiduTranslationService.translateText({
        text: request.text,
        sourceLang: request.sourceLang,
        targetLang: request.targetLang
      });
      
      console.log('📋 百度翻译服务返回结果:', result);
      
      const response = {
        translatedText: result.translatedText,
        confidence: result.confidence,
        model: 'baidu',
        detectedLanguage: result.detectedLanguage
      };
      
      console.log('✅ BaiduTranslationServiceAdapter 返回响应:', response);
      return response;
    } catch (error) {
      console.error('❌ 百度翻译服务错误:', error);
      console.error('- 错误类型:', error.constructor.name);
      console.error('- 错误消息:', error.message);
      console.error('- 错误堆栈:', error.stack);
      // 重新抛出错误，不要回退到模拟服务
      throw error;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      return await baiduTranslationService.detectLanguage(text);
    } catch (error) {
      console.error('百度语言检测错误:', error);
      const mockService = new MockTranslationService();
      return await mockService.detectLanguage(text);
    }
  }
}

// Translation Service Factory
class TranslationServiceFactory {
  private static instance: TranslationServiceFactory;
  private services: Map<string, any> = new Map();

  static getInstance(): TranslationServiceFactory {
    if (!TranslationServiceFactory.instance) {
      TranslationServiceFactory.instance = new TranslationServiceFactory();
    }
    return TranslationServiceFactory.instance;
  }

  getService(model: 'baidu' | 'google' | 'openai' | 'mock' = 'baidu') {
    console.log('🏭 翻译服务工厂获取服务:', model);
    
    if (!this.services.has(model)) {
      console.log('- 创建新的服务实例:', model);
      switch (model) {
        case 'baidu':
          console.log('✅ 创建百度翻译服务');
          this.services.set(model, new BaiduTranslationServiceAdapter());
          break;
        case 'google':
          console.log('✅ 创建谷歌翻译服务');
          // In production, get API key from environment variables
          this.services.set(model, new GoogleTranslateService(import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || ''));
          break;
        case 'openai':
          console.log('✅ 创建OpenAI翻译服务');
          // In production, get API key from environment variables
          this.services.set(model, new OpenAITranslationService(import.meta.env.VITE_OPENAI_API_KEY || ''));
          break;
        default:
          console.log('✅ 创建模拟翻译服务');
          this.services.set(model, new MockTranslationService());
      }
    } else {
      console.log('- 使用已存在的服务实例:', model);
    }
    
    const service = this.services.get(model);
    console.log('- 返回服务实例:', service?.constructor.name);
    return service;
  }
}

// Main Translation Service
export class TranslationService {
  private factory = TranslationServiceFactory.getInstance();
  private defaultModel: 'baidu' | 'google' | 'openai' | 'mock' = 'baidu';

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      console.log('🎯 主翻译服务调用开始');
      console.log('- 请求参数:', request);
      console.log('- 默认模型:', this.defaultModel);
      
      const model = request.model || this.defaultModel;
      console.log('- 使用模型:', model);
      
      const service = this.factory.getService(model as 'baidu' | 'google' | 'openai' | 'mock');
      console.log('- 获取到服务:', service.constructor.name);
      
      // 确保我们不会意外使用模拟服务
      if (model === 'baidu' && service.constructor.name === 'MockTranslationService') {
        console.error('⚠️ 警告：请求百度服务但获得了模拟服务！');
        throw new Error('百度翻译服务初始化失败');
      }
      
      const result = await service.translate(request);
      console.log('✅ 翻译服务调用成功:', result);
      
      // 检查返回结果是否为模拟格式
      if (result.translatedText && result.translatedText.includes('Translation]')) {
        console.error('⚠️ 警告：检测到模拟翻译结果格式！');
        console.error('- 结果:', result.translatedText);
        throw new Error('获得了模拟翻译结果，而非真实API结果');
      }
      
      return result;
    } catch (error) {
      console.error('❌ 翻译服务错误:', error);
      console.error('- 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw {
        code: 'TRANSLATION_ERROR',
        message: 'Failed to translate text',
        details: error
      } as TranslationError;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const service = this.factory.getService(this.defaultModel);
      return await service.detectLanguage(text);
    } catch (error) {
      console.error('语言检测错误:', error);
      throw {
        code: 'DETECTION_ERROR',
        message: 'Failed to detect language',
        details: error
      } as TranslationError;
    }
  }

  // 设置默认翻译模型
  setDefaultModel(model: 'baidu' | 'google' | 'openai' | 'mock') {
    this.defaultModel = model;
  }

  // 获取当前默认模型
  getDefaultModel() {
    return this.defaultModel;
  }

  // 检查百度翻译服务是否可用
  async checkBaiduService(): Promise<boolean> {
    try {
      await this.translate({
        text: 'test',
        sourceLang: 'en',
        targetLang: 'zh',
        model: 'baidu'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  getLanguageOptions() {
    return Object.values(SUPPORTED_LANGUAGES).map(lang => ({
      value: lang.code,
      label: `${lang.flag} ${lang.name}`
    }));
  }
}

// Export singleton instance
export const translationService = new TranslationService();