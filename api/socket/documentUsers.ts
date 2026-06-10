import type { OnlineUser } from '../../shared/types.js'

interface DocUser extends OnlineUser {
  socketId: string
}

const documentUsers = new Map<string, Map<string, DocUser>>()

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF4500',
]

function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

function getDocUsers(docId: string): Map<string, DocUser> {
  if (!documentUsers.has(docId)) {
    documentUsers.set(docId, new Map())
  }
  return documentUsers.get(docId)!
}

export function addUserToDocument(
  docId: string,
  user: { id: string; username: string; email: string; avatar: string | null },
  socketId: string,
): OnlineUser {
  const docUsers = getDocUsers(docId)
  const docUser: DocUser = {
    ...user,
    color: getUserColor(user.id),
    socketId,
  }
  docUsers.set(user.id, docUser)
  return {
    id: docUser.id,
    username: docUser.username,
    email: docUser.email,
    avatar: docUser.avatar,
    color: docUser.color,
  }
}

export function removeUserFromDocument(docId: string, userId: string): void {
  const docUsers = documentUsers.get(docId)
  if (docUsers) {
    docUsers.delete(userId)
    if (docUsers.size === 0) {
      documentUsers.delete(docId)
    }
  }
}

export function removeUserFromAllDocuments(userId: string): string[] {
  const affectedDocs: string[] = []
  documentUsers.forEach((docUsers, docId) => {
    if (docUsers.has(userId)) {
      docUsers.delete(userId)
      if (docUsers.size === 0) {
        documentUsers.delete(docId)
      }
      affectedDocs.push(docId)
    }
  })
  return affectedDocs
}

export function getOnlineUsers(docId: string): OnlineUser[] {
  const docUsers = documentUsers.get(docId)
  if (!docUsers) return []
  return Array.from(docUsers.values()).map(({ id, username, email, avatar, color }) => ({
    id,
    username,
    email,
    avatar,
    color,
  }))
}

export function getDocumentOnlineCount(docId: string): number {
  return documentUsers.get(docId)?.size || 0
}

export function getSpaceOnlineCount(spaceDocIds: string[]): number {
  let count = 0
  for (const docId of spaceDocIds) {
    count += getDocumentOnlineCount(docId)
  }
  return count
}
