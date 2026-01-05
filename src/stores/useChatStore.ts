import { create } from 'zustand';
import type { Chat, Message, Character } from '@/types';
import { dbHelpers, db } from '@/services/db';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  
  loadChats: () => Promise<void>;
  loadChat: (id: string) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  createChat: (character: Character) => Promise<Chat>;
  updateChat: (id: string, updates: Partial<Chat>) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>;
  setSending: (sending: boolean) => void;
  
  togglePin: (id: string) => Promise<void>;
  toggleMute: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  loading: true,
  sending: false,

  loadChats: async () => {
    set({ loading: true });
    const chats = await dbHelpers.getChats();
    // Sort: pinned first, then by lastMessageTime
    const sorted = chats.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.lastMessageTime - a.lastMessageTime;
    });
    set({ chats: sorted, loading: false });
  },

  loadChat: async (id) => {
    const chat = await dbHelpers.getChat(id);
    set({ currentChat: chat || null });
  },

  loadMessages: async (chatId) => {
    const messages = await dbHelpers.getMessages(chatId);
    set({ messages });
  },

  createChat: async (character) => {
    const chat: Chat = {
      id: crypto.randomUUID(),
      characterId: character.id,
      name: character.name,
      avatar: character.avatar,
      lastMessage: '',
      lastMessageTime: Date.now(),
      unreadCount: 0,
      pinned: false,
      muted: false
    };
    await dbHelpers.createChat(chat);
    set({ chats: [chat, ...get().chats] });
    return chat;
  },

  updateChat: async (id, updates) => {
    await dbHelpers.updateChat(id, updates);
    set({
      chats: get().chats.map(c => c.id === id ? { ...c, ...updates } : c),
      currentChat: get().currentChat?.id === id 
        ? { ...get().currentChat!, ...updates } 
        : get().currentChat
    });
  },

  deleteChat: async (id) => {
    await dbHelpers.deleteChat(id);
    // Also delete related realities
    await db.realities.where('chatId').equals(id).delete();
    set({
      chats: get().chats.filter(c => c.id !== id),
      currentChat: get().currentChat?.id === id ? null : get().currentChat
    });
  },

  addMessage: async (messageData) => {
    const message: Message = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    await dbHelpers.addMessage(message);
    
    // Update chat's last message
    const chat = get().chats.find(c => c.id === message.chatId);
    if (chat) {
      const lastMessage = message.type === 'text' 
        ? message.content 
        : message.type === 'image' ? '[图片]'
        : message.type === 'voice' ? '[语音]'
        : message.type === 'redpacket' ? '[红包]'
        : message.type === 'location' ? '[位置]'
        : message.type === 'link' ? '[链接]'
        : message.type === 'reality' ? '[现实]'
        : message.content;
      
      await get().updateChat(message.chatId, {
        lastMessage: lastMessage.slice(0, 50),
        lastMessageTime: message.timestamp,
        unreadCount: message.sender === 'ai' ? chat.unreadCount + 1 : chat.unreadCount
      });
    }
    
    set({ messages: [...get().messages, message] });
    return message;
  },

  setSending: (sending) => set({ sending }),

  togglePin: async (id) => {
    const chat = get().chats.find(c => c.id === id);
    if (chat) {
      await get().updateChat(id, { pinned: !chat.pinned });
      await get().loadChats();
    }
  },

  toggleMute: async (id) => {
    const chat = get().chats.find(c => c.id === id);
    if (chat) {
      await get().updateChat(id, { muted: !chat.muted });
    }
  },

  markAsRead: async (id) => {
    await get().updateChat(id, { unreadCount: 0 });
  }
}));
