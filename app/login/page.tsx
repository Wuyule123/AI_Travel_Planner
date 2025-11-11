'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
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
  const [success, setSuccess] = useState('')

  const signIn = async () => {
    setLoading(true); setErr(''); setSuccess('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return setErr('邮箱未验证，请检查邮箱中的验证链接')
      }
      return setErr(error.message)
    }
    r.push('/dashboard')
  }

  const signUp = async () => {
    setLoading(true); setErr(''); setSuccess('')
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) return setErr(error.message)
    setSuccess('注册成功！请检查邮箱验证链接（如已关闭验证，可直接登录）')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-3 p-6">
          <h1 className="text-xl font-semibold">登录 / 注册</h1>
          <Input placeholder="邮箱" value={email} onChange={e=>setEmail(e.target.value)} />
          <Input placeholder="密码" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {err && <p className="text-red-500 text-sm">{err}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <div className="flex gap-2">
            <Button onClick={signIn} disabled={loading}>登录</Button>
            <Button onClick={signUp} variant="secondary" disabled={loading}>注册</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}