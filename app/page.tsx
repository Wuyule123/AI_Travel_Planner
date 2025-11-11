export default function Home(){
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">AI Travel Planner</h1>
      <p>登录后前往「智能行程规划」页面生成你的第一份行程。</p>
      <a className="underline" href="/login">登录</a> · <a className="underline" href="/planner">智能行程规划</a>
    </main>
  )
}
