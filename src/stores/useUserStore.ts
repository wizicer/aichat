import { create } from 'zustand';
import type { UserProfile, Transaction } from '@/types';
import { dbHelpers } from '@/services/db';

interface UserState {
  profile: UserProfile | null;
  transactions: Transaction[];
  loading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  loadTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  updateBalance: (amount: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  transactions: [],
  loading: true,

  loadProfile: async () => {
    set({ loading: true });
    const profile = await dbHelpers.getUserProfile();
    set({ profile: profile || null, loading: false });
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    if (!current) return;
    
    await dbHelpers.updateUserProfile(updates);
    set({ profile: { ...current, ...updates } });
  },

  loadTransactions: async () => {
    const transactions = await dbHelpers.getTransactions();
    set({ transactions });
  },

  addTransaction: async (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    await dbHelpers.addTransaction(newTransaction);
    set({ transactions: [newTransaction, ...get().transactions] });
  },

  updateBalance: async (amount) => {
    const current = get().profile;
    if (!current) return;
    
    const newBalance = current.balance + amount;
    await dbHelpers.updateUserProfile({ balance: newBalance });
    set({ profile: { ...current, balance: newBalance } });
  }
}));
