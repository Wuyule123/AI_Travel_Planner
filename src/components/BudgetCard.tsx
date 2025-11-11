// filepath: src/components/BudgetCard.tsx
'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { Trip, Item } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function BudgetCard({ trip, onChange, tripId }:{ trip: Trip, onChange:(t:Trip)=>void, tripId:string }){
  const [showModal, setShowModal] = useState(false)
  const supabase = getSupabaseClient()
  // 表单字段
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [type, setType] = useState<'sight'|'food'|'hotel'|'transport'|'activity'>('food')
  const [time, setTime] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [locationName, setLocationName] = useState('')
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')

  const resetForm = () => {
    setSelectedDay('')
    setType('food')
    setTime('')
    setTitle('')
    setNote('')
    setLocationName('')
    setAddress('')
    setAmount('')
  }

  const addExpense = async () => {
    if (!selectedDay || !title || !amount) {
      alert('请填写必填项：日期、标题、金额')
      return
    }

    const newTrip = { ...trip }
    
    // 找到对应的天
    const dayIndex = parseInt(selectedDay)
    if (!newTrip.days[dayIndex]) {
      alert('无效的日期')
      return
    }

    // 创建新的 Item
    const newItem: Item = {
      type,
      title,
      costEstimate: parseFloat(amount),
      time: time || undefined,
      note: note || undefined,
      location: (locationName || address) ? {
        name: locationName || undefined,
        address: address || undefined
      } : undefined
    }

    // 添加到对应天的 items
    if (!newTrip.days[dayIndex].items) {
      newTrip.days[dayIndex].items = []
    }
    newTrip.days[dayIndex].items.push(newItem)

    // 更新预算分类
    const categoryName = getCategoryName(type)
    if (!newTrip.budget.breakdown) {
      newTrip.budget.breakdown = []
    }
    
    const categoryIndex = newTrip.budget.breakdown.findIndex(
      item => item.category === categoryName
    )
    
    if (categoryIndex >= 0) {
      newTrip.budget.breakdown[categoryIndex].estimate += parseFloat(amount)
    } else {
      newTrip.budget.breakdown.push({
        category: categoryName,
        estimate: parseFloat(amount),
        note: `${categoryName}相关费用`
      })
    }

    // 重新计算总预算
    newTrip.budget.totalEstimate = newTrip.budget.breakdown.reduce(
      (sum, item) => sum + item.estimate, 
      0
    )

    // 保存到数据库
    const { error } = await supabase.from('trips').update({
      trip_json: newTrip
    }).eq('id', tripId)

    if (error) {
      alert('保存失败：' + error.message)
      return
    }

    onChange(newTrip)
    resetForm()
    setShowModal(false)
    alert('添加成功！')
  }

  // 获取类别的中文名称
  const getCategoryName = (type: string): string => {
    const mapping: Record<string, string> = {
      'sight': '门票',
      'food': '餐饮',
      'hotel': '住宿',
      'transport': '交通',
      'activity': '娱乐活动'
    }
    return mapping[type] || '其他'
  }

  return (
    <>{/* 自定义模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              resetForm()
              setShowModal(false)
            }}
          />
          
          {/* 模态框内容 */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto m-4 z-10">
            <div className="p-6 space-y-4">
              {/* 标题 */}
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">添加支出</h2>
                <p className="text-sm text-muted-foreground">
                  记录您的旅行支出，包括日期、类型、金额等详细信息
                </p>
              </div>

              {/* 表单 */}
              <div className="space-y-4">
                {/* 选择日期 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    日期 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDay}
                    onChange={e => setSelectedDay(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">选择日期</option>
                    {trip.days?.map((day, index) => (
                      <option key={index} value={String(index)}>
                        第{index + 1}天 ({day.date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 类型 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="sight">景点</option>
                    <option value="food">餐饮</option>
                    <option value="hotel">住宿</option>
                    <option value="transport">交通</option>
                    <option value="activity">活动</option>
                  </select>
                </div>

                {/* 时间 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">时间（可选）</label>
                  <Input 
                    type="time"
                    value={time} 
                    onChange={e => setTime(e.target.value)} 
                  />
                </div>

                {/* 标题 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    placeholder="例如：午餐、故宫门票等" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                  />
                </div>

                {/* 备注 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">备注（可选）</label>
                  <Textarea 
                    placeholder="添加说明信息..." 
                    value={note} 
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* 地点名称 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">地点名称（可选）</label>
                  <Input 
                    placeholder="例如：北京饭店" 
                    value={locationName} 
                    onChange={e => setLocationName(e.target.value)} 
                  />
                </div>

                {/* 详细地址 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">详细地址（可选）</label>
                  <Input 
                    placeholder="例如：北京市东城区东长安街33号" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                  />
                </div>

                {/* 金额 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    金额（元）<span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* 按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={addExpense} className="flex-1">
                    确认添加
                  </Button>
                  <Button 
                    onClick={() => {
                      resetForm()
                      setShowModal(false)
                    }} 
                    variant="outline"
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>预算详情</span>
            <Button size="sm" onClick={() => setShowModal(true)}>
              记一笔
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-2xl font-bold text-orange-600">
              总预算: ¥{trip.budget?.totalEstimate?.toLocaleString() || 0}
            </div>
            
            {trip.budget?.breakdown && trip.budget.breakdown.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">预算明细</div>
                {trip.budget.breakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{item.category}</div>
                      {item.note && (
                        <div className="text-sm text-muted-foreground">{item.note}</div>
                      )}
                    </div>
                    <div className="font-semibold">¥{item.estimate.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      
    </>
  )
}