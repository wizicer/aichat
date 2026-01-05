import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Plus, Image, Gift, MapPin, Link2, Sparkles, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useChatStore, useCharacterStore, useSettingsStore, useLoreBookStore, useRealityStore } from '@/stores';
import { Avatar, Button, Modal, Input } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { formatTime } from '@/utils/helpers';
import { aiService } from '@/services/ai';
import type { Message, AIDebugInfo } from '@/types';

export function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Action modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatingReality, setGeneratingReality] = useState(false);
  
  // Action form data
  const [imageUrl, setImageUrl] = useState('');
  const [redPacketAmount, setRedPacketAmount] = useState('');
  const [redPacketMessage, setRedPacketMessage] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  
  // Debug info (in-memory only)
  const [lastDebugInfo, setLastDebugInfo] = useState<AIDebugInfo | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const { currentChat, messages, loadChat, loadMessages, addMessage, sending, setSending, markAsRead } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { settings, loadSettings } = useSettingsStore();
  const { entries: loreBooks, loadEntries: loadLoreBooks } = useLoreBookStore();
  const { createReality } = useRealityStore();

  useEffect(() => {
    if (id) {
      loadChat(id);
      loadMessages(id);
      loadSettings();
      loadLoreBooks();
      markAsRead(id);
    }
  }, [id, loadChat, loadMessages, loadSettings, loadLoreBooks, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending || !currentChat || !settings) return;

    const character = await getCharacter(currentChat.characterId);
    if (!character) return;

    setError(null);
    setSending(true);

    // Add user message
    const userMessage = await addMessage({
      chatId: currentChat.id,
      sender: 'user',
      type: 'text',
      content: inputText.trim(),
      recalled: false
    });

    setInputText('');

    try {
      // Call AI with debug info if enabled
      const includeDebug = settings.debugMode || false;
      const { response, debug } = await aiService.chat(settings, character, [...messages, userMessage], loreBooks, includeDebug);
      
      if (debug) {
        setLastDebugInfo(debug);
      }

      if (response.type === 'reality') {
        // Create reality card
        const reality = await createReality(
          currentChat.id,
          response.title,
          response.paragraph,
          response.choices
        );
        
        // Add reality message
        await addMessage({
          chatId: currentChat.id,
          sender: 'ai',
          type: 'reality',
          content: response.title,
          metadata: { realityId: reality.id },
          recalled: false
        });
      } else {
        // Add text message
        await addMessage({
          chatId: currentChat.id,
          sender: 'ai',
          type: 'text',
          content: response.content,
          recalled: false
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRealityClick = (realityId: string) => {
    navigate(`/chat/${id}/reality/${realityId}`);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
            {message.content}
          </span>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`flex gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <Avatar
          src={isUser ? '' : currentChat?.avatar}
          name={isUser ? '我' : currentChat?.name || ''}
          size="md"
        />
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
          {message.type === 'reality' ? (
            <button
              onClick={() => message.metadata?.realityId && handleRealityClick(message.metadata.realityId)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} />
                <span className="font-medium">现实邀请</span>
              </div>
              <p className="text-sm opacity-90">{message.content}</p>
              <p className="text-xs mt-2 opacity-75">点击查看详情</p>
            </button>
          ) : (
            <div
              className={`
                px-3 py-2 rounded-xl
                ${isUser 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                }
              `}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}
          <span className="text-xs text-gray-400 mt-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  };

  // Send image message
  const handleSendImage = async () => {
    if (!imageUrl.trim() || !currentChat) return;
    await addMessage({
      chatId: currentChat.id,
      sender: 'user',
      type: 'image',
      content: '[图片]',
      metadata: { imageUrl: imageUrl.trim() },
      recalled: false
    });
    setImageUrl('');
    setShowImageModal(false);
    setShowMenu(false);
  };

  // Send red packet message
  const handleSendRedPacket = async () => {
    if (!redPacketAmount || !currentChat) return;
    const amount = parseFloat(redPacketAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    await addMessage({
      chatId: currentChat.id,
      sender: 'user',
      type: 'redpacket',
      content: redPacketMessage || '恭喜发财，大吉大利',
      metadata: { 
        redpacketId: crypto.randomUUID(),
        redpacketAmount: amount,
        redpacketMessage: redPacketMessage || '恭喜发财，大吉大利',
        redpacketClaimed: false
      },
      recalled: false
    });
    setRedPacketAmount('');
    setRedPacketMessage('');
    setShowRedPacketModal(false);
    setShowMenu(false);
  };

  // Send location message
  const handleSendLocation = async () => {
    if (!locationName.trim() || !currentChat) return;
    await addMessage({
      chatId: currentChat.id,
      sender: 'user',
      type: 'location',
      content: locationName.trim(),
      metadata: { 
        locationName: locationName.trim(),
        locationAddress: locationAddress.trim() || locationName.trim()
      },
      recalled: false
    });
    setLocationName('');
    setLocationAddress('');
    setShowLocationModal(false);
    setShowMenu(false);
  };

  // Send link message
  const handleSendLink = async () => {
    if (!linkUrl.trim() || !currentChat) return;
    await addMessage({
      chatId: currentChat.id,
      sender: 'user',
      type: 'link',
      content: linkTitle.trim() || linkUrl.trim(),
      metadata: { 
        linkUrl: linkUrl.trim(),
        linkTitle: linkTitle.trim() || linkUrl.trim()
      },
      recalled: false
    });
    setLinkUrl('');
    setLinkTitle('');
    setShowLinkModal(false);
    setShowMenu(false);
  };

  // Generate reality card based on conversation
  const handleGenerateReality = async () => {
    if (!currentChat || !settings || generatingReality) return;
    
    const character = await getCharacter(currentChat.characterId);
    if (!character) return;
    
    setGeneratingReality(true);
    setError(null);
    setShowMenu(false);
    
    try {
      const includeDebug = settings.debugMode || false;
      const { response, debug } = await aiService.suggestReality(settings, character, messages, loreBooks, includeDebug);
      
      if (debug) {
        setLastDebugInfo(debug);
      }
      
      if (response.type === 'reality') {
        const reality = await createReality(
          currentChat.id,
          response.title,
          response.paragraph,
          response.choices
        );
        
        await addMessage({
          chatId: currentChat.id,
          sender: 'ai',
          type: 'reality',
          content: response.title,
          metadata: { realityId: reality.id },
          recalled: false
        });
      } else {
        setError('AI未能生成有效的互动场景，请重试');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setGeneratingReality(false);
    }
  };

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader
        title={currentChat.name}
        showBack
        right={
          <button
            onClick={() => navigate(`/contacts/${currentChat.characterId}`)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <MoreVertical size={20} />
          </button>
        }
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}
        {sending && (
          <div className="flex gap-2 mb-4">
            <Avatar src={currentChat.avatar} name={currentChat.name} size="md" />
            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 safe-bottom">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Plus size={24} />
          </button>
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-gray-100"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="!rounded-full !p-2"
          >
            <Send size={20} />
          </Button>
        </div>

        {/* Quick action menu */}
        {showMenu && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => setShowImageModal(true)}
              className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Image size={24} />
              </div>
              <span className="text-xs">图片</span>
            </button>
            <button 
              onClick={() => setShowRedPacketModal(true)}
              className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Gift size={24} />
              </div>
              <span className="text-xs">红包</span>
            </button>
            <button 
              onClick={() => setShowLocationModal(true)}
              className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <span className="text-xs">位置</span>
            </button>
            <button 
              onClick={() => setShowLinkModal(true)}
              className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Link2 size={24} />
              </div>
              <span className="text-xs">链接</span>
            </button>
            <button 
              onClick={handleGenerateReality}
              disabled={generatingReality}
              className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white ${generatingReality ? 'opacity-50' : ''}`}>
                <Sparkles size={24} className={generatingReality ? 'animate-spin' : ''} />
              </div>
              <span className="text-xs">{generatingReality ? '生成中...' : '现实'}</span>
            </button>
          </div>
        )}
        
        {/* Debug info display */}
        {settings?.debugMode && lastDebugInfo && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <span>Token: {lastDebugInfo.totalTokens} ({lastDebugInfo.promptTokens}+{lastDebugInfo.completionTokens})</span>
              {showDebugInfo ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showDebugInfo && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-60">
                <div className="mb-2">
                  <strong>Prompt:</strong>
                  <pre className="whitespace-pre-wrap mt-1 text-gray-600 dark:text-gray-400">
                    {lastDebugInfo.prompt.map((m) => `[${m.role}]: ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`).join('\n\n')}
                  </pre>
                </div>
                <div>
                  <strong>Raw Response:</strong>
                  <pre className="whitespace-pre-wrap mt-1 text-gray-600 dark:text-gray-400">
                    {lastDebugInfo.rawResponse}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} title="发送图片">
        <Input
          label="图片URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="输入图片URL"
        />
        {imageUrl && (
          <img src={imageUrl} alt="预览" className="mt-2 max-h-40 rounded" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>取消</Button>
          <Button onClick={handleSendImage} disabled={!imageUrl.trim()}>发送</Button>
        </div>
      </Modal>

      {/* Red Packet Modal */}
      <Modal isOpen={showRedPacketModal} onClose={() => setShowRedPacketModal(false)} title="发红包">
        <Input
          label="金额"
          type="number"
          value={redPacketAmount}
          onChange={(e) => setRedPacketAmount(e.target.value)}
          placeholder="输入金额"
        />
        <Input
          label="祝福语"
          value={redPacketMessage}
          onChange={(e) => setRedPacketMessage(e.target.value)}
          placeholder="恭喜发财，大吉大利"
          className="mt-2"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowRedPacketModal(false)}>取消</Button>
          <Button onClick={handleSendRedPacket} disabled={!redPacketAmount}>发送</Button>
        </div>
      </Modal>

      {/* Location Modal */}
      <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} title="发送位置">
        <Input
          label="位置名称"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="输入位置名称"
        />
        <Input
          label="详细地址"
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
          placeholder="输入详细地址（可选）"
          className="mt-2"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowLocationModal(false)}>取消</Button>
          <Button onClick={handleSendLocation} disabled={!locationName.trim()}>发送</Button>
        </div>
      </Modal>

      {/* Link Modal */}
      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="发送链接">
        <Input
          label="链接URL"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
        />
        <Input
          label="链接标题"
          value={linkTitle}
          onChange={(e) => setLinkTitle(e.target.value)}
          placeholder="输入链接标题（可选）"
          className="mt-2"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowLinkModal(false)}>取消</Button>
          <Button onClick={handleSendLink} disabled={!linkUrl.trim()}>发送</Button>
        </div>
      </Modal>
    </div>
  );
}
