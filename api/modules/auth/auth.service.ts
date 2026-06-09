import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
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
