import React, { useState } from 'react';
import { ArrowLeft, Star, Clock, Globe, Plus, Trash2, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslationStore } from '../store/translationStore';
import { 
  SUPPORTED_LANGUAGES, 
  POPULAR_LANGUAGE_PAIRS, 
  LANGUAGE_GROUPS,
  getLanguageByCode,
  getLanguagePairLabel,
  type Language 
} from '../config/languages';
import { Button, Card, Switch } from '../components/ui';
import LanguageSelector, { LanguagePairSelector } from '../components/LanguageSelector';
import { toast } from 'sonner';

export default function LanguageSettings() {
  const navigate = useNavigate();
  const { 
    settings, 
    updateSettings, 
    recentLanguagePairs, 
    clearRecentLanguagePairs,
    removeRecentLanguagePair 
  } = useTranslationStore();
  
  const [activeTab, setActiveTab] = useState<'general' | 'pairs' | 'recent'>('general');
  const [showAddPair, setShowAddPair] = useState(false);
  const [newPairSource, setNewPairSource] = useState('auto');
  const [newPairTarget, setNewPairTarget] = useState('en');
  
  const handleSaveSettings = () => {
    toast.success('语言设置已保存');
  };
  
  const handleClearRecent = () => {
    clearRecentLanguagePairs();
    toast.success('已清除最近使用的语言对');
  };
  
  const handleRemoveRecentPair = (index: number) => {
    removeRecentLanguagePair(index);
    toast.success('已移除语言对');
  };
  
  const renderGeneralSettings = () => (
    <div className="space-y-4">
      {/* Default Languages */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">默认语言设置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              默认源语言
            </label>
            <LanguageSelector
              value={settings.defaultSourceLang || 'auto'}
              onChange={(value) => updateSettings({ defaultSourceLang: value })}
              type="source"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              默认目标语言
            </label>
            <LanguageSelector
              value={settings.defaultTargetLang || 'en'}
              onChange={(value) => updateSettings({ defaultTargetLang: value })}
              type="target"
            />
          </div>
        </div>
      </Card>
      
      {/* Language Detection */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">语言检测</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-900">自动检测语言</div>
              <div className="text-sm text-gray-500 mt-1">
                自动识别输入文本的语言类型
              </div>
            </div>
            <Switch
              checked={settings.autoDetect || false}
              onChange={(checked) => updateSettings({ autoDetect: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-900">智能语言建议</div>
              <div className="text-sm text-gray-500 mt-1">
                根据使用习惯推荐语言对
              </div>
            </div>
            <Switch
              checked={settings.smartSuggestions || false}
              onChange={(checked) => updateSettings({ smartSuggestions: checked })}
            />
          </div>
        </div>
      </Card>
      
      {/* Popular Language Pairs */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门语言对</h3>
        <div className="grid grid-cols-1 gap-2">
          {POPULAR_LANGUAGE_PAIRS.slice(0, 6).map((pair, index) => {
            const sourceLang = getLanguageByCode(pair.source);
            const targetLang = getLanguageByCode(pair.target);
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">{sourceLang?.flag}</span>
                    <span className="text-sm text-gray-600">{sourceLang?.nativeName}</span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">{targetLang?.flag}</span>
                    <span className="text-sm text-gray-600">{targetLang?.nativeName}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateSettings({ 
                      defaultSourceLang: pair.source, 
                      defaultTargetLang: pair.target 
                    });
                    toast.success('已设置为默认语言对');
                  }}
                >
                  设为默认
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
  
  const renderLanguagePairs = () => (
    <div className="space-y-4">
      {/* Add New Pair */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">自定义语言对</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddPair(!showAddPair)}
            icon={<Plus className="w-4 h-4" />}
          >
            添加语言对
          </Button>
        </div>
        
        {showAddPair && (
          <div className="border-t pt-4">
            <div className="space-y-3">
              <LanguagePairSelector
                sourceLang={newPairSource}
                targetLang={newPairTarget}
                onSourceChange={setNewPairSource}
                onTargetChange={setNewPairTarget}
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    // Add to favorites or custom pairs
                    toast.success('语言对已添加到收藏');
                    setShowAddPair(false);
                  }}
                >
                  添加
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPair(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Language Groups */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">语言分组</h3>
        <div className="space-y-4">
          {Object.entries(LANGUAGE_GROUPS).map(([groupName, languageCodes]) => {
            const groupLabels = {
              popular: '常用语言',
              european: '欧洲语言',
              asian: '亚洲语言',
              middleEast: '中东语言',
              african: '非洲语言'
            };
            
            return (
              <div key={groupName} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">
                  {groupLabels[groupName as keyof typeof groupLabels] || groupName}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {languageCodes.map(code => {
                    const lang = getLanguageByCode(code);
                    return lang ? (
                      <span
                        key={code}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        <span className="mr-1">{lang.flag}</span>
                        {lang.nativeName}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
  
  const renderRecentPairs = () => (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">最近使用的语言对</h3>
          {recentLanguagePairs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRecent}
              icon={<Trash2 className="w-4 h-4" />}
            >
              清除全部
            </Button>
          )}
        </div>
        
        {recentLanguagePairs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无最近使用的语言对</p>
            <p className="text-sm mt-1">开始翻译后，您的语言对选择将显示在这里</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLanguagePairs.map((pair, index) => {
              const sourceLang = getLanguageByCode(pair.source);
              const targetLang = getLanguageByCode(pair.target);
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">{sourceLang?.flag}</span>
                      <span className="text-sm text-gray-600">{sourceLang?.nativeName}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">{targetLang?.flag}</span>
                      <span className="text-sm text-gray-600">{targetLang?.nativeName}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSettings({ 
                          defaultSourceLang: pair.source, 
                          defaultTargetLang: pair.target 
                        });
                        toast.success('已设置为默认语言对');
                      }}
                    >
                      设为默认
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecentPair(index)}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      
      {/* Usage Statistics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">使用统计</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">总翻译次数</span>
            <span className="font-semibold">{recentLanguagePairs.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">使用过的语言对</span>
            <span className="font-semibold">
              {new Set(recentLanguagePairs.map(p => `${p.source}-${p.target}`)).size}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">最常用语言对</span>
            <span className="font-semibold text-blue-600">
              {recentLanguagePairs.length > 0 
                ? getLanguagePairLabel(
                    recentLanguagePairs[0].source, 
                    recentLanguagePairs[0].target
                  )
                : '暂无数据'
              }
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
            语言设置
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveSettings}
          >
            保存
          </Button>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        {/* Tabs */}
        <div className="flex bg-white rounded-lg p-1 mb-4 shadow-sm">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'general'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="w-4 h-4 mr-1" />
            通用
          </button>
          <button
            onClick={() => setActiveTab('pairs')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'pairs'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star className="w-4 h-4 mr-1" />
            语言对
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4 mr-1" />
            最近
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'pairs' && renderLanguagePairs()}
        {activeTab === 'recent' && renderRecentPairs()}
      </div>
    </div>
  );
}