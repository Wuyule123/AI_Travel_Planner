'use client'
import { useState } from 'react'
import type { Trip } from '@/lib/schema'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

export default function BudgetCard({ trip, onChange, tripId }:{ trip: Trip, onChange:(t:Trip)=>void, tripId:string }){
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('其他')

  const total = trip.budget.totalEstimate
  const actual = trip.budget.breakdown.reduce((s,x)=> s + (x.estimate||0), 0)
  const percent = Math.min(100, Math.round(actual/Math.max(total,1)*100))

  const addExpense = async () => {
    const est = Number(amount) || 0
    const t = { ...trip, budget: { ...trip.budget, breakdown: [...trip.budget.breakdown, { category, estimate: est, note: title }] } }
    onChange(t)
    await supabase.from('trips').update({ trip_json: t }).eq('id', tripId)
    setTitle(''); setAmount('')
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="font-medium">预算</div>
        <div className="text-sm">总预算：{total} {trip.budget.currency}，已记录：{actual}（{percent}%）</div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-2 bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <Dialog>
          <DialogTrigger asChild><Button size="sm">记一笔</Button></DialogTrigger>
          <DialogContent className="space-y-2">
            <Input placeholder="标题/备注" value={title} onChange={e=>setTitle(e.target.value)} />
            <Input placeholder="金额" value={amount} onChange={e=>setAmount(e.target.value)} />
            <Input placeholder="类别(如 餐饮/交通/住宿/门票/其他)" value={category} onChange={e=>setCategory(e.target.value)} />
            <Button onClick={addExpense}>保存</Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}