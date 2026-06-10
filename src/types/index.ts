export type {
  User,
  Space,
  SpaceMember,
  Document,
  InviteLink,
  JwtPayload,
  DocumentVersion,
  OnlineUser,
  CursorPosition,
  TypingUser,
} from '../../shared/types';

export interface SpaceResponse {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  member_count: number;
  document_count: number;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface SpaceMemberResponse {
  user_id: string;
  username: string;
  email: string;
  avatar: string | null;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  online_count?: number;
}

export interface DocumentDetail extends DocumentListItem {
  space_id: string;
  content: any;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorResponse {
  success: boolean;
  error: string;
  message?: string;
}
