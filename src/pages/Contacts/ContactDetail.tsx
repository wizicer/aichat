import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Edit, Trash2 } from 'lucide-react';
import { useCharacterStore, useChatStore } from '@/stores';
import { Avatar, Button, Modal } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import type { Character } from '@/types';

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { getCharacter, deleteCharacter } = useCharacterStore();
  const { chats, loadChats, createChat } = useChatStore();

  useEffect(() => {
    if (id) {
      getCharacter(id).then((char) => setCharacter(char || null));
      loadChats();
    }
  }, [id, getCharacter, loadChats]);

  const handleStartChat = async () => {
    if (!character) return;
    
    // Check if chat already exists
    const existingChat = chats.find(c => c.characterId === character.id);
    if (existingChat) {
      navigate(`/chat/${existingChat.id}`);
    } else {
      const chat = await createChat(character);
      navigate(`/chat/${chat.id}`);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteCharacter(id);
    navigate('/contacts');
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title="联系人详情"
        showBack
        right={
          <button
            onClick={() => navigate(`/contacts/${id}/edit`)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Edit size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Profile header */}
        <div className="bg-white dark:bg-gray-900 px-4 py-6">
          <div className="flex items-center gap-4">
            <Avatar src={character.avatar} name={character.name} size="xl" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {character.name}
              </h2>
              {character.bio && (
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {character.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Persona section */}
        <div className="mt-3 bg-white dark:bg-gray-900 px-4 py-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            人设描述
          </h3>
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {character.persona || '暂无人设描述'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-3 bg-white dark:bg-gray-900 p-4 space-y-3">
          <Button
            onClick={handleStartChat}
            className="w-full"
          >
            <MessageCircle size={20} />
            发消息
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="w-full"
          >
            <Trash2 size={20} />
            删除联系人
          </Button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          确定要删除联系人 "{character.name}" 吗？此操作不可撤销。
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            className="flex-1"
          >
            删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
