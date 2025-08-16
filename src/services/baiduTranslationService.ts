import axios from 'axios';
import CryptoJS from 'crypto-js';
import { apiUtils, RetryHandler, UsageStatsManager } from './apiUtils';
import { translationCacheService } from './cacheService';

// 检测是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 百度翻译API配置
const BAIDU_API_CONFIG = {
  appId: import.meta.env.VITE_BAIDU_APP_ID || '20250816002432414',
  apiKey: import.meta.env.VITE_BAIDU_API_KEY || 'b3a1JQGV7LUYIEVti14j',
  // 在浏览器环境中使用代理，在Node.js环境中直接访问
  textApiUrl: isBrowser ? '/api/baidu/api/trans/vip/translate' : 'https://fanyi-api.baidu.com/api/trans/vip/translate',
  imageApiUrl: isBrowser ? '/api/baidu/api/trans/vip/picture' : 'https://fanyi-api.baidu.com/api/trans/vip/picture',
  speechApiUrl: isBrowser ? '/api/baidu/api/trans/vip/speech' : 'https://fanyi-api.baidu.com/api/trans/vip/speech',
};

// 百度翻译语言代码映射
const BAIDU_LANGUAGE_MAP: Record<string, string> = {
  'auto': 'auto',
  'zh': 'zh',
  'en': 'en',
  'ja': 'jp',
  'ko': 'kor',
  'fr': 'fra',
  'de': 'de',
  'es': 'spa',
  'it': 'it',
  'pt': 'pt',
  'ru': 'ru',
  'ar': 'ara',
  'hi': 'hi',
  'th': 'th',
  'vi': 'vie'
};

// 反向映射：百度语言代码到我们的语言代码
const REVERSE_LANGUAGE_MAP: Record<string, string> = {
  'auto': 'auto',
  'zh': 'zh',
  'en': 'en',
  'jp': 'ja',
  'kor': 'ko',
  'fra': 'fr',
  'de': 'de',
  'spa': 'es',
  'it': 'it',
  'pt': 'pt',
  'ru': 'ru',
  'ara': 'ar',
  'hi': 'hi',
  'th': 'th',
  'vie': 'vi'
};

// 百度翻译API接口类型
export interface BaiduTranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface BaiduTranslationResponse {
  from: string;
  to: string;
  trans_result: Array<{
    src: string;
    dst: string;
  }>;
  error_code?: string;
  error_msg?: string;
}

export interface BaiduImageTranslationRequest {
  image: string; // base64编码的图片
  sourceLang: string;
  targetLang: string;
  paste?: number; // 是否贴合原文
}

export interface BaiduImageTranslationResponse {
  log_id: number;
  data: {
    sumSrc: string;
    sumDst: string;
    pasteImg?: string; // 贴合翻译的图片
    content: Array<{
      src: string;
      dst: string;
      rect: {
        left: number;
        top: number;
        width: number;
        height: number;
      };
    }>;
  };
  error_code?: string;
  error_msg?: string;
}

export interface BaiduSpeechTranslationRequest {
  voice: string; // base64编码的音频
  format: string; // 音频格式
  rate: number; // 采样率
  channel: number; // 声道数
  sourceLang: string;
  targetLang: string;
}

export interface BaiduSpeechTranslationResponse {
  log_id: number;
  result: {
    src: string;
    dst: string;
    voice: string; // 合成的语音base64
  };
  error_code?: string;
  error_msg?: string;
}

// 生成百度API签名
function generateSign(query: string, appId: string, salt: string, apiKey: string): string {
  const str = appId + query + salt + apiKey;
  return CryptoJS.MD5(str).toString();
}

// 百度翻译服务类
export class BaiduTranslationService {
  private appId: string;
  private apiKey: string;

  constructor() {
    this.appId = BAIDU_API_CONFIG.appId || '20250816002432414';
    this.apiKey = BAIDU_API_CONFIG.apiKey || 'b3a1JQGV7LUYIEVti14j';
    
    console.log('🔧 百度翻译服务初始化');
    console.log('- APP ID:', this.appId);
    console.log('- API Key:', this.apiKey ? this.apiKey.substring(0, 8) + '***' : '未设置');
    console.log('- 环境变量 VITE_BAIDU_APP_ID:', import.meta.env.VITE_BAIDU_APP_ID);
    console.log('- 环境变量 VITE_BAIDU_API_KEY:', import.meta.env.VITE_BAIDU_API_KEY ? import.meta.env.VITE_BAIDU_API_KEY.substring(0, 8) + '***' : '未设置');
    
    // 不在构造函数中抛出错误，而是在实际调用时检查
    if (!this.appId || !this.apiKey) {
      console.warn('⚠️ 百度翻译API配置缺失，将在调用时检查');
    } else {
      console.log('✅ 百度翻译服务初始化成功');
    }
  }

