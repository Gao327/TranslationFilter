// 翻译缓存服务
import CryptoJS from 'crypto-js';

// 缓存项接口
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

// 缓存配置
export interface CacheConfig {
  maxSize: number; // 最大缓存项数
  defaultTTL: number; // 默认过期时间（毫秒）
  cleanupInterval: number; // 清理间隔（毫秒）
  compressionThreshold: number; // 压缩阈值（字节）
}

// 默认缓存配置
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24小时
  cleanupInterval: 60 * 60 * 1000, // 1小时
  compressionThreshold: 1024 // 1KB
};

// 翻译缓存键生成器
export class CacheKeyGenerator {
  static generateTextKey(
    text: string,
    sourceLang: string,
    targetLang: string,
    model: string = 'baidu'
  ): string {
    const content = `${model}:text:${sourceLang}:${targetLang}:${text}`;
    return CryptoJS.MD5(content).toString();
  }

  static generateImageKey(
    imageHash: string,
    sourceLang: string,
    targetLang: string,
    paste: number = 0
  ): string {
    const content = `baidu:image:${sourceLang}:${targetLang}:${paste}:${imageHash}`;
    return CryptoJS.MD5(content).toString();
  }

  static generateSpeechKey(
    audioHash: string,
    sourceLang: string,
    targetLang: string,
    format: string = 'wav'
  ): string {
    const content = `baidu:speech:${sourceLang}:${targetLang}:${format}:${audioHash}`;
    return CryptoJS.MD5(content).toString();
  }

  static generateHashFromData(data: string | ArrayBuffer): string {
    if (typeof data === 'string') {
      return CryptoJS.MD5(data).toString();
    } else {
      const uint8Array = new Uint8Array(data);
      const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
      return CryptoJS.MD5(binaryString).toString();
    }
  }
}

