'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'

export default function Dashboard(){
  const r = useRouter()
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return r.push('/login')
      const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
      if (!error && data) setRows(data)
    })()
  }, [r])

  return (
    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rows.map(row => (
        <Card key={row.id} className="cursor-pointer" onClick={()=>r.push(`/trip/${row.id}`)}>
          <CardContent className="p-4 space-y-1">
            <div className="text-lg font-medium">{row.title}</div>
            <div className="text-sm text-muted-foreground">{row.destination} · {row.start_date} ~ {row.end_date}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}