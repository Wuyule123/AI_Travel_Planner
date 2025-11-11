import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// 使用 service role key 来访问 auth.users 表
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 需要在 .env.local 中添加
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '邮箱不能为空' },
        { status: 400 }
      )
    }

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