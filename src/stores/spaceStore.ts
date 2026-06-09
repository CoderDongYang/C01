import { create } from 'zustand';
import { api } from '@/api/client';
import type { SpaceResponse, SpaceMemberResponse } from '@/types';

interface SpaceState {
  spaces: SpaceResponse[];
  currentSpace: SpaceResponse | null;
  members: SpaceMemberResponse[];
  isLoading: boolean;
  fetchSpaces: () => Promise<void>;
  fetchSpace: (spaceId: string) => Promise<void>;
  createSpace: (name: string, description?: string) => Promise<void>;
  fetchMembers: (spaceId: string) => Promise<void>;
  createInvite: (spaceId: string, maxRole?: string, maxUses?: number) => Promise<string>;
  joinSpace: (token: string) => Promise<void>;
  updateMemberRole: (spaceId: string, userId: string, role: string) => Promise<void>;
  removeMember: (spaceId: string, userId: string) => Promise<void>;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  spaces: [],
  currentSpace: null,
  members: [],
  isLoading: false,

  fetchSpaces: async () => {
    set({ isLoading: true });
    try {
      const spaces = await api.get<SpaceResponse[]>('/api/spaces');
      set({ spaces });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSpace: async (spaceId: string) => {
    set({ isLoading: true });
    try {
      const space = await api.get<SpaceResponse>(`/api/spaces/${spaceId}`);
      set({ currentSpace: space });
    } finally {
      set({ isLoading: false });
    }
  },

  createSpace: async (name: string, description?: string) => {
    const space = await api.post<SpaceResponse>('/api/spaces', { name, description });
    set((state) => ({ spaces: [...state.spaces, space] }));
  },

  fetchMembers: async (spaceId: string) => {
    const members = await api.get<SpaceMemberResponse[]>(`/api/spaces/${spaceId}/members`);
    set({ members });
  },

  createInvite: async (spaceId: string, maxRole?: string, maxUses?: number) => {
    const result = await api.post<{ token: string }>(`/api/spaces/${spaceId}/invite`, {
      maxRole: maxRole || 'member',
      maxUses: maxUses || 0,
    });
    return result.token;
  },

  joinSpace: async (token: string) => {
    await api.post(`/api/spaces/join/${token}`);
  },

  updateMemberRole: async (spaceId: string, userId: string, role: string) => {
    await api.patch(`/api/spaces/${spaceId}/members/${userId}`, { role });
  },

  removeMember: async (spaceId: string, userId: string) => {
    await api.delete(`/api/spaces/${spaceId}/members/${userId}`);
    set((state) => ({
      members: state.members.filter((m) => m.user_id !== userId),
    }));
  },
}));
