'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Trip } from '@/lib/schema'

export default function Home(){
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
        if (data) setTrips(data)
      }
      setLoading(false)
    })()
  }, [])

  // 退出登录
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      alert('退出失败：' + error.message)
    } else {
      setUser(null)
      setTrips([])
      router.push('/')
      router.refresh()
    }
  }

  // 切换账号
  const handleSwitchAccount = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 计算总预算
  const getTotalBudget = () => {
    return trips.reduce((sum, trip) => {
      const tripData = trip.trip_json as Trip
      return sum + (tripData.budget?.totalEstimate || 0)
    }, 0)
  }

  // 按类别汇总预算
  const getBudgetByCategory = () => {
    const categoryTotals: Record<string, number> = {}
    
    trips.forEach(trip => {
      const tripData = trip.trip_json as Trip
      tripData.budget?.breakdown?.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.estimate
      })
    })
    
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // 只显示前5个类别
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 顶部导航栏 */}
      {user && (
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-3 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              欢迎, {user.email}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSwitchAccount}
              >
                切换账号
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
              >
                退出登录
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          AI Travel Planner
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          让 AI 为你定制专属旅行计划，只需一句话，智能生成详细行程
        </p>
        <div className="flex gap-4 justify-center">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  我的行程
                </Button>
              </Link>
              <Link href="/planner">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  新建行程
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg" className="text-lg px-8">
                  登录/注册
                </Button>
              </Link>
              <Link href="/planner">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  免费试用
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>



      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6 text-center space-y-3">
              <h3 className="text-xl font-semibold">🤖 AI 智能规划</h3>
              <p className="text-gray-600">
                只需描述你的需求，AI 自动生成详细行程，包含景点、美食、住宿推荐
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6 text-center space-y-3">
              <h3 className="text-xl font-semibold">💰 预算管理</h3>
              <p className="text-gray-600">
                智能估算各项开支，实时调整预算，让你的旅行花费一目了然
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6 text-center space-y-3">
              <h3 className="text-xl font-semibold">🗺️ 地图可视化</h3>
              <p className="text-gray-600">
                在地图上查看所有行程点，直观了解路线规划，优化出行体验
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}