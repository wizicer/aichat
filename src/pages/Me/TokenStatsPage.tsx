import { useEffect, useState } from 'react';
import { BarChart3, Trash2, RefreshCw } from 'lucide-react';
import { useTokenUsageStore, useCharacterStore } from '@/stores';
import { PageHeader } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import type { TokenStats, AIProvider } from '@/types';

const PROVIDER_NAMES: Record<AIProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  moonshot: 'Moonshot',
  custom: '自定义'
};

export function TokenStatsPage() {
  const { stats, loading, getStats, clearUsageRecords } = useTokenUsageStore();
  const { loadCharacters } = useCharacterStore();
  const [showClearModal, setShowClearModal] = useState(false);
  const [viewMode, setViewMode] = useState<'character' | 'provider'>('character');

  useEffect(() => {
    loadCharacters();
    getStats();
  }, [loadCharacters, getStats]);

  const handleClear = async () => {
    await clearUsageRecords();
    setShowClearModal(false);
  };

  const handleRefresh = () => {
    getStats();
  };

  // Group stats by character or provider
  const groupedStats = viewMode === 'character'
    ? groupByCharacter(stats)
    : groupByProvider(stats);

  const totalTokens = stats.reduce((sum, s) => sum + s.totalTokens, 0);
  const totalPrompt = stats.reduce((sum, s) => sum + s.totalPromptTokens, 0);
  const totalCompletion = stats.reduce((sum, s) => sum + s.totalCompletionTokens, 0);
  const totalRequests = stats.reduce((sum, s) => sum + s.requestCount, 0);

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title="Token 用量统计"
        showBack
        right={
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowClearModal(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
            >
              <Trash2 size={20} />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Summary card */}
        <div className="m-4 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={24} />
            <span className="font-medium">总计用量</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{formatNumber(totalTokens)}</p>
              <p className="text-sm opacity-80">总 Token</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRequests}</p>
              <p className="text-sm opacity-80">请求次数</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{formatNumber(totalPrompt)}</p>
              <p className="text-xs opacity-80">输入 Token</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{formatNumber(totalCompletion)}</p>
              <p className="text-xs opacity-80">输出 Token</p>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-2 px-4 mb-4">
          <button
            onClick={() => setViewMode('character')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'character'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            按角色
          </button>
          <button
            onClick={() => setViewMode('provider')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'provider'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            按提供商
          </button>
        </div>

        {/* Stats list */}
        <div className="px-4 pb-4 space-y-3">
          {groupedStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>暂无用量数据</p>
              <p className="text-sm mt-2">开始聊天后将自动记录</p>
            </div>
          ) : (
            groupedStats.map((group, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {group.subLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatNumber(group.totalTokens)}</p>
                    <p className="text-xs text-gray-500">{group.requestCount} 次请求</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${totalTokens > 0 ? (group.totalTokens / totalTokens) * 100 : 0}%` }}
                  />
                </div>
                
                {/* Token breakdown */}
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>输入: {formatNumber(group.totalPromptTokens)}</span>
                  <span>输出: {formatNumber(group.totalCompletionTokens)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clear confirmation modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="清空用量记录"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          确定要清空所有 Token 用量记录吗？此操作不可恢复。
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>
            取消
          </Button>
          <Button variant="danger" onClick={handleClear}>
            清空
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

interface GroupedStats {
  name: string;
  subLabel: string;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  requestCount: number;
}

function groupByCharacter(stats: TokenStats[]): GroupedStats[] {
  const map = new Map<string, GroupedStats>();
  
  for (const stat of stats) {
    const existing = map.get(stat.characterId);
    if (existing) {
      existing.totalTokens += stat.totalTokens;
      existing.totalPromptTokens += stat.totalPromptTokens;
      existing.totalCompletionTokens += stat.totalCompletionTokens;
      existing.requestCount += stat.requestCount;
      existing.subLabel = `${existing.requestCount} 次请求`;
    } else {
      map.set(stat.characterId, {
        name: stat.characterName,
        subLabel: `${stat.requestCount} 次请求`,
        totalTokens: stat.totalTokens,
        totalPromptTokens: stat.totalPromptTokens,
        totalCompletionTokens: stat.totalCompletionTokens,
        requestCount: stat.requestCount
      });
    }
  }
  
  return Array.from(map.values()).sort((a, b) => b.totalTokens - a.totalTokens);
}

function groupByProvider(stats: TokenStats[]): GroupedStats[] {
  const map = new Map<AIProvider, GroupedStats>();
  
  for (const stat of stats) {
    const existing = map.get(stat.provider);
    if (existing) {
      existing.totalTokens += stat.totalTokens;
      existing.totalPromptTokens += stat.totalPromptTokens;
      existing.totalCompletionTokens += stat.totalCompletionTokens;
      existing.requestCount += stat.requestCount;
      existing.subLabel = `${existing.requestCount} 次请求`;
    } else {
      map.set(stat.provider, {
        name: PROVIDER_NAMES[stat.provider] || stat.provider,
        subLabel: `${stat.requestCount} 次请求`,
        totalTokens: stat.totalTokens,
        totalPromptTokens: stat.totalPromptTokens,
        totalCompletionTokens: stat.totalCompletionTokens,
        requestCount: stat.requestCount
      });
    }
  }
  
  return Array.from(map.values()).sort((a, b) => b.totalTokens - a.totalTokens);
}
