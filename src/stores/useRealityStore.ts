import { create } from 'zustand';
import type { Reality, RealityParagraph } from '@/types';
import { dbHelpers } from '@/services/db';

interface RealityState {
  currentReality: Reality | null;
  loading: boolean;
  
  loadReality: (id: string) => Promise<void>;
  createReality: (chatId: string, title: string, firstParagraph: string, choices?: { id: string; label: string }[]) => Promise<Reality>;
  addParagraph: (paragraph: RealityParagraph) => Promise<void>;
  selectChoice: (paragraphId: string, choiceId: string) => Promise<void>;
  endReality: (summary?: string) => Promise<void>;
  acceptReality: (id: string) => Promise<void>;
  rejectReality: (id: string) => Promise<void>;
}

export const useRealityStore = create<RealityState>((set, get) => ({
  currentReality: null,
  loading: false,

  loadReality: async (id) => {
    set({ loading: true });
    const reality = await dbHelpers.getReality(id);
    set({ currentReality: reality || null, loading: false });
  },

  createReality: async (chatId, title, firstParagraph, choices) => {
    const reality: Reality = {
      id: crypto.randomUUID(),
      chatId,
      status: 'pending',
      title,
      paragraphs: [{
        id: crypto.randomUUID(),
        content: firstParagraph,
        choices
      }],
      createdAt: Date.now()
    };
    await dbHelpers.createReality(reality);
    set({ currentReality: reality });
    return reality;
  },

  addParagraph: async (paragraph) => {
    const reality = get().currentReality;
    if (!reality) return;
    
    const updatedParagraphs = [...reality.paragraphs, paragraph];
    await dbHelpers.updateReality(reality.id, { paragraphs: updatedParagraphs });
    set({
      currentReality: { ...reality, paragraphs: updatedParagraphs }
    });
  },

  selectChoice: async (paragraphId, choiceId) => {
    const reality = get().currentReality;
    if (!reality) return;
    
    const updatedParagraphs = reality.paragraphs.map(p =>
      p.id === paragraphId ? { ...p, chosenId: choiceId } : p
    );
    await dbHelpers.updateReality(reality.id, { paragraphs: updatedParagraphs });
    set({
      currentReality: { ...reality, paragraphs: updatedParagraphs }
    });
  },

  endReality: async (summary) => {
    const reality = get().currentReality;
    if (!reality) return;
    
    const updates: Partial<Reality> = { status: 'ended' };
    if (summary) {
      updates.summary = summary;
    }
    
    await dbHelpers.updateReality(reality.id, updates);
    set({
      currentReality: { ...reality, ...updates }
    });
  },

  acceptReality: async (id) => {
    await dbHelpers.updateReality(id, { status: 'active' });
    const reality = get().currentReality;
    if (reality?.id === id) {
      set({ currentReality: { ...reality, status: 'active' } });
    }
  },

  rejectReality: async (id) => {
    await dbHelpers.updateReality(id, { status: 'ended' });
    const reality = get().currentReality;
    if (reality?.id === id) {
      set({ currentReality: { ...reality, status: 'ended' } });
    }
  }
}));
