'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'

interface MapSelectorProps {
  onLocationSelect: (start: string, end: string) => void
}

export default function MapSelector({ onLocationSelect }: MapSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const [startPoint, setStartPoint] = useState<{ name: string; address: string; lng: number; lat: number } | null>(null)
  const [endPoint, setEndPoint] = useState<{ name: string; address: string; lng: number; lat: number } | null>(null)
  const [selectMode, setSelectMode] = useState<'start' | 'end' | null>(null)
  const startMarkerRef = useRef<any>(null)
  const endMarkerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  // 手动输入模式
  const [manualMode, setManualMode] = useState(false)
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')

  // 使用 ref 存储最新的状态值，避免闭包问题
  const selectModeRef = useRef(selectMode)
  const endPointRef = useRef(endPoint)
  
  useEffect(() => {
    selectModeRef.current = selectMode
  }, [selectMode])
  
  useEffect(() => {
    endPointRef.current = endPoint
  }, [endPoint])

  // 当起点和终点都选择完成后，自动应用
  useEffect(() => {
    if (startPoint && endPoint) {
      console.log('起点和终点都已选择，自动应用:', startPoint.name, endPoint.name)
      onLocationSelect(startPoint.name, endPoint.name)
    }
  }, [startPoint, endPoint, onLocationSelect])

  // 当手动输入的起点和终点都填写完成后，自动应用
  useEffect(() => {
    if (manualMode && manualStart.trim() && manualEnd.trim()) {
      const timer = setTimeout(() => {
        console.log('手动输入完成，自动应用:', manualStart, manualEnd)
        onLocationSelect(manualStart.trim(), manualEnd.trim())
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [manualMode, manualStart, manualEnd, onLocationSelect])

  // 初始化地图
  useEffect(() => {
    const initMap = () => {
      const AMap = (window as any).AMap
      
      if (!AMap) {
        console.error('❌ 高德地图 API 未加载')
        return
      }
      
      if (!mapContainerRef.current) {
        console.error('❌ 地图容器未找到')
        return
      }
      
      if (mapInstanceRef.current) {
        console.log('⚠️ 地图实例已存在，跳过初始化')
        return
      }

      console.log('🗺️ 开始初始化地图...')
      console.log('📍 AMap 版本:', AMap.version)

      try {
        // 创建地图实例
        const map = new AMap.Map(mapContainerRef.current, {
          zoom: 13,
          center: [118.796877, 32.060255],
          mapStyle: 'amap://styles/normal',
          resizeEnable: true,
          viewMode: '2D'
        })

        mapInstanceRef.current = map

        // 地图加载完成事件
        map.on('complete', () => {
          console.log('✅ 地图渲染完成')
          setMapLoaded(true)
        })

        // 初始化地理编码插件
        AMap.plugin(['AMap.Geocoder'], () => {
          geocoderRef.current = new AMap.Geocoder({
            city: '全国',
            radius: 1000
          })
          console.log('✅ 地理编码器初始化完成')
        })

        // 地图点击处理
        const handleMapClick = (e: any) => {
          const currentSelectMode = selectModeRef.current
          const currentEndPoint = endPointRef.current
          
          if (!currentSelectMode) {
            return
          }

          const lnglat = e.lnglat
          console.log('📍 点击位置:', lnglat.lng, lnglat.lat)
          
          // 默认使用坐标
          let locationName = `位置 (${lnglat.lng.toFixed(4)}, ${lnglat.lat.toFixed(4)})`
          let locationAddress = `经度: ${lnglat.lng.toFixed(6)}, 纬度: ${lnglat.lat.toFixed(6)}`
          
          // 逆地理编码
          if (geocoderRef.current) {
            geocoderRef.current.getAddress([lnglat.lng, lnglat.lat], (status: string, result: any) => {
              console.log('🔍 逆地理编码状态:', status)
              
              if (status === 'complete' && result.regeocode) {
                const regeocode = result.regeocode
                console.log('✅ 逆地理编码成功:', regeocode)
                
                // 只提取省市信息
                if (regeocode.addressComponent) {
                  const addr = regeocode.addressComponent
                  const province = addr.province || ''
                  const city = addr.city || ''
                  
                  // 如果是直辖市，省市名称相同，只显示一个
                  if (province === city) {
                    locationName = city
                    locationAddress = city
                  } else {
                    // 组合省市名称
                    locationName = city || province || locationName
                    locationAddress = `${province}${city}`.replace(/市$/, '') // 移除末尾的"市"字
                  }
                  
                  console.log('📌 省市信息:', { province, city, locationName, locationAddress })
                }
              } else {
                console.warn('⚠️ 逆地理编码失败，使用坐标:', status, result)
              }
              
              // 创建位置对象并更新状态
              createMarkerAndUpdateState(lnglat, locationName, locationAddress, currentSelectMode, currentEndPoint)
            })
          } else {
            // 没有地理编码器，直接使用坐标
            createMarkerAndUpdateState(lnglat, locationName, locationAddress, currentSelectMode, currentEndPoint)
          }
        }

        // 创建标记并更新状态
        const createMarkerAndUpdateState = (
          lnglat: any,
          locationName: string,
          locationAddress: string,
          mode: 'start' | 'end',
          currentEndPoint: any
        ) => {
          const location = {
            name: locationName,
            address: locationAddress,
            lng: lnglat.lng,
            lat: lnglat.lat
          }

          console.log('📌 最终位置信息:', location)

          if (mode === 'start') {
            setStartPoint(location)
            
            // 移除旧标记
            if (startMarkerRef.current) {
              map.remove(startMarkerRef.current)
              startMarkerRef.current = null
            }
            
            // 添加新标记
            startMarkerRef.current = new AMap.Marker({
              map,
              position: lnglat,
              title: '起点',
              label: {
                content: `<div style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">起点: ${locationName}</div>`,
                direction: 'top'
              }
            })
            
            if (!currentEndPoint) {
              setSelectMode('end')
            } else {
              setSelectMode(null)
            }
          } else if (mode === 'end') {
            setEndPoint(location)
            
            // 移除旧标记
            if (endMarkerRef.current) {
              map.remove(endMarkerRef.current)
              endMarkerRef.current = null
            }
            
            // 添加新标记
            endMarkerRef.current = new AMap.Marker({
              map,
              position: lnglat,
              title: '终点',
              label: {
                content: `<div style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">终点: ${locationName}</div>`,
                direction: 'top'
              }
            })
            
            setSelectMode(null)
          }
        }

        map.on('click', handleMapClick)
        
      } catch (error) {
        console.error('❌ 地图初始化失败:', error)
      }
    }

    // 等待 DOM 和 AMap 都准备好
    const timer = setTimeout(() => {
      const checkAndInit = () => {
        const AMap = (window as any).AMap
        
        if (AMap && mapContainerRef.current) {
          console.log('✅ 检测到高德地图 API 和容器元素')
          initMap()
        } else {
          if (!AMap) {
            console.log('⏳ 等待高德地图 API...')
          }
          if (!mapContainerRef.current) {
            console.log('⏳ 等待地图容器...')
          }
          setTimeout(checkAndInit, 100)
        }
      }
      
      checkAndInit()
    }, 100) // 延迟 100ms 确保 DOM 渲染完成

    // 清理函数
    return () => {
      clearTimeout(timer)
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.clearMap()
          mapInstanceRef.current.destroy()
          console.log('🗑️ 地图实例已销毁')
        } catch (error) {
          console.warn('⚠️ 销毁地图时出错:', error)
        }
        mapInstanceRef.current = null
      }
      
      startMarkerRef.current = null
      endMarkerRef.current = null
      geocoderRef.current = null
    }
  }, [])

  // 清除选择
  const handleClear = useCallback(() => {
    setStartPoint(null)
    setEndPoint(null)
    setSelectMode(null)
    setManualStart('')
    setManualEnd('')
    
    if (mapInstanceRef.current) {
      if (startMarkerRef.current) {
        mapInstanceRef.current.remove(startMarkerRef.current)
        startMarkerRef.current = null
      }
      if (endMarkerRef.current) {
        mapInstanceRef.current.remove(endMarkerRef.current)
        endMarkerRef.current = null
      }
    }
  }, [])
  
  // 切换模式
  const handleModeSwitch = useCallback(() => {
    const newMode = !manualMode
    setManualMode(newMode)
    
    if (!newMode) {
      setManualStart('')
      setManualEnd('')
    } else {
      handleClear()
    }
  }, [manualMode, handleClear])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>📍 选择起点和终点</span>
          <div className="flex gap-2">
              <Button 
                size="sm"
                variant={selectMode === 'start' ? 'default' : startPoint ? 'secondary' : 'outline'}
                onClick={() => {
                  setSelectMode('start')
                  // 点击选择起点时清空手动输入框
                  setManualStart('')
                  setManualEnd('')
                }}
                className="flex-1"
              >
                {selectMode === 'start' 
                  ? '👆 点击地图选择起点' 
                  : startPoint 
                    ? `✓ ${startPoint.name.length > 10 ? startPoint.name.slice(0, 10) + '...' : startPoint.name}` 
                    : '选择起点'}
              </Button>
              <Button 
                size="sm"
                variant={selectMode === 'end' ? 'default' : endPoint ? 'secondary' : 'outline'}
                onClick={() => {
                  setSelectMode('end')
                  // 点击选择终点时清空手动输入框
                  setManualStart('')
                  setManualEnd('')
                }}
                className="flex-1"
                disabled={!startPoint && selectMode !== 'end'}
              >
                {selectMode === 'end' 
                  ? '👆 点击地图选择终点' 
                  : endPoint 
                    ? `✓ ${endPoint.name.length > 10 ? endPoint.name.slice(0, 10) + '...' : endPoint.name}` 
                    : '选择终点'}
              </Button>
            </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {manualMode ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">起点</label>
              <Input
                placeholder="例如：南京南站"
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">终点</label>
              <Input
                placeholder="例如：泰州老街"
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
              💡 输入起点和终点后，会自动添加到提示词中
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button 
                size="sm"
                variant={selectMode === 'start' ? 'default' : startPoint ? 'secondary' : 'outline'}
                onClick={() => setSelectMode('start')}
                className="flex-1"
              >
                {selectMode === 'start' 
                  ? '👆 点击地图选择起点' 
                  : startPoint 
                    ? `✓ ${startPoint.name.length > 10 ? startPoint.name.slice(0, 10) + '...' : startPoint.name}` 
                    : '选择起点'}
              </Button>
              <Button 
                size="sm"
                variant={selectMode === 'end' ? 'default' : endPoint ? 'secondary' : 'outline'}
                onClick={() => setSelectMode('end')}
                className="flex-1"
                disabled={!startPoint && selectMode !== 'end'}
              >
                {selectMode === 'end' 
                  ? '👆 点击地图选择终点' 
                  : endPoint 
                    ? `✓ ${endPoint.name.length > 10 ? endPoint.name.slice(0, 10) + '...' : endPoint.name}` 
                    : '选择终点'}
              </Button>
            </div>

            {(startPoint || endPoint) && (
              <div className="space-y-2">
                {startPoint && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-600 shrink-0">起点</Badge>
                      <div className="flex-1 text-sm overflow-hidden min-w-0">
                        <div className="font-medium truncate">{startPoint.name}</div>
                        <div className="text-muted-foreground text-xs truncate">{startPoint.address}</div>
                      </div>
                    </div>
                  </div>
                )}
                {endPoint && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-red-600 shrink-0">终点</Badge>
                      <div className="flex-1 text-sm overflow-hidden min-w-0">
                        <div className="font-medium truncate">{endPoint.name}</div>
                        <div className="text-muted-foreground text-xs truncate">{endPoint.address}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {startPoint && endPoint && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded text-center font-medium">
                    ✓ 已自动添加到提示词：从 {startPoint.name} 到 {endPoint.name}
                  </div>
                )}
              </div>
            )}

            <div className="relative w-full">
              <div 
                ref={mapContainerRef}
                className={`w-full h-[400px] rounded-lg border-2 ${
                  selectMode ? 'border-blue-500' : 'border-gray-200'
                } bg-gray-100 overflow-hidden`}
              >
                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <div className="text-sm text-muted-foreground">地图加载中...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`text-sm text-center p-2 rounded ${
              selectMode 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-muted-foreground'
            }`}>
              {selectMode === 'start'
                ? '👆 点击地图选择起点位置，系统将自动识别城市/地点名称' 
                : selectMode === 'end'
                  ? '👆 点击地图选择终点位置，系统将自动识别城市/地点名称'
                  : mapLoaded 
                    ? startPoint && !endPoint
                      ? '💡 请继续选择终点'
                      : '💡 点击"选择起点"按钮开始，或切换到手动输入模式'
                    : '⏳ 正在加载地图...'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}