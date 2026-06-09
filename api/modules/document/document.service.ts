import { query } from '../../config/index.js'
import { AppError } from '../../middleware/error.js'
import type { Document } from '../../../shared/types.js'

export const createDocument = async (
  spaceId: string,
  userId: string,
  title: string,
  parentId?: string,
): Promise<Document> => {
  const memberResult = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [spaceId, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您不是该空间的成员', 403)
  }
  const result = await query(
    'INSERT INTO documents (space_id, title, content, created_by, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [spaceId, title, '{}', userId, parentId || null],
  )
  return result.rows[0]
}

export const getSpaceDocuments = async (spaceId: string, userId: string) => {
  const memberResult = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [spaceId, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您不是该空间的成员', 403)
  }
  const result = await query(
    'SELECT id, title, parent_id, created_by, updated_at FROM documents WHERE space_id = $1',
    [spaceId],
  )
  return result.rows
}

export const getDocumentById = async (docId: string, userId: string): Promise<Document> => {
  const docResult = await query('SELECT * FROM documents WHERE id = $1', [docId])
  if (docResult.rows.length === 0) {
    throw new AppError('文档不存在', 404)
  }
  const document = docResult.rows[0]
  const memberResult = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [document.space_id, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您没有权限访问该文档', 403)
  }
  return document
}

export const updateDocument = async (
  docId: string,
  userId: string,
  data: { title?: string; content?: unknown },
): Promise<Document> => {
  const docResult = await query('SELECT * FROM documents WHERE id = $1', [docId])
  if (docResult.rows.length === 0) {
    throw new AppError('文档不存在', 404)
  }
  const document = docResult.rows[0]
  const memberResult = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [document.space_id, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您没有权限修改该文档', 403)
  }
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1
  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }
  if (data.content !== undefined) {
    updates.push(`content = $${paramIndex++}::jsonb`)
    values.push(JSON.stringify(data.content))
  }
  updates.push('updated_at = NOW()')
  values.push(docId)
  const result = await query(
    `UPDATE documents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  return result.rows[0]
}

export const deleteDocument = async (docId: string, userId: string): Promise<void> => {
  const docResult = await query('SELECT * FROM documents WHERE id = $1', [docId])
  if (docResult.rows.length === 0) {
    throw new AppError('文档不存在', 404)
  }
  const document = docResult.rows[0]
  const memberResult = await query(
    'SELECT sm.role FROM space_members sm JOIN spaces s ON s.id = sm.space_id WHERE sm.space_id = $1 AND sm.user_id = $2',
    [document.space_id, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您没有权限删除该文档', 403)
  }
  const role = memberResult.rows[0].role
  if (role !== 'owner' && role !== 'admin' && document.created_by !== userId) {
    throw new AppError('只有空间管理员或文档创建者可以删除文档', 403)
  }
  await query('DELETE FROM documents WHERE id = $1', [docId])
}
