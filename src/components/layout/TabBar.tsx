import { NavLink } from 'react-router-dom';
import { MessageCircle, Users, Compass, User } from 'lucide-react';

const tabs = [
  { path: '/chat', icon: MessageCircle, label: '聊天' },
  { path: '/contacts', icon: Users, label: '通讯录' },
  { path: '/discover', icon: Compass, label: '发现' },
  { path: '/me', icon: User, label: '我' }
];

export function TabBar() {
  return (
    <nav className="flex items-center justify-around bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-bottom">
      {tabs.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `
            flex flex-col items-center py-2 px-4 min-w-[64px]
            ${isActive 
              ? 'text-primary' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }
          `}
        >
          <Icon size={24} />
          <span className="text-xs mt-1">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
