import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Image, Zap, Download, Copy, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { baiduTranslationService } from '../services/baiduTranslationService';
import { useTranslationStore } from '../store/translationStore';
import { toast } from 'sonner';

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
    
    try {
      // 将图片转换为base64格式（去掉data:image/...;base64,前缀）
      const base64Image = imageUrl.split(',')[1];
      
      // 调用百度图片翻译API
      const result = await baiduTranslationService.translateImage({
        image: base64Image,
        sourceLang,
        targetLang,
        paste: 1 // 启用贴合翻译
      });
      
      setExtractedText(result.originalText);
      setTranslatedText(result.translatedText);
      setTranslatedImage(result.translatedImage || null);
      setTextBlocks(result.textBlocks);
      
      // 添加到翻译历史
      addTranslation({
        sourceText: result.originalText,
        translatedText: result.translatedText,
        sourceLang,
        targetLang,
        type: 'image',
        confidence: 0.9,
        model: 'baidu',
        isFavorite: false
      });
      
      // 更新最近使用的语言对
      addRecentLanguagePair({ source: sourceLang, target: targetLang });
      
      toast.success('图片翻译完成！');
    } catch (error) {
      console.error('图片翻译错误:', error);
      setError(error instanceof Error ? error.message : '图片翻译失败');
      toast.error('图片翻译失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedText('');
    setTranslatedText('');
    setTranslatedImage(null);
    setTextBlocks([]);
    setError(null);
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
            图像翻译
          </h1>
          <div className="w-9" />
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
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600">正在识别图片中的文字...</p>
              </div>
            )}

            {/* Translated Image */}
            {translatedImage && !isProcessing && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-2">翻译后的图片</div>
                <img
                  src={`data:image/png;base64,${translatedImage}`}
                  alt="Translated"
                  className="w-full rounded-lg"
                />
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
              <div className="flex space-x-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重新拍摄
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}