// 内存缓存管理器
export class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.startCleanupTimer();
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);

    // 如果缓存已满，删除最少使用的项
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    const now = Date.now();
    
    // 检查是否过期
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问统计
    item.accessCount++;
    item.lastAccessed = now;

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // 获取缓存统计信息
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccess: number;
    expiredItems: number;
  } {
    let totalAccess = 0;
    let expiredItems = 0;
    const now = Date.now();

    for (const item of this.cache.values()) {
      totalAccess += item.accessCount;
      if (now > item.expiresAt) {
        expiredItems++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalAccess > 0 ? (totalAccess / (totalAccess + expiredItems)) * 100 : 0,
      totalAccess,
      expiredItems
    };
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastUsedItem: CacheItem<T> | null = null;

    for (const [key, item] of this.cache.entries()) {
      if (!leastUsedItem || 
          item.accessCount < leastUsedItem.accessCount ||
          (item.accessCount === leastUsedItem.accessCount && item.lastAccessed < leastUsedItem.lastAccessed)) {
        leastUsedKey = key;
        leastUsedItem = item;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// 持久化缓存管理器（使用 localStorage）
export class PersistentCache<T> {
  private storageKey: string;
  private memoryCache: MemoryCache<T>;
  private config: CacheConfig;

  constructor(storageKey: string, config: Partial<CacheConfig> = {}) {
    this.storageKey = storageKey;
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.memoryCache = new MemoryCache<T>(config);
    this.loadFromStorage();
  }

  set(key: string, data: T, ttl?: number): void {
    this.memoryCache.set(key, data, ttl);
    this.saveToStorage();
  }

  get(key: string): T | null {
    return this.memoryCache.get(key);
  }

  has(key: string): boolean {
    return this.memoryCache.has(key);
  }

  delete(key: string): boolean {
    const result = this.memoryCache.delete(key);
    this.saveToStorage();
    return result;
  }

  clear(): void {
    this.memoryCache.clear();
    this.clearStorage();
  }

  getStats() {
    return this.memoryCache.getStats();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();

        // 只加载未过期的项
        for (const [key, item] of Object.entries(data)) {
          const cacheItem = item as CacheItem<T>;
          if (now <= cacheItem.expiresAt) {
            this.memoryCache.set(key, cacheItem.data, cacheItem.expiresAt - now);
          }
        }
      }
    } catch (error) {
      console.error('加载缓存失败:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const cacheData: Record<string, CacheItem<T>> = {};
      const cache = (this.memoryCache as any).cache as Map<string, CacheItem<T>>;
      
      for (const [key, item] of cache.entries()) {
        cacheData[key] = item;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存缓存失败:', error);
      // 如果存储空间不足，清理一些缓存
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldestItems(Math.floor(this.memoryCache.size() * 0.3));
      }
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  private clearOldestItems(count: number): void {
    const cache = (this.memoryCache as any).cache as Map<string, CacheItem<T>>;
    const items = Array.from(cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);

    items.forEach(([key]) => this.memoryCache.delete(key));
    this.saveToStorage();
  }

  destroy(): void {
    this.memoryCache.destroy();
  }
}

// 翻译缓存服务
export class TranslationCacheService {
  private textCache: PersistentCache<{
    translatedText: string;
    confidence: number;
    detectedLanguage?: string;
  }>;
  
  private imageCache: MemoryCache<{
    translatedText: string;
    originalText: string;
    translatedImage?: string;
    textBlocks: Array<{
      original: string;
      translated: string;
      position: { x: number; y: number; width: number; height: number };
    }>;
  }>;
  
  private speechCache: MemoryCache<{
    originalText: string;
    translatedText: string;
    translatedAudio: string;
  }>;

  constructor() {
    // 文本翻译使用持久化缓存，保存时间较长
    this.textCache = new PersistentCache('translation_text_cache', {
      maxSize: 2000,
      defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7天
      cleanupInterval: 2 * 60 * 60 * 1000 // 2小时
    });

    // 图片翻译使用内存缓存，数据量大但使用频率低
    this.imageCache = new MemoryCache({
      maxSize: 100,
      defaultTTL: 24 * 60 * 60 * 1000, // 24小时
      cleanupInterval: 60 * 60 * 1000 // 1小时
    });

    // 语音翻译使用内存缓存，数据量大且时效性强
    this.speechCache = new MemoryCache({
      maxSize: 50,
      defaultTTL: 60 * 60 * 1000, // 1小时
      cleanupInterval: 30 * 60 * 1000 // 30分钟
    });
  }

  // 文本翻译缓存
  getCachedTextTranslation(
    text: string,
    sourceLang: string,
    targetLang: string,
    model: string = 'baidu'
  ) {
    const key = CacheKeyGenerator.generateTextKey(text, sourceLang, targetLang, model);
    return this.textCache.get(key);
  }

  setCachedTextTranslation(
    text: string,
    sourceLang: string,
    targetLang: string,
    result: {
      translatedText: string;
      confidence: number;
      detectedLanguage?: string;
    },
    model: string = 'baidu'
  ) {
    const key = CacheKeyGenerator.generateTextKey(text, sourceLang, targetLang, model);
    this.textCache.set(key, result);
  }

  // 图片翻译缓存
  getCachedImageTranslation(
    imageData: string,
    sourceLang: string,
    targetLang: string,
    paste: number = 0
  ) {
    const imageHash = CacheKeyGenerator.generateHashFromData(imageData);
    const key = CacheKeyGenerator.generateImageKey(imageHash, sourceLang, targetLang, paste);
    return this.imageCache.get(key);
  }

  setCachedImageTranslation(
    imageData: string,
    sourceLang: string,
    targetLang: string,
    result: {
      translatedText: string;
      originalText: string;
      translatedImage?: string;
      textBlocks: Array<{
        original: string;
        translated: string;
        position: { x: number; y: number; width: number; height: number };
      }>;
    },
    paste: number = 0
  ) {
    const imageHash = CacheKeyGenerator.generateHashFromData(imageData);
    const key = CacheKeyGenerator.generateImageKey(imageHash, sourceLang, targetLang, paste);
    this.imageCache.set(key, result);
  }

  // 语音翻译缓存
  getCachedSpeechTranslation(
    audioData: string,
    sourceLang: string,
    targetLang: string,
    format: string = 'wav'
  ) {
    const audioHash = CacheKeyGenerator.generateHashFromData(audioData);
    const key = CacheKeyGenerator.generateSpeechKey(audioHash, sourceLang, targetLang, format);
    return this.speechCache.get(key);
  }

  setCachedSpeechTranslation(
    audioData: string,
    sourceLang: string,
    targetLang: string,
    result: {
      originalText: string;
      translatedText: string;
      translatedAudio: string;
    },
    format: string = 'wav'
  ) {
    const audioHash = CacheKeyGenerator.generateHashFromData(audioData);
    const key = CacheKeyGenerator.generateSpeechKey(audioHash, sourceLang, targetLang, format);
    this.speechCache.set(key, result);
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      text: this.textCache.getStats(),
      image: this.imageCache.getStats(),
      speech: this.speechCache.getStats()
    };
  }

  // 清理所有缓存
  clearAllCaches() {
    this.textCache.clear();
    this.imageCache.clear();
    this.speechCache.clear();
  }

  // 销毁缓存服务
  destroy() {
    this.textCache.destroy();
    this.imageCache.destroy();
    this.speechCache.destroy();
  }
}

// 导出单例实例
export const translationCacheService = new TranslationCacheService();