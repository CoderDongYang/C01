import type { Request, Response, NextFunction } from 'express'
import { catchAsync } from '../../middleware/error.js'
import { streamChat } from './ai.service.js'

export const chat = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { messages, context } = req.body
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    const stream = await streamChat(messages, context)
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  },
)
