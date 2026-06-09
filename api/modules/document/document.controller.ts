import type { Request, Response, NextFunction } from 'express'
import { catchAsync } from '../../middleware/error.js'
import * as documentService from './document.service.js'

export const createDocument = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { spaceId } = req.params
    const { title, parent_id } = req.body
    const userId = req.user!.id
    const document = await documentService.createDocument(
      spaceId,
      userId,
      title,
      parent_id,
    )
    res.status(201).json({ success: true, data: document })
  },
)

export const getDocuments = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { spaceId } = req.params
    const userId = req.user!.id
    const documents = await documentService.getSpaceDocuments(spaceId, userId)
    res.status(200).json({ success: true, data: documents })
  },
)

export const getDocument = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { docId } = req.params
    const userId = req.user!.id
    const document = await documentService.getDocumentById(docId, userId)
    res.status(200).json({ success: true, data: document })
  },
)

export const updateDocument = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { docId } = req.params
    const userId = req.user!.id
    const { title, content } = req.body
    const document = await documentService.updateDocument(docId, userId, {
      title,
      content,
    })
    res.status(200).json({ success: true, data: document })
  },
)

export const deleteDocument = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { docId } = req.params
    const userId = req.user!.id
    await documentService.deleteDocument(docId, userId)
    res.status(200).json({ success: true, message: '文档已删除' })
  },
)
