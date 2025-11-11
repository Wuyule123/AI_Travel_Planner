'use client'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SavedTrip {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  created_at: string
  trip_json: any
}

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<SavedTrip[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    loadTrips()
  }, [])

  const loadTrips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTrips(data || [])
    } catch (error) {
      console.error('加载行程失败:', error)
      alert('加载行程失败')
    } finally {
      setLoading(false)
    }
  }

  const deleteTrip = async (id: string) => {
    if (!confirm('确定要删除这个行程吗？')) return

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setTrips(trips.filter(t => t.id !== id))
      alert('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">我的行程</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/')}>
            返回首页
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">还没有保存的行程</p>
            <Button onClick={() => router.push('/planner')}>
              开始规划行程
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{trip.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">📍 {trip.destination}</p>
                  <p className="text-muted-foreground">
                    📅 {trip.start_date} ~ {trip.end_date}
                  </p>
                  <p className="text-muted-foreground">
                    创建于 {new Date(trip.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/trip/${trip.id}`)}
                  >
                    查看详情
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTrip(trip.id)}
                  >
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}