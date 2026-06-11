import OpenAI from 'openai'
import { config } from '../../config/index.js'

const hasValidApiKey = config.deepseek.apiKey && config.deepseek.apiKey !== 'your-deepseek-api-key'

const client = hasValidApiKey
  ? new OpenAI({
      baseURL: config.deepseek.baseUrl,
      apiKey: config.deepseek.apiKey,
    })
  : null

const extractKeywords = (text: string): string[] => {
  const cleaned = text.replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 2)
  const freq: Record<string, number> = {}
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1
  })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

const summarizeDocument = (content: string): string => {
  if (!content || content.trim().length === 0) {
    return '文档内容为空，无法进行总结。请先添加一些内容后再尝试。'
  }

  const sentences = content
    .split(/[。！？.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  const keywords = extractKeywords(content)

  let summary = '## 文档总结\n\n'

  summary += `### 基本信息\n`
  summary += `- 总字数：${content.length} 字\n`
  summary += `- 句子数：${sentences.length} 句\n`
  summary += `- 段落数：${paragraphs.length} 段\n\n`

  if (keywords.length > 0) {
    summary += `### 核心关键词\n`
    summary += keywords.map((k) => `**${k}**`).join('、')
    summary += '\n\n'
  }

  if (sentences.length > 0) {
    summary += `### 内容摘要\n`
    const firstSentences = sentences.slice(0, Math.min(3, sentences.length))
    firstSentences.forEach((s, i) => {
      summary += `${i + 1}. ${s}\n`
    })
    summary += '\n'
  }

  if (paragraphs.length > 1) {
    summary += `### 段落结构\n`
    paragraphs.slice(0, Math.min(5, paragraphs.length)).forEach((p, i) => {
      const firstSentence = p.split(/[。！？.!?]/)[0].trim()
      if (firstSentence) {
        summary += `- 段落 ${i + 1}：${firstSentence.substring(0, 50)}${firstSentence.length > 50 ? '...' : ''}\n`
      }
    })
  }

  return summary
}

const generateFallbackResponse = (
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  context?: string,
): string => {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  const userQuery = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : ''

  const lowerQuery = userQuery.toLowerCase()

  if (lowerQuery.includes('总结') || lowerQuery.includes('摘要') || lowerQuery.includes('概括')) {
    return summarizeDocument(context || '')
  }

  if (lowerQuery.includes('关键词') || lowerQuery.includes('关键字')) {
    const keywords = extractKeywords(context || '')
    if (keywords.length === 0) {
      return '文档内容为空，无法提取关键词。'
    }
    return `## 文档关键词\n\n本文档的核心关键词包括：\n\n${keywords.map((k, i) => `${i + 1}. **${k}**`).join('\n')}`
  }

  if (lowerQuery.includes('统计') || lowerQuery.includes('字数') || lowerQuery.includes('多少字')) {
    const content = context || ''
    const sentences = content.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0)
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    return `## 文档统计信息\n\n| 项目 | 数量 |\n|------|------|\n| 总字数 | ${content.length} 字 |\n| 句子数 | ${sentences.length} 句 |\n| 段落数 | ${paragraphs.length} 段 |`
  }

  if (lowerQuery.includes('标题') || lowerQuery.includes('建议')) {
    const keywords = extractKeywords(context || '')
    if (keywords.length === 0) {
      return '文档内容为空，无法生成标题建议。'
    }
    return `## 标题建议\n\n基于文档内容，建议以下标题：\n\n1. 《${keywords.slice(0, 3).join('与')}详解》\n2. 《${keywords.slice(0, 2).join('及')}指南》\n3. 《浅谈${keywords.slice(0, 2).join('与')}》\n4. 《${keywords[0] || '文档'}：从入门到精通》`
  }

  if (context && context.trim().length > 0) {
    return `我是您的文档助手。基于当前文档内容，我可以帮您：\n\n1. **总结文档** - 输入"总结"或"摘要"\n2. **提取关键词** - 输入"关键词"\n3. **文档统计** - 输入"统计"或"字数"\n4. **标题建议** - 输入"标题建议"\n\n您的问题是："${userQuery}"\n\n请尝试上述功能，或输入更明确的指令。`
  }

  return `我是您的文档助手。目前文档内容为空，请先在编辑器中输入一些内容，然后我可以帮您：\n\n1. 总结文档内容\n2. 提取关键词\n3. 统计字数信息\n4. 生成标题建议`
}

export const streamChat = async (
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  context?: string,
) => {
  if (!hasValidApiKey || !client) {
    const fallbackResponse = generateFallbackResponse(messages, context)
    return {
      [Symbol.asyncIterator]: async function* () {
        for (let i = 0; i < fallbackResponse.length; i += 3) {
          const chunk = fallbackResponse.slice(i, i + 3)
          await new Promise((resolve) => setTimeout(resolve, 10))
          yield {
            choices: [
              {
                delta: { content: chunk },
              },
            ],
          }
        }
      },
    } as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
  }

  try {
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
  } catch {
    const fallbackResponse = generateFallbackResponse(messages, context)
    return {
      [Symbol.asyncIterator]: async function* () {
        for (let i = 0; i < fallbackResponse.length; i += 3) {
          const chunk = fallbackResponse.slice(i, i + 3)
          await new Promise((resolve) => setTimeout(resolve, 10))
          yield {
            choices: [
              {
                delta: { content: chunk },
              },
            ],
          }
        }
      },
    } as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
  }
}
