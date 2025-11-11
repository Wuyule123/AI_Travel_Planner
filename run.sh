#!/bin/bash

echo "🚀 AI Travel Planner - Docker Compose 启动脚本"
echo "=============================================="

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "📝 请复制 .env.example 并填写配置:"
    echo "   cp .env.example .env"
    echo "   然后编辑 .env 文件填写你的 API 密钥"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ 错误: Docker 未运行"
    echo "📝 请启动 Docker Desktop"
    exit 1
fi

# 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down

# 构建并启动
echo "🏗️  构建并启动容器..."
docker-compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查容器状态
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ 启动成功!"
    echo "=============================================="
    echo "🌐 访问应用: http://localhost:3000"
    echo "📝 查看日志: docker-compose logs -f"
    echo "⏹️  停止服务: docker-compose down"
    echo "🔄 重启服务: docker-compose restart"
    echo "=============================================="
else
    echo "❌ 启动失败，查看日志:"
    docker-compose logs
    exit 1
fi