import React, { useState } from 'react';
import { ArrowLeft, User, Crown, BarChart3, Calendar, Settings, LogOut, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [user] = useState({
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: null,
    plan: 'premium', // 'free', 'premium', 'enterprise'
    joinDate: new Date('2024-01-15'),
    totalTranslations: 1247,
    favoriteTranslations: 23,
    streakDays: 15
  });

  const [stats] = useState({
    thisMonth: {
      translations: 156,
      textTranslations: 89,
      imageTranslations: 34,
      audioTranslations: 21,
      interfaceTranslations: 12
    },
    languages: [
      { code: 'en', name: '英语', count: 456 },
      { code: 'zh', name: '中文', count: 389 },
      { code: 'ja', name: '日语', count: 234 },
      { code: 'ko', name: '韩语', count: 168 }
    ]
  });

  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'premium':
        return {
          name: '高级版',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: <Crown className="w-4 h-4" />
        };
      case 'enterprise':
        return {
          name: '企业版',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          icon: <Crown className="w-4 h-4" />
        };
      default:
        return {
          name: '免费版',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: <User className="w-4 h-4" />
        };
    }
  };

  const planInfo = getPlanInfo(user.plan);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            个人资料
          </h1>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* User Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-16 h-16 rounded-full" />
              ) : (
                <User className="w-8 h-8 text-blue-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <Edit3 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-gray-600">{user.email}</p>
              
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${planInfo.bgColor} ${planInfo.color}`}>
                {planInfo.icon}
                <span>{planInfo.name}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>加入时间: {formatDate(user.joinDate)}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">{user.totalTranslations}</div>
            <div className="text-xs text-gray-500 mt-1">总翻译数</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">{user.streakDays}</div>
            <div className="text-xs text-gray-500 mt-1">连续使用</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">{user.favoriteTranslations}</div>
            <div className="text-xs text-gray-500 mt-1">收藏翻译</div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">本月统计</h3>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">总翻译次数</span>
              <span className="font-semibold text-gray-900">{stats.thisMonth.translations}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">📝 文本翻译</span>
                <span className="text-gray-900">{stats.thisMonth.textTranslations}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">📷 图像翻译</span>
                <span className="text-gray-900">{stats.thisMonth.imageTranslations}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">🎤 语音翻译</span>
                <span className="text-gray-900">{stats.thisMonth.audioTranslations}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">📱 界面翻译</span>
                <span className="text-gray-900">{stats.thisMonth.interfaceTranslations}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Language Usage */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">常用语言</h3>
          </div>
          
          <div className="p-4 space-y-3">
            {stats.languages.map((lang, index) => (
              <div key={lang.code} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <span className="text-gray-900">{lang.name}</span>
                </div>
                <span className="text-gray-600">{lang.count} 次</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        {user.plan === 'free' && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center space-x-3 mb-3">
              <Crown className="w-6 h-6" />
              <h3 className="text-lg font-semibold">升级到高级版</h3>
            </div>
            <p className="text-blue-100 text-sm mb-4">
              解锁无限翻译、高级模型和专属功能
            </p>
            <button className="w-full py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              立即升级
            </button>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="divide-y divide-gray-100">
            <button
              onClick={() => navigate('/history')}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900">翻译历史</span>
              <span className="text-gray-400">→</span>
            </button>
            
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="text-gray-900">数据导出</span>
              <span className="text-gray-400">→</span>
            </button>
            
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="text-gray-900">账户安全</span>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-xl shadow-sm">
          <button
            onClick={() => navigate('/login')}
            className="w-full px-4 py-4 flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 transition-colors rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </div>
  );
}