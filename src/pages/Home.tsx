import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Type, 
  Camera, 
  Mic, 
  Smartphone, 
  History, 
  Settings, 
  User,
  Globe,
  Zap,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';
import { LanguagePairSelector } from '../components/LanguageSelector';
import { useTranslationStore } from '../store/translationStore';

export default function Home() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useTranslationStore();
  
  const [sourceLang, setSourceLang] = useState(settings.defaultSourceLang || 'auto');
  const [targetLang, setTargetLang] = useState(settings.defaultTargetLang || 'en');

  const translationModes = [
    {
      id: 'text',
      title: '文本翻译',
      description: '输入或粘贴文本进行翻译',
      icon: <Type className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-600',
      route: '/text-translate'
    },
    {
      id: 'camera',
      title: '图像翻译',
      description: '拍照或选择图片翻译文字',
      icon: <Camera className="w-8 h-8" />,
      color: 'from-green-500 to-green-600',
      route: '/camera-translate'
    },
    {
      id: 'audio',
      title: '语音翻译',
      description: '录音或实时语音翻译',
      icon: <Mic className="w-8 h-8" />,
      color: 'from-purple-500 to-purple-600',
      route: '/audio-translate'
    },
    {
      id: 'interface',
      title: '界面翻译',
      description: '翻译手机界面上的文字',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'from-orange-500 to-orange-600',
      route: '/overlay',
      featured: true
    }
  ];

  const quickActions = [
    {
      title: '翻译历史',
      icon: <History className="w-6 h-6" />,
      route: '/history'
    },
    {
      title: '设置',
      icon: <Settings className="w-6 h-6" />,
      route: '/settings'
    },
    {
      title: '个人资料',
      icon: <User className="w-6 h-6" />,
      route: '/profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Translation Filter</h1>
                <p className="text-sm text-gray-500">智能翻译助手</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Language Selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-3">默认语言设置</h3>
          <LanguagePairSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={(value) => {
              setSourceLang(value);
              updateSettings({ defaultSourceLang: value });
            }}
            onTargetChange={(value) => {
              setTargetLang(value);
              updateSettings({ defaultTargetLang: value });
            }}
            onSwap={() => {
              if (sourceLang !== 'auto') {
                setSourceLang(targetLang);
                setTargetLang(sourceLang);
                updateSettings({ 
                  defaultSourceLang: targetLang, 
                  defaultTargetLang: sourceLang 
                });
              }
            }}
          />
        </div>

        {/* Translation Modes */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">翻译模式</h2>
          <div className="grid grid-cols-2 gap-4">
            {translationModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => navigate(mode.route)}
                className={`relative p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-br ${mode.color}`}
              >
                {mode.featured && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-yellow-800 fill-current" />
                  </div>
                )}
                
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {mode.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{mode.title}</h3>
                    <p className="text-sm opacity-90 mt-1">{mode.description}</p>
                  </div>
                </div>
                
                {mode.featured && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-white/20 rounded-lg px-2 py-1">
                      <div className="flex items-center justify-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span className="text-xs font-medium">新功能</span>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.route)}
                className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="p-2 bg-gray-100 rounded-lg">
                  {action.icon}
                </div>
                <span className="flex-1 text-left font-medium text-gray-900">
                  {action.title}
                </span>
                <div className="text-gray-400">→</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Translations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近翻译</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              查看全部
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Mock recent translations */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="text-lg">📝</div>
                <div className="flex-1">
                  <div className="text-gray-900 text-sm">Hello, how are you?</div>
                  <div className="text-blue-600 text-sm font-medium mt-1">你好，你好吗？</div>
                  <div className="text-xs text-gray-500 mt-2">30分钟前</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="text-lg">📱</div>
                <div className="flex-1">
                  <div className="text-gray-900 text-sm">设置</div>
                  <div className="text-blue-600 text-sm font-medium mt-1">Settings</div>
                  <div className="text-xs text-gray-500 mt-2">2小时前</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">使用提示</h3>
              <p className="text-sm text-blue-700">
                尝试新的界面翻译功能，可以翻译任何应用界面上的文字！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}