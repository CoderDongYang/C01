import type { Request, Response, NextFunction } from 'express'
import { catchAsync } from '../../middleware/error.js'
import { config } from '../../config/index.js'

export const uploadImage = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请选择图片文件' })
    }

    const host = req.get('host')
    const protocol = req.protocol
    const imageUrl = `${protocol}://${host}/uploads/images/${req.file.filename}`

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    })
  },
)
