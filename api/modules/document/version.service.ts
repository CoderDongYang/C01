import { query, queryReturning, generateId } from '../../config/index.js'
import { AppError } from '../../middleware/error.js'

const MAX_VERSIONS = 10

export const saveVersion = async (
  documentId: string,
  title: string,
  content: string,
  userId: string,
) => {
  const countResult = query(
    'SELECT COUNT(*) as count FROM document_versions WHERE document_id = ?',
    [documentId],
  )
  const versionCount = (countResult.rows[0]?.count as number) || 0
  const versionNumber = versionCount + 1

  const versionId = generateId()
  queryReturning(
    'INSERT INTO document_versions (id, document_id, title, content, created_by, version_number) VALUES (?, ?, ?, ?, ?, ?)',
    [versionId, documentId, title, content, userId, versionNumber],
  )

  if (versionCount >= MAX_VERSIONS) {
    query(
      'DELETE FROM document_versions WHERE document_id = ? AND id IN (SELECT id FROM document_versions WHERE document_id = ? ORDER BY created_at ASC LIMIT 1)',
      [documentId, documentId],
    )
  }

  const result = query('SELECT * FROM document_versions WHERE id = ?', [versionId])
  return result.rows[0]
}

export const getDocumentVersions = async (docId: string, userId: string) => {
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

  const result = query(
    `SELECT dv.*, u.username as created_by_name, u.avatar as created_by_avatar
     FROM document_versions dv
     LEFT JOIN users u ON dv.created_by = u.id
     WHERE dv.document_id = ?
     ORDER BY dv.created_at DESC
     LIMIT ?`,
    [docId, MAX_VERSIONS],
  )

  return result.rows
}

export const getVersionById = async (versionId: string, userId: string) => {
  const result = query(
    `SELECT dv.*, d.space_id
     FROM document_versions dv
     JOIN documents d ON dv.document_id = d.id
     WHERE dv.id = ?`,
    [versionId],
  )

  if (result.rows.length === 0) {
    throw new AppError('版本不存在', 404)
  }

  const version = result.rows[0]
  const memberResult = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
    [version.space_id, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您没有权限访问该版本', 403)
  }

  return version
}

export const rollbackToVersion = async (versionId: string, userId: string) => {
  const version = await getVersionById(versionId, userId)

  const docResult = query('SELECT * FROM documents WHERE id = ?', [version.document_id])
  if (docResult.rows.length === 0) {
    throw new AppError('文档不存在', 404)
  }
  const document = docResult.rows[0]

  const memberResult = query(
    'SELECT role FROM space_members WHERE space_id = ? AND user_id = ?',
    [document.space_id, userId],
  )
  if (memberResult.rows.length === 0) {
    throw new AppError('您没有权限回滚该文档', 403)
  }

  await saveVersion(
    document.id as string,
    document.title as string,
    document.content as string,
    userId,
  )

  query(
    'UPDATE documents SET title = ?, content = ?, updated_at = datetime(?) WHERE id = ?',
    [version.title, version.content, 'now', version.document_id],
  )

  const updatedDoc = query('SELECT * FROM documents WHERE id = ?', [version.document_id])
  return updatedDoc.rows[0]
}
