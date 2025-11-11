'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import type { Trip, Day, Item } from '@/lib/schema'
import MapView from '@/components/MapView'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import BudgetCard from '@/components/BudgetCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function TripPage(){
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [trip, setTrip] = useState<Trip|null>(null)
  const [editingItem, setEditingItem] = useState<{dayIndex: number, itemIndex: number} | null>(null)
  const [editForm, setEditForm] = useState<Partial<Item>>({})

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('trips').select('*').eq('id', id).single()
      if (data) setTrip(data.trip_json as Trip)
    })()
  }, [id])

  const days = trip?.days || []

  // 按时间排序项目
  const getSortedItems = (items: Item[]) => {
    return [...items].sort((a, b) => {
      // 如果都没有时间，保持原顺序
      if (!a.time && !b.time) return 0
      // 没有时间的排在后面
      if (!a.time) return 1
      if (!b.time) return -1
      // 按时间排序
      return a.time.localeCompare(b.time)
    })
  }

  // 计算每日总花费
  const getDayTotal = (day: Day) => {
    return day.items.reduce((sum, item) => sum + (item.costEstimate || 0), 0)
  }

  // 获取活动类型的中文标签
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'sight': '景点',
      'food': '餐饮',
      'hotel': '住宿',
      'transport': '交通',
      'activity': '活动'
    }
    return labels[type] || type
  }

  // 获取活动类型的颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'sight': 'bg-blue-100 text-blue-800',
      'food': 'bg-orange-100 text-orange-800',
      'hotel': 'bg-purple-100 text-purple-800',
      'transport': 'bg-green-100 text-green-800',
      'activity': 'bg-pink-100 text-pink-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
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

  // 开始编辑
  const startEdit = (dayIndex: number, itemIndex: number, item: Item) => {
    setEditingItem({ dayIndex, itemIndex })
    setEditForm({
      type: item.type,
      title: item.title,
      time: item.time,
      note: item.note,
      costEstimate: item.costEstimate,
      location: item.location ? {
        name: item.location.name,
        address: item.location.address
      } : undefined
    })
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingItem(null)
    setEditForm({})
  }

  // 保存编辑
  const saveEdit = async (dayIndex: number, itemIndex: number) => {
    if (!trip) return

    try {
      const newTrip = { ...trip }
      
      // 更新指定的 item
      const oldCost = newTrip.days[dayIndex].items[itemIndex].costEstimate || 0
      newTrip.days[dayIndex].items[itemIndex] = {
        ...newTrip.days[dayIndex].items[itemIndex],
        ...editForm
      }
      const newCost = editForm.costEstimate || 0

      // 更新预算
      const costDiff = newCost - oldCost
      if (costDiff !== 0 && newTrip.budget) {
        newTrip.budget.totalEstimate = (newTrip.budget.totalEstimate || 0) + costDiff

        // 更新对应类别的预算
        const oldCategoryName = getCategoryName(trip.days[dayIndex].items[itemIndex].type)
        const newCategoryName = getCategoryName(editForm.type || 'activity')
        
        if (newTrip.budget.breakdown) {
          // 如果类型改变了，需要从旧类别扣除，向新类别添加
          if (oldCategoryName !== newCategoryName) {
            // 从旧类别扣除
            const oldCategoryIndex = newTrip.budget.breakdown.findIndex(
              item => item.category === oldCategoryName
            )
            if (oldCategoryIndex >= 0) {
              newTrip.budget.breakdown[oldCategoryIndex].estimate -= oldCost
              if (newTrip.budget.breakdown[oldCategoryIndex].estimate <= 0) {
                newTrip.budget.breakdown.splice(oldCategoryIndex, 1)
              }
            }
            
            // 向新类别添加
            const newCategoryIndex = newTrip.budget.breakdown.findIndex(
              item => item.category === newCategoryName
            )
            if (newCategoryIndex >= 0) {
              newTrip.budget.breakdown[newCategoryIndex].estimate += newCost
            } else {
              newTrip.budget.breakdown.push({
                category: newCategoryName,
                estimate: newCost,
                note: `${newCategoryName}相关费用`
              })
            }
          } else {
            // 类型未改变，只更新金额差额
            const categoryIndex = newTrip.budget.breakdown.findIndex(
              item => item.category === newCategoryName
            )
            if (categoryIndex >= 0) {
              newTrip.budget.breakdown[categoryIndex].estimate += costDiff
            }
          }
        }
      }

      // 保存到数据库
      const { error } = await supabase
        .from('trips')
        .update({ trip_json: newTrip })
        .eq('id', id)

      if (error) {
        alert('保存失败：' + error.message)
        return
      }

      setTrip(newTrip)
      cancelEdit()
      alert('保存成功！')
    } catch (err) {
      alert('保存失败：' + (err as Error).message)
    }
  }

  // 删除项目
  const deleteItem = async (dayIndex: number, itemIndex: number) => {
    if (!trip) return
    
    if (!confirm('确定要删除这条记录吗？')) {
      return
    }

    try {
      const newTrip = { ...trip }
      
      // 获取要删除的项目
      const deletedItem = newTrip.days[dayIndex].items[itemIndex]
      const deletedCost = deletedItem.costEstimate || 0

      // 删除项目
      newTrip.days[dayIndex].items.splice(itemIndex, 1)

      // 更新预算
      if (deletedCost > 0 && newTrip.budget) {
        newTrip.budget.totalEstimate = (newTrip.budget.totalEstimate || 0) - deletedCost

        // 更新对应类别的预算
        const categoryName = getCategoryName(deletedItem.type)
        if (newTrip.budget.breakdown) {
          const categoryIndex = newTrip.budget.breakdown.findIndex(
            item => item.category === categoryName
          )
          if (categoryIndex >= 0) {
            newTrip.budget.breakdown[categoryIndex].estimate -= deletedCost
            // 如果分类金额为 0 或负数，删除该分类
            if (newTrip.budget.breakdown[categoryIndex].estimate <= 0) {
              newTrip.budget.breakdown.splice(categoryIndex, 1)
            }
          }
        }
      }

      // 保存到数据库
      const { error } = await supabase
        .from('trips')
        .update({ trip_json: newTrip })
        .eq('id', id)

      if (error) {
        alert('删除失败：' + error.message)
        return
      }

      setTrip(newTrip)
      alert('删除成功！')
    } catch (err) {
      alert('删除失败：' + (err as Error).message)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 返回按钮 */}
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-2"
      >
        ← 返回
      </Button>

      {trip && (
        <>
          {/* 行程头部信息 */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <div className="flex gap-4 text-muted-foreground">
              <span>📍 {trip.destination}</span>
              <span>📅 {trip.startDate} ~ {trip.endDate}</span>
              {trip.preferences?.people && <span>👥 {trip.preferences.people}人</span>}
            </div>
            {trip.preferences?.tags && (
              <div className="flex gap-2 flex-wrap">
                {trip.preferences.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* 每日行程 */}
          <Tabs defaultValue="0" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              {days.map((d, i)=> (
                <TabsTrigger key={i} value={String(i)}>
                  第{i+1}天 ({d.date})
                </TabsTrigger>
              ))}
            </TabsList>
            
            {days.map((d, dayIndex)=> {
              // 获取排序后的项目
              const sortedItems = getSortedItems(d.items)
              
              return (
                <TabsContent key={dayIndex} value={String(dayIndex)} className="space-y-4">
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* 行程详情 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>第{dayIndex+1}天行程</span>
                          <span className="text-lg font-normal text-muted-foreground">
                            💰 ¥{getDayTotal(d)}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {sortedItems.map((item, displayIndex)=> {
                          // 找到原始索引（用于编辑和删除）
                          const itemIndex = d.items.findIndex(originalItem => 
                            originalItem === item
                          )
                          
                          const isEditing = editingItem?.dayIndex === dayIndex && 
                                            editingItem?.itemIndex === itemIndex

                          return (
                            <div key={itemIndex} className="border-l-4 border-blue-500 pl-4 py-2">
                              {isEditing ? (
                                // 编辑模式
                                <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                                  {/* 类型选择 */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">类型</label>
                                    <select
                                      value={editForm.type || 'activity'}
                                      onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                                      className="w-full rounded-md border border-input bg-white px-2 py-1.5 text-sm"
                                    >
                                      <option value="sight">景点</option>
                                      <option value="food">餐饮</option>
                                      <option value="hotel">住宿</option>
                                      <option value="transport">交通</option>
                                      <option value="activity">活动</option>
                                    </select>
                                  </div>

                                  {/* 时间 */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">时间</label>
                                    <Input
                                      type="time"
                                      value={editForm.time || ''}
                                      onChange={e => setEditForm({...editForm, time: e.target.value})}
                                      className="h-8"
                                    />
                                  </div>

                                  {/* 标题 */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">标题</label>
                                    <Input
                                      value={editForm.title || ''}
                                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                                      placeholder="标题"
                                      className="h-8"
                                    />
                                  </div>

                                  {/* 备注 */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">备注</label>
                                    <Textarea
                                      value={editForm.note || ''}
                                      onChange={e => setEditForm({...editForm, note: e.target.value})}
                                      placeholder="备注"
                                      rows={2}
                                      className="text-sm"
                                    />
                                  </div>

                                  {/* 地点名称 */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">地点名称</label>
                                    <Input
                                      value={editForm.location?.name || ''}
                                      onChange={e => setEditForm({
                                        ...editForm, 
                                        location: {...editForm.location, name: e.target.value}
                                      })}
                                      placeholder="地点名称"
                                      className="h-8"
                                    />
                                  </div>

                                  {/* 地址 */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">地址</label>
                                    <Input
                                      value={editForm.location?.address || ''}
                                      onChange={e => setEditForm({
                                        ...editForm, 
                                        location: {...editForm.location, address: e.target.value}
                                      })}
                                      placeholder="地址"
                                      className="h-8"
                                    />
                                  </div>

                                  {/* 金额 */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">金额（元）</label>
                                    <Input
                                      type="number"
                                      value={editForm.costEstimate || 0}
                                      onChange={e => setEditForm({
                                        ...editForm, 
                                        costEstimate: parseFloat(e.target.value) || 0
                                      })}
                                      step="0.01"
                                      min="0"
                                      className="h-8"
                                    />
                                  </div>

                                  {/* 按钮 */}
                                  <div className="flex gap-2 pt-1">
                                    <Button 
                                      size="sm" 
                                      onClick={() => saveEdit(dayIndex, itemIndex)}
                                      className="flex-1"
                                    >
                                      保存
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={cancelEdit}
                                      className="flex-1"
                                    >
                                      取消
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // 查看模式
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {item.time && (
                                          <span className="text-sm font-medium text-muted-foreground">
                                            {item.time}
                                          </span>
                                        )}
                                        <Badge className={getTypeColor(item.type)}>
                                          {getTypeLabel(item.type)}
                                        </Badge>
                                      </div>
                                      <div className="font-medium">{item.title}</div>
                                      {item.note && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {item.note}
                                        </div>
                                      )}
                                      {item.location?.name && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          📍 {item.location.name}
                                        </div>
                                      )}
                                      {item.location?.address && (
                                        <div className="text-sm text-muted-foreground">
                                          {item.location.address}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {item.costEstimate !== undefined && (
                                        <div className="text-sm font-medium text-orange-600">
                                          ¥{item.costEstimate}
                                        </div>
                                      )}
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEdit(dayIndex, itemIndex, item)}
                                          className="h-7 px-2 text-xs"
                                        >
                                          编辑
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => deleteItem(dayIndex, itemIndex)}
                                        >
                                          删除
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>

                    {/* 地图 */}
                    <MapView day={d as Day} />
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>

          {/* 预算卡片 */}
          <BudgetCard trip={trip} onChange={setTrip} tripId={id} />
        </>
      )}
    </div>
  )
}