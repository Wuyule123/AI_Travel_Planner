'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import SpeechButton from '../../components/SpeechButton'
// ...existing code...
import { supabase } from '../../lib/supabase'
import type { Trip } from '../../lib/schema'
import { useRouter } from 'next/navigation'

export default function PlannerPage(){
  const r = useRouter()
  const [prompt, setPrompt] = useState('我想去日本东京，5天，预算10000，喜欢美食和动漫，带孩子')
  const [loading, setLoading] = useState(false)
  const [trip, setTrip] = useState<Trip|null>(null)

  const callPlan = async () => {
    setLoading(true)
    // 简单解析：也可做表单结构化（目的地/天数/预算/人数/标签）
    const body = { destination:'东京', days:5, budget:10000, people:3, tags:['美食','动漫','亲子'] }
    const resp = await fetch('/api/plan', { method:'POST', body: JSON.stringify(body) })
    setLoading(false)
    const data = await resp.json()
    if (resp.ok) setTrip(data)
    else alert('生成失败：'+data.error)
  }

  const saveTrip = async () => {
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
    alert('已保存，前往仪表盘查看')
    r.push('/dashboard')
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">智能行程规划</h1>
      <div className="flex gap-2 items-center">
        <SpeechButton onText={t=>setPrompt(t)} />
        <Textarea value={prompt} onChange={e=>setPrompt(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={callPlan} disabled={loading}>{loading? '生成中…':'生成行程'}</Button>
        <Button onClick={saveTrip} variant="secondary" disabled={!trip}>保存行程</Button>
      </div>
      {trip && <pre className="bg-muted p-3 rounded-lg overflow-auto text-sm">{JSON.stringify(trip, null, 2)}</pre>}
    </div>
  )
}