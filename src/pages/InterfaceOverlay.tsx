import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Settings, Zap, RefreshCw, Camera, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslationStore } from '../store/translationStore';
import { translationService } from '../services/translationService';
import { 
  interfaceTranslationService, 
  UIElement, 
  ScreenCapture, 
  TranslationOverlay 
} from '../services/interfaceTranslationService';
import { Button, Loading, Card } from '../components/ui';
import { LanguagePairSelector } from '../components/LanguageSelector';
import { toast } from 'sonner';

export default function InterfaceOverlay() {
  const navigate = useNavigate();
  const { settings, addTranslation } = useTranslationStore();
  
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedElements, setDetectedElements] = useState<UIElement[]>([]);
  const [currentCapture, setCurrentCapture] = useState<ScreenCapture | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<TranslationOverlay | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(settings.overlayOpacity || 0.8);
  const [sourceLang, setSourceLang] = useState(settings.defaultSourceLang || 'auto');
  const [targetLang, setTargetLang] = useState(settings.defaultTargetLang || 'en');
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);



  useEffect(() => {
    // Check if screen capture is supported
    if (!interfaceTranslationService.isScreenCaptureSupported()) {
      setError('您的浏览器不支持屏幕捕获功能');
    }
  }, []);

  useEffect(() => {
    // Update overlay opacity when changed
    if (activeOverlay) {
      interfaceTranslationService.updateOverlayOpacity(activeOverlay.id, overlayOpacity);
    }
  }, [overlayOpacity, activeOverlay]);

  const requestPermission = async () => {
    try {
      const granted = await interfaceTranslationService.requestScreenCapturePermission();
      setPermissionGranted(granted);
      if (granted) {
        toast.success('屏幕捕获权限已获取');
      } else {
        toast.error('需要屏幕捕获权限才能使用此功能');
      }
    } catch (error) {
      toast.error('获取权限失败');
    }
  };

  const startScanning = async () => {
    if (!permissionGranted) {
      await requestPermission();
      return;
    }

    setIsScanning(true);
    setError(null);
    setDetectedElements([]);
    
    try {
      // Capture screen and analyze UI elements
      const result = await interfaceTranslationService.captureAndAnalyze();
      
      setCurrentCapture(result.capture);
      setDetectedElements(result.elements);
      
      if (result.elements.length === 0) {
        toast.warning('未检测到可翻译的UI元素');
        return;
      }
      
      // Start translation process
      await translateElements(result.elements);
      
    } catch (error: any) {
      setError(error.message || '扫描失败，请重试');
      toast.error('扫描失败');
    } finally {
      setIsScanning(false);
    }
  };

  const translateElements = async (elements: UIElement[]) => {
    setIsTranslating(true);
    
    try {
      const translatedElements = await interfaceTranslationService.translateInterface(
        elements,
        sourceLang,
        targetLang,
        translationService
      );
      
      setDetectedElements(translatedElements);
      
      // Create and show overlay
      const overlay = interfaceTranslationService.createTranslationOverlay(
        translatedElements,
        sourceLang,
        targetLang,
        overlayOpacity
      );
      
      setActiveOverlay(overlay);
      interfaceTranslationService.showOverlay(overlay.id);
      setIsOverlayActive(true);
      
      // Add to translation history
      translatedElements.forEach(element => {
        if (element.translatedText && element.translatedText !== element.text) {
          addTranslation({
            sourceText: element.text,
            translatedText: element.translatedText,
            sourceLang,
            targetLang,
            type: 'interface',
            model: 'google',
            confidence: element.confidence,
            isFavorite: false,
            metadata: {
              elementType: element.elementType,
              position: { x: element.x, y: element.y },
              size: { width: element.width, height: element.height }
            }
          });
        }
      });
      
      toast.success(`成功翻译 ${translatedElements.length} 个界面元素`);
      
    } catch (error: any) {
      setError(error.message || '翻译失败，请重试');
      toast.error('翻译失败');
    } finally {
      setIsTranslating(false);
    }
  };

  const stopOverlay = () => {
    if (activeOverlay) {
      interfaceTranslationService.hideOverlay(activeOverlay.id);
      setActiveOverlay(null);
    }
    setIsOverlayActive(false);
    setDetectedElements([]);
    setCurrentCapture(null);
  };

  const toggleTranslations = () => {
    if (activeOverlay) {
      if (showTranslations) {
        interfaceTranslationService.hideOverlay(activeOverlay.id);
      } else {
        interfaceTranslationService.showOverlay(activeOverlay.id);
      }
    }
    setShowTranslations(!showTranslations);
  };

  const refreshTranslations = async () => {
    if (detectedElements.length === 0) {
      toast.error('没有可刷新的翻译');
      return;
    }
    
    await translateElements(detectedElements.map(el => ({ ...el, translatedText: undefined })));
  };

  const handleLanguageChange = () => {
    if (detectedElements.length > 0) {
      // Re-translate with new language pair
      translateElements(detectedElements.map(el => ({ ...el, translatedText: undefined })));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
            界面翻译
          </h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Permission Status */}
        {!permissionGranted && (
          <Card className="border-orange-200 bg-orange-50">
            <div className="flex items-start space-x-3">
              <Monitor className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-900 mb-1">需要屏幕访问权限</h3>
                <p className="text-sm text-orange-700 mb-3">
                  界面翻译功能需要访问屏幕内容来检测和翻译UI元素
                </p>
                <Button
                  onClick={requestPermission}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  授予权限
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <div className="text-sm text-red-700">
              <strong>错误:</strong> {error}
            </div>
          </Card>
        )}

        {/* Language Settings */}
        <Card>
          <h3 className="text-sm font-medium text-gray-900 mb-3">翻译设置</h3>
          <LanguagePairSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={(value) => {
              setSourceLang(value);
              handleLanguageChange();
            }}
            onTargetChange={(value) => {
              setTargetLang(value);
              handleLanguageChange();
            }}
          />
        </Card>

        {/* Overlay Controls */}
        <Card>
          <h3 className="text-sm font-medium text-gray-900 mb-3">覆盖层控制</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                透明度: {Math.round(overlayOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.1"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            
            {isOverlayActive && (
              <div className="flex space-x-2">
                <Button
                  variant={showTranslations ? 'primary' : 'outline'}
                  onClick={toggleTranslations}
                  icon={showTranslations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  className="flex-1"
                  size="sm"
                >
                  {showTranslations ? '隐藏' : '显示'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={refreshTranslations}
                  disabled={isScanning || isTranslating}
                  loading={isTranslating}
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="flex-1"
                  size="sm"
                >
                  刷新
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Main Action */}
        <Card className="text-center">
          {!isOverlayActive ? (
            <div>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {isScanning ? (
                  <Loading size="lg" />
                ) : (
                  <Camera className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                启动界面翻译
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {isScanning ? '正在扫描屏幕并检测UI元素...' : '扫描当前屏幕并翻译所有可见文本'}
              </p>
              
              {isTranslating && (
                <div className="mb-4">
                  <Loading text="正在翻译检测到的元素..." />
                </div>
              )}
              
              <Button
                onClick={startScanning}
                disabled={isScanning || isTranslating || !permissionGranted}
                loading={isScanning}
                className="w-full"
                size="lg"
              >
                {isScanning ? '扫描中' : '开始扫描'}
              </Button>
            </div>
          ) : (
            <div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                覆盖层已激活
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                检测到 {detectedElements.length} 个可翻译元素
              </p>
              <Button
                onClick={stopOverlay}
                variant="danger"
                className="w-full"
                size="lg"
              >
                停止覆盖
              </Button>
            </div>
          )}
        </Card>

        {/* Demo Preview */}
        {isOverlayActive && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-3">翻译预览</h3>
            <div className="relative bg-gray-100 rounded-lg h-48 overflow-hidden">
              {/* Mock UI Elements */}
              <div className="absolute top-4 left-4 right-4 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-sm font-medium">应用标题栏</span>
              </div>
              
              {/* Detected Elements with Translations */}
              {detectedElements.map((element) => (
                <div key={element.id}>
                  {/* Original Element */}
                  <div
                    className="absolute bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      opacity: showTranslations ? 0.3 : 1
                    }}
                  >
                    {element.text}
                  </div>
                  
                  {/* Translation Overlay */}
                  {showTranslations && (
                    <div
                      className="absolute bg-blue-600 text-white rounded px-2 py-1 text-sm font-medium shadow-lg"
                      style={{
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        opacity: overlayOpacity
                      }}
                    >
                      {element.translatedText}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              这是翻译覆盖层的演示预览
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">使用说明</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• 点击"开始扫描"来检测屏幕上的文本元素</li>
            <li>• 翻译结果将以覆盖层形式显示在原文本上方</li>
            <li>• 可以调整透明度和切换显示/隐藏翻译</li>
            <li>• 支持实时切换语言对和刷新翻译</li>
          </ul>
        </div>
      </div>
    </div>
  );
}