import { v4 as uuidv4 } from 'uuid'
import { query, redisClient } from '../../config/index.js'
import { AppError } from '../../middleware/error.js'
import type { Space, SpaceMember, InviteLink } from '../../../shared/types.js'

const verifyMembership = async (spaceId: string, userId: string) => {
  const result = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [spaceId, userId]
  )
  if (result.rows.length === 0) {
    throw new AppError('您不是该空间的成员', 403)
  }
  return result.rows[0].role
}

const verifyOwnerOrAdmin = async (spaceId: string, userId: string) => {
  const role = await verifyMembership(spaceId, userId)
  if (role !== 'owner' && role !== 'admin') {
    throw new AppError('权限不足，需要拥有者或管理员权限', 403)
  }
  return role
}

const verifyOwner = async (spaceId: string, userId: string) => {
  const role = await verifyMembership(spaceId, userId)
  if (role !== 'owner') {
    throw new AppError('权限不足，需要拥有者权限', 403)
  }
  return role
}

export const createSpace = async (userId: string, name: string, description?: string) => {
  const result = await query(
    'INSERT INTO spaces (name, description, owner_id) VALUES ($1, $2, $3) RETURNING id, name, description, owner_id, created_at, updated_at',
    [name, description || null, userId]
  )
  const space = result.rows[0]
  await query(
    'INSERT INTO space_members (space_id, user_id, role) VALUES ($1, $2, $3)',
    [space.id, userId, 'owner']
  )
  return { ...space, role: 'owner', member_count: 1, document_count: 0 }
}

export const getUserSpaces = async (userId: string) => {
  const result = await query(
    `SELECT s.id, s.name, s.description, s.owner_id, s.created_at, s.updated_at,
      sm.role,
      (SELECT COUNT(*) FROM space_members WHERE space_id = s.id)::int AS member_count,
      (SELECT COUNT(*) FROM documents WHERE space_id = s.id)::int AS document_count
    FROM spaces s
    JOIN space_members sm ON s.id = sm.space_id
    WHERE sm.user_id = $1
    ORDER BY s.created_at DESC`,
    [userId]
  )
  return result.rows
}

export const getSpaceById = async (spaceId: string, userId: string) => {
  const spaceResult = await query('SELECT id FROM spaces WHERE id = $1', [spaceId])
  if (spaceResult.rows.length === 0) {
    throw new AppError('空间不存在', 404)
  }
  const result = await query(
    `SELECT s.id, s.name, s.description, s.owner_id, s.created_at, s.updated_at,
      sm.role,
      (SELECT COUNT(*) FROM space_members WHERE space_id = s.id)::int AS member_count,
      (SELECT COUNT(*) FROM documents WHERE space_id = s.id)::int AS document_count
    FROM spaces s
    JOIN space_members sm ON s.id = sm.space_id
    WHERE s.id = $1 AND sm.user_id = $2`,
    [spaceId, userId]
  )
  if (result.rows.length === 0) {
    throw new AppError('您不是该空间的成员', 403)
  }
  return result.rows[0]
}

export const updateSpace = async (spaceId: string, userId: string, data: { name?: string; description?: string }) => {
  await verifyOwnerOrAdmin(spaceId, userId)
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1
  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (updates.length === 0) {
    throw new AppError('没有需要更新的字段', 400)
  }
  updates.push('updated_at = NOW()')
  values.push(spaceId)
  const result = await query(
    `UPDATE spaces SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, description, owner_id, created_at, updated_at`,
    values
  )
  return result.rows[0]
}

export const deleteSpace = async (spaceId: string, userId: string) => {
  await verifyOwner(spaceId, userId)
  await query('DELETE FROM spaces WHERE id = $1', [spaceId])
}

