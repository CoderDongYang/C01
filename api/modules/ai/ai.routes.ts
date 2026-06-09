import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { chat } from './ai.controller.js'

const router = Router()

router.use(authenticate)

router.post('/chat', chat)

export default router
