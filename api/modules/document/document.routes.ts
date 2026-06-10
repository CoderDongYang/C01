import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentVersions,
  getVersion,
  rollbackToVersion,
} from './document.controller.js'

const router = Router({ mergeParams: true })

router.use(authenticate)

router.post('/', createDocument)
router.get('/', getDocuments)
router.get('/:docId', getDocument)
router.patch('/:docId', updateDocument)
router.delete('/:docId', deleteDocument)

router.get('/:docId/versions', getDocumentVersions)
router.get('/versions/:versionId', getVersion)
router.post('/versions/:versionId/rollback', rollbackToVersion)

export default router
