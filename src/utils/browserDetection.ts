/**
 * Unified Browser Environment Detection Utility
 * (Consolidated to avoid duplicate types/exports and to match current usages)
 */

export interface BrowserEnvironment {
  isEmbedded: boolean;
  isTraeEmbedded: boolean;
  isIframe: boolean;
  userAgent: string;
  capabilities: Record<string, boolean>;
  restrictions: Record<string, boolean>;
}

export interface EnvironmentConfig {
  useProxy: boolean;
  headers: Record<string, string>;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  apiEndpoint: string;
  errorHandling: {
    showDetailedErrors: boolean;
    fallbackToMock: boolean;
    logErrors: boolean;
  };
}

export function detectBrowserEnvironment(): BrowserEnvironment {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIframe = typeof window !== 'undefined' ? (window !== window.top) : false;
  const isTraeEmbedded = /Trae|Electron/i.test(ua) || (typeof window !== 'undefined' && window.location.href.includes('trae'));
  const isEmbedded = isIframe || isTraeEmbedded || /WebView|wv/i.test(ua);
  const capabilities: Record<string, boolean> = {
    fetch: typeof fetch !== 'undefined',
    clipboard: typeof navigator !== 'undefined' && !!(navigator as any).clipboard,
    speechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
    localStorage: (() => { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch { return false; } })(),
    sessionStorage: (() => { try { sessionStorage.setItem('__t', '1'); sessionStorage.removeItem('__t'); return true; } catch { return false; } })(),
    webRTC: typeof window !== 'undefined' && !!((window as any).RTCPeerConnection || (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection),
    geolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    notifications: typeof window !== 'undefined' && 'Notification' in window,
  };
  const restrictions: Record<string, boolean> = {
    corsStrict: isEmbedded,
    securityContextRestricted: isEmbedded || isIframe,
    apiAccessLimited: isEmbedded,
  };
  return { isEmbedded, isTraeEmbedded, isIframe, userAgent: ua, capabilities, restrictions };
}

export function getEnvironmentConfig(env: BrowserEnvironment): EnvironmentConfig {
  return {
    useProxy: env.isEmbedded,
    timeout: env.isEmbedded ? 20000 : 10000,
    maxRetries: env.isEmbedded ? 3 : 2,
    retryDelay: env.isEmbedded ? 1500 : 1000,
    headers: {
      ...(env.isEmbedded ? { 'X-Requested-With': 'XMLHttpRequest' } : {})
    },
    apiEndpoint: env.isEmbedded ? '/api/baidu' : 'https://fanyi-api.baidu.com',
    errorHandling: {
      showDetailedErrors: !env.isEmbedded,
      fallbackToMock: !!env.restrictions.apiAccessLimited,
      logErrors: true
    }
  };
}

export function getDebugInfo(): Record<string, any> {
  const env = browserEnvironment;
  return {
    environment: env,
    navigator: typeof navigator !== 'undefined' ? {
      userAgent: navigator.userAgent,
      onLine: navigator.onLine,
      language: navigator.language
    } : undefined,
    window: typeof window !== 'undefined' ? {
      isTop: window === window.top,
      isSecureContext: (window as any).isSecureContext
    } : undefined,
    time: new Date().toISOString()
  };
}

export const browserEnvironment = detectBrowserEnvironment();
export const environmentConfig = getEnvironmentConfig(browserEnvironment);

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('🔍 Browser Environment:', browserEnvironment);
}