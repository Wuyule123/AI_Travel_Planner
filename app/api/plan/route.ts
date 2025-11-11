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

**核心要求：**

1. **基本信息提取：**
   - 从用户输入中提取：出发地、目的地、天数、预算、人数、偏好
   - startDate默认为明天，格式YYYY-MM-DD，endDate根据天数计算
   - id使用UUID格式，createdAt和updatedAt使用ISO 8601格式
   - 如果用户未明确说明人数，默认为1人

2. **交通规划（必须且重要）：**
   - **去程交通**：第一天第一个Item必须是"出发地→目的地"的交通
     * 根据距离选择：高铁（<1000km）、飞机（>1000km）、汽车（<300km）
     * 包含具体班次时间（例如：G1234次 08:30-12:45）
     * 费用=单人票价×人数（例如：高铁二等座300元/人×2人=600元）
   - **返程交通**：最后一天最后一个Item必须是"目的地→出发地"的返程交通
     * 同样包含班次和时间
     * 费用同样按人数计算
   - **市内交通**：
     * 景点之间距离>2km时添加市内交通（地铁/公交/打车）
     * 费用按实际估算（地铁3-10元/人，出租车起步价+里程）
   - **参考价格**：
     * 高铁二等座：0.4-0.5元/公里/人
     * 飞机经济舱：800-2000元/人（国内）
     * 长途汽车：0.3元/公里/人
     * 市内地铁：3-10元/人/次
     * 出租车：起步价13元+2.5元/公里

3. **住宿规划（必须）：**
   - **住宿天数**：N天行程=N-1晚住宿
   - **安排时间**：每天最后一个Item安排当晚住宿（除最后一天）
   - **房间数量**：
     * 1人：单人间或标间
     * 2人：标间1间
     * 3-4人：标间2间
     * 费用=房间单价×房间数×晚数（例如：标间400元/晚×2间=800元）
   - **价格参考**（单间/晚）：
     * 经济型：150-300元
     * 舒适型：300-600元
     *高档型：600-1200元
     * 豪华型：1200元以上
   - **位置选择**：优先选择景区附近或交通便利的位置
   - **酒店信息**：提供具体名称、地址、经纬度

4. **餐饮规划（必须）：**
   - **每日三餐**：早餐、午餐、晚餐（第一天可能只有午晚餐，最后一天可能只有早午餐）
   - **费用标准**（人均）：
     * 早餐：15-50元/人（快餐20-30元、酒店自助40-60元）
     * 午餐：40-120元/人（快餐40-60元、特色餐厅80-120元）
     * 晚餐：60-200元/人（普通餐厅80-120元、特色/高档150-200元）
     * 总费用=人均价格×人数
   - **餐厅推荐**：提供当地特色美食和具体餐厅名称
   - **时间安排**：早餐07:00-08:30、午餐11:30-13:00、晚餐18:00-19:30

5. **景点规划：**
   - **时间分配**：
     * 大型景点（故宫、长城）：3-4小时
     * 中型景点（博物馆、公园）：1.5-2.5小时
     * 小型景点（特色街区）：1-1.5小时
   - **门票价格**：
     * 提供真实门票价格（旺季/淡季）
     * 费用=单人票价×人数
     * 免费景点标注costEstimate为0
   - **开放时间**：确保安排的时间在景点开放时间内
   - **游览顺序**：按地理位置优化路线，减少往返
   - **详细信息**：景点简介、特色、建议游览时长

6. **活动规划：**
   - 根据用户偏好添加特色活动（演出、体验项目、娱乐活动）
   - 费用=单人价格×人数
   - 提前标注是否需要预约

7. **时间规划原则：**
   - **第一天**：考虑到达时间，通常从中午开始安排
   - **中间天**：全天安排，早上08:00-晚上21:00
   - **最后一天**：考虑返程时间，通常下午或傍晚结束
   - **用餐时间**：景点参观间隙安排午晚餐
   - **休息时间**：避免行程过于紧凑，适当留白

8. **预算计算（严格）：**
   - **每个Item的costEstimate必须准确**：
     * 所有费用已包含人数计算
     * 例如：2人用餐，午餐80元/人×2=160元
   - **budget.breakdown分类汇总**：
     * 交通：所有transport类型Item之和
     * 餐饮：所有food类型Item之和
     * 住宿：所有hotel类型Item之和
     * 门票：所有sight类型Item的门票之和
     * 娱乐活动：所有activity类型Item之和
   - **budget.totalEstimate**：
     * 必须等于所有breakdown的estimate总和
     * 必须等于所有Item的costEstimate总和
   - **预算控制**：
     * 如果用户指定预算，确保totalEstimate在预算范围内（±10%）
     * 优先保证往返交通和住宿，其次是餐饮和门票

