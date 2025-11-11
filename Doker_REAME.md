# Docker 部署指南

## 快速开始


## 本地构建镜像

```bash
# 克隆仓库
git clone https://github.com/yourusername/ai-travel-planner.git
cd ai-travel-planner
```

在根目录下创建 `.env` 文件填入如下内容:
```env
NEXT_PUBLIC_AMAP_KEY=your_amap_key
NEXT_PUBLIC_AMAP_SECRET=your_amap_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DASHSCOPE_API_KEY=your_dashscope_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-plus
IFLYTEK_APPID=your_iflytek_appid
IFLYTEK_APIKEY=your_iflytek_apikey
```

```bash
# 构建镜像并运行
./run.sh

# 停止容器并清除
./stop.sh
```


### 使用预构建的镜像

```bash
# 从阿里云拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
```

创建 `.env.docker` 文件，内容如下：

```env
NEXT_PUBLIC_AMAP_KEY=your_amap_key
NEXT_PUBLIC_AMAP_SECRET=your_amap_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DASHSCOPE_API_KEY=your_dashscope_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-plus
IFLYTEK_APPID=your_iflytek_appid
IFLYTEK_APIKEY=your_iflytek_apikey
```

运行容器：

```bash
# 运行容器
docker run -d \
  --name ai-travel-planner \
  -p 3000:3000 \
  --env-file .env.docker \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest

# 访问应用
# 打开浏览器访问: http://localhost:3000
```

### 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    image: registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_AMAP_KEY=${NEXT_PUBLIC_AMAP_KEY}
      - NEXT_PUBLIC_AMAP_SECRET=${NEXT_PUBLIC_AMAP_SECRET}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
      - DASHSCOPE_BASE_URL=${DASHSCOPE_BASE_URL}
      - DASHSCOPE_MODEL=${DASHSCOPE_MODEL}
      - IFLYTEK_APPID=${IFLYTEK_APPID}
      - IFLYTEK_APIKEY=${IFLYTEK_APIKEY}
    restart: unless-stopped
```

启动：

```bash
docker-compose up -d
```

## 容器管理

```bash
# 查看运行状态
docker ps

# 查看日志
docker logs ai-travel-planner

# 实时查看日志
docker logs -f ai-travel-planner

# 停止容器
docker stop ai-travel-planner

# 启动容器
docker start ai-travel-planner

# 重启容器
docker restart ai-travel-planner

# 删除容器
docker rm -f ai-travel-planner
```

## 镜像版本

镜像标签说明：
- `latest`: 最新稳定版本
- `v1.0.0`: 特定版本号
- `main`: 主分支最新构建
- `sha-xxxxxxx`: 特定提交的构建

拉取特定版本：

```bash
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:v1.0.0
```

## 环境变量说明

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_AMAP_KEY` | 高德地图 Key | ✅ |
| `NEXT_PUBLIC_AMAP_SECRET` | 高德地图安全密钥 | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | ✅ |
| `DASHSCOPE_API_KEY` | 阿里云通义千问 API Key | ✅ |
| `DASHSCOPE_BASE_URL` | 通义千问 API 地址 | ✅ |
| `DASHSCOPE_MODEL` | 使用的模型名称 | ✅ |
| `IFLYTEK_APPID` | 讯飞语音 APPID | ✅ |
| `IFLYTEK_APIKEY` | 讯飞语音 APIKey | ✅ |

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker logs ai-travel-planner

# 检查环境变量
docker inspect ai-travel-planner
```

### 端口被占用

```bash
# 使用其他端口
docker run -d -p 8080:3000 ...
```

### 镜像拉取失败

```bash
# 检查网络连接
ping registry.cn-hangzhou.aliyuncs.com

# 登录阿里云镜像仓库
docker login registry.cn-hangzhou.aliyuncs.com
```

## 生产环境建议

1. **使用 HTTPS**: 配置反向代理（如 Nginx）启用 SSL
2. **资源限制**: 限制容器资源使用

```bash
docker run -d \
  --name ai-travel-planner \
  --memory="1g" \
  --cpus="1.0" \
  -p 3000:3000 \
  --env-file .env.docker \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
```

3. **健康检查**: 配置健康检查

```yaml
# docker-compose.yml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

4. **日志管理**: 配置日志驱动

```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  ...
```

## 支持

如有问题，请提交 Issue: https://github.com/Wuyule123/ai-travel-planner/issues