import { create } from 'zustand';
import { db } from '@/services/db';
import type { TokenUsage, TokenStats, AIProvider } from '@/types';

interface TokenUsageState {
  usageRecords: TokenUsage[];
  stats: TokenStats[];
  loading: boolean;
  
  // Actions
  loadUsageRecords: () => Promise<void>;
  recordUsage: (usage: Omit<TokenUsage, 'id' | 'timestamp'>) => Promise<void>;
  getStats: () => Promise<TokenStats[]>;
  getStatsByCharacter: (characterId: string) => Promise<TokenStats[]>;
  getStatsByProvider: (provider: AIProvider) => Promise<TokenStats[]>;
  clearUsageRecords: () => Promise<void>;
}

export const useTokenUsageStore = create<TokenUsageState>((set, get) => ({
  usageRecords: [],
  stats: [],
  loading: false,

  loadUsageRecords: async () => {
    set({ loading: true });
    try {
      const records = await db.tokenUsage.orderBy('timestamp').reverse().toArray();
      set({ usageRecords: records });
    } finally {
      set({ loading: false });
    }
  },

  recordUsage: async (usage) => {
    const record: TokenUsage = {
      id: crypto.randomUUID(),
      ...usage,
      timestamp: Date.now()
    };
    await db.tokenUsage.add(record);
    
    // Update local state
    set(state => ({
      usageRecords: [record, ...state.usageRecords]
    }));
  },

  getStats: async () => {
    const records = await db.tokenUsage.toArray();
    
    // Group by characterId + provider
    const statsMap = new Map<string, TokenStats>();
    
    for (const record of records) {
      const key = `${record.characterId}:${record.provider}`;
      const existing = statsMap.get(key);
      
      if (existing) {
        existing.totalPromptTokens += record.promptTokens;
        existing.totalCompletionTokens += record.completionTokens;
        existing.totalTokens += record.totalTokens;
        existing.requestCount += 1;
      } else {
        statsMap.set(key, {
          characterId: record.characterId,
          characterName: record.characterName,
          provider: record.provider,
          totalPromptTokens: record.promptTokens,
          totalCompletionTokens: record.completionTokens,
          totalTokens: record.totalTokens,
          requestCount: 1
        });
      }
    }
    
    const stats = Array.from(statsMap.values()).sort((a, b) => b.totalTokens - a.totalTokens);
    set({ stats });
    return stats;
  },

  getStatsByCharacter: async (characterId) => {
    const allStats = await get().getStats();
    return allStats.filter(s => s.characterId === characterId);
  },

  getStatsByProvider: async (provider) => {
    const allStats = await get().getStats();
    return allStats.filter(s => s.provider === provider);
  },

  clearUsageRecords: async () => {
    await db.tokenUsage.clear();
    set({ usageRecords: [], stats: [] });
  }
}));
