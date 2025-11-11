'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import SpeechButton from '@/components/SpeechButton'
import MapSelector from '@/components/MapSelector'
import { getSupabaseClient } from '@/lib/supabase'
import type { Trip, Day } from '@/lib/schema'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import MapView from '@/components/MapView'

export default function PlannerPage(){
  const r = useRouter()
  const supabase = getSupabaseClient()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [trip, setTrip] = useState<Trip|null>(null)
  const [showMapSelector, setShowMapSelector] = useState(false)

  // 监听页面离开事件
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading) {
        e.preventDefault()
        e.returnValue = '行程正在生成中，确定要离开吗？'
        return '行程正在生成中，确定要离开吗？'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [loading])

  const callPlan = async () => {
    setLoading(true)
    const body = { prompt }
    try {
      const resp = await fetch('/api/plan', { method:'POST', body: JSON.stringify(body) })
      const data = await resp.json()
      if (resp.ok) setTrip(data)
      else alert('生成失败：'+data.error)
    } catch (error) {
      alert('生成失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const saveTrip = async () => {
    if (loading) {
      alert('⚠️ 行程正在生成中，请等待生成完成后再保存')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !trip) return alert('请先登录 / 生成行程')
    const { error } = await supabase.from('trips').insert({
      user_id: user.id,
      title: trip.title,
      destination: trip.destination,
      start_date: trip.startDate,
      end_date: trip.endDate,
      trip_json: trip
    })
    if (error) return alert(error.message)
    alert('已保存,前往仪表盘查看')
    r.push('/dashboard')
  }

  // 处理地图选择
  const handleLocationSelect = (start: string, end: string) => {
    if (loading) {
      alert('⚠️ 行程正在生成中，无法更改出发地和目的地')
      return
    }

    // 移除旧的地点信息，保留其他描述
    const cleanedPrompt = prompt
      .replace(/我想从.+?到.+?旅行/g, '')
      .replace(/从.+?到.+?[，,。]/g, '')
      .replace(/目的地[:：].+?[，,。]/g, '')
      .trim()
    
    // 设置新的提示词
    if (cleanedPrompt) {
      setPrompt(`我想从${start}到${end}旅行，${cleanedPrompt}`)
    } else {
      setPrompt(`我想从${start}到${end}旅行`)
    }
    
    setShowMapSelector(false)
  }

  // 带确认的返回首页
  const handleBackHome = () => {
    if (loading) {
      if (confirm('⚠️ 行程正在生成中，确定要离开吗？生成进度将会丢失。')) {
        r.push('/')
      }
    } else {
      r.push('/')
    }
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

  const days = trip?.days || []

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 返回按钮 */}
      <Button 
        variant="outline" 
        onClick={handleBackHome}
      >
        返回首页
      </Button>

      <h1 className="text-3xl font-bold">智能行程规划</h1>

      {/* 生成状态提示 */}
      {loading && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
              <div className="text-orange-800">
                <div className="font-semibold">正在生成行程...</div>
                <div className="text-sm">请勿关闭页面或点击其他按钮，这可能需要几秒钟时间</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 地图选择器（可折叠） */}
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => {
            if (loading) {
              alert('⚠️ 行程正在生成中，请稍后再操作')
              return
            }
            setShowMapSelector(!showMapSelector)
          }}
          className="w-full"
          disabled={loading}
        >
          {showMapSelector ? '隐藏地图选择' : '📍 从地图选择起点和终点'}
        </Button>
        
        {showMapSelector && (
          <MapSelector onLocationSelect={handleLocationSelect} />
        )}
      </div>
      
      {/* 提示词输入 */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <SpeechButton 
            onText={t => {
              if (loading) {
                alert('⚠️ 行程正在生成中，请稍后再输入')
                return
              }
              setPrompt(t)
            }} 
          />
          <Textarea 
            value={prompt} 
            onChange={e => {
              if (loading) {
                alert('⚠️ 行程正在生成中，无法修改需求')
                return
              }
              setPrompt(e.target.value)
            }}
            placeholder="例如: 我想从南京到泰州旅行2天，预算500&#10;&#10;详细描述你的旅行需求，包括：&#10;• 目的地&#10;• 出行天数&#10;• 预算范围&#10;• 人数和偏好（美食、文化、购物等）&#10;&#10;提示：也可以点击上方按钮从地图选择起点和终点"
            rows={8}
            className="text-base resize-none"
            disabled={loading}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          提示：描述越详细，AI 生成的行程越符合你的需求
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button onClick={callPlan} disabled={loading} size="lg" className="px-8">
          {loading? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              生成中…
            </span>
          ):'生成行程'}
        </Button>
        <Button onClick={saveTrip} variant="secondary" disabled={!trip || loading} size="lg">
          保存行程
        </Button>
      </div>

      {trip && (
        <div className="space-y-6 mt-8">
          {/* 行程头部信息 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{trip.title}</h2>
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

          {/* 预算概览 */}
          {trip.budget && (
            <Card>
              <CardHeader>
                <CardTitle>预算概览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-orange-600">
                    总预算: ¥{trip.budget.totalEstimate?.toLocaleString() || 0}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {trip.budget.breakdown?.map((item, i) => (
                      <div key={i} className="border-l-4 border-blue-500 pl-3">
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                        <div className="text-lg font-semibold">¥{item.estimate.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 每日行程 */}
          <Tabs defaultValue="0" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              {days.map((d, i)=> (
                <TabsTrigger key={i} value={String(i)}>
                  第{i+1}天 ({d.date})
                </TabsTrigger>
              ))}
            </TabsList>
            
            {days.map((d, i)=> (
              <TabsContent key={i} value={String(i)} className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-4">
                  {/* 行程详情 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>第{i+1}天行程</span>
                        <span className="text-lg font-normal text-muted-foreground">
                          当日花费: ¥{getDayTotal(d)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {d.items.map((item, idx)=> (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 space-y-1">
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
                            {item.costEstimate !== undefined && (
                              <div className="text-right shrink-0">
                                <div className="text-sm font-medium text-orange-600">
                                  ¥{item.costEstimate}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* 地图 */}
                  <MapView day={d as Day} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  )
}