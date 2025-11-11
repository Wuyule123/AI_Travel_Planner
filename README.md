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
- **讯飞听写 API** - 语音识别进行行程规划

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm（推荐）或 npm
- Docker（可选，用于容器化部署）


### 方式一：Docker 部署

#### 前置准备

1. **安装 Docker Desktop**（Windows/Mac）
2. **配置 Docker 镜像加速**（可选，提高拉取速度）
   
   在 Docker Desktop → Settings → Docker Engine 中添加：
   ```json
   {
     "registry-mirrors": [
       "https://registry.cn-hangzhou.aliyuncs.com",
       "https://ccr.ccs.tencentyun.com",
       "https://docker.m.daocloud.io"
     ]
   }
   ```

#### 使用 Docker Compose（推荐）

##### 1. 配置环境变量

创建 `.env` 文件：

```bash
# 高德地图配置
NEXT_PUBLIC_AMAP_KEY=your_amap_key
NEXT_PUBLIC_AMAP_SECRET=your_amap_secret

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DashScope (通义千问) 配置
DASHSCOPE_API_KEY=your_dashscope_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-plus

# 讯飞语音配置
IFLYTEK_APPID=your_iflytek_appid
IFLYTEK_APIKEY=your_iflytek_apikey
```

##### 2. 一键启动

```bash
# Linux/Mac/WSL2
./run.sh
```

##### 3. 一键停止

```bash
# Linux/Mac/WSL2
./stop.sh
```

或手动运行：

```bash
# 构建并启动
docker-compose up --build -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

##### 3. 访问应用

打开浏览器访问：[http://localhost:3000](http://localhost:3000)

#### 使用预构建镜像

```bash
# 拉取最新镜像
docker pull registry.cn-hangzhou.aliyuncs.com/ai_travel_planner12/ai-travel-planner:latest

# 创建 .env.docker 文件（内容同上）

# 运行容器
docker run -d \
  --name ai-travel-planner \
  -p 3000:3000 \
  --env-file .env.docker \
  registry.cn-hangzhou.aliyuncs.com/ai_travel_planner12/ai-travel-planner:latest
```

#### 常用 Docker 命令

```bash
# 查看运行状态
docker ps
# 或
docker-compose ps

# 查看日志
docker logs ai-travel-planner
# 或
docker-compose logs

# 实时查看日志
docker logs -f ai-travel-planner
# 或
docker-compose logs -f

# 重启服务
docker restart ai-travel-planner
# 或
docker-compose restart

# 停止并删除容器
docker rm -f ai-travel-planner
# 或
docker-compose down

# 清理未使用的镜像
docker system prune -a
```

### 方式二：本地开发环境

#### 1. 克隆项目
```bash
git clone https://github.com/Wuyule123/ai-travel-planner.git
cd ai-travel-planner
```

#### 2. 安装依赖
```bash
pnpm install
# 或
npm install
```

#### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
# 地图（高德 AMap）
NEXT_PUBLIC_AMAP_KEY=your_amap_key
NEXT_PUBLIC_AMAP_SECRET=your_amap_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 阿里云百炼 DashScope（OpenAI 兼容接口）
DASHSCOPE_API_KEY=your_dashscope_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-plus   # 或 qwen-turbo / qwen-max / qwen2.5-72b-instruct 等

# 讯飞语音识别
IFLYTEK_APPID=your_iflytek_appid
IFLYTEK_APIKEY=your_iflytek_apikey
```

#### 4. 设置数据库

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

#### 5. 启动开发服务器
```bash
pnpm dev
# 或
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)


## 📁 项目结构

```
ai-travel-planner/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── plan/            # 行程生成 API
│   │   └── check-email/     # 邮箱检查 API
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
├── .github/
│   └── workflows/
│       └── docker-publish.yml  # GitHub Actions CI/CD
├── docker-compose.yml      # Docker Compose 配置
├── Dockerfile              # Docker 镜像构建
├── run.sh                  # Linux/Mac 启动脚本
├── build-local.ps1         # Windows PowerShell 构建脚本
├── .env.example            # 环境变量模板
├── next.config.ts          # Next.js 配置
├── tailwind.config.ts      # Tailwind 配置
└── tsconfig.json          # TypeScript 配置
```

## 🔑 API 密钥配置指南

### 1. Supabase 设置
1. 访问 [supabase.com](https://supabase.com) 并创建项目
2. 在 Project Settings → API 中获取：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. 在 SQL Editor 中创建数据库表（见上方 SQL）

### 2. 阿里云通义千问
1. 访问 [阿里云百炼控制台](https://dashscope.console.aliyun.com/)
2. 开通通义千问服务
3. 创建 API Key：`DASHSCOPE_API_KEY`
4. 选择模型：`qwen-plus`（推荐）或其他

### 3. 高德地图
1. 访问 [高德开放平台](https://console.amap.com/)
2. 创建应用，选择 **Web 端（JS API）**
3. 配置域名白名单：
   - 开发环境：`localhost`、`127.0.0.1`
   - 生产环境：你的实际域名
4. 获取 `NEXT_PUBLIC_AMAP_KEY`
5. 启用"安全密钥"并获取：`NEXT_PUBLIC_AMAP_SECRET`

### 4. 讯飞语音
1. 访问 [讯飞开放平台](https://www.xfyun.cn/)
2. 在控制台创建应用
3. 开通"语音听写（流式版）"服务
4. 获取接口认证信息：
   - `IFLYTEK_APPID`
   - `IFLYTEK_APIKEY`

## 🛠️ 开发命令

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

## 🐳 Docker 相关

### 生产环境建议

1. **使用 HTTPS**：配置反向代理（如 Nginx）启用 SSL
2. **资源限制**：限制容器资源使用

```bash
docker run -d \
  --name ai-travel-planner \
  --memory="1g" \
  --cpus="1.0" \
  -p 3000:3000 \
  --env-file .env.docker \
  registry.cn-hangzhou.aliyuncs.com/ai_travel_planner12/ai-travel-planner:latest
