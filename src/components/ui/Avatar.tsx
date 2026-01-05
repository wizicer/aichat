import { getAvatarColor } from '@/utils/helpers';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl'
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-md object-cover ${className}`}
      />
    );
  }
  
  const colorClass = getAvatarColor(name);
  const firstChar = name.charAt(0).toUpperCase();
  
  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-md flex items-center justify-center text-white font-medium ${className}`}
    >
      {firstChar}
    </div>
  );
}
