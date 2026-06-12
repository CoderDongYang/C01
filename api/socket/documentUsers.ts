import type { OnlineUser, SpaceOnlineUser } from '../../shared/types.js'

interface DocUser extends OnlineUser {
  socketId: string
}

interface SpaceUser {
  id: string
  username: string
  email: string
  avatar: string | null
  color: string
  socketId: string
  currentDocId: string | null
  currentDocTitle: string | null
  lastActive: number
}

const documentUsers = new Map<string, Map<string, DocUser>>()
const spaceUsers = new Map<string, Map<string, SpaceUser>>()
const userSpaces = new Map<string, Set<string>>()
const userDocs = new Map<string, string>()

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

function getSpaceUsers(spaceId: string): Map<string, SpaceUser> {
  if (!spaceUsers.has(spaceId)) {
    spaceUsers.set(spaceId, new Map())
  }
  return spaceUsers.get(spaceId)!
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
  userDocs.set(user.id, docId)
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
  const currentDoc = userDocs.get(userId)
  if (currentDoc === docId) {
    userDocs.delete(userId)
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
  userDocs.delete(userId)
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

export function addUserToSpace(
  spaceId: string,
  user: { id: string; username: string; email: string; avatar: string | null },
  socketId: string,
): SpaceOnlineUser {
  const spaceUsersMap = getSpaceUsers(spaceId)
  const existingUser = spaceUsersMap.get(user.id)
  const currentDocId = userDocs.get(user.id) || null
  
  const spaceUser: SpaceUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    color: getUserColor(user.id),
    socketId,
    currentDocId,
    currentDocTitle: existingUser?.currentDocTitle || null,
    lastActive: Date.now(),
  }
  spaceUsersMap.set(user.id, spaceUser)
  
  if (!userSpaces.has(user.id)) {
    userSpaces.set(user.id, new Set())
  }
  userSpaces.get(user.id)!.add(spaceId)
  
  return {
    id: spaceUser.id,
    username: spaceUser.username,
    email: spaceUser.email,
    avatar: spaceUser.avatar,
    color: spaceUser.color,
    currentDocId: spaceUser.currentDocId,
    currentDocTitle: spaceUser.currentDocTitle,
    lastActive: spaceUser.lastActive,
  }
}

export function updateUserSpaceDoc(
  spaceId: string,
  userId: string,
  docId: string | null,
  docTitle: string | null,
): void {
  const spaceUsersMap = spaceUsers.get(spaceId)
  if (spaceUsersMap) {
    const user = spaceUsersMap.get(userId)
    if (user) {
      user.currentDocId = docId
      user.currentDocTitle = docTitle
      user.lastActive = Date.now()
    }
  }
}

export function updateUserDocTitle(
  docId: string,
  docTitle: string,
): void {
  spaceUsers.forEach((spaceUsersMap) => {
    spaceUsersMap.forEach((user) => {
      if (user.currentDocId === docId) {
        user.currentDocTitle = docTitle
      }
    })
  })
}

export function removeUserFromSpace(spaceId: string, userId: string): SpaceOnlineUser | null {
  const spaceUsersMap = spaceUsers.get(spaceId)
  if (!spaceUsersMap) return null
  const user = spaceUsersMap.get(userId)
  if (!user) return null
  
  spaceUsersMap.delete(userId)
  if (spaceUsersMap.size === 0) {
    spaceUsers.delete(spaceId)
  }
  
  const userSpaceSet = userSpaces.get(userId)
  if (userSpaceSet) {
    userSpaceSet.delete(spaceId)
    if (userSpaceSet.size === 0) {
      userSpaces.delete(userId)
    }
  }
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    color: user.color,
    currentDocId: user.currentDocId,
    currentDocTitle: user.currentDocTitle,
    lastActive: user.lastActive,
  }
}

export function removeUserFromAllSpaces(userId: string): string[] {
  const affectedSpaces: string[] = []
  const spaceIds = userSpaces.get(userId)
  if (spaceIds) {
    spaceIds.forEach((spaceId) => {
      affectedSpaces.push(spaceId)
    })
  }
  affectedSpaces.forEach((spaceId) => {
    removeUserFromSpace(spaceId, userId)
  })
  return affectedSpaces
}

export function getSpaceOnlineUsers(spaceId: string): SpaceOnlineUser[] {
  const spaceUsersMap = spaceUsers.get(spaceId)
  if (!spaceUsersMap) return []
  return Array.from(spaceUsersMap.values()).map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    color: user.color,
    currentDocId: user.currentDocId,
    currentDocTitle: user.currentDocTitle,
    lastActive: user.lastActive,
  }))
}

export function getUserSpaceIds(userId: string): string[] {
  const spaceSet = userSpaces.get(userId)
  return spaceSet ? Array.from(spaceSet) : []
}

export function getUserCurrentDoc(userId: string): string | null {
  return userDocs.get(userId) || null
}
