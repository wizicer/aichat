import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Settings, ChevronRight } from 'lucide-react';
import { useUserStore, useSettingsStore } from '@/stores';
import { Avatar } from '@/components/ui';
import { PageHeader } from '@/components/layout';

export function MeHome() {
  const navigate = useNavigate();
  const { profile, loadProfile } = useUserStore();
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, [loadProfile, loadSettings]);

  const menuItems = [
    {
      icon: Wallet,
      label: '钱包',
      path: '/me/wallet',
      color: 'text-yellow-500'
    },
    {
      icon: Settings,
      label: '设置',
      path: '/me/settings',
      color: 'text-gray-500'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader title="我" />

      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <button
          onClick={() => navigate('/me/profile')}
          className="w-full bg-white dark:bg-gray-900 px-4 py-6"
        >
          <div className="flex items-center gap-4">
            <Avatar src={profile?.avatar} name={profile?.name || '我'} size="xl" />
            <div className="flex-1 text-left">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {profile?.name || '未设置昵称'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {profile?.bio || '点击编辑个人资料'}
              </p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </button>

        {/* Menu items */}
        <div className="mt-3 bg-white dark:bg-gray-900">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-4 px-4 py-4
                hover:bg-gray-50 dark:hover:bg-gray-800
                ${index !== menuItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}
              `}
            >
              <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${item.color}`}>
                <item.icon size={24} />
              </div>
              <span className="flex-1 text-left text-gray-900 dark:text-gray-100">
                {item.label}
              </span>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* API status */}
        <div className="mt-3 bg-white dark:bg-gray-900 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              API状态
            </span>
            <span className={`text-sm ${settings?.apiKey ? 'text-green-500' : 'text-red-500'}`}>
              {settings?.apiKey ? '已配置' : '未配置'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
