import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { getSocket } from '@/lib/socket';
import type { OnlineUser, CursorPosition, DocumentVersion } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface UseCollaborativeEditorOptions {
  docId: string;
  editor: Editor | null;
  title: string;
  onTitleChange: (title: string) => void;
}

interface RemoteCursor {
  userId: string;
  username: string;
  color: string;
  anchor: number;
  head: number;
  avatar?: string | null;
}

export function useCollaborativeEditor({
  docId,
  editor,
  title,
  onTitleChange,
}: UseCollaborativeEditorOptions) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef(getSocket());
  const user = useAuthStore((s) => s.user);
  const isRemoteChangeRef = useRef(false);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const socket = socketRef.current;

    const handleOnlineUsers = (users: OnlineUser[]) => {
      setOnlineUsers(users.filter((u) => u.id !== user?.id));
    };

    const handleUserJoined = (userData: OnlineUser) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u.id === userData.id)) return prev;
        return [...prev, userData];
      });
    };

    const handleUserLeft = (userId: string) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
      setRemoteCursors((prev) => prev.filter((c) => c.userId !== userId));
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleCursorChange = (cursor: CursorPosition & { userId: string }) => {
      if (cursor.userId === user?.id) return;
      setRemoteCursors((prev) => {
        const existing = prev.find((c) => c.userId === cursor.userId);
        const onlineUser = onlineUsers.find((u) => u.id === cursor.userId);
        if (existing) {
          return prev.map((c) =>
            c.userId === cursor.userId
              ? { ...c, anchor: cursor.anchor, head: cursor.head }
              : c
          );
        }
        return [
          ...prev,
          {
            userId: cursor.userId,
            username: onlineUser?.username || '未知用户',
            color: onlineUser?.color || '#888',
            anchor: cursor.anchor,
            head: cursor.head,
            avatar: onlineUser?.avatar,
          },
        ];
      });
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === user?.id) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    };

    const handleDocumentChange = (data: { changes: any; userId: string }) => {
      if (data.userId === user?.id || !editor) return;
      isRemoteChangeRef.current = true;
      try {
        editor.commands.setContent(data.changes, false);
      } finally {
        setTimeout(() => {
          isRemoteChangeRef.current = false;
        }, 0);
      }
    };

    const handleTitleChange = (data: { title: string; userId: string }) => {
      if (data.userId === user?.id) return;
      onTitleChange(data.title);
    };

    socket.on('online-users', handleOnlineUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('cursor-change', handleCursorChange);
    socket.on('typing', handleTyping);
    socket.on('document-change', handleDocumentChange);
    socket.on('title-change', handleTitleChange);

    socket.emit('join-document', docId);

    return () => {
      socket.off('online-users', handleOnlineUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('cursor-change', handleCursorChange);
      socket.off('typing', handleTyping);
      socket.off('document-change', handleDocumentChange);
      socket.off('title-change', handleTitleChange);

      socket.emit('leave-document', docId);
    };
  }, [docId, editor, user?.id, onlineUsers, onTitleChange]);

  const sendCursorUpdate = useCallback(
    (anchor: number, head: number) => {
      if (!docId || !user?.id) return;
      socketRef.current.emit('cursor-change', {
        docId,
        cursor: { anchor, head, userId: user.id },
      });
    },
    [docId, user?.id]
  );

  const sendContentUpdate = useCallback(
    (content: any) => {
      if (!docId || !user?.id || isRemoteChangeRef.current) return;
      socketRef.current.emit('document-change', {
        docId,
        changes: content,
        userId: user.id,
      });
    },
    [docId, user?.id]
  );

  const sendTitleUpdate = useCallback(
    (newTitle: string) => {
      if (!docId || !user?.id) return;
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
      titleTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('title-change', {
          docId,
          title: newTitle,
          userId: user.id,
        });
      }, 200);
    },
    [docId, user?.id]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!docId || !user?.id) return;
      socketRef.current.emit('typing', {
        docId,
        userId: user.id,
        isTyping,
      });
    },
    [docId, user?.id]
  );

  return {
    onlineUsers,
    remoteCursors,
    typingUsers,
    sendCursorUpdate,
    sendContentUpdate,
    sendTitleUpdate,
    sendTyping,
    isRemoteChangeRef,
  };
}
