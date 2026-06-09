import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query, config } from '../../config/index.js'
import { generateTokens } from '../../middleware/auth.js'
import { AppError } from '../../middleware/error.js'

export const registerUser = async (username: string, email: string, password: string) => {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    throw new AppError('该邮箱已被注册', 409)
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const result = await query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar, created_at, updated_at',
    [username, email, passwordHash]
  )
  const user = result.rows[0]
  const tokens = generateTokens({ id: user.id, email: user.email, username: user.username })
  return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
}

export const loginUser = async (email: string, password: string) => {
  const result = await query(
    'SELECT id, username, email, avatar, password_hash FROM users WHERE email = $1',
    [email]
  )
  if (result.rows.length === 0) {
    throw new AppError('邮箱或密码错误', 401)
  }
  const user = result.rows[0]
  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    throw new AppError('邮箱或密码错误', 401)
  }
  const tokens = generateTokens({ id: user.id, email: user.email, username: user.username })
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
  const result = await query('SELECT id, email, username FROM users WHERE id = $1', [payload.id])
  if (result.rows.length === 0) {
    throw new AppError('用户不存在', 401)
  }
  const user = result.rows[0]
  return generateTokens({ id: user.id, email: user.email, username: user.username })
}