export const createInviteLink = async (
  spaceId: string,
  userId: string,
  maxRole: string = 'member',
  maxUses: number = 0,
  expiresInHours: number = 24
) => {
  await verifyOwnerOrAdmin(spaceId, userId)
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
  const result = await query(
    'INSERT INTO invite_links (space_id, created_by, token, max_role, max_uses, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [spaceId, userId, token, maxRole, maxUses, expiresAt]
  )
  const inviteData = result.rows[0]
  await redisClient.set(`invite:${token}`, JSON.stringify(inviteData), { EX: 24 * 60 * 60 })
  return { token, expires_at: expiresAt }
}

export const joinSpace = async (token: string, userId: string) => {
  let inviteData: any = null
  const cached = await redisClient.get(`invite:${token}`)
  if (cached) {
    inviteData = JSON.parse(cached)
  } else {
    const result = await query('SELECT * FROM invite_links WHERE token = $1', [token])
    if (result.rows.length === 0) {
      throw new AppError('邀请链接无效', 404)
    }
    inviteData = result.rows[0]
  }
  if (new Date(inviteData.expires_at) < new Date()) {
    throw new AppError('邀请链接已过期', 410)
  }
  if (inviteData.max_uses > 0 && inviteData.use_count >= inviteData.max_uses) {
    throw new AppError('邀请链接已达到最大使用次数', 410)
  }
  const existing = await query(
    'SELECT id FROM space_members WHERE space_id = $1 AND user_id = $2',
    [inviteData.space_id, userId]
  )
  if (existing.rows.length > 0) {
    throw new AppError('您已是该空间成员', 409)
  }
  const role = inviteData.max_role || 'member'
  await query(
    'INSERT INTO space_members (space_id, user_id, role) VALUES ($1, $2, $3)',
    [inviteData.space_id, userId, role]
  )
  await query(
    'UPDATE invite_links SET use_count = use_count + 1 WHERE token = $1',
    [token]
  )
  return { space_id: inviteData.space_id, role }
}

export const getSpaceMembers = async (spaceId: string, userId: string) => {
  await verifyMembership(spaceId, userId)
  const result = await query(
    `SELECT sm.user_id, sm.role, sm.joined_at,
      u.username, u.email, u.avatar
    FROM space_members sm
    JOIN users u ON sm.user_id = u.id
    WHERE sm.space_id = $1
    ORDER BY sm.joined_at ASC`,
    [spaceId]
  )
  return result.rows
}

export const updateMemberRole = async (
  spaceId: string,
  targetUserId: string,
  operatorUserId: string,
  newRole: string
) => {
  await verifyOwnerOrAdmin(spaceId, operatorUserId)
  const targetResult = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [spaceId, targetUserId]
  )
  if (targetResult.rows.length === 0) {
    throw new AppError('该用户不是空间成员', 404)
  }
  if (targetResult.rows[0].role === 'owner') {
    throw new AppError('无法更改拥有者的角色', 403)
  }
  await query(
    'UPDATE space_members SET role = $1 WHERE space_id = $2 AND user_id = $3',
    [newRole, spaceId, targetUserId]
  )
  const result = await query(
    `SELECT sm.user_id, sm.role, sm.joined_at,
      u.username, u.email, u.avatar
    FROM space_members sm
    JOIN users u ON sm.user_id = u.id
    WHERE sm.space_id = $1 AND sm.user_id = $2`,
    [spaceId, targetUserId]
  )
  return result.rows[0]
}

export const removeMember = async (
  spaceId: string,
  targetUserId: string,
  operatorUserId: string
) => {
  await verifyOwnerOrAdmin(spaceId, operatorUserId)
  const targetResult = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [spaceId, targetUserId]
  )
  if (targetResult.rows.length === 0) {
    throw new AppError('该用户不是空间成员', 404)
  }
  if (targetResult.rows[0].role === 'owner') {
    throw new AppError('无法移除空间拥有者', 403)
  }
  await query(
    'DELETE FROM space_members WHERE space_id = $1 AND user_id = $2',
    [spaceId, targetUserId]
  )
}
