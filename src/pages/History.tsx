import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Heart, 
  Trash2, 
  Copy, 
  Share2, 
  Download,
  MoreVertical,
  CheckSquare,
  Square,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslationStore, type TranslationRecord } from '../store/translationStore';
import { getLanguageByCode } from '../config/languages';
import { Button, Card, Select } from '../components/ui';
import { toast } from 'sonner';

export default function History() {
  const navigate = useNavigate();
  const { 
    history, 
    removeTranslation, 
    toggleFavorite, 
    clearHistory,
    searchHistory,
    getFavorites,
    getHistoryByType
  } = useTranslationStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image' | 'audio' | 'interface'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'language'>('date');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = history;
    
    // Apply search filter
    if (searchQuery) {
      filtered = searchHistory(searchQuery);
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(record => record.type === filterType);
    }
    
    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(record => record.isFavorite);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        
        switch (dateFilter) {
          case 'today':
            return recordDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return recordDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return recordDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    // Sort results
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        case 'language':
          return `${a.sourceLang}-${a.targetLang}`.localeCompare(`${b.sourceLang}-${b.targetLang}`);
        default:
          return 0;
      }
    });
  }, [history, searchQuery, filterType, showFavoritesOnly, dateFilter, sortBy, searchHistory]);

  // Bulk operations
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(record => record.id)));
    }
  };
  
  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };
  
  const bulkDelete = () => {
    selectedItems.forEach(id => removeTranslation(id));
    setSelectedItems(new Set());
    setShowBulkActions(false);
    toast.success(`已删除 ${selectedItems.size} 条记录`);
  };
  
  const bulkToggleFavorite = () => {
    selectedItems.forEach(id => toggleFavorite(id));
    setSelectedItems(new Set());
    setShowBulkActions(false);
    toast.success(`已更新 ${selectedItems.size} 条记录`);
  };
  
  const exportHistory = () => {
    const dataToExport = selectedItems.size > 0 
      ? filteredHistory.filter(record => selectedItems.has(record.id))
      : filteredHistory;
    
    const csvContent = [
      ['源文本', '译文', '源语言', '目标语言', '类型', '时间', '收藏'],
      ...dataToExport.map(record => [
        record.sourceText,
        record.translatedText,
        getLanguageByCode(record.sourceLang)?.nativeName || record.sourceLang,
        getLanguageByCode(record.targetLang)?.nativeName || record.targetLang,
        getTypeLabel(record.type),
        new Date(record.timestamp).toLocaleString('zh-CN'),
        record.isFavorite ? '是' : '否'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `translation-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('历史记录已导出');
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shareRecord = (record: TranslationRecord) => {
    if (navigator.share) {
      navigator.share({
        title: 'Translation Filter',
        text: `${record.sourceText} → ${record.translatedText}`,
      });
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '📷';
      case 'audio': return '🎤';
      case 'interface': return '📱';
      default: return '📝';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return '文本';
      case 'image': return '图像';
      case 'audio': return '语音';
      case 'interface': return '界面';
      default: return '文本';
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
            翻译历史
          </h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Statistics */}
        <Card>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{history.length}</div>
              <div className="text-xs text-gray-500">总记录</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{getFavorites().length}</div>
              <div className="text-xs text-gray-500">收藏</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{filteredHistory.length}</div>
              <div className="text-xs text-gray-500">筛选结果</div>
            </div>
          </div>
        </Card>

        {/* Search and Filters */}
        <Card>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索翻译记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Select
              value={filterType}
              onChange={(value) => setFilterType(value as any)}
              options={[
                { value: 'all', label: '全部类型' },
                { value: 'text', label: '文本翻译' },
                { value: 'image', label: '图像翻译' },
                { value: 'audio', label: '语音翻译' },
                { value: 'interface', label: '界面翻译' }
              ]}
            />
            
            <Select
              value={dateFilter}
              onChange={(value) => setDateFilter(value as any)}
              options={[
                { value: 'all', label: '全部时间' },
                { value: 'today', label: '今天' },
                { value: 'week', label: '本周' },
                { value: 'month', label: '本月' }
              ]}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant={showFavoritesOnly ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                icon={<Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />}
              >
                收藏
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
                icon={<CheckSquare className="w-4 h-4" />}
              >
                批量操作
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportHistory}
                icon={<Download className="w-4 h-4" />}
              >
                导出
              </Button>
              
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value as any)}
                options={[
                  { value: 'date', label: '按时间' },
                  { value: 'type', label: '按类型' },
                  { value: 'language', label: '按语言' }
                ]}
                className="w-24"
              />
            </div>
          </div>
        </Card>
        
        {/* Bulk Actions */}
        {showBulkActions && (
          <Card className="border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  icon={selectedItems.size === filteredHistory.length ? 
                    <CheckSquare className="w-4 h-4" /> : 
                    <Square className="w-4 h-4" />
                  }
                >
                  {selectedItems.size === filteredHistory.length ? '取消全选' : '全选'}
                </Button>
                
                {selectedItems.size > 0 && (
                  <span className="text-sm text-blue-700">
                    已选择 {selectedItems.size} 项
                  </span>
                )}
              </div>
              
              {selectedItems.size > 0 && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkToggleFavorite}
                    icon={<Heart className="w-4 h-4" />}
                  >
                    切换收藏
                  </Button>
                  
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={bulkDelete}
                    icon={<Trash2 className="w-4 h-4" />}
                  >
                    删除
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* History List */}
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <Card className="text-center py-8">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无翻译记录</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterType !== 'all' || showFavoritesOnly || dateFilter !== 'all'
                  ? '没有找到符合条件的记录，请尝试调整筛选条件'
                  : '开始使用翻译功能，您的翻译记录将显示在这里'
                }
              </p>
              {(searchQuery || filterType !== 'all' || showFavoritesOnly || dateFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setShowFavoritesOnly(false);
                    setDateFilter('all');
                  }}
                >
                  清除筛选条件
                </Button>
              )}
            </Card>
          ) : (
            filteredHistory.map((record) => {
              const sourceLang = getLanguageByCode(record.sourceLang);
              const targetLang = getLanguageByCode(record.targetLang);
              const isSelected = selectedItems.has(record.id);
              
              return (
                <Card key={record.id} className={`overflow-hidden transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}>
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {showBulkActions && (
                          <button
                            onClick={() => toggleSelectItem(record.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                        
                        <span className="text-lg">{getTypeIcon(record.type)}</span>
                        <span className="text-xs text-gray-500">{getTypeLabel(record.type)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">{sourceLang?.flag}</span>
                          <span className="text-xs text-gray-500">{sourceLang?.nativeName}</span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="text-xs">{targetLang?.flag}</span>
                          <span className="text-xs text-gray-500">{targetLang?.nativeName}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(record.id)}
                          className="p-1"
                        >
                          <Heart className={`w-4 h-4 ${
                            record.isFavorite 
                              ? 'text-red-500 fill-current' 
                              : 'text-gray-400'
                          }`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeTranslation(record.id);
                            toast.success('记录已删除');
                          }}
                          className="p-1"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">原文</div>
                        <div className="text-gray-900 text-sm leading-relaxed">
                          {record.sourceText}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-blue-600 mb-1">译文</div>
                        <div className="text-blue-900 text-sm font-medium leading-relaxed">
                          {record.translatedText}
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-400">
                        {formatTimestamp(record.timestamp)}
                      </div>
                      
                      {record.confidence && (
                        <div className="text-xs text-gray-500">
                          置信度: {Math.round(record.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-100 px-4 py-3 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        copyText(record.translatedText);
                        toast.success('译文已复制到剪贴板');
                      }}
                      icon={<Copy className="w-4 h-4" />}
                      className="flex-1"
                    >
                      复制译文
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        copyText(record.sourceText);
                        toast.success('原文已复制到剪贴板');
                      }}
                      className="flex-1"
                    >
                      复制原文
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareRecord(record)}
                      icon={<Share2 className="w-4 h-4" />}
                    >
                      分享
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
        
        {/* Clear All Button */}
        {history.length > 0 && (
          <Card className="text-center">
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('确定要清空所有翻译记录吗？此操作不可撤销。')) {
                  clearHistory();
                  toast.success('所有记录已清空');
                }
              }}
              icon={<Trash2 className="w-4 h-4" />}
            >
              清空所有记录
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}