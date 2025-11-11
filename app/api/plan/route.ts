// app/api/plan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatJSON } from '../../../lib/dashscope'
import type { Trip } from '../../../lib/schema'

export async function POST(req: NextRequest) {
  const input = await req.json() as {
    destination: string; days: number; budget: number; people: number; tags?: string[]; startDate?: string
  }

  const system = `你是专业旅行规划师。请严格输出与如下TypeScript类型兼容的JSON，不要包含任何多余文本或注释：\n${
    `Trip { id:string; title:string; destination:string; startDate:string; endDate:string; days:Day[]; budget:{currency:'CNY'|'JPY'|'USD'; totalEstimate:number; breakdown:{category:string; estimate:number; note?:string}[]}; preferences?:{people:number; tags:string[]}; createdAt:string; updatedAt:string }`}
  Day { date:string; items: Item[] }
  Item { time?:string; type:'sight'|'food'|'hotel'|'transport'|'activity'; title:string; note?:string; location?:{name?:string; address?:string; lat?:number; lng?:number}; costEstimate?:number }`

  const user = `目的地:${input.destination}; 天数:${input.days}; 预算:${input.budget}CNY; 人数:${input.people}; 偏好:${(input.tags||[]).join(',')}. \n` +
    `输出须包含：每日行程(时间顺序、含地点名与可选坐标)、住宿与交通建议、预算估算(总额与分类breakdown)。`;

  try {
    const text = await chatJSON([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ])

    let jsonText = text
    // 兜底：尝试提取最外层JSON
    if (!text.trim().startsWith('{')) {
      const m = text.match(/\{[\s\S]*\}$/)
      if (m) jsonText = m[0]
    }
    const trip = JSON.parse(jsonText) as Trip

    return NextResponse.json(trip)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}