// API工具类：错误处理、重试机制和使用统计

// API错误类型定义
export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  details?: any;
}

// 使用统计接口
export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCharacters: number;
  totalCost: number; // 估算费用（人民币分）
  lastResetDate: string;
  dailyUsage: Record<string, {
    requests: number;
    characters: number;
    cost: number;
  }>;
}

// 重试配置
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // 基础延迟（毫秒）
  maxDelay: number; // 最大延迟（毫秒）
  backoffFactor: number; // 退避因子
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

// 百度API费用配置（人民币分/字符）
const BAIDU_PRICING = {
  text: 0.049, // ¥49/百万字符 = 0.049分/字符
  image: 0.15, // ¥1.5/千次 = 150分/千次，按平均50字符计算
  speech: 0.12 // ¥1.2/小时，按平均500字符/分钟计算
};

// API错误分类
export class ApiErrorHandler {
  static categorizeError(error: any): ApiError {
    // 网络错误
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置',
        retryable: true,
        details: error
      };
    }

    // 超时错误
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: '请求超时，请稍后重试',
        retryable: true,
        details: error
      };
    }

    // 百度API特定错误
    if (error.response?.data?.error_code) {
      const errorCode = String(error.response.data.error_code);
      const errorMsg = error.response.data.error_msg || '未知错误';

      switch (errorCode) {
        case '52001':
          return {
            code: 'TIMEOUT',
            message: '请求超时，请重试',
            retryable: true,
            details: error
          };
        case '52002':
          return {
            code: 'SYSTEM_ERROR',
            message: '系统错误，请稍后重试',
            retryable: true,
            details: error
          };
        case '52003':
          return {
            code: 'UNAUTHORIZED',
            message: 'API密钥无效，请检查配置',
            retryable: false,
            details: error
          };
        case '54000':
          return {
            code: 'MISSING_PARAMS',
            message: '请求参数缺失',
            retryable: false,
            details: error
          };
        case '54001':
          return {
            code: 'INVALID_SIGNATURE',
            message: '签名错误，请检查API配置',
            retryable: false,
            details: error
          };
        case '54003':
          return {
            code: 'ACCESS_FREQUENCY_LIMITED',
            message: '访问频率受限，请稍后重试',
            retryable: true,
            details: error
          };
        case '54004':
          return {
            code: 'ACCOUNT_NOT_EXISTS',
            message: '账户不存在，请检查API配置',
            retryable: false,
            details: error
          };
        case '54005':
          return {
            code: 'INSUFFICIENT_BALANCE',
            message: '账户余额不足',
            retryable: false,
            details: error
          };
        case '58000':
          return {
            code: 'CLIENT_IP_ILLEGAL',
            message: 'IP地址不在白名单中',
            retryable: false,
            details: error
          };
        case '90107':
          return {
            code: 'CERTIFICATION_NOT_PASSED',
            message: '认证未通过或未生效',
            retryable: false,
            details: error
          };
        default:
          return {
            code: 'API_ERROR',
            message: `API错误: ${errorMsg} (${errorCode})`,
            retryable: errorCode.startsWith('52'), // 52xxx错误通常可重试
            details: error
          };
      }
    }

    // 其他错误
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || '未知错误',
      retryable: false,
      details: error
    };
  }
}

// 重试机制
export class RetryHandler {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: any;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const apiError = ApiErrorHandler.categorizeError(error);

        // 如果错误不可重试，直接抛出
        if (!apiError.retryable || attempt === retryConfig.maxRetries) {
          throw apiError;
        }

        // 计算延迟时间
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
          retryConfig.maxDelay
        );

        console.warn(`API请求失败，${delay}ms后重试 (${attempt + 1}/${retryConfig.maxRetries}):`, apiError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw ApiErrorHandler.categorizeError(lastError);
  }
}

// 使用统计管理
export class UsageStatsManager {
  private static readonly STORAGE_KEY = 'translation_usage_stats';

  static getStats(): UsageStats {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('读取使用统计失败:', error);
    }

    // 返回默认统计
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCharacters: 0,
      totalCost: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      dailyUsage: {}
    };
  }

  static updateStats(
    type: 'text' | 'image' | 'speech',
    characters: number,
    success: boolean
  ): void {
    try {
      const stats = this.getStats();
      const today = new Date().toISOString().split('T')[0];

      // 检查是否需要重置日统计
      if (stats.lastResetDate !== today) {
        stats.lastResetDate = today;
        // 保留最近30天的数据
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
        
        Object.keys(stats.dailyUsage).forEach(date => {
          if (date < cutoffDate) {
            delete stats.dailyUsage[date];
          }
        });
      }

      // 更新总统计
      stats.totalRequests++;
      if (success) {
        stats.successfulRequests++;
        stats.totalCharacters += characters;
        
        // 计算费用
        const cost = characters * BAIDU_PRICING[type];
        stats.totalCost += cost;

        // 更新日统计
        if (!stats.dailyUsage[today]) {
          stats.dailyUsage[today] = {
            requests: 0,
            characters: 0,
            cost: 0
          };
        }
        stats.dailyUsage[today].requests++;
        stats.dailyUsage[today].characters += characters;
        stats.dailyUsage[today].cost += cost;
      } else {
        stats.failedRequests++;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('更新使用统计失败:', error);
    }
  }

  static resetStats(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('重置使用统计失败:', error);
    }
  }

  static getMonthlyStats(): {
    requests: number;
    characters: number;
    cost: number;
  } {
    const stats = this.getStats();
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    let monthlyRequests = 0;
    let monthlyCharacters = 0;
    let monthlyCost = 0;

    Object.entries(stats.dailyUsage).forEach(([date, usage]) => {
      if (date.startsWith(currentMonth)) {
        monthlyRequests += usage.requests;
        monthlyCharacters += usage.characters;
        monthlyCost += usage.cost;
      }
    });

    return {
      requests: monthlyRequests,
      characters: monthlyCharacters,
      cost: monthlyCost
    };
  }

  static getTodayStats(): {
    requests: number;
    characters: number;
    cost: number;
  } {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = stats.dailyUsage[today];

    return todayUsage || {
      requests: 0,
      characters: 0,
      cost: 0
    };
  }

  static formatCost(costInCents: number): string {
    return `¥${(costInCents / 100).toFixed(2)}`;
  }

  static getSuccessRate(): number {
    const stats = this.getStats();
    if (stats.totalRequests === 0) return 0;
    return (stats.successfulRequests / stats.totalRequests) * 100;
  }
}

// 导出工具函数
export const apiUtils = {
  retry: RetryHandler.executeWithRetry,
  categorizeError: ApiErrorHandler.categorizeError,
  updateStats: UsageStatsManager.updateStats,
  getStats: UsageStatsManager.getStats,
  resetStats: UsageStatsManager.resetStats,
  getMonthlyStats: UsageStatsManager.getMonthlyStats,
  getTodayStats: UsageStatsManager.getTodayStats,
  formatCost: UsageStatsManager.formatCost,
  getSuccessRate: UsageStatsManager.getSuccessRate
};