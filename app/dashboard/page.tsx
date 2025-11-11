'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

  if (loading) {
    return <div className="p-6">加载中...</div>
  }

  if (rows.length === 0) {
    return (
      <div className="p-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold">我的行程</h1>
        <p className="text-muted-foreground">还没有保存的行程</p>
        <Button onClick={() => r.push('/planner')}>
          创建第一个行程
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">我的行程</h1>
        <Button onClick={() => r.push('/planner')}>新建行程</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map(row => (
          <Card key={row.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={()=>r.push(`/trip/${row.id}`)}>
            <CardContent className="p-4 space-y-1">
              <div className="text-lg font-medium">{row.title}</div>
              <div className="text-sm text-muted-foreground">{row.destination} · {row.start_date} ~ {row.end_date}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}