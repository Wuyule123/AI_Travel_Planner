import { NextRequest, NextResponse } from 'next/server'
import { chatJSON } from '@/lib/dashscope'
import type { Trip } from '@/lib/schema'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    
    if (!prompt) {
      return NextResponse.json({ error: '请输入旅行需求' }, { status: 400 })
    }

    const system = `你是专业旅行规划师。根据用户的自然语言描述，生成完整的旅行计划。
请严格输出与如下TypeScript类型兼容的JSON，不要包含任何多余文本或注释：

Trip { 
  id:string; 
  title:string; 
  destination:string; 
  startDate:string; 
  endDate:string; 
  days:Day[]; 
  budget:{
    currency:'CNY'|'JPY'|'USD'; 
    totalEstimate:number; 
    breakdown:{category:string; estimate:number; note?:string}[]
  }; 
  preferences?:{people:number; tags:string[]}; 
  createdAt:string; 
  updatedAt:string 
}

Day { date:string; items: Item[] }

Item { 
  time?:string; 
  type:'sight'|'food'|'hotel'|'transport'|'activity'; 
  title:string; 
  note?:string; 
  location?:{name?:string; address?:string; lat?:number; lng?:number}; 
  costEstimate?:number 
}

要求：
1. 从用户输入中提取目的地、天数、预算、人数、偏好等信息
2. startDate默认为明天，格式YYYY-MM-DD
3. 每日行程按时间顺序排列，包含景点、餐饮、住宿、交通
4. 提供详细的预算估算和分类breakdown
5. 如果能确定地点，提供经纬度坐标`

    const user = `用户需求：${prompt}\n\n请生成详细的旅行计划JSON。`

    const text = await chatJSON([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ])

    let jsonText = text
    // 兜底：尝试提取最外层JSON
    if (!text.trim().startsWith('{')) {
      const m = text.match(/\{[\s\S]*\}/)
      if (m) jsonText = m[0]
    }
    
    const trip = JSON.parse(jsonText) as Trip

    return NextResponse.json(trip)
  } catch (e: any) {
    console.error('Plan generation error:', e)
    return NextResponse.json({ error: e.message || '生成失败' }, { status: 500 })
  }
}