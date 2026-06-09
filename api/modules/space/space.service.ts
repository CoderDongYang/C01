import { query, queryReturning, redisClient, generateId } from '../../config/index.js'
import { AppError } from '../../middleware/error.js'

const verifyMembership = async (spaceId: string, userId: string) => {
  const result = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
    [spaceId, userId]
  )
  if (result.rows.length === 0) {
    throw new AppError('您不是该空间的成员', 403)
  }
  return result.rows[0].role as string
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
  const spaceId = generateId()
  queryReturning(
    'INSERT INTO spaces (id, name, description, owner_id) VALUES (?, ?, ?, ?)',
    [spaceId, name, description || null, userId]
  )
  query(
    'INSERT INTO space_members (id, space_id, user_id, role) VALUES (?, ?, ?, ?)',
    [generateId(), spaceId, userId, 'owner']
  )
  return { id: spaceId, name, description: description || null, owner_id: userId, role: 'owner', member_count: 1, document_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
}

export const getUserSpaces = async (userId: string) => {
  const result = query(
    `SELECT s.id, s.name, s.description, s.owner_id, s.created_at, s.updated_at,
      sm.role
    FROM spaces s
    JOIN space_members sm ON s.id = sm.space_id
    WHERE sm.user_id = ?
    ORDER BY s.created_at DESC`,
    [userId]
  )
  return result.rows.map((space: any) => {
    const memberCount = query('SELECT COUNT(*) as cnt FROM space_members WHERE space_id = ?', [space.id])
    const docCount = query('SELECT COUNT(*) as cnt FROM documents WHERE space_id = ?', [space.id])
    return {
      ...space,
      member_count: (memberCount.rows[0] as any).cnt,
      document_count: (docCount.rows[0] as any).cnt,
    }
  })
}

export const getSpaceById = async (spaceId: string, userId: string) => {
  const spaceResult = query('SELECT id FROM spaces WHERE id = ?', [spaceId])
  if (spaceResult.rows.length === 0) {
    throw new AppError('空间不存在', 404)
  }
  const result = query(
    `SELECT s.id, s.name, s.description, s.owner_id, s.created_at, s.updated_at,
      sm.role
    FROM spaces s
    JOIN space_members sm ON s.id = sm.space_id
    WHERE s.id = ? AND sm.user_id = ?`,
    [spaceId, userId]
  )
  if (result.rows.length === 0) {
    throw new AppError('您不是该空间的成员', 403)
  }
  const space = result.rows[0] as any
  const memberCount = query('SELECT COUNT(*) as cnt FROM space_members WHERE space_id = ?', [spaceId])
  const docCount = query('SELECT COUNT(*) as cnt FROM documents WHERE space_id = ?', [spaceId])
  return {
    ...space,
    member_count: (memberCount.rows[0] as any).cnt,
    document_count: (docCount.rows[0] as any).cnt,
  }
}

export const updateSpace = async (spaceId: string, userId: string, data: { name?: string; description?: string }) => {
  await verifyOwnerOrAdmin(spaceId, userId)
  const updates: string[] = []
  const values: unknown[] = []
  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }
  if (updates.length === 0) {
    throw new AppError('没有需要更新的字段', 400)
  }
  updates.push("updated_at = datetime('now')")
  values.push(spaceId)
  query(`UPDATE spaces SET ${updates.join(', ')} WHERE id = ?`, values)
  const result = query('SELECT id, name, description, owner_id, created_at, updated_at FROM spaces WHERE id = ?', [spaceId])
  return result.rows[0]
}

export const deleteSpace = async (spaceId: string, userId: string) => {
  await verifyOwner(spaceId, userId)
  query('DELETE FROM spaces WHERE id = ?', [spaceId])
}

export const createInviteLink = async (
  spaceId: string,
  userId: string,
  maxRole: string = 'member',
  maxUses: number = 0,
  expiresInHours: number = 24
) => {
  await verifyOwnerOrAdmin(spaceId, userId)
  const token = generateId()
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
  queryReturning(
    'INSERT INTO invite_links (id, space_id, created_by, token, max_role, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [generateId(), spaceId, userId, token, maxRole, maxUses, expiresAt]
  )
  const inviteData = { space_id: spaceId, created_by: userId, token, max_role: maxRole, max_uses: maxUses, expires_at: expiresAt }
  await redisClient.set(`invite:${token}`, JSON.stringify(inviteData), { EX: 24 * 60 * 60 })
  return { token, expires_at: expiresAt }
}

export const joinSpace = async (token: string, userId: string) => {
  let inviteData: any = null
  const cached = await redisClient.get(`invite:${token}`)
  if (cached) {
    inviteData = JSON.parse(cached)
  } else {
    const result = query('SELECT * FROM invite_links WHERE token = ?', [token])
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
  const existing = query(
    'SELECT id FROM space_members WHERE space_id = ? AND user_id = ?',
    [inviteData.space_id, userId]
  )
  if (existing.rows.length > 0) {
    throw new AppError('您已是该空间成员', 409)
  }
  const role = inviteData.max_role || 'member'
  query(
    'INSERT INTO space_members (id, space_id, user_id, role) VALUES (?, ?, ?, ?)',
    [generateId(), inviteData.space_id, userId, role]
  )
  query(
    'UPDATE invite_links SET use_count = use_count + 1 WHERE token = ?',
    [token]
  )
  return { space_id: inviteData.space_id, role }
}

export const getSpaceMembers = async (spaceId: string, userId: string) => {
  await verifyMembership(spaceId, userId)
  const result = query(
    `SELECT sm.user_id, sm.role, sm.joined_at,
      u.username, u.email, u.avatar
    FROM space_members sm
    JOIN users u ON sm.user_id = u.id
    WHERE sm.space_id = ?
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
  const targetResult = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
    [spaceId, targetUserId]
  )
  if (targetResult.rows.length === 0) {
    throw new AppError('该用户不是空间成员', 404)
  }
  if (targetResult.rows[0].role === 'owner') {
    throw new AppError('无法更改拥有者的角色', 403)
  }
  query(
    'UPDATE space_members SET role = ? WHERE space_id = ? AND user_id = ?',
    [newRole, spaceId, targetUserId]
  )
  const result = query(
    `SELECT sm.user_id, sm.role, sm.joined_at,
      u.username, u.email, u.avatar
    FROM space_members sm
    JOIN users u ON sm.user_id = u.id
    WHERE sm.space_id = ? AND sm.user_id = ?`,
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
  const targetResult = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
    [spaceId, targetUserId]
  )
  if (targetResult.rows.length === 0) {
    throw new AppError('该用户不是空间成员', 404)
  }
  if (targetResult.rows[0].role === 'owner') {
    throw new AppError('无法移除空间拥有者', 403)
  }
  query(
    'DELETE FROM space_members WHERE space_id = ? AND user_id = ?',
    [spaceId, targetUserId]
  )
}
