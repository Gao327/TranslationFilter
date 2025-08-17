import React, { useState, useEffect } from 'react';
import { browserEnvironment, environmentConfig, getDebugInfo } from '../utils/browserDetection';
import { AlertTriangle, Info, CheckCircle, XCircle, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DebugInfo {
  timestamp: string;
  environment: any;
  debugData: any;
  testResults: Record<string, boolean>;
}

export function EmbeddedBrowserDebugger() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  // 只在开发环境或嵌入式浏览器中显示
  const shouldShow = import.meta.env.DEV || browserEnvironment.isEmbedded;

  useEffect(() => {
    if (shouldShow) {
      runDiagnostics();
    }
  }, [shouldShow]);

  const runDiagnostics = async () => {
    console.log('🔍 运行嵌入式浏览器诊断...');
    
    const tests = {
      'Fetch API': testFetchAPI(),
      'CORS预检': await testCORSPreflight(),
      '环境变量访问': testEnvironmentVariables(),
      '本地存储': testLocalStorage(),
      '剪贴板API': await testClipboardAPI(),
      '语音合成': testSpeechSynthesis(),
      '网络连接': testNetworkConnection(),
      '代理配置': await testProxyConfiguration()
    };

    setTestResults(tests);
    
    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      environment: browserEnvironment,
      debugData: getDebugInfo(),
      testResults: tests
    };
    
    setDebugInfo(info);
    console.log('🔍 诊断完成:', info);
  };

  const testFetchAPI = (): boolean => {
    try {
      return typeof fetch !== 'undefined' && typeof AbortController !== 'undefined';
    } catch {
      return false;
    }
  };

  const testCORSPreflight = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await fetch('/api/baidu/api/trans/vip/translate', {
        method: 'OPTIONS',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  };

  const testEnvironmentVariables = (): boolean => {
    try {
      const appId = import.meta.env.VITE_BAIDU_APP_ID;
      const apiKey = import.meta.env.VITE_BAIDU_API_KEY;
      return !!(appId && apiKey);
    } catch {
      return false;
    }
  };

  const testLocalStorage = (): boolean => {
    try {
      const testKey = '__embedded_browser_test__';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return value === 'test';
    } catch {
      return false;
    }
  };

  const testClipboardAPI = async (): Promise<boolean> => {
    try {
      return !!navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
    } catch {
      return false;
    }
  };

  const testSpeechSynthesis = (): boolean => {
    try {
      return 'speechSynthesis' in window && typeof speechSynthesis.speak === 'function';
    } catch {
      return false;
    }
  };

  const testNetworkConnection = (): boolean => {
    try {
      return navigator.onLine;
    } catch {
      return false;
    }
  };

  const testProxyConfiguration = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/baidu/api/trans/vip/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'q=test&from=en&to=zh&appid=test&salt=123&sign=test',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      // 即使返回错误，只要能连接到代理就算成功
      return response.status !== 0;
    } catch {
      return false;
    }
  };

  const copyDebugInfo = async () => {
    if (!debugInfo) return;
    
    const debugText = JSON.stringify(debugInfo, null, 2);
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(debugText);
        toast.success('调试信息已复制到剪贴板');
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = debugText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('调试信息已复制到剪贴板');
      }
    } catch {
      toast.error('复制失败，请手动复制控制台中的信息');
      console.log('🔍 调试信息:', debugText);
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`mb-2 p-3 rounded-full shadow-lg transition-all ${
          browserEnvironment.isEmbedded 
            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title="嵌入式浏览器调试器"
      >
        {browserEnvironment.isEmbedded ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <Info className="w-5 h-5" />
        )}
      </button>

      {/* 调试面板 */}
      {isVisible && (
        <div className="bg-white rounded-lg shadow-xl border max-w-md w-80 max-h-96 overflow-y-auto">
          <div className="p-4 border-b bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                浏览器环境调试
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={runDiagnostics}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="重新运行诊断"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={copyDebugInfo}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="复制调试信息"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* 环境状态 */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">环境状态</h4>
              <div className="space-y-1 text-xs">
                <div className={`flex items-center space-x-2 ${
                  browserEnvironment.isEmbedded ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {browserEnvironment.isEmbedded ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  <span>
                    {browserEnvironment.isEmbedded ? '嵌入式浏览器' : '独立浏览器'}
                  </span>
                </div>
                
                {browserEnvironment.isTraeEmbedded && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Trae 嵌入式环境</span>
                  </div>
                )}
                
                {browserEnvironment.isIframe && (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <Info className="w-3 h-3" />
                    <span>iframe 环境</span>
                  </div>
                )}
              </div>
            </div>

            {/* 功能测试结果 */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">功能测试</h4>
              <div className="space-y-1">
                {Object.entries(testResults).map(([test, passed]) => (
                  <div key={test} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{test}</span>
                    <div className={`flex items-center space-x-1 ${
                      passed ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {passed ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{passed ? '通过' : '失败'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 配置信息 */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">配置信息</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>代理: {environmentConfig.useProxy ? '启用' : '禁用'}</div>
                <div>超时: {environmentConfig.timeout}ms</div>
                <div>重试: {environmentConfig.maxRetries}次</div>
                <div>网络: {navigator.onLine ? '在线' : '离线'}</div>
              </div>
            </div>

            {/* 建议 */}
            {browserEnvironment.isEmbedded && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <h4 className="font-medium text-sm text-orange-800 mb-1">建议</h4>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• 确保代理配置正确</li>
                  <li>• 检查环境变量设置</li>
                  <li>• 如有问题请联系技术支持</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmbeddedBrowserDebugger;