import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import type { JwtPayload } from '../../shared/types.js'

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
      socket.data.user = decoded
      next()
    } catch {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user.id}`)

    socket.on('join-document', (docId: string) => {
      socket.join(docId)
      socket.to(docId).emit('user-joined', { userId: socket.data.user.id })
    })

    socket.on('leave-document', (docId: string) => {
      socket.leave(docId)
    })

    socket.on('document-change', (data: { docId: string; changes: unknown }) => {
      socket.to(data.docId).emit('document-change', data.changes)
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.id}`)
    })
  })

  return io
}