  // 文本翻译
  async translateText(request: BaiduTranslationRequest): Promise<{
    translatedText: string;
    confidence: number;
    detectedLanguage?: string;
  }> {
    // 运行时检查API配置
    if (!this.appId || !this.apiKey) {
      console.error('❌ 百度翻译API配置缺失');
      console.error('- APP ID:', this.appId || '未设置');
      console.error('- API Key:', this.apiKey ? '已设置' : '未设置');
      throw new Error('百度翻译API配置缺失，请检查环境变量 VITE_BAIDU_APP_ID 和 VITE_BAIDU_API_KEY');
    }
    
    // 检查缓存
    const cachedResult = translationCacheService.getCachedTextTranslation(
      request.text,
      request.sourceLang,
      request.targetLang,
      'baidu'
    );
    
    if (cachedResult) {
      console.log('使用缓存的翻译结果');
      return cachedResult;
    }

    const operation = async () => {
      const salt = Date.now().toString();
      const from = BAIDU_LANGUAGE_MAP[request.sourceLang] || 'auto';
      const to = BAIDU_LANGUAGE_MAP[request.targetLang] || 'en';
      const sign = generateSign(request.text, this.appId, salt, this.apiKey);

      const params = {
        q: request.text,
        from,
        to,
        appid: this.appId,
        salt,
        sign
      };

      console.log('🚀 开始百度翻译API调用');
      console.log('- 原文:', request.text);
      console.log('- 源语言:', request.sourceLang);
      console.log('- 目标语言:', request.targetLang);
      
      console.log('📤 百度翻译API调用参数:');
      console.log('- URL:', BAIDU_API_CONFIG.textApiUrl);
      console.log('- 参数:', { ...params, sign: sign.substring(0, 8) + '***' });

      const response = await axios.post<BaiduTranslationResponse>(
        BAIDU_API_CONFIG.textApiUrl,
        new URLSearchParams(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );
      
      console.log('📥 百度翻译API响应:');
      console.log('- 状态码:', response.status);
      console.log('- 响应数据:', response.data);

      if (response.data.error_code) {
        const error = new Error(`百度翻译API错误: ${response.data.error_msg} (${response.data.error_code})`);
        (error as any).response = { data: response.data };
        throw error;
      }

      const result = response.data.trans_result[0];
      const detectedLanguage = REVERSE_LANGUAGE_MAP[response.data.from] || response.data.from;

      return {
        translatedText: result.dst,
        confidence: 0.95, // 百度API不返回置信度，使用固定值
        detectedLanguage: request.sourceLang === 'auto' ? detectedLanguage : undefined
      };
    };

    try {
      const result = await RetryHandler.executeWithRetry(operation, {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 5000
      });
      
      // 更新使用统计
      UsageStatsManager.updateStats('text', request.text.length, true);
      
      // 缓存结果
      translationCacheService.setCachedTextTranslation(
        request.text,
        request.sourceLang,
        request.targetLang,
        result,
        'baidu'
      );
      
      return result;
    } catch (error) {
      // 更新失败统计
      UsageStatsManager.updateStats('text', request.text.length, false);
      
      console.error('百度文本翻译错误:', error);
      throw error;
    }
  }

  // 图片翻译
  async translateImage(request: BaiduImageTranslationRequest): Promise<{
    translatedText: string;
    originalText: string;
    translatedImage?: string;
    textBlocks: Array<{
      original: string;
      translated: string;
      position: { x: number; y: number; width: number; height: number };
    }>;
  }> {
    // 检查缓存
    const cachedResult = translationCacheService.getCachedImageTranslation(
      request.image,
      request.sourceLang,
      request.targetLang,
      request.paste || 0
    );
    
    if (cachedResult) {
      console.log('使用缓存的图片翻译结果');
      return cachedResult;
    }

    const operation = async () => {
      const salt = Date.now().toString();
      const from = BAIDU_LANGUAGE_MAP[request.sourceLang] || 'auto';
      const to = BAIDU_LANGUAGE_MAP[request.targetLang] || 'en';
      const sign = generateSign(request.image, this.appId, salt, this.apiKey);

      const params = {
        image: request.image,
        from,
        to,
        appid: this.appId,
        salt,
        sign,
        paste: (request.paste || 0).toString()
      };

      const response = await axios.post<BaiduImageTranslationResponse>(
        BAIDU_API_CONFIG.imageApiUrl,
        new URLSearchParams(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      if (response.data.error_code) {
        const error = new Error(`百度图片翻译API错误: ${response.data.error_msg} (${response.data.error_code})`);
        (error as any).response = { data: response.data };
        throw error;
      }

      const textBlocks = response.data.data.content.map(item => ({
        original: item.src,
        translated: item.dst,
        position: {
          x: item.rect.left,
          y: item.rect.top,
          width: item.rect.width,
          height: item.rect.height
        }
      }));

      return {
        originalText: response.data.data.sumSrc,
        translatedText: response.data.data.sumDst,
        translatedImage: response.data.data.pasteImg,
        textBlocks
      };
    };

    try {
      const result = await RetryHandler.executeWithRetry(operation, {
        maxRetries: 1, // 图片翻译重试次数较少
        baseDelay: 2000,
        maxDelay: 8000
      });
      
      // 更新使用统计（按平均50字符计算）
      const estimatedChars = Math.max(result.originalText.length, 50);
      UsageStatsManager.updateStats('image', estimatedChars, true);
      
      // 缓存结果
      translationCacheService.setCachedImageTranslation(
        request.image,
        request.sourceLang,
        request.targetLang,
        result,
        request.paste || 0
      );
      
      return result;
    } catch (error) {
      // 更新失败统计
      UsageStatsManager.updateStats('image', 50, false);
      
      console.error('百度图片翻译错误:', error);
      throw error;
    }
  }

  // 语音翻译
  async translateSpeech(request: BaiduSpeechTranslationRequest): Promise<{
    originalText: string;
    translatedText: string;
    translatedAudio: string;
  }> {
    // 检查缓存
    const cachedResult = translationCacheService.getCachedSpeechTranslation(
      request.voice,
      request.sourceLang,
      request.targetLang,
      request.format
    );
    
    if (cachedResult) {
      console.log('使用缓存的语音翻译结果');
      return cachedResult;
    }

    const operation = async () => {
      const salt = Date.now().toString();
      const from = BAIDU_LANGUAGE_MAP[request.sourceLang] || 'auto';
      const to = BAIDU_LANGUAGE_MAP[request.targetLang] || 'en';
      const sign = generateSign(request.voice, this.appId, salt, this.apiKey);

      const params = {
        voice: request.voice,
        format: request.format,
        rate: (request.rate || 16000).toString(),
        channel: (request.channel || 1).toString(),
        from,
        to,
        appid: this.appId,
        salt,
        sign
      };

      const response = await axios.post<BaiduSpeechTranslationResponse>(
        BAIDU_API_CONFIG.speechApiUrl,
        new URLSearchParams(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      if (response.data.error_code) {
        const error = new Error(`百度语音翻译API错误: ${response.data.error_msg} (${response.data.error_code})`);
        (error as any).response = { data: response.data };
        throw error;
      }

      return {
        originalText: response.data.result.src,
        translatedText: response.data.result.dst,
        translatedAudio: response.data.result.voice
      };
    };

    try {
      const result = await RetryHandler.executeWithRetry(operation, {
        maxRetries: 1, // 语音翻译重试次数较少
        baseDelay: 2000,
        maxDelay: 10000
      });
      
      // 更新使用统计
      const estimatedChars = Math.max(result.originalText.length, 30);
      UsageStatsManager.updateStats('speech', estimatedChars, true);
      
      // 缓存结果
      translationCacheService.setCachedSpeechTranslation(
        request.voice,
        request.sourceLang,
        request.targetLang,
        result,
        request.format
      );
      
      return result;
    } catch (error) {
      // 更新失败统计
      UsageStatsManager.updateStats('speech', 30, false);
      
      console.error('百度语音翻译错误:', error);
      throw error;
    }
  }

  // 语言检测
  async detectLanguage(text: string): Promise<string> {
    try {
      const result = await this.translateText({
        text,
        sourceLang: 'auto',
        targetLang: 'en'
      });
      return result.detectedLanguage || 'en';
    } catch (error) {
      console.error('语言检测错误:', error);
      return 'en'; // 默认返回英语
    }
  }

  // 获取API使用统计
  getUsageStats() {
    return UsageStatsManager.getStats();
  }

  // 获取今日使用统计
  getTodayStats() {
    return UsageStatsManager.getTodayStats();
  }

  // 获取本月使用统计
  getMonthlyStats() {
    return UsageStatsManager.getMonthlyStats();
  }

  // 获取成功率
  getSuccessRate() {
    return UsageStatsManager.getSuccessRate();
  }

  // 重置使用统计
  resetUsageStats() {
    UsageStatsManager.resetStats();
  }

  // 获取缓存统计
  getCacheStats() {
    return translationCacheService.getCacheStats();
  }

  // 清理缓存
  clearCache() {
    translationCacheService.clearAllCaches();
  }

  // 获取支持的语言列表
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return Object.keys(BAIDU_LANGUAGE_MAP).map(code => ({
      code,
      name: this.getLanguageName(code)
    }));
  }

  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'auto': '自动检测',
      'zh': '中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'it': '意大利语',
      'pt': '葡萄牙语',
      'ru': '俄语',
      'ar': '阿拉伯语',
      'hi': '印地语',
      'th': '泰语',
      'vi': '越南语'
    };
    return names[code] || code;
  }
}

// 导出单例实例
export const baiduTranslationService = new BaiduTranslationService();