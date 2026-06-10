import { create } from 'zustand';
import { api } from '@/api/client';
import type { DocumentListItem, DocumentDetail } from '@/types';

interface DocumentState {
  documents: DocumentListItem[];
  currentDocument: DocumentDetail | null;
  currentSpaceId: string | null;
  isLoading: boolean;
  fetchDocuments: (spaceId: string) => Promise<void>;
  fetchDocument: (docId: string) => Promise<void>;
  createDocument: (spaceId: string, title: string, parentId?: string) => Promise<DocumentDetail>;
  updateDocument: (docId: string, data: { title?: string; content?: any }) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  setCurrentSpaceId: (spaceId: string) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocument: null,
  currentSpaceId: null,
  isLoading: false,

  fetchDocuments: async (spaceId: string) => {
    set({ isLoading: true, currentSpaceId: spaceId });
    try {
      const documents = await api.get<DocumentListItem[]>(`/api/spaces/${spaceId}/documents`);
      set({ documents });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDocument: async (docId: string) => {
    set({ isLoading: true });
    try {
      const { currentSpaceId } = get();
      const document = await api.get<DocumentDetail>(
        `/api/spaces/${currentSpaceId}/documents/${docId}`
      );
      set({ currentDocument: document });
    } finally {
      set({ isLoading: false });
    }
  },

  createDocument: async (spaceId: string, title: string, parentId?: string) => {
    const document = await api.post<DocumentDetail>(`/api/spaces/${spaceId}/documents`, {
      title,
      parent_id: parentId,
    });
    set((state) => ({
      documents: [...state.documents, document],
      currentSpaceId: spaceId,
    }));
    return document;
  },

  updateDocument: async (docId: string, data: { title?: string; content?: any }) => {
    const { currentSpaceId } = get();
    await api.patch(`/api/spaces/${currentSpaceId}/documents/${docId}`, data);
    if (get().currentDocument?.id === docId && data.title !== undefined) {
      set((state) => ({
        currentDocument: state.currentDocument
          ? { ...state.currentDocument, title: data.title }
          : null,
      }));
    }
  },

  deleteDocument: async (docId: string) => {
    const { currentSpaceId } = get();
    await api.delete(`/api/spaces/${currentSpaceId}/documents/${docId}`);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== docId),
      currentDocument: state.currentDocument?.id === docId ? null : state.currentDocument,
    }));
  },

  setCurrentSpaceId: (spaceId: string) => {
    set({ currentSpaceId: spaceId });
  },
}));
