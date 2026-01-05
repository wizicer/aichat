import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout';

export function DiscoverHome() {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: Users,
      label: '朋友圈',
      description: '查看最新动态',
      path: '/discover/moments',
      color: 'text-orange-500'
    },
    {
      icon: BookOpen,
      label: '世界书',
      description: '管理世界观设定',
      path: '/discover/lorebook',
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader title="发现" />

      <div className="flex-1 overflow-y-auto">
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
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {item.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
