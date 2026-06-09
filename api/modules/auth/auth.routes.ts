import { Router } from 'express'
import { register, login, refresh, getMe, uploadAvatar, forgotPassword, resetPassword } from './auth.controller.js'
import { authenticate } from '../../middleware/auth.js'
import { uploadAvatar as uploadAvatarMiddleware } from '../../middleware/upload.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', authenticate, getMe)
router.post('/avatar', authenticate, uploadAvatarMiddleware, uploadAvatar)

export default router
