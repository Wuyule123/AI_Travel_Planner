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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  // 翻译错误信息为中文
  const translateError = (errorMessage: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': '邮箱或密码错误',
      'Email not confirmed': '邮箱未验证，请检查邮箱中的验证链接',
      'User already registered': '该邮箱已注册，请直接登录',
      'Password should be at least 6 characters': '密码至少需要6个字符',
      'Unable to validate email address: invalid format': '邮箱格式不正确',
      'Invalid email': '邮箱格式不正确',
      'Signup requires a valid password': '请输入有效密码',
      'Email rate limit exceeded': '操作过于频繁，请稍后再试',
      'User not found': '用户不存在',
      'Invalid email or password': '邮箱或密码错误',
      'Email link is invalid or has expired': '邮箱验证链接无效或已过期',
    }

    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.includes(key)) {
        return value
      }
    }

    return errorMessage
  }

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 检查邮箱是否已注册
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // 尝试使用该邮箱登录（使用错误密码）
      // Supabase 会返回不同的错误信息来区分"用户不存在"和"密码错误"
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: '___check_only___' // 临时密码，只用于检查
      })

      if (error) {
        // 如果错误是"Invalid login credentials"，说明用户存在但密码错误
        if (error.message.includes('Invalid login credentials')) {
          return true // 用户已注册
        }
        // 其他错误也可能表示用户不存在
        return false
      }

      return false
    } catch (e) {
      return false
    }
  }

  const signIn = async () => {
    // 1. 基础验证
    if (!email || !password) {
      setErr('请输入邮箱和密码')
      return
    }

    // 2. 邮箱格式验证
    if (!validateEmail(email)) {
      setErr('邮箱格式不正确')
      return
    }

    // 3. 密码长度验证
    if (password.length < 6) {
      setErr('密码至少需要6个字符')
      return
    }

    setLoading(true)
    setErr('')
    setSuccess('')

    // 4. 检查邮箱是否已注册
    const exists = await checkEmailExists(email)
    if (!exists) {
      setLoading(false)
      setErr('该邮箱未注册，请先注册')
      return
    }

    // 5. 执行登录
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    
    if (error) {
      setErr(translateError(error.message))
      return
    }
    
    setSuccess('登录成功！')
    setTimeout(() => {
      r.push('/dashboard')
    }, 500)
  }

  const signUp = async () => {
    // 1. 基础验证
    if (!email || !password) {
      setErr('请输入邮箱和密码')
      return
    }

    // 2. 邮箱格式验证
    if (!validateEmail(email)) {
      setErr('邮箱格式不正确')
      return
    }

    // 3. 密码长度验证
    if (password.length < 6) {
      setErr('密码至少需要6个字符')
      return
    }

    // 4. 密码强度验证（可选）
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setErr('密码需要包含字母和数字')
      return
    }

    // 5. 确认密码验证
    if (isRegistering && password !== confirmPassword) {
      setErr('两次输入的密码不一致')
      return
    }

    setLoading(true)
    setErr('')
    setSuccess('')

    // 6. 检查邮箱是否已注册
    const exists = await checkEmailExists(email)
    if (exists) {
      setLoading(false)
      setErr('该邮箱已注册，请直接登录')
      return
    }

    // 7. 执行注册
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })
    setLoading(false)
    
    if (error) {
      setErr(translateError(error.message))
      return
    }

    // 8. 注册成功处理
    if (data?.user) {
      // 检查是否需要邮箱验证
      if (data.user.confirmed_at) {
        setSuccess('注册成功！正在跳转...')
        setTimeout(() => {
          r.push('/dashboard')
        }, 1000)
      } else {
        setSuccess('注册成功！请检查邮箱中的验证链接完成注册')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-gradient-to-b from-blue-50 to-white">
      {/* 返回按钮 */}
      <Button 
        variant="outline" 
        onClick={() => r.back()}
        className="absolute top-6 left-6"
      >
        ← 返回
      </Button>

      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold text-center">
            {isRegistering ? '注册账号' : '登录账号'}
          </h1>
          
          <Input 
            placeholder="邮箱地址" 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value.trim())}
            disabled={loading}
          />
          
          <Input 
            placeholder="密码（至少6个字符，需包含字母和数字）" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isRegistering && signIn()}
            disabled={loading}
          />

          {isRegistering && (
            <Input 
              placeholder="确认密码" 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && signUp()}
              disabled={loading}
            />
          )}

          {err && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{err}</p>
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-2">
            {isRegistering ? (
              <>
                <Button 
                  onClick={signUp} 
                  disabled={loading} 
                  className="w-full"
                  size="lg"
                >
                  {loading ? '注册中...' : '注册'}
                </Button>
                <Button 
                  onClick={() => {
                    setIsRegistering(false)
                    setErr('')
                    setSuccess('')
                    setConfirmPassword('')
                  }} 
                  variant="ghost" 
                  className="w-full"
                  disabled={loading}
                >
                  已有账号？去登录
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={signIn} 
                  disabled={loading} 
                  className="w-full"
                  size="lg"
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
                <Button 
                  onClick={() => {
                    setIsRegistering(true)
                    setErr('')
                    setSuccess('')
                  }} 
                  variant="ghost" 
                  className="w-full"
                  disabled={loading}
                >
                  没有账号？去注册
                </Button>
              </>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground pt-2">
            <p>登录即表示同意我们的服务条款和隐私政策</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}