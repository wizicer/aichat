import { pinyin } from 'pinyin-pro';

// Format timestamp to readable string
export function formatTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - timestamp;
  
  // Within 1 minute
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // Within 1 hour
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }
  
  // Today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }
  
  // Within 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }
  
  // Other
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

// Format full datetime
export function formatFullTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get first letter for sorting (supports Chinese pinyin)
export function getFirstLetter(name: string): string {
  if (!name) return '#';
  
  const firstChar = name.charAt(0);
  
  // Check if it's a Chinese character
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    const py = pinyin(firstChar, { toneType: 'none', type: 'array' });
    if (py && py[0]) {
      return py[0].charAt(0).toUpperCase();
    }
  }
  
  // Check if it's a letter
  if (/[a-zA-Z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  
  return '#';
}

// Group items by first letter
export function groupByFirstLetter<T extends { name: string }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (const item of items) {
    const letter = getFirstLetter(item.name);
    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(item);
  }
  
  // Sort groups by letter
  const sortedGroups = new Map(
    [...groups.entries()].sort((a, b) => {
      if (a[0] === '#') return 1;
      if (b[0] === '#') return -1;
      return a[0].localeCompare(b[0]);
    })
  );
  
  return sortedGroups;
}

// Generate default avatar color based on name
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID();
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}
