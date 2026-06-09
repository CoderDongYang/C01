import { Router } from 'express'
import {
  createSpace,
  getSpaces,
  getSpace,
  updateSpace,
  deleteSpace,
  createInvite,
  joinSpace,
  getMembers,
  updateMemberRole,
  removeMember
} from './space.controller.js'
import { authenticate } from '../../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.post('/', createSpace)
router.get('/', getSpaces)
router.get('/:spaceId', getSpace)
router.patch('/:spaceId', updateSpace)
router.delete('/:spaceId', deleteSpace)
router.post('/:spaceId/invite', createInvite)
router.post('/join/:token', joinSpace)
router.get('/:spaceId/members', getMembers)
router.patch('/:spaceId/members/:userId', updateMemberRole)
router.delete('/:spaceId/members/:userId', removeMember)

export default router
