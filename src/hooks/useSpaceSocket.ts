import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import type { SpaceOnlineUser, ToastNotification } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

interface SpaceSocketState {
  onlineUsers: Map<string, SpaceOnlineUser>;
}

type AddNotificationParam = Omit<ToastNotification, 'id'>;

const spaceConnectionRefs = new Map<string, number>();
let currentConnectedSpace: string | null = null;
let eventHandlersAttached = false;
const globalOnlineUsers = new Map<string, SpaceOnlineUser>();
const stateListeners = new Set<(state: SpaceSocketState) => void>();
let pendingLeaveTimeout: ReturnType<typeof setTimeout> | null = null;
const recentNotifications = new Map<string, number>();

function notifyListeners() {
  const state: SpaceSocketState = {
    onlineUsers: new Map(globalOnlineUsers),
  };
  stateListeners.forEach((listener) => listener(state));
}

function shouldNotify(key: string): boolean {
  const now = Date.now();
  const last = recentNotifications.get(key);
  if (last && now - last < 2000) {
    return false;
  }
  recentNotifications.set(key, now);
  if (recentNotifications.size > 100) {
    const keysToDelete: string[] = [];
    recentNotifications.forEach((v, k) => {
      if (now - v > 5000) keysToDelete.push(k);
    });
    keysToDelete.forEach((k) => recentNotifications.delete(k));
  }
  return true;
}

function cancelPendingLeave() {
  if (pendingLeaveTimeout) {
    clearTimeout(pendingLeaveTimeout);
    pendingLeaveTimeout = null;
  }
}

export function useSpaceSocket(spaceId: string | undefined) {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef(getSocket());
  const lastSpaceIdRef = useRef<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, SpaceOnlineUser>>(new Map(globalOnlineUsers));

  const addNotification = useCallback((notification: AddNotificationParam) => {
    useNotificationStore.getState().addNotification(notification);
  }, []);

  useEffect(() => {
    if (!spaceId || !user?.id) return;

    const socket = socketRef.current;
    const currentUserId = user.id;

    const refCount = spaceConnectionRefs.get(spaceId) || 0;
    spaceConnectionRefs.set(spaceId, refCount + 1);

    const setupEventHandlers = () => {
      if (eventHandlersAttached) return;
      eventHandlersAttached = true;

      socket.on('space-online-users', (users: SpaceOnlineUser[]) => {
        globalOnlineUsers.clear();
        users.forEach((u) => {
          if (u.id !== currentUserId) {
            globalOnlineUsers.set(u.id, u);
          }
        });
        notifyListeners();
      });

      socket.on('space-user-joined', (joinedUser: SpaceOnlineUser) => {
        if (joinedUser.id === currentUserId) return;
        if (globalOnlineUsers.has(joinedUser.id)) return;

        globalOnlineUsers.set(joinedUser.id, joinedUser);
        notifyListeners();

        const notifyKey = `joined:${joinedUser.id}`;
        if (shouldNotify(notifyKey)) {
          addNotification({
            type: 'info',
            title: `${joinedUser.username} 加入了空间`,
            message: '开始协同工作吧',
            duration: 4000,
          });
        }
      });

      socket.on('space-user-left', (leftUser: SpaceOnlineUser) => {
        if (leftUser.id === currentUserId) return;
        const existed = globalOnlineUsers.has(leftUser.id);
        globalOnlineUsers.delete(leftUser.id);
        notifyListeners();

        if (existed) {
          const notifyKey = `left:${leftUser.id}`;
          if (shouldNotify(notifyKey)) {
            addNotification({
              type: 'info',
              title: `${leftUser.username} 离开了空间`,
              message: leftUser.currentDocTitle ? `正在编辑: ${leftUser.currentDocTitle}` : undefined,
              duration: 4000,
            });
          }
        }
      });

      socket.on('space-user-doc-changed', (data: { userId: string; docId: string | null; docTitle: string | null }) => {
        if (data.userId === currentUserId) return;
        const existing = globalOnlineUsers.get(data.userId);
        if (existing) {
          globalOnlineUsers.set(data.userId, {
            ...existing,
            currentDocId: data.docId,
            currentDocTitle: data.docTitle,
            lastActive: Date.now(),
          });
          notifyListeners();
        }
      });
    };

    setupEventHandlers();

    cancelPendingLeave();

    if (currentConnectedSpace !== spaceId) {
      if (currentConnectedSpace) {
        socket.emit('leave-space', currentConnectedSpace);
        const prevRefCount = spaceConnectionRefs.get(currentConnectedSpace) || 0;
        spaceConnectionRefs.set(currentConnectedSpace, Math.max(0, prevRefCount - 1));
      }
      socket.emit('join-space', spaceId);
      currentConnectedSpace = spaceId;
    }

    lastSpaceIdRef.current = spaceId;

    const stateListener = (state: SpaceSocketState) => {
      setOnlineUsers(new Map(state.onlineUsers));
    };
    stateListeners.add(stateListener);
    setOnlineUsers(new Map(globalOnlineUsers));

    return () => {
      stateListeners.delete(stateListener);

      const currentRefCount = spaceConnectionRefs.get(spaceId) || 0;
      const newRefCount = Math.max(0, currentRefCount - 1);
      spaceConnectionRefs.set(spaceId, newRefCount);

      if (newRefCount === 0 && currentConnectedSpace === spaceId) {
        cancelPendingLeave();
        pendingLeaveTimeout = setTimeout(() => {
          const finalRefCount = spaceConnectionRefs.get(spaceId) || 0;
          if (finalRefCount === 0 && currentConnectedSpace === spaceId) {
            socket.emit('leave-space', spaceId);
            currentConnectedSpace = null;
            globalOnlineUsers.clear();
            notifyListeners();
          }
          pendingLeaveTimeout = null;
        }, 300);
      }
    };
  }, [spaceId, user?.id, addNotification]);

  const clearAll = useCallback(() => {
    if (currentConnectedSpace) {
      socketRef.current.emit('leave-space', currentConnectedSpace);
      currentConnectedSpace = null;
    }
    spaceConnectionRefs.clear();
    globalOnlineUsers.clear();
    notifyListeners();
  }, []);

  return {
    onlineUsers,
    clearAll,
  };
}

export function getCurrentConnectedSpace(): string | null {
  return currentConnectedSpace;
}
