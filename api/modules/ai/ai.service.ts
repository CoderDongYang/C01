import OpenAI from 'openai'
import { config } from '../../config/index.js'

const client = new OpenAI({
  baseURL: config.deepseek.baseUrl,
  apiKey: config.deepseek.apiKey,
})

export const streamChat = async (
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  context?: string,
) => {
  const systemContent =
    '你是一个专业的文档写作助手，帮助用户撰写和优化文档内容。请用中文回答。'
  const systemMessage: OpenAI.Chat.Completions.ChatCompletionSystemMessageParam = {
    role: 'system',
    content: context ? `${systemContent}\n\n上下文信息：${context}` : systemContent,
  }
  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [systemMessage, ...messages],
    stream: true,
  })
  return stream
}
