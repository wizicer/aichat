import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pin, BellOff, Trash2 } from 'lucide-react';
import { useChatStore, useCharacterStore } from '@/stores';
import { Avatar, Modal, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { formatTime } from '@/utils/helpers';
import type { Chat, Character } from '@/types';

export function ChatList() {
  const navigate = useNavigate();
  const { chats, loadChats, togglePin, toggleMute, deleteChat } = useChatStore();
  const { characters, loadCharacters } = useCharacterStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ chat: Chat; x: number; y: number } | null>(null);

  useEffect(() => {
    loadChats();
    loadCharacters();
  }, [loadChats, loadCharacters]);

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleNewChat = async (character: Character) => {
    const { createChat } = useChatStore.getState();
    const chat = await createChat(character);
    setShowNewChat(false);
    navigate(`/chat/${chat.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    setContextMenu({ chat, x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title="聊天"
        right={
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="mb-4">暂无聊天</p>
            <Button onClick={() => setShowNewChat(true)}>
              开始新聊天
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                onContextMenu={(e) => handleContextMenu(e, chat)}
                className={`
                  flex items-center gap-3 px-4 py-3 cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-800/50
                  ${chat.pinned ? 'bg-gray-50 dark:bg-gray-800/30' : 'bg-white dark:bg-gray-900'}
                `}
              >
                <div className="relative">
                  <Avatar src={chat.avatar} name={chat.name} size="lg" />
                  {chat.muted && (
                    <BellOff size={12} className="absolute -bottom-1 -right-1 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {chat.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chat.lastMessage || '暂无消息'}
                    </p>
                    {!chat.muted && chat.unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[18px] text-center">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={handleCloseContextMenu}
        >
          <div
            className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[120px]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 140),
              top: Math.min(contextMenu.y, window.innerHeight - 160)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                togglePin(contextMenu.chat.id);
                handleCloseContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Pin size={16} />
              {contextMenu.chat.pinned ? '取消置顶' : '置顶'}
            </button>
            <button
              onClick={() => {
                toggleMute(contextMenu.chat.id);
                handleCloseContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <BellOff size={16} />
              {contextMenu.chat.muted ? '取消静音' : '静音'}
            </button>
            <button
              onClick={() => {
                deleteChat(contextMenu.chat.id);
                handleCloseContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Trash2 size={16} />
              删除
            </button>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      <Modal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        title="选择联系人"
      >
        {characters.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-4">暂无联系人</p>
            <Button onClick={() => {
              setShowNewChat(false);
              navigate('/contacts/new');
            }}>
              创建联系人
            </Button>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto -mx-4">
            {characters.map((character) => (
              <button
                key={character.id}
                onClick={() => handleNewChat(character)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Avatar src={character.avatar} name={character.name} size="md" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {character.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {character.bio || '暂无签名'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
