import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/stores';
import { AI_PROVIDERS, aiService } from '@/services/ai';
import { Button, Input, Select } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { AIProvider } from '@/types';

export function APISettings() {
  const { settings, loadSettings, updateSettings, setProvider } = useSettingsStore();
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleProviderChange = (provider: AIProvider) => {
    setProvider(provider);
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!settings) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await aiService.testConnection(settings);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : '测试失败'
      });
    } finally {
      setTesting(false);
    }
  };

  const providerOptions = Object.entries(AI_PROVIDERS).map(([key, config]) => ({
    value: key,
    label: config.name
  }));

  const currentProvider = settings?.provider || 'openai';
  const modelOptions = AI_PROVIDERS[currentProvider]?.models.map(m => ({
    value: m,
    label: m
  })) || [];

  // Allow custom model input for custom provider
  const showCustomModel = currentProvider === 'custom' || modelOptions.length === 0;

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader title="API设置" showBack />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Provider selection */}
        <Select
          label="API提供商"
          value={currentProvider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          options={providerOptions}
        />

        {/* API endpoint */}
        <Input
          label="API端点"
          value={settings?.apiEndpoint || ''}
          onChange={(e) => updateSettings({ apiEndpoint: e.target.value })}
          placeholder="输入API端点URL"
        />

        {/* API key */}
        <Input
          label="API密钥"
          type="password"
          value={settings?.apiKey || ''}
          onChange={(e) => updateSettings({ apiKey: e.target.value })}
          placeholder="输入API密钥"
        />

        {/* Model selection */}
        {showCustomModel ? (
          <Input
            label="模型名称"
            value={settings?.model || ''}
            onChange={(e) => updateSettings({ model: e.target.value })}
            placeholder="输入模型名称"
          />
        ) : (
          <Select
            label="模型"
            value={settings?.model || ''}
            onChange={(e) => updateSettings({ model: e.target.value })}
            options={modelOptions}
          />
        )}

        {/* Provider info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            💡 配置提示
          </p>
          <ul className="text-blue-800 dark:text-blue-400 space-y-1">
            {currentProvider === 'openai' && (
              <>
                <li>• 官方端点: https://api.openai.com/v1</li>
                <li>• 需要OpenAI账户和API密钥</li>
                <li>• 推荐使用gpt-4o-mini性价比最高</li>
              </>
            )}
            {currentProvider === 'gemini' && (
              <>
                <li>• 官方端点: https://generativelanguage.googleapis.com/v1beta</li>
                <li>• 需要Google AI Studio API密钥</li>
                <li>• gemini-1.5-flash免费额度较高</li>
              </>
            )}
            {currentProvider === 'deepseek' && (
              <>
                <li>• 官方端点: https://api.deepseek.com/v1</li>
                <li>• 国产大模型，价格实惠</li>
                <li>• 支持中文对话效果好</li>
              </>
            )}
            {currentProvider === 'moonshot' && (
              <>
                <li>• 官方端点: https://api.moonshot.cn/v1</li>
                <li>• 月之暗面Kimi API</li>
                <li>• 支持超长上下文</li>
              </>
            )}
            {currentProvider === 'custom' && (
              <>
                <li>• 支持任意OpenAI兼容API</li>
                <li>• 需要手动填写端点和模型</li>
                <li>• 可用于本地模型或第三方服务</li>
              </>
            )}
          </ul>
        </div>

        {/* Test connection */}
        <Button
          onClick={handleTest}
          disabled={!settings?.apiKey || !settings?.apiEndpoint || testing}
          loading={testing}
          className="w-full"
        >
          测试连接
        </Button>

        {/* Test result */}
        {testResult && (
          <div className={`rounded-lg p-4 ${
            testResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
          }`}>
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
