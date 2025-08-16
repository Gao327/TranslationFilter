import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Share2, Languages, Volume2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslationStore } from '../store/translationStore';
import { translationService, TranslationRequest } from '../services/translationService';
import { Button, Textarea, Loading } from '../components/ui';
import { LanguagePairSelector } from '../components/LanguageSelector';
import { toast } from 'sonner';

export default function TextTranslate() {
  const navigate = useNavigate();
  const { 
    currentTranslation, 
    setCurrentTranslation, 
    resetCurrentTranslation,
    addTranslation,
    settings,
    addRecentLanguagePair
  } = useTranslationStore();
  
  const [sourceText, setSourceText] = useState(currentTranslation.sourceText);
  const [translatedText, setTranslatedText] = useState(currentTranslation.translatedText);
  const [sourceLang, setSourceLang] = useState(currentTranslation.sourceLang || settings.defaultSourceLang);
  const [targetLang, setTargetLang] = useState(currentTranslation.targetLang || settings.defaultTargetLang);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);



  useEffect(() => {
    // Update store when local state changes
    setCurrentTranslation({
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      isTranslating,
      error
    });
  }, [sourceText, translatedText, sourceLang, targetLang, isTranslating, error, setCurrentTranslation]);

  const handleTranslate = async () => {
    console.log('🔥 用户点击翻译按钮');
    console.log('- 输入文本:', sourceText);
    console.log('- 源语言:', sourceLang);
    console.log('- 目标语言:', targetLang);
    
    if (!sourceText.trim()) {
      console.log('❌ 输入文本为空');
      setError('请输入要翻译的文本');
      return;
    }
    
    setIsTranslating(true);
    setError(null);
    console.log('⏳ 开始翻译流程');
    
    try {
      const request: TranslationRequest = {
        text: sourceText,
        sourceLang,
        targetLang,
        model: settings.preferredModel
      };
      
      console.log('📋 翻译请求对象:', request);
      console.log('🔧 翻译服务对象:', translationService);
      
      const response = await translationService.translate(request);
      console.log('🎉 翻译完成，结果:', response);
      
      setTranslatedText(response.translatedText);
      setConfidence(response.confidence);
      
      // Add to translation history
      addTranslation({
        sourceText,
        translatedText: response.translatedText,
        sourceLang: response.detectedLanguage || sourceLang,
        targetLang,
        type: 'text',
        model: response.model,
        confidence: response.confidence,
        isFavorite: false
      });
      
      // Add to recent language pairs
      addRecentLanguagePair({ source: sourceLang, target: targetLang });
      console.log('📚 已添加到历史记录');
      
      toast.success('翻译完成');
    } catch (err: any) {
      console.error('❌ 翻译失败:', err);
      setError(err.message || '翻译失败，请重试');
      toast.error('翻译失败');
    } finally {
      setIsTranslating(false);
      console.log('🏁 翻译流程结束');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      toast.success('已复制到剪贴板');
    } catch (err) {
      toast.error('复制失败');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Translation Filter',
          text: `${sourceText} → ${translatedText}`,
        });
      } else {
        // Fallback to copy
        await handleCopy();
      }
    } catch (err) {
      console.log('Share cancelled or failed');
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      toast.error('无法交换自动检测语言');
      return;
    }
    
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
    setError(null);
    setConfidence(0);
    resetCurrentTranslation();
  };

  const handleTextToSpeech = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'zh' ? 'zh-CN' : lang;
      speechSynthesis.speak(utterance);
    } else {
      toast.error('您的浏览器不支持语音播放');
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
            文本翻译
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Language Selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <LanguagePairSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={setSourceLang}
            onTargetChange={setTargetLang}
            onSwap={handleSwapLanguages}
          />
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">输入文本</div>
              {sourceText && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTextToSpeech(sourceText, sourceLang)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={handleClear}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    清空
                  </button>
                </div>
              )}
            </div>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="请输入要翻译的文本..."
              className="border-none focus:ring-0 p-0 resize-none"
              rows={4}
            />
          </div>
          
          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="p-4">
            <Button
              onClick={handleTranslate}
              disabled={!sourceText.trim() || isTranslating}
              loading={isTranslating}
              className="w-full"
              size="lg"
            >
              翻译
            </Button>
          </div>
        </div>

        {/* Output Section */}
        {(translatedText || isTranslating) && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">翻译结果</div>
                {confidence > 0 && (
                  <div className="text-xs text-gray-400">
                    置信度: {Math.round(confidence * 100)}%
                  </div>
                )}
              </div>
              
              {isTranslating ? (
                <div className="flex items-center justify-center py-8">
                  <Loading text="正在翻译..." />
                </div>
              ) : (
                <div className="text-gray-900 leading-relaxed">
                  {translatedText}
                </div>
              )}
            </div>
            
            {translatedText && !isTranslating && (
              <div className="p-4 flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  icon={<Copy className="w-4 h-4" />}
                  className="flex-1"
                >
                  复制
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleTextToSpeech(translatedText, targetLang)}
                  icon={<Volume2 className="w-4 h-4" />}
                  className="flex-1"
                >
                  播放
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleShare}
                  icon={<Share2 className="w-4 h-4" />}
                  className="flex-1"
                >
                  分享
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}