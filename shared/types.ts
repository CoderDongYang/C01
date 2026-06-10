export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Document {
  id: string;
  space_id: string;
  parent_id: string | null;
  title: string;
  content: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InviteLink {
  id: string;
  space_id: string;
  created_by: string;
  token: string;
  max_role: 'admin' | 'member';
  max_uses: number;
  use_count: number;
  expires_at: string;
  created_at: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  title: string;
  content: string;
  created_by: string;
  created_by_name?: string;
  created_by_avatar?: string | null;
  created_at: string;
  version_number: number;
}

export interface OnlineUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  color: string;
}

export interface CursorPosition {
  userId: string;
  anchor: number;
  head: number;
  title?: boolean;
}

export interface TypingUser {
  userId: string;
  isTyping: boolean;
}

export interface SocketEvents {
  'join-document': (docId: string) => void;
  'leave-document': (docId: string) => void;
  'document-change': (data: { docId: string; changes: unknown; userId: string }) => void;
  'cursor-change': (data: { docId: string; cursor: CursorPosition }) => void;
  'typing': (data: { docId: string; userId: string; isTyping: boolean }) => void;
  'title-change': (data: { docId: string; title: string; userId: string }) => void;
  'online-users': (users: OnlineUser[]) => void;
  'user-joined': (user: OnlineUser) => void;
  'user-left': (userId: string) => void;
  'version-saved': (version: DocumentVersion) => void;
}
