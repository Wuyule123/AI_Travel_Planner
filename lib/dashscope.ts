// lib/dashscope.ts
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

const BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const MODEL = process.env.DASHSCOPE_MODEL || 'qwen-plus'

export async function chatJSON(messages: ChatMessage[]) {
  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`DashScope error: ${resp.status} ${t}`)
  }
  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content || ''
  return text as string
}