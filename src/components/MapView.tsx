'use client'
import { useEffect, useRef } from 'react'
import type { Day } from '@/lib/schema'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function MapView({ day }: { day: Day }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const AMap = (window as any).AMap
    if (!AMap || !mapRef.current) return
    
    // 销毁旧地图实例
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy()
    }

    // 创建新地图实例
    const map = new AMap.Map(mapRef.current, { 
      zoom: 12,
      mapStyle: 'amap://styles/normal'
    })
    
    mapInstanceRef.current = map

    const path: [number, number][] = []
    const markers: any[] = []

    // 添加标记点
    day.items.forEach((it, index) => {
      const loc = it.location
      if (loc?.lng && loc?.lat) {
        const position: [number, number] = [loc.lng, loc.lat]
        path.push(position)
        
        // 创建标记
        const marker = new AMap.Marker({ 
          map, 
          position,
          title: it.title,
          label: {
            content: `${index + 1}`,
            offset: new AMap.Pixel(0, 0),
            direction: 'center'
          }
        })

        // 添加信息窗口
        const infoWindow = new AMap.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h4 style="margin: 0 0 5px 0; font-weight: bold;">${it.title}</h4>
              ${it.time ? `<p style="margin: 0; color: #666; font-size: 12px;">⏰ ${it.time}</p>` : ''}
              ${it.location?.name ? `<p style="margin: 0; color: #666; font-size: 12px;">📍 ${it.location.name}</p>` : ''}
              ${it.costEstimate ? `<p style="margin: 5px 0 0 0; color: #ff6b00; font-weight: bold;">¥${it.costEstimate}</p>` : ''}
            </div>
          `,
          offset: new AMap.Pixel(0, -30)
        })

        marker.on('click', () => {
          infoWindow.open(map, position)
        })

        markers.push(marker)
      }
    })

    // 绘制路线
    if (path.length > 1) {
      new AMap.Polyline({ 
        map, 
        path, 
        strokeColor: '#3b82f6',
        strokeWeight: 6,
        strokeOpacity: 0.8,
        showDir: true
      })
      
      // 自适应显示所有点
      map.setFitView(markers)
    } else if (path.length === 1) {
      // 只有一个点，居中显示
      map.setCenter(path[0])
    }

    return () => {
      mapInstanceRef.current?.destroy()
      mapInstanceRef.current = null
    }
  }, [day])

  return (
    <Card>
      <CardHeader>
        <CardTitle>🗺️ 路线地图</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-[420px] rounded-lg border"
        />
      </CardContent>
    </Card>
  )
}