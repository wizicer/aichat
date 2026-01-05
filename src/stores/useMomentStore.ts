import { create } from 'zustand';
import type { Moment, MomentComment } from '@/types';
import { dbHelpers } from '@/services/db';

interface MomentState {
  moments: Moment[];
  loading: boolean;
  
  loadMoments: () => Promise<void>;
  createMoment: (moment: Omit<Moment, 'id' | 'timestamp' | 'likes' | 'comments'>) => Promise<Moment>;
  deleteMoment: (id: string) => Promise<void>;
  toggleLike: (momentId: string, userId: string) => Promise<void>;
  addComment: (momentId: string, comment: Omit<MomentComment, 'id' | 'timestamp'>) => Promise<void>;
}

export const useMomentStore = create<MomentState>((set, get) => ({
  moments: [],
  loading: true,

  loadMoments: async () => {
    set({ loading: true });
    const moments = await dbHelpers.getMoments();
    set({ moments, loading: false });
  },

  createMoment: async (data) => {
    const moment: Moment = {
      ...data,
      id: crypto.randomUUID(),
      likes: [],
      comments: [],
      timestamp: Date.now()
    };
    await dbHelpers.addMoment(moment);
    set({ moments: [moment, ...get().moments] });
    return moment;
  },

  deleteMoment: async (id) => {
    await dbHelpers.deleteMoment(id);
    set({ moments: get().moments.filter(m => m.id !== id) });
  },

  toggleLike: async (momentId, userId) => {
    const moment = get().moments.find(m => m.id === momentId);
    if (!moment) return;
    
    const likes = moment.likes.includes(userId)
      ? moment.likes.filter(id => id !== userId)
      : [...moment.likes, userId];
    
    await dbHelpers.updateMoment(momentId, { likes });
    set({
      moments: get().moments.map(m => 
        m.id === momentId ? { ...m, likes } : m
      )
    });
  },

  addComment: async (momentId, commentData) => {
    const moment = get().moments.find(m => m.id === momentId);
    if (!moment) return;
    
    const comment: MomentComment = {
      ...commentData,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    const comments = [...moment.comments, comment];
    await dbHelpers.updateMoment(momentId, { comments });
    set({
      moments: get().moments.map(m => 
        m.id === momentId ? { ...m, comments } : m
      )
    });
  }
}));
