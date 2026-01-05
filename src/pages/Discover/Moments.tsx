import { useEffect, useState } from 'react';
import { Camera, Heart, MessageCircle } from 'lucide-react';
import { useMomentStore, useUserStore, useCharacterStore } from '@/stores';
import { Avatar, Button, Modal, TextArea } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { formatTime } from '@/utils/helpers';
import type { Moment } from '@/types';

export function Moments() {
  const { moments, loadMoments, createMoment, toggleLike, addComment } = useMomentStore();
  const { profile, loadProfile } = useUserStore();
  const { characters, loadCharacters } = useCharacterStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadMoments();
    loadProfile();
    loadCharacters();
  }, [loadMoments, loadProfile, loadCharacters]);

  const handleCreate = async () => {
    if (!newContent.trim() || !profile) return;
    
    await createMoment({
      authorId: 'user',
      authorName: profile.name,
      authorAvatar: profile.avatar,
      content: newContent.trim(),
      images: []
    });
    
    setNewContent('');
    setShowCreateModal(false);
  };

  const handleLike = (momentId: string) => {
    toggleLike(momentId, 'user');
  };

  const handleComment = async (momentId: string) => {
    if (!commentText.trim() || !profile) return;
    
    await addComment(momentId, {
      authorId: 'user',
      authorName: profile.name,
      content: commentText.trim()
    });
    
    setCommentText('');
    setCommentingId(null);
  };

  const renderMoment = (moment: Moment) => {
    const isLiked = moment.likes.includes('user');
    
    return (
      <div key={moment.id} className="bg-white dark:bg-gray-900 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-3">
          <Avatar src={moment.authorAvatar} name={moment.authorName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {moment.authorName}
            </p>
            <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">
              {moment.content}
            </p>
            
            {/* Images */}
            {moment.images.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-1">
                {moment.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt=""
                    className="w-full aspect-square object-cover rounded"
                  />
                ))}
              </div>
            )}
            
            {/* Time and actions */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-500">
                {formatTime(moment.timestamp)}
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(moment.id)}
                  className={`flex items-center gap-1 text-sm ${
                    isLiked ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                  {moment.likes.length > 0 && moment.likes.length}
                </button>
                <button
                  onClick={() => setCommentingId(commentingId === moment.id ? null : moment.id)}
                  className="flex items-center gap-1 text-sm text-gray-500"
                >
                  <MessageCircle size={16} />
                  {moment.comments.length > 0 && moment.comments.length}
                </button>
              </div>
            </div>
            
            {/* Comments */}
            {moment.comments.length > 0 && (
              <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2 space-y-1">
                {moment.comments.map((comment) => (
                  <p key={comment.id} className="text-sm">
                    <span className="font-medium text-primary">
                      {comment.authorName}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ：{comment.content}
                    </span>
                  </p>
                ))}
              </div>
            )}
            
            {/* Comment input */}
            {commentingId === moment.id && (
              <div className="mt-2 flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写评论..."
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-sm focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment(moment.id);
                    }
                  }}
                />
                <Button size="sm" onClick={() => handleComment(moment.id)}>
                  发送
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title="朋友圈"
        showBack
        right={
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Camera size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="mb-4">暂无动态</p>
            <Button onClick={() => setShowCreateModal(true)}>
              发布第一条动态
            </Button>
          </div>
        ) : (
          moments.map(renderMoment)
        )}
      </div>

      {/* Create modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="发布动态"
      >
        <TextArea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="分享你的想法..."
          rows={4}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={!newContent.trim()}>
            发布
          </Button>
        </div>
      </Modal>
    </div>
  );
}
