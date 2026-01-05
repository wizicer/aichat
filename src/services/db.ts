import Dexie, { type Table } from 'dexie';
import type {
  Chat,
  Message,
  Character,
  Moment,
  LoreBook,
  Reality,
  Settings,
  UserProfile,
  Transaction
} from '@/types';

export class AIChatDB extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message>;
  characters!: Table<Character>;
  moments!: Table<Moment>;
  loreBooks!: Table<LoreBook>;
  realities!: Table<Reality>;
  settings!: Table<Settings>;
  userProfile!: Table<UserProfile>;
  transactions!: Table<Transaction>;

  constructor() {
    super('AIChatDB');
    this.version(1).stores({
      chats: 'id, characterId, lastMessageTime, pinned',
      messages: 'id, chatId, timestamp, type',
      characters: 'id, name, createdAt',
      moments: 'id, authorId, timestamp',
      loreBooks: 'id, category, priority, enabled',
      realities: 'id, chatId, status, createdAt',
      settings: 'id',
      userProfile: 'id',
      transactions: 'id, type, timestamp'
    });
  }
}

export const db = new AIChatDB();

// Initialize default data
export async function initializeDB() {
  // Check if user profile exists
  const profileCount = await db.userProfile.count();
  if (profileCount === 0) {
    await db.userProfile.add({
      id: 'user',
      name: '我',
      avatar: '',
      bio: '这个人很懒，什么都没写',
      balance: 100
    });
  }

  // Check if settings exist
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'default',
      provider: 'openai',
      apiEndpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      darkMode: false,
      fontSize: 16,
      notifications: true,
      debugMode: false
    });
  }
}

// Helper functions for database operations
export const dbHelpers = {
  // Chat operations
  async getChats(): Promise<Chat[]> {
    return db.chats.orderBy('lastMessageTime').reverse().toArray();
  },

  async getChat(id: string): Promise<Chat | undefined> {
    return db.chats.get(id);
  },

  async createChat(chat: Chat): Promise<string> {
    return db.chats.add(chat);
  },

  async updateChat(id: string, updates: Partial<Chat>): Promise<void> {
    await db.chats.update(id, updates);
  },

  async deleteChat(id: string): Promise<void> {
    await db.chats.delete(id);
    await db.messages.where('chatId').equals(id).delete();
  },

  // Message operations
  async getMessages(chatId: string): Promise<Message[]> {
    return db.messages.where('chatId').equals(chatId).sortBy('timestamp');
  },

  async addMessage(message: Message): Promise<string> {
    return db.messages.add(message);
  },

  async updateMessage(id: string, updates: Partial<Message>): Promise<void> {
    await db.messages.update(id, updates);
  },

  // Character operations
  async getCharacters(): Promise<Character[]> {
    return db.characters.orderBy('name').toArray();
  },

  async getCharacter(id: string): Promise<Character | undefined> {
    return db.characters.get(id);
  },

  async createCharacter(character: Character): Promise<string> {
    return db.characters.add(character);
  },

  async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
    await db.characters.update(id, updates);
  },

  async deleteCharacter(id: string): Promise<void> {
    await db.characters.delete(id);
  },

  // Moment operations
  async getMoments(): Promise<Moment[]> {
    return db.moments.orderBy('timestamp').reverse().toArray();
  },

  async addMoment(moment: Moment): Promise<string> {
    return db.moments.add(moment);
  },

  async updateMoment(id: string, updates: Partial<Moment>): Promise<void> {
    await db.moments.update(id, updates);
  },

  async deleteMoment(id: string): Promise<void> {
    await db.moments.delete(id);
  },

  // LoreBook operations
  async getLoreBooks(): Promise<LoreBook[]> {
    return db.loreBooks.orderBy('priority').reverse().toArray();
  },

  async addLoreBook(entry: LoreBook): Promise<string> {
    return db.loreBooks.add(entry);
  },

  async updateLoreBook(id: string, updates: Partial<LoreBook>): Promise<void> {
    await db.loreBooks.update(id, updates);
  },

  async deleteLoreBook(id: string): Promise<void> {
    await db.loreBooks.delete(id);
  },

  // Reality operations
  async getReality(id: string): Promise<Reality | undefined> {
    return db.realities.get(id);
  },

  async createReality(reality: Reality): Promise<string> {
    return db.realities.add(reality);
  },

  async updateReality(id: string, updates: Partial<Reality>): Promise<void> {
    await db.realities.update(id, updates);
  },

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    return db.settings.get('default');
  },

  async updateSettings(updates: Partial<Settings>): Promise<void> {
    await db.settings.update('default', updates);
  },

  // User profile operations
  async getUserProfile(): Promise<UserProfile | undefined> {
    return db.userProfile.get('user');
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    await db.userProfile.update('user', updates);
  },

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    return db.transactions.orderBy('timestamp').reverse().toArray();
  },

  async addTransaction(transaction: Transaction): Promise<string> {
    return db.transactions.add(transaction);
  }
};
