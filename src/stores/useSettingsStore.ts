import { create } from 'zustand';
import type { Settings, AIProvider } from '@/types';
import { dbHelpers } from '@/services/db';
import { AI_PROVIDERS } from '@/services/ai';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  setProvider: (provider: AIProvider) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: true,

  loadSettings: async () => {
    set({ loading: true });
    const settings = await dbHelpers.getSettings();
    set({ settings: settings || null, loading: false });
  },

  updateSettings: async (updates) => {
    const current = get().settings;
    if (!current) return;
    
    await dbHelpers.updateSettings(updates);
    set({ settings: { ...current, ...updates } });
  },

  setProvider: async (provider) => {
    const config = AI_PROVIDERS[provider];
    await get().updateSettings({
      provider,
      apiEndpoint: config.defaultEndpoint,
      model: config.models[0] || ''
    });
  }
}));
