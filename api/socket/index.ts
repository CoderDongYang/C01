import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { query } from '../config/index.js'
import type { JwtPayload, OnlineUser, CursorPosition } from '../../shared/types.js'
import {
  addUserToDocument,
  removeUserFromDocument,
  removeUserFromAllDocuments,
  getOnlineUsers,
  getDocumentOnlineCount,
} from './documentUsers.js'

export const setupSocketIO = (server: import('http').Server) => {
  const io = new Server(server, {
    cors: { origin: '*' },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error'))
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret!) as JwtPayload
      const userResult = query(
        'SELECT id, username, email, avatar FROM users WHERE id = ?',
        [decoded.id],
      )
      if (userResult.rows.length === 0) {
        return next(new Error('User not found'))
      }
      socket.data.user = userResult.rows[0]
      next()
    } catch {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: string; username: string; email: string; avatar: string | null }
    console.log(`User connected: ${user.id}`)

    socket.on('join-document', (docId: string) => {
      socket.join(docId)
      const onlineUser = addUserToDocument(docId, user, socket.id)
      socket.to(docId).emit('user-joined', onlineUser)
      socket.emit('online-users', getOnlineUsers(docId))
    })

    socket.on('leave-document', (docId: string) => {
      socket.leave(docId)
      removeUserFromDocument(docId, user.id)
      socket.to(docId).emit('user-left', user.id)
    })

    socket.on('document-change', (data: { docId: string; changes: unknown; userId: string }) => {
      socket.to(data.docId).emit('document-change', {
        changes: data.changes,
        userId: data.userId,
      })
    })

    socket.on('cursor-change', (data: { docId: string; cursor: CursorPosition }) => {
      socket.to(data.docId).emit('cursor-change', {
        ...data.cursor,
        userId: user.id,
      })
    })

    socket.on('typing', (data: { docId: string; userId: string; isTyping: boolean }) => {
      socket.to(data.docId).emit('typing', {
        userId: user.id,
        isTyping: data.isTyping,
      })
    })

    socket.on('title-change', (data: { docId: string; title: string; userId: string }) => {
      socket.to(data.docId).emit('title-change', {
        title: data.title,
        userId: user.id,
      })
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`)
      const affectedDocs = removeUserFromAllDocuments(user.id)
      affectedDocs.forEach((docId) => {
        socket.to(docId).emit('user-left', user.id)
      })
    })
  })

  return io
}

export { getDocumentOnlineCount }
