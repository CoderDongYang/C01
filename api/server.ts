import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'
import { initDatabase } from './config/index.js'
import { setupSocketIO } from './socket/index.js'

const PORT = process.env.PORT || 3001

async function start() {
  try {
    await initDatabase()
    console.log('Database initialized')

    const server = app.listen(PORT, () => {
      console.log(`Server ready on port ${PORT}`)
    })

    setupSocketIO(server)

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      console.log('SIGINT signal received')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
