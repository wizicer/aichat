import { create } from 'zustand';
import type { LoreBook } from '@/types';
import { dbHelpers } from '@/services/db';

interface LoreBookState {
  entries: LoreBook[];
  loading: boolean;
  
  loadEntries: () => Promise<void>;
  createEntry: (entry: Omit<LoreBook, 'id'>) => Promise<LoreBook>;
  updateEntry: (id: string, updates: Partial<LoreBook>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleEnabled: (id: string) => Promise<void>;
}

export const useLoreBookStore = create<LoreBookState>((set, get) => ({
  entries: [],
  loading: true,

  loadEntries: async () => {
    set({ loading: true });
    const entries = await dbHelpers.getLoreBooks();
    set({ entries, loading: false });
  },

  createEntry: async (data) => {
    const entry: LoreBook = {
      ...data,
      id: crypto.randomUUID()
    };
    await dbHelpers.addLoreBook(entry);
    set({ entries: [...get().entries, entry] });
    return entry;
  },

  updateEntry: async (id, updates) => {
    await dbHelpers.updateLoreBook(id, updates);
    set({
      entries: get().entries.map(e => 
        e.id === id ? { ...e, ...updates } : e
      )
    });
  },

  deleteEntry: async (id) => {
    await dbHelpers.deleteLoreBook(id);
    set({ entries: get().entries.filter(e => e.id !== id) });
  },

  toggleEnabled: async (id) => {
    const entry = get().entries.find(e => e.id === id);
    if (entry) {
      await get().updateEntry(id, { enabled: !entry.enabled });
    }
  }
}));
