import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { query, queryReturning, config } from '../../config/index.js'
import { generateTokens } from '../../middleware/auth.js'
import { AppError } from '../../middleware/error.js'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export const validatePassword = (password: string): boolean => {
  return PASSWORD_REGEX.test(password)
}

export const registerUser = async (username: string, email: string, password: string) => {
  const existing = query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    throw new AppError('该邮箱已被注册', 409)
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const result = queryReturning(
    'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
    [crypto.randomUUID(), username, email, passwordHash]
  )
  const user = result.rows[0]
  const { password_hash, ...userWithoutPassword } = user
  const tokens = generateTokens({ id: user.id as string, email: user.email as string, username: user.username as string })
  return { user: userWithoutPassword, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
}

export const loginUser = async (email: string, password: string) => {
  const result = query(
    'SELECT id, username, email, avatar, password_hash FROM users WHERE email = ?',
    [email]
  )
  if (result.rows.length === 0) {
    throw new AppError('邮箱或密码错误', 401)
  }
  const user = result.rows[0]
  const isMatch = await bcrypt.compare(password, user.password_hash as string)
  if (!isMatch) {
    throw new AppError('邮箱或密码错误', 401)
  }
  const tokens = generateTokens({ id: user.id as string, email: user.email as string, username: user.username as string })
  const { password_hash, ...userWithoutPassword } = user
  return { user: userWithoutPassword, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
}

export const refreshTokenFn = async (token: string) => {
  let payload: any
  try {
    payload = jwt.verify(token, config.jwt.refreshSecret!)
  } catch {
    throw new AppError('无效的刷新令牌', 401)
  }
  const result = query('SELECT id, email, username FROM users WHERE id = ?', [payload.id])
  if (result.rows.length === 0) {
    throw new AppError('用户不存在', 401)
  }
  const user = result.rows[0]
  return generateTokens({ id: user.id as string, email: user.email as string, username: user.username as string })
}

export const createResetToken = async (email: string) => {
  const result = query('SELECT id, username FROM users WHERE email = ?', [email])
  if (result.rows.length === 0) {
    throw new AppError('该邮箱未注册', 404)
  }
  const user = result.rows[0]
  const resetToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  query(
    'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [crypto.randomUUID(), user.id, resetToken, expiresAt]
  )
  return { resetToken, email }
}

export const resetPassword = async (token: string, newPassword: string) => {
  const result = query(
    'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?',
    [token]
  )
  if (result.rows.length === 0) {
    throw new AppError('无效的重置令牌', 400)
  }
  const resetRecord = result.rows[0]
  if (resetRecord.used_at) {
    throw new AppError('该重置令牌已使用', 400)
  }
  if (new Date(resetRecord.expires_at as string) < new Date()) {
    throw new AppError('重置令牌已过期', 400)
  }
  if (!validatePassword(newPassword)) {
    throw new AppError('密码需至少8位，包含大小写字母、数字和特殊字符', 400)
  }
  const passwordHash = await bcrypt.hash(newPassword, 10)
  query('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?', [
    passwordHash,
    resetRecord.user_id,
  ])
  query('UPDATE password_reset_tokens SET used_at = datetime(\'now\') WHERE id = ?', [resetRecord.id])
}
