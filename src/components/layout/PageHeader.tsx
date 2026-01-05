import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  right?: ReactNode;
}

export function PageHeader({ title, showBack = false, backTo, right }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 safe-top">
      <div className="flex items-center gap-2 min-w-[60px]">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-1 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
        {title}
      </h1>
      <div className="flex items-center gap-2 min-w-[60px] justify-end">
        {right}
      </div>
    </header>
  );
}
