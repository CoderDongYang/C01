import { Request, Response, NextFunction } from 'express'
import * as spaceService from './space.service.js'
import { catchAsync, AppError } from '../../middleware/error.js'

export const createSpace = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, description } = req.body
  if (!name) {
    return next(new AppError('请提供空间名称', 400))
  }
  const result = await spaceService.createSpace(req.user!.id, name, description)
  res.status(201).json({ success: true, data: result })
})

export const getSpaces = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await spaceService.getUserSpaces(req.user!.id)
  res.status(200).json({ success: true, data: result })
})

export const getSpace = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { spaceId } = req.params
  const result = await spaceService.getSpaceById(spaceId, req.user!.id)
  res.status(200).json({ success: true, data: result })
})

export const updateSpace = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { spaceId } = req.params
  const { name, description } = req.body
  const result = await spaceService.updateSpace(spaceId, req.user!.id, { name, description })
  res.status(200).json({ success: true, data: result })
})

export const deleteSpace = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { spaceId } = req.params
  await spaceService.deleteSpace(spaceId, req.user!.id)
  res.status(200).json({ success: true, message: '空间已删除' })
})

export const createInvite = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { spaceId } = req.params
  const { maxRole = 'member', maxUses = 0, expiresInHours = 24 } = req.body
  const result = await spaceService.createInviteLink(spaceId, req.user!.id, maxRole, maxUses, expiresInHours)
  res.status(201).json({ success: true, data: result })
})

export const joinSpace = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params
  const result = await spaceService.joinSpace(token, req.user!.id)
  res.status(200).json({ success: true, data: result })
})

export const getMembers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { spaceId } = req.params
  const result = await spaceService.getSpaceMembers(spaceId, req.user!.id)
  res.status(200).json({ success: true, data: result })
})

export const updateMemberRole = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { spaceId, userId } = req.params
  const { role } = req.body
  if (!role) {
    return next(new AppError('请提供新的角色', 400))
  }
  const result = await spaceService.updateMemberRole(spaceId, userId, req.user!.id, role)
  res.status(200).json({ success: true, data: result })
})

export const removeMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { spaceId, userId } = req.params
  await spaceService.removeMember(spaceId, userId, req.user!.id)
  res.status(200).json({ success: true, message: '成员已移除' })
})
