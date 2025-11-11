import { createClient } from '@supabase/supabase-js'

// 不要在模块顶层初始化，而是导出一个函数来获取客户端
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// 为了向后兼容，保留默认导出（但仅在客户端使用）
export const supabase = typeof window !== 'undefined' 
  ? getSupabaseClient()
  : null as any