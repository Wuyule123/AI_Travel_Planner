import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '邮箱不能为空' },
        { status: 400 }
      )
    }

    // 在函数内部初始化 Supabase Admin 客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      )
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 使用 admin client 查询用户
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('查询用户失败:', error)
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      )
    }

    // 检查邮箱是否存在
    const exists = data.users.some(user => user.email === email)

    return NextResponse.json({ exists })
  } catch (error) {
    console.error('检查邮箱出错:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}