// app/(public)/login/page.tsx
'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  const r = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const signIn = async () => {
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setErr(error.message)
    r.push('/dashboard')
  }

  const signUp = async () => {
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) return setErr(error.message)
    r.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-3 p-6">
          <h1 className="text-xl font-semibold">登录 / 注册</h1>
          <Input placeholder="邮箱" value={email} onChange={e=>setEmail(e.target.value)} />
          <Input placeholder="密码" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={signIn} disabled={loading}>登录</Button>
            <Button onClick={signUp} variant="secondary" disabled={loading}>注册</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}