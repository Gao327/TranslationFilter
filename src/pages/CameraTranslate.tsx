import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { ArrowLeft, Camera, Image, Zap, Download, Copy, Share2, Settings, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { baiduTranslationService } from '../services/baiduTranslationService';
import { useTranslationStore } from '../store/translationStore';
import { toast } from 'sonner';
import { ImageTranslationFilter, FilterOptions, FilterResult } from '../services/imageTranslationFilter';

export default function CameraTranslate() {
  const navigate = useNavigate();
  const { addTranslation, addRecentLanguagePair } = useTranslationStore();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [textBlocks, setTextBlocks] = useState<Array<{
    original: string;
    translated: string;
    position: { x: number; y: number; width: number; height: number };
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New advanced filter states
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sourceLang: 'auto',
    targetLang: 'en',
    qualityLevel: 'balanced',
    preserveStyle: true,
    overflowHandling: {
      strategy: 'adaptive_scaling',
      maxScaleDown: 0.6,
      maxScaleUp: 1.2,
      allowLineBreaking: true,
      allowAbbreviation: false,
      prioritizeReadability: true,
      expandBounds: true,
      maxExpansion: 20
    },
    renderingOptions: {
      preserveOriginalStyle: true,
      adaptiveScaling: true,
      qualityLevel: 'high',
      antialiasing: true,
      subpixelRendering: true
    },
    enablePreview: true
  });
  const [imageTranslationFilter] = useState(() => new ImageTranslationFilter());

  const handleCapture = () => {
    // TODO: 实现相机捕获功能
    console.log('Camera capture');
  };

  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setCapturedImage(imageUrl);
        processImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageUrl: string) => {
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    setProcessingStage('初始化处理...');
    
    try {
      // Create image element for processing
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Apply advanced image translation filter
      const result = await imageTranslationFilter.applyFilter(
        imageUrl,
        {
          ...filterOptions,
          sourceLang,
          targetLang,
          progressCallback: (progress, stage) => {
            setProcessingStage(stage);
            setProcessingProgress(progress);
          }
        }
      );
      
      setFilterResult(result);
      setExtractedText(result.textBlocks.map(block => block.text).join(' '));
      setTranslatedText(result.textBlocks.map(block => block.translatedText || block.text).join(' '));
      
      // Convert canvas to data URL for display
      const translatedImageDataUrl = result.translatedCanvas.toDataURL();
      setTranslatedImage(translatedImageDataUrl);
      
      // Convert text blocks to legacy format for compatibility
      const legacyTextBlocks = result.textBlocks.map(block => ({
        original: block.text,
        translated: (block as any).translatedText || block.text,
        position: {
          x: block.bbox.x0,
          y: block.bbox.y0,
          width: block.bbox.x1 - block.bbox.x0,
          height: block.bbox.y1 - block.bbox.y0
        }
      }));
      setTextBlocks(legacyTextBlocks);
      
      // 添加到翻译历史
      addTranslation({
        sourceText: result.textBlocks.map(block => block.text).join(' '),
        translatedText: result.textBlocks.map(block => (block as any).translatedText || block.text).join(' '),
        sourceLang,
        targetLang,
        type: 'image',
        confidence: result.confidence,
        model: 'advanced-filter',
        isFavorite: false
      });
      
      // 更新最近使用的语言对
      addRecentLanguagePair({ source: sourceLang, target: targetLang });
      
      toast.success(`图片翻译完成！置信度: ${Math.round(result.confidence * 100)}%`);
    } catch (error) {
      console.error('图片翻译错误:', error);
      setError(error instanceof Error ? error.message : '图片翻译失败');
      toast.error('图片翻译失败，请重试');
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
      setProcessingProgress(0);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedText('');
    setTranslatedText('');
    setTranslatedImage(null);
    setTextBlocks([]);
    setError(null);
    setFilterResult(null);
    setShowPreview(false);
  };

  const handleDownload = async () => {
    if (!filterResult?.translatedCanvas) {
      toast.error('没有可下载的翻译图片');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = filterResult.translatedCanvas.toDataURL();
      link.download = `translated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('图片已下载');
    } catch (error) {
      toast.error('下载失败');
    }
  };

  const handleFilterOptionChange = (key: keyof FilterOptions, value: any) => {
    setFilterOptions(prev => ({ ...prev, [key]: value }));
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleShare = async (text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '翻译结果',
          text: text
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('已复制到剪贴板');
      }
    } catch (error) {
      toast.error('分享失败');
    }
  };

  const handleLanguageSwap = () => {
    if (sourceLang !== 'auto') {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
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
            智能图像翻译
          </h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Language Settings */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">翻译设置</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">源语言</label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">自动检测</option>
                <option value="zh">中文</option>
                <option value="en">英语</option>
                <option value="ja">日语</option>
                <option value="ko">韩语</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">目标语言</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">英语</option>
                <option value="zh">中文</option>
                <option value="ja">日语</option>
                <option value="ko">韩语</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filter Settings */}
        {showSettings && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">高级设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">处理质量</label>
                <select
                  value={filterOptions.qualityLevel}
                  onChange={(e) => handleFilterOptionChange('qualityLevel', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fast">快速</option>
                  <option value="balanced">平衡</option>
                  <option value="high_quality">高质量</option>
                  <option value="ultra">超高质量</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">溢出处理</label>
                <select
                  value={filterOptions.overflowHandling.strategy}
                  onChange={(e) => handleFilterOptionChange('overflowHandling', {
                    ...filterOptions.overflowHandling,
                    strategy: e.target.value
                  })}
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="preserve_bounds">保持边界</option>
                  <option value="adaptive_scaling">自适应缩放</option>
                  <option value="multi_line_wrap">多行换行</option>
                  <option value="overflow_expand">扩展边界</option>
                  <option value="abbreviation">智能缩写</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">保留样式</span>
                <button
                  onClick={() => handleFilterOptionChange('preserveStyle', !filterOptions.preserveStyle)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    filterOptions.preserveStyle ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      filterOptions.preserveStyle ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">启用预览</span>
                <button
                  onClick={() => handleFilterOptionChange('enablePreview', !filterOptions.enablePreview)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    filterOptions.enablePreview ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      filterOptions.enablePreview ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="text-sm text-red-700">
              <strong>错误:</strong> {error}
            </div>
          </div>
        )}

        {!capturedImage ? (
          /* Camera Interface */
          <div className="space-y-4">
            {/* Camera Viewfinder Placeholder */}
            <div className="bg-black rounded-xl aspect-[4/3] flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm opacity-75">相机预览区域</p>
                <p className="text-xs opacity-50 mt-1">将在实际应用中显示相机画面</p>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-center space-x-8 py-6">
              <button
                onClick={handleGallerySelect}
                className="p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <Image className="w-6 h-6 text-gray-600" />
              </button>
              
              <button
                onClick={handleCapture}
                className="p-6 bg-blue-600 rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>
              
              <button className="p-4 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow">
                <Zap className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          /* Image Processing Results */
          <div className="space-y-4">
            {/* Captured Image */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full rounded-lg"
              />
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-center mb-4">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-600 mb-2">{processingStage || '正在处理图片...'}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(processingProgress)}%</p>
                </div>
              </div>
            )}

            {/* Before/After Preview Toggle */}
            {filterResult && !isProcessing && (
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-500">翻译结果</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">对比预览</span>
                    <button
                      onClick={togglePreview}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                    </button>
                  </div>
                </div>
                
                {showPreview ? (
                  /* Before/After Comparison */
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">原图</div>
                      <img
                        src={capturedImage!}
                        alt="Original"
                        className="w-full rounded-lg border"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">翻译后</div>
                      <img
                         src={filterResult.translatedCanvas.toDataURL()}
                         alt="Translated"
                         className="w-full rounded-lg border"
                       />
                    </div>
                  </div>
                ) : (
                  /* Single Translated Image */
                  <div>
                    <img
                       src={filterResult.translatedCanvas.toDataURL()}
                       alt="Translated"
                       className="w-full rounded-lg"
                     />
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>置信度: {Math.round(filterResult.confidence * 100)}%</span>
                      <span>处理时间: {filterResult.processingTime}ms</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Text */}
            {extractedText && !isProcessing && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">识别的文字</div>
                  <div className="text-gray-900 leading-relaxed">
                    {extractedText}
                  </div>
                </div>
                <div className="p-4 flex space-x-2">
                  <button
                    onClick={() => handleCopy(extractedText)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </button>
                  <button
                    onClick={() => handleShare(extractedText)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>分享</span>
                  </button>
                </div>
              </div>
            )}

            {/* Translated Text */}
            {translatedText && !isProcessing && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">翻译结果</div>
                  <div className="text-gray-900 leading-relaxed">
                    {translatedText}
                  </div>
                </div>
                
                <div className="p-4 flex space-x-2">
                  <button
                    onClick={() => handleCopy(translatedText)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </button>
                  <button
                    onClick={() => handleShare(translatedText)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>分享</span>
                  </button>
                </div>
              </div>
            )}

            {/* Text Blocks Details */}
            {textBlocks.length > 0 && !isProcessing && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">文字块详情</div>
                </div>
                <div className="p-4 space-y-3">
                  {textBlocks.map((block, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="text-sm text-gray-600 mb-1">原文:</div>
                      <div className="text-gray-900 mb-2">{block.original}</div>
                      <div className="text-sm text-gray-600 mb-1">译文:</div>
                      <div className="text-blue-600">{block.translated}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {(extractedText || translatedText) && !isProcessing && (
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleRetake}
                    className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    重新拍摄
                  </button>
                  {filterResult?.translatedCanvas && (
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>下载图片</span>
                    </button>
                  )}
                </div>
                
                {/* Processing Statistics */}
                {filterResult && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">处理统计</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">文本块:</span>
                        <span className="font-medium">{filterResult.textBlocks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">置信度:</span>
                        <span className="font-medium">{Math.round(filterResult.confidence * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">处理时间:</span>
                        <span className="font-medium">{filterResult.processingTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-600">质量:</span>
                         <span className="font-medium">{filterOptions.qualityLevel}</span>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}