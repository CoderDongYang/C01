import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} from './document.controller.js'

const router = Router()

router.use(authenticate)

router.post('/', createDocument)
router.get('/', getDocuments)
router.get('/:docId', getDocument)
router.patch('/:docId', updateDocument)
router.delete('/:docId', deleteDocument)

export default router
