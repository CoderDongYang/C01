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
