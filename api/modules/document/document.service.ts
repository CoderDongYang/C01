import { query, queryReturning, generateId } from '../../config/index.js'
import { AppError } from '../../middleware/error.js'

export const createDocument = async (
  spaceId: string,
  userId: string,
  title: string,
  parentId?: string,
) => {
  const memberResult = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
    [spaceId, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您不是该空间的成员', 403)
  }
  const docId = generateId()
  const emptyDoc = JSON.stringify({ type: 'doc', content: [] })
  queryReturning(
    'INSERT INTO documents (id, space_id, title, content, created_by, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
    [docId, spaceId, title, emptyDoc, userId, parentId || null],
  )
  const result = query('SELECT * FROM documents WHERE id = ?', [docId])
  return result.rows[0]
}

export const getSpaceDocuments = async (spaceId: string, userId: string) => {
  const memberResult = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
    [spaceId, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您不是该空间的成员', 403)
  }
  const result = query(
    'SELECT id, title, parent_id, created_by, created_at, updated_at FROM documents WHERE space_id = ?',
    [spaceId],
  )
  return result.rows
}

export const getDocumentById = async (docId: string, userId: string) => {
  const docResult = query('SELECT * FROM documents WHERE id = ?', [docId])
  if (docResult.rows.length === 0) {
    throw new AppError('文档不存在', 404)
  }
  const document = docResult.rows[0]
  const memberResult = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
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
) => {
  const docResult = query('SELECT * FROM documents WHERE id = ?', [docId])
  if (docResult.rows.length === 0) {
    throw new AppError('文档不存在', 404)
  }
  const document = docResult.rows[0]
  const memberResult = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
    [document.space_id, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您没有权限修改该文档', 403)
  }
  const updates: string[] = []
  const values: unknown[] = []
  if (data.title !== undefined) {
    updates.push('title = ?')
    values.push(data.title)
  }
  if (data.content !== undefined) {
    updates.push('content = ?')
    values.push(JSON.stringify(data.content))
  }
  updates.push("updated_at = datetime('now')")
  values.push(docId)
  query(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`, values)
  const result = query('SELECT * FROM documents WHERE id = ?', [docId])
  return result.rows[0]
}

export const deleteDocument = async (docId: string, userId: string): Promise<void> => {
  const docResult = query('SELECT * FROM documents WHERE id = ?', [docId])
  if (docResult.rows.length === 0) {
    throw new AppError('文档不存在', 404)
  }
  const document = docResult.rows[0]
  const memberResult = query(
    'SELECT sm.role FROM space_members sm JOIN spaces s ON s.id = sm.space_id WHERE sm.space_id = ? AND sm.user_id = ?',
    [document.space_id, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您没有权限删除该文档', 403)
  }
  const role = memberResult.rows[0].role
  if (role !== 'owner' && role !== 'admin' && document.created_by !== userId) {
    throw new AppError('只有空间管理员或文档创建者可以删除文档', 403)
  }
  query('DELETE FROM documents WHERE id = ?', [docId])
}
