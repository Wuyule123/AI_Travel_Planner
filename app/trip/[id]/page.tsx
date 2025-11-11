'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import type { Trip, Day } from '../../../lib/schema'
import MapView from '@/components/MapView'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import BudgetCard from '@/components/BudgetCard'

export default function TripPage(){
  const { id } = useParams() as { id: string }
  const [trip, setTrip] = useState<Trip|null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('trips').select('*').eq('id', id).single()
      if (data) setTrip(data.trip_json as Trip)
    })()
  }, [id])

  const days = trip?.days || []

  return (
    <div className="p-6 space-y-4">
      {trip && (
        <>
          <h1 className="text-2xl font-semibold">{trip.title}</h1>
          <Tabs defaultValue="0" className="space-y-4">
            <TabsList>{days.map((d, i)=> <TabsTrigger key={i} value={String(i)}>第{i+1}天</TabsTrigger>)}</TabsList>
            {days.map((d, i)=> (
              <TabsContent key={i} value={String(i)}>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="font-medium">日程</div>
                      <ul className="space-y-1 text-sm">
                        {d.items.map((it, idx)=> (
                          <li key={idx}>[{it.time||'--:--'}] {it.title} <span className="text-muted-foreground">{it.note||''}</span></li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <MapView day={d as Day} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
          <BudgetCard trip={trip} onChange={setTrip} tripId={id} />
        </>
      )}
    </div>
  )
}