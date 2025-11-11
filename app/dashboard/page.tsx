'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Trip } from '@/lib/schema'

export default function Dashboard(){
  const r = useRouter()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return r.push('/login')
      const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
      if (!error && data) setRows(data)
      setLoading(false)
    })()
  }, [r])

  const deleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发卡片点击
    if (!confirm('确定要删除这个行程吗？')) return
    
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) {
      alert('删除失败：' + error.message)
    } else {
      setRows(rows.filter(row => row.id !== id))
    }
  }

  if (loading) {
    return <div className="p-6">加载中...</div>
  }

  if (rows.length === 0) {
    return (
      <div className="p-6 text-center space-y-4">
        <Button 
          variant="outline" 
          onClick={() => r.push('/')}
          className="absolute top-6 left-6"
        >
          ← 返回首页
        </Button>
        <h1 className="text-2xl font-semibold pt-8">我的行程</h1>
        <p className="text-muted-foreground">还没有保存的行程</p>
        <Button onClick={() => r.push('/planner')}>
          创建第一个行程
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => r.push('/')}
          >
            ← 返回首页
          </Button>
          <h1 className="text-2xl font-semibold">我的行程</h1>
        </div>
        <Button onClick={() => r.push('/planner')}>+ 新建行程</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map(row => {
          const tripData = row.trip_json as Trip
          return (
            <Card 
              key={row.id} 
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="text-lg font-medium">{row.title}</div>
                <div className="text-sm text-muted-foreground">
                  📍 {row.destination}
                </div>
                <div className="text-sm text-muted-foreground">
                  📅 {row.start_date} ~ {row.end_date}
                </div>
                {tripData.budget?.totalEstimate && (
                  <div className="text-sm font-medium text-orange-600">
                    💰 预算: ¥{tripData.budget.totalEstimate.toLocaleString()}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex gap-2">
                <Button 
                  onClick={() => r.push(`/trip/${row.id}`)}
                  className="flex-1"
                  size="sm"
                >
                  查看详情
                </Button>
                <Button 
                  onClick={(e) => deleteTrip(row.id, e)}
                  variant="destructive"
                  size="sm"
                >
                  删除
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}