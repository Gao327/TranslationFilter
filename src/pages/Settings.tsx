import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Globe, Zap, Eye, Bell, Shield, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [autoDetect, setAutoDetect] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [preferredModel, setPreferredModel] = useState('google');
  const [defaultSourceLang, setDefaultSourceLang] = useState('auto');
  const [defaultTargetLang, setDefaultTargetLang] = useState('en');
  const [overlayOpacity, setOverlayOpacity] = useState(0.8);

  const settingSections = [
    {
      title: '翻译设置',
      icon: <Globe className="w-5 h-5" />,
      items: [
        {
          label: '语言设置',
          type: 'navigation',
          description: '管理默认语言、语言对和翻译偏好',
          onClick: () => navigate('/language-settings')
        },
        {
          label: '自动检测语言',
          type: 'toggle',
          value: autoDetect,
          onChange: setAutoDetect,
          description: '自动识别输入文本的语言'
        }
      ]
    },
    {
      title: '翻译模型',
      icon: <Zap className="w-5 h-5" />,
      items: [
        {
          label: '首选翻译模型',
          type: 'select',
          value: preferredModel,
          onChange: setPreferredModel,
          options: [
            { value: 'google', label: 'Google 翻译' },
            { value: 'openai', label: 'OpenAI GPT' },
            { value: 'azure', label: 'Azure 翻译' }
          ]
        }
      ]
    },
    {
      title: '界面覆盖',
      icon: <Eye className="w-5 h-5" />,
      items: [
        {
          label: '启用界面翻译',
          type: 'toggle',
          value: overlayEnabled,
          onChange: setOverlayEnabled,
          description: '允许翻译其他应用的界面文本'
        },
        {
          label: '覆盖层透明度',
          type: 'slider',
          value: overlayOpacity,
          onChange: setOverlayOpacity,
          min: 0.3,
          max: 1,
          step: 0.1,
          description: `当前透明度: ${Math.round(overlayOpacity * 100)}%`
        }
      ]
    },
    {
      title: '通知设置',
      icon: <Bell className="w-5 h-5" />,
      items: [
        {
          label: '推送通知',
          type: 'toggle',
          value: notifications,
          onChange: setNotifications,
          description: '接收翻译完成和应用更新通知'
        }
      ]
    }
  ];

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{item.label}</div>
              {item.description && (
                <div className="text-sm text-gray-500 mt-1">{item.description}</div>
              )}
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => item.onChange(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  item.value ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    item.value ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </label>
            </div>
          </div>
        );
      case 'navigation':
        return (
          <button
            onClick={item.onClick}
            className="w-full flex items-center justify-between p-0 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">{item.label}</div>
              {item.description && (
                <div className="text-sm text-gray-500 mt-1">{item.description}</div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        );

      case 'select':
        return (
          <div>
            <div className="font-medium text-gray-900 mb-2">{item.label}</div>
            <select
              value={item.value}
              onChange={(e) => item.onChange(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {item.options.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'slider':
        return (
          <div>
            <div className="font-medium text-gray-900 mb-2">{item.label}</div>
            <input
              type="range"
              min={item.min}
              max={item.max}
              step={item.step}
              value={item.value}
              onChange={(e) => item.onChange(parseFloat(e.target.value))}
              className="w-full"
            />
            {item.description && (
              <div className="text-sm text-gray-500 mt-1">{item.description}</div>
            )}
          </div>
        );

      default:
        return null;
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
            设置
          </h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600">{section.icon}</div>
                <h3 className="font-medium text-gray-900">{section.title}</h3>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {renderSettingItem(item)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Additional Options */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="text-blue-600">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-gray-900">其他选项</h3>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            <button
              onClick={() => navigate('/profile')}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900">账户管理</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="text-gray-900">隐私政策</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">帮助与支持</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="text-gray-900">关于应用</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">v1.0.0</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-4">数据管理</h3>
          <div className="space-y-3">
            <button className="w-full py-3 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              清除翻译历史
            </button>
            <button className="w-full py-3 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              导出数据
            </button>
            <button className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              重置所有设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}