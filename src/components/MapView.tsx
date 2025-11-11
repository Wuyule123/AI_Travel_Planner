import Script from 'next/script'
import { useEffect, useRef } from 'react'
import type { Day } from '@/lib/schema'

export default function MapView({ day }: { day: Day }){
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const AMap = (window as any).AMap
    if (!AMap || !ref.current) return
    const map = new AMap.Map(ref.current, { zoom: 12 })
    const path: [number, number][] = []

    day.items.forEach(it => {
      const loc = it.location
      if (loc?.lng && loc?.lat) {
        const p: [number, number] = [loc.lng, loc.lat]
        path.push(p)
        new AMap.Marker({ map, position: p, title: it.title })
      }
    })

    if (path.length) {
      new AMap.Polyline({ map, path, strokeWeight: 5 })
      map.setFitView()
    }
    return () => map?.destroy?.()
  }, [day])

  return (
    <>
      <Script src={`https://webapi.amap.com/maps?v=2.0&key=${process.env.NEXT_PUBLIC_AMAP_KEY}`} strategy="afterInteractive"/>
      <div ref={ref} className="w-full h-[420px] rounded-xl border" />
    </>
  )
}