import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service.js'
import { catchAsync, AppError } from '../../middleware/error.js'
import { query } from '../../config/index.js'

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) {
    return next(new AppError('请提供用户名、邮箱和密码', 400))
  }
  const result = await authService.registerUser(username, email, password)
  res.status(201).json({ success: true, data: result })
})

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(new AppError('请提供邮箱和密码', 400))
  }
  const result = await authService.loginUser(email, password)
  res.status(200).json({ success: true, data: result })
})

export const refresh = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return next(new AppError('请提供刷新令牌', 400))
  }
  const tokens = await authService.refreshTokenFn(refreshToken)
  res.status(200).json({ success: true, data: tokens })
})

export const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await query(
    'SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = $1',
    [req.user!.id]
  )
  if (result.rows.length === 0) {
    return next(new AppError('用户不存在', 404))
  }
  res.status(200).json({ success: true, data: result.rows[0] })
})

export const uploadAvatar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('请上传头像文件', 400))
  }
  const avatarUrl = `/uploads/avatars/${req.file.filename}`
  const result = await query(
    'UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, avatar, created_at, updated_at',
    [avatarUrl, req.user!.id]
  )
  res.status(200).json({ success: true, data: result.rows[0] })
})
