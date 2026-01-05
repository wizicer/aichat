import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Moon, Type, Bell, Download, Upload, Trash2, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '@/stores';
import { PageHeader } from '@/components/layout';
import { Switch } from '@/components/ui';

export function SettingsPage() {
  const navigate = useNavigate();
  const { settings, loadSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleDarkModeToggle = (checked: boolean) => {
    updateSettings({ darkMode: checked });
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleNotificationsToggle = (checked: boolean) => {
    updateSettings({ notifications: checked });
  };

  const handleExport = async () => {
    // Export data as JSON
    const { db } = await import('@/services/db');
    const data = {
      chats: await db.chats.toArray(),
      messages: await db.messages.toArray(),
      characters: await db.characters.toArray(),
      moments: await db.moments.toArray(),
      loreBooks: await db.loreBooks.toArray(),
      realities: await db.realities.toArray(),
      settings: await db.settings.toArray(),
      userProfile: await db.userProfile.toArray(),
      transactions: await db.transactions.toArray()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aichat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const { db } = await import('@/services/db');
        
        // Clear and import each table
        if (data.chats) {
          await db.chats.clear();
          await db.chats.bulkAdd(data.chats);
        }
        if (data.messages) {
          await db.messages.clear();
          await db.messages.bulkAdd(data.messages);
        }
        if (data.characters) {
          await db.characters.clear();
          await db.characters.bulkAdd(data.characters);
        }
        if (data.moments) {
          await db.moments.clear();
          await db.moments.bulkAdd(data.moments);
        }
        if (data.loreBooks) {
          await db.loreBooks.clear();
          await db.loreBooks.bulkAdd(data.loreBooks);
        }
        if (data.realities) {
          await db.realities.clear();
          await db.realities.bulkAdd(data.realities);
        }
        
        alert('导入成功！请刷新页面。');
        window.location.reload();
      } catch (err) {
        alert('导入失败：文件格式错误');
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可撤销。')) return;
    
    const { db } = await import('@/services/db');
    await db.chats.clear();
    await db.messages.clear();
    await db.characters.clear();
    await db.moments.clear();
    await db.loreBooks.clear();
    await db.realities.clear();
    await db.transactions.clear();
    
    alert('数据已清空！');
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader title="设置" showBack />

      <div className="flex-1 overflow-y-auto">
        {/* API Settings */}
        <div className="mt-3 bg-white dark:bg-gray-900">
          <button
            onClick={() => navigate('/me/settings/api')}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500">
              <Key size={24} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-900 dark:text-gray-100">API设置</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {settings?.apiKey ? '已配置' : '未配置API密钥'}
              </p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* General Settings */}
        <div className="mt-3 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-500">
              <Moon size={24} />
            </div>
            <span className="flex-1 text-gray-900 dark:text-gray-100">深色模式</span>
            <Switch
              checked={settings?.darkMode || false}
              onChange={handleDarkModeToggle}
            />
          </div>
          <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500">
              <Type size={24} />
            </div>
            <span className="flex-1 text-gray-900 dark:text-gray-100">字体大小</span>
            <span className="text-gray-500">{settings?.fontSize || 16}px</span>
          </div>
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-500">
              <Bell size={24} />
            </div>
            <span className="flex-1 text-gray-900 dark:text-gray-100">消息通知</span>
            <Switch
              checked={settings?.notifications || false}
              onChange={handleNotificationsToggle}
            />
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-3 bg-white dark:bg-gray-900">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center text-cyan-500">
              <Download size={24} />
            </div>
            <span className="flex-1 text-left text-gray-900 dark:text-gray-100">导出数据</span>
          </button>
          <button
            onClick={handleImport}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-500">
              <Upload size={24} />
            </div>
            <span className="flex-1 text-left text-gray-900 dark:text-gray-100">导入数据</span>
          </button>
          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-500">
              <Trash2 size={24} />
            </div>
            <span className="flex-1 text-left text-red-500">清空数据</span>
          </button>
        </div>

        {/* Version info */}
        <div className="mt-6 text-center text-sm text-gray-400 dark:text-gray-500 pb-6">
          AIChat v0.0.1
        </div>
      </div>
    </div>
  );
}
