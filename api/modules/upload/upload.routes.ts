import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { uploadImage as uploadImageMiddleware } from '../../middleware/upload.js'
import { uploadImage } from './upload.controller.js'

const router = Router()

router.use(authenticate)

router.post('/image', uploadImageMiddleware, uploadImage)

export default router
