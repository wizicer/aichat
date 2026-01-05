import { create } from 'zustand';
import type { Character } from '@/types';
import { dbHelpers } from '@/services/db';

interface CharacterState {
  characters: Character[];
  loading: boolean;
  
  loadCharacters: () => Promise<void>;
  getCharacter: (id: string) => Promise<Character | undefined>;
  createCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Character>;
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  loading: true,

  loadCharacters: async () => {
    set({ loading: true });
    const characters = await dbHelpers.getCharacters();
    set({ characters, loading: false });
  },

  getCharacter: async (id) => {
    return dbHelpers.getCharacter(id);
  },

  createCharacter: async (data) => {
    const character: Character = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await dbHelpers.createCharacter(character);
    set({ characters: [...get().characters, character] });
    return character;
  },

  updateCharacter: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: Date.now() };
    await dbHelpers.updateCharacter(id, updatedData);
    set({
      characters: get().characters.map(c => 
        c.id === id ? { ...c, ...updatedData } : c
      )
    });
  },

  deleteCharacter: async (id) => {
    await dbHelpers.deleteCharacter(id);
    set({ characters: get().characters.filter(c => c.id !== id) });
  }
}));