9. **地理信息（重要）：**
   - 所有有具体位置的Item必须提供location
   - location包含：name（地点名称）、address（详细地址）、lat（纬度）、lng（经度）
   - 坐标使用WGS84标准（GCJ-02火星坐标系）
   - 确保坐标准确，便于地图展示

10. **实用性建议：**
    - 在note字段添加实用提示：
      * 交通：候车地点、预计耗时、是否需要提前购票
      * 景点：最佳游览时间、避坑建议、拍照机位
      * 餐饮：特色菜品、人均消费、是否需要排队
      * 住宿：退房时间、周边设施
    - 考虑天气和季节因素
    - 标注是否适合老人/儿童

11. **特殊情况处理：**
    - 如果预算过低，诚实说明"预算不足"并给出最低合理预算
    - 如果天数过短（1天），不安排住宿
    - 如果目的地=出发地，安排本地游，无需长途交通
    - 节假日和旺季价格上浮20-50%

**完整示例（南京→苏州2天1晚，2人，预算2000元）：**

第1天(2025-11-12):
1. 07:30 交通-高铁 "南京南→苏州站 G7001次" (150元/人×2=300元)
2. 10:00 景点 "拙政园" 门票(70元/人×2=140元)
3. 12:00 餐饮-午餐 "苏州本帮菜馆" (80元/人×2=160元)
4. 14:00 景点 "苏州博物馆" 免费(0元)
5. 16:30 活动 "平江路古街漫步" 免费(0元)
6. 18:00 餐饮-晚餐 "观前街美食" (100元/人×2=200元)
7. 21:00 住宿 "如家酒店观前街店" 标间(280元/晚×1间=280元)

第2天(2025-11-13):
1. 08:00 餐饮-早餐 "酒店自助早餐" (30元/人×2=60元)
2. 09:00 景点 "虎丘" 门票(60元/人×2=120元)
3. 12:00 餐饮-午餐 "苏州面馆" (50元/人×2=100元)
4. 14:00 交通-地铁 "虎丘→苏州站" (5元/人×2=10元)
5. 15:30 交通-高铁 "苏州站→南京南 G7010次" (150元/人×2=300元)

预算分解：
- 交通：300+10+300=610元
- 餐饮：160+200+60+100=520元
- 住宿：280元
- 门票：140+120=260元
总预算：1670元 < 2000元（符合预算）`

    const user = `用户需求：${prompt}\n\n请生成详细的旅行计划JSON，确保：
1. 所有交通费用已按人数计算（单价×人数）
2. 所有餐饮费用已按人数计算（人均×人数）
3. 住宿费用按房间数计算（房价×房间数）
4. 门票和活动费用按人数计算（票价×人数）
5. 包含完整的往返交通和住宿安排
6. 时间安排合理、路线优化
7. 提供准确的地理坐标
8. 总预算在用户指定范围内`

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

    // 验证并修正预算
    if (trip.days && trip.budget) {
      let totalCost = 0
      const categoryTotals: Record<string, number> = {}

      // 遍历所有活动，计算总花费
      trip.days.forEach(day => {
        day.items?.forEach(item => {
          if (item.costEstimate) {
            totalCost += item.costEstimate
            
            // 按类型分类汇总
            const category = getCategoryName(item.type)
            categoryTotals[category] = (categoryTotals[category] || 0) + item.costEstimate
          }
        })
      })

      // 更新 breakdown
      trip.budget.breakdown = Object.entries(categoryTotals).map(([category, estimate]) => ({
        category,
        estimate,
        note: `${category}相关费用`
      }))

      // 更新总预算
      trip.budget.totalEstimate = totalCost
    }

    return NextResponse.json(trip)
  } catch (e: any) {
    console.error('Plan generation error:', e)
    return NextResponse.json({ error: e.message || '生成失败' }, { status: 500 })
  }
}

// 辅助函数：将活动类型映射到预算类别
function getCategoryName(type: string): string {
  const mapping: Record<string, string> = {
    'sight': '门票',
    'food': '餐饮',
    'hotel': '住宿',
    'transport': '交通',
    'activity': '娱乐活动'
  }
  return mapping[type] || '其他'
}