```

3. **健康检查**：在 docker-compose.yml 中已配置

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

4. **日志管理**：配置日志驱动

```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  ...
```

### 镜像版本说明

| 标签 | 说明 |
|------|------|
| `latest` | 最新稳定版本 |
| `v1.0.0` | 特定版本号 |
| `main` | 主分支最新构建 |

拉取特定版本：

```bash
docker pull registry.cn-hangzhou.aliyuncs.com/ai_travel_planner12/ai-travel-planner:v1.0.0
```

## 🐛 故障排查

### 本地开发问题

#### Q: 地图无法加载
**A:** 检查高德地图配置：
1. 确认 `.env.local` 中的 Key 和 Secret 正确
2. 在高德控制台确认域名白名单配置
3. 重启开发服务器

#### Q: AI 生成失败
**A:** 检查阿里云配置：
1. 确认 `DASHSCOPE_API_KEY` 正确
2. 检查通义千问服务是否开通
3. 查看控制台是否有余额

#### Q: 无法保存行程
**A:** 检查 Supabase 配置：
1. 确认已登录
2. 检查 Supabase 表和 RLS 策略
3. 查看浏览器控制台错误信息

#### Q: 逆地理编码失败（INVALID_USER_SCODE）
**A:** 这是高德地图安全验证失败：
1. 在高德控制台启用"安全密钥"
2. 将安全密钥添加到环境变量
3. 确保域名在白名单中
4. 重启开发服务器

### Docker 部署问题

#### Q: 容器无法启动
```bash
# 查看详细日志
docker logs ai-travel-planner
# 或
docker-compose logs

# 检查环境变量
docker inspect ai-travel-planner
```

#### Q: 端口被占用
```bash
# 修改 docker-compose.yml 或使用其他端口
docker run -d -p 8080:3000 ...
```

#### Q: 镜像拉取失败（网络问题）
```bash
# 方案1: 手动拉取阿里云镜像
docker pull registry.cn-hangzhou.aliyuncs.com/library/node:20-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/library/node:20-alpine node:20-alpine

# 方案2: 配置 Docker 镜像加速（见上方"前置准备"）

# 方案3: 使用代理
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

#### Q: 构建很慢
```bash
# 只构建 amd64 架构（更快）
docker build --platform linux/amd64 -t ai-travel-planner:local .
```

## 📊 环境变量说明

| 变量名 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| `NEXT_PUBLIC_AMAP_KEY` | 高德地图 Key | ✅ | - |
| `NEXT_PUBLIC_AMAP_SECRET` | 高德地图安全密钥 | ✅ | - |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | ✅ | - |
| `DASHSCOPE_API_KEY` | 通义千问 API Key | ✅ | - |
| `DASHSCOPE_BASE_URL` | 通义千问 API 地址 | ✅ | 见示例 |
| `DASHSCOPE_MODEL` | 使用的模型名称 | ✅ | `qwen-plus` |
| `IFLYTEK_APPID` | 讯飞语音 APPID | ✅ | - |
| `IFLYTEK_APIKEY` | 讯飞语音 APIKey | ✅ | - |

## 🚀 CI/CD 部署

本项目已配置 GitHub Actions 自动构建和推送 Docker 镜像到阿里云容器镜像服务。

### 配置 GitHub Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

- `ALIYUN_REGISTRY_USERNAME` - 阿里云镜像仓库用户名
- `ALIYUN_REGISTRY_PASSWORD` - 阿里云镜像仓库密码
- `NEXT_PUBLIC_AMAP_KEY`
- `NEXT_PUBLIC_AMAP_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 触发构建

```bash
# 推送到 main 分支自动触发
git push origin main

# 或打标签触发
git tag v1.0.0
git push origin v1.0.0

# 或手动触发（在 GitHub Actions 页面）
```


## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端服务
- [阿里云通义千问](https://tongyi.aliyun.com/) - AI 大模型
- [高德地图](https://lbs.amap.com/) - 地图服务
- [讯飞开放平台](https://www.xfyun.cn/) - 语音识别
- [Shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

## 📮 联系方式

- **作者**：Wuyule123
- **Email**：1078314987@qq.com
- **GitHub**：[@Wuyule123](https://github.com/Wuyule123)
- **Issues**：[提交问题](https://github.com/Wuyule123/ai-travel-planner/issues)

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Wuyule123/ai-travel-planner&type=Date)](https://star-history.com/#Wuyule123/ai-travel-planner&Date)