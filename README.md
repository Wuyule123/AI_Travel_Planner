# 🌍 AI Travel Planner | AI 智能旅行规划助手

基于 Next.js 和阿里云通义千问的智能旅行行程规划应用，通过 AI 帮你快速生成个性化旅行计划。

## ✨ 主要功能

### 核心功能
- **智能行程生成**：输入旅行需求，AI 自动生成详细的多日行程计划
- **地图选点**：集成高德地图，可视化选择起点和终点
- **语音输入**：支持语音描述旅行需求（需浏览器支持）
- **预算规划**：自动估算各项费用，生成预算明细
- **路线地图**：每日行程自动在地图上展示景点位置和路线

### 用户体验
- **行程保存**：登录后可保存行程到个人仪表盘
- **行程管理**：查看、编辑和删除已保存的行程
- **响应式设计**：支持桌面端和移动端访问
- **实时预览**：即时查看 AI 生成的行程详情

## 快速开始

### 环境要求
- Node.js 18+
- pnpm（推荐）或 npm
- Supabase 账号
- 阿里云账号（通义千问 API）
- 高德地图 Web 端 Key

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/ai-travel-planner.git
cd ai-travel-planner
```

2. **安装依赖**
```bash
pnpm install
# 或
npm install
```

3. **配置环境变量**

创建 `.env.local` 文件：

```bash
# 地图（高德 AMap）
NEXT_PUBLIC_AMAP_KEY=
NEXT_PUBLIC_AMAP_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 阿里云百炼 DashScope（OpenAI 兼容接口）
DASHSCOPE_API_KEY=
# 国内北京区：
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-plus   # 或 qwen-turbo / qwen-max / qwen2.5-72b-instruct 等

# 讯飞语音识别 Key
IFLYTEK_APPID=
IFLYTEK_APIKEY=
```

4. **设置数据库**

在 Supabase 中创建 `trips` 表：

```sql
create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  destination text not null,
  start_date text not null,
  end_date text not null,
  trip_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 启用行级安全策略
alter table trips enable row level security;

-- 用户只能访问自己的行程
create policy "Users can only access their own trips"
  on trips for all
  using (auth.uid() = user_id);
```

5. **启动开发服务器**
```bash
pnpm dev
# 或
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📦 技术栈

### 前端框架
- **Next.js 14+** - React 全栈框架（App Router）
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式设计
- **Shadcn/ui** - UI 组件库

### 后端服务
- **Supabase** - 数据库 + 用户认证
- **阿里云通义千问** - AI 大语言模型
- **高德地图 API** - 地图和地理编码服务

### 核心依赖
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "tailwindcss": "^3.4.0"
}
```

## 📁 项目结构

```
ai-travel-planner/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── plan/            # 行程生成 API
│   │   └── trips/           # 行程 CRUD API
│   ├── dashboard/           # 用户仪表盘
│   ├── planner/             # 行程规划页面
│   ├── trip/[id]/          # 行程详情页
│   ├── login/              # 登录页面
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页
├── src/
│   ├── components/         # React 组件
│   │   ├── AmapLoader.tsx  # 高德地图加载器
│   │   ├── MapSelector.tsx # 地图选点组件
│   │   ├── MapView.tsx     # 地图展示组件
│   │   ├── SpeechButton.tsx # 语音输入按钮
│   │   └── ui/             # UI 基础组件
│   └── lib/                # 工具库
│       ├── dashscope.ts    # 通义千问 API
│       ├── supabase.ts     # Supabase 客户端
│       ├── schema.ts       # TypeScript 类型定义
│       └── utils.ts        # 工具函数
├── .env.local              # 环境变量（需自行创建）
├── next.config.ts          # Next.js 配置
├── tailwind.config.ts      # Tailwind 配置
└── tsconfig.json          # TypeScript 配置
```

## 🔑 API 密钥配置指南

### 1. Supabase 设置
1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 在 Project Settings → API 中获取：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. 阿里云通义千问
1. 访问 [阿里云控制台](https://dashscope.console.aliyun.com/)
2. 开通通义千问服务
3. 创建 API Key：`DASHSCOPE_API_KEY`

### 3. 高德地图
1. 访问 [高德开放平台](https://console.amap.com/)
2. 创建应用，选择 **Web 端（JS API）**
3. 配置域名白名单：
   - 开发环境：`localhost`、`127.0.0.1`
   - 生产环境：你的实际域名
4. 获取 Key：`NEXT_PUBLIC_AMAP_KEY`
5. 启用安全密钥并获取：`NEXT_PUBLIC_AMAP_SECRET`

### 4. 讯飞语音听写 API

#### 步骤 1：注册讯飞开放平台账号
1. 访问 [讯飞开放平台](https://www.xfyun.cn/)
2. 点击右上角"注册"，完成账号注册
3. 进行实名认证（语音服务需要实名认证）

#### 步骤 2：创建应用
1. 登录后进入 [控制台](https://console.xfyun.cn/)
2. 点击"创建新应用"
3. 填写应用信息：
   - **应用名称**：`AI Travel Planner`（或自定义）
   - **应用平台**：选择 **WebAPI**
   - **应用分类**：选择合适的分类
4. 点击"提交"创建应用

#### 步骤 3：开通语音听写服务
1. 在控制台找到刚创建的应用
2. 点击应用卡片进入详情页
3. 在左侧菜单选择"服务管理"
4. 找到 **"语音听写（流式版）"** 或 **"语音听写"**
5. 点击"开通"按钮
6. 选择套餐：
   - **免费版**：每日 500 次调用，适合开发测试
   - **付费版**：根据需求选择

#### 步骤 4：获取 API 凭证
1. 在应用详情页，找到 **"接口认证信息"** 部分
2. 复制以下三个参数：
   ```
   APPID: xxxxxxxx
   APIKey: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   APISecret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### 步骤 5：配置环境变量
将获取的凭证添加到 `.env.local`：




```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 类型检查
pnpm type-check
```


## 🐛 常见问题

### Q: 地图无法加载
**A:** 检查高德地图配置：
1. 确认 `.env.local` 中的 `NEXT_PUBLIC_AMAP_KEY` 和 `NEXT_PUBLIC_AMAP_SECRET` 正确
2. 在高德控制台确认域名白名单配置
3. 重启开发服务器

### Q: AI 生成失败
**A:** 检查阿里云配置：
1. 确认 `DASHSCOPE_API_KEY` 正确
2. 检查通义千问服务是否开通
3. 查看控制台是否有余额

### Q: 无法保存行程
**A:** 检查 Supabase 配置：
1. 确认已登录
2. 检查 Supabase 表和 RLS 策略
3. 查看浏览器控制台错误信息

### Q: 逆地理编码失败（INVALID_USER_SCODE）
**A:** 这是高德地图安全验证失败：
1. 在高德控制台启用"安全密钥"
2. 将安全密钥添加到 `.env.local` 的 `NEXT_PUBLIC_AMAP_SECRET`
3. 确保域名在白名单中
4. 重启开发服务器


## 👨‍💻 作者

Wuyule123

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端服务
- [阿里云通义千问](https://tongyi.aliyun.com/) - AI 大模型
- [高德地图](https://lbs.amap.com/) - 地图服务
- [Shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

## 📮 联系方式

- Email: 1078314987@qq.com
- GitHub: [@Wuyule123](https://github.com/Wuyule123)

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！