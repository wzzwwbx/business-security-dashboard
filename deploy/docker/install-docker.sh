#!/bin/bash  
# docker network create shared-network
# Docker 离线安装脚本
# 使用方法：
# 1. 确保 docker-27.1.2.tgz 和 docker-compose-linux-aarch64 文件在当前目录
# 2. chmod +x install-docker.sh
# 3. sudo ./install-docker.sh

set -e  # 遇到错误时退出

echo "========================================="
echo "开始安装 Docker 和 Docker Compose"
echo "========================================="

# 检查是否以 root 或 sudo 运行
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 检查必要文件是否存在
if [ ! -f "docker-27.1.2.tgz" ]; then
    echo "错误: 找不到 docker-27.1.2.tgz 文件"
    exit 1
fi

if [ ! -f "docker-compose-linux-aarch64" ]; then
    echo "错误: 找不到 docker-compose-linux-aarch64 文件"
    exit 1
fi

echo "✓ 检查文件完整性..."

# 解压 Docker
echo "正在解压 Docker..."
tar xzvf docker-27.1.2.tgz -C /usr/local/bin --strip-components=1
echo "✓ Docker 解压完成"

# 创建 docker 用户组
echo "正在创建 docker 用户组..."
groupadd docker 2>/dev/null || true
echo "✓ docker 用户组已创建"

# 创建 systemd 服务文件
echo "正在创建 systemd 服务文件..."
cat > /etc/systemd/system/docker.service <<'EOF'
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network-online.target firewalld.service
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/dockerd
ExecReload=/bin/kill -s HUP $MAINPID
TimeoutSec=0
RestartSec=2
Restart=always
StartLimitBurst=3
StartLimitInterval=60s
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
Delegate=yes
KillMode=process

[Install]
WantedBy=multi-user.target
EOF
echo "✓ systemd 服务文件已创建"

# 重新加载 systemd
echo "正在重新加载 systemd..."
systemctl daemon-reload
echo "✓ systemd 已重新加载"

# 启动 Docker
echo "正在启动 Docker 服务..."
systemctl enable docker
systemctl start docker
echo "✓ Docker 服务已启动"

# 验证 Docker 安装
echo "========================================="
echo "验证 Docker 安装:"
docker --version
docker info > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Docker 安装成功"
else
    echo "✗ Docker 验证失败"
    exit 1
fi

# 安装 Docker Compose
echo "========================================="
echo "正在安装 Docker Compose..."
cp docker-compose-linux-aarch64 /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
echo "✓ Docker Compose 已安装"

# 验证 Docker Compose
echo "验证 Docker Compose 安装:"
docker-compose --version
if [ $? -eq 0 ]; then
    echo "✓ Docker Compose 安装成功"
else
    echo "✗ Docker Compose 验证失败"
    exit 1
fi

# 将当前用户添加到 docker 组（可选）
if [ -n "$SUDO_USER" ]; then
    echo "========================================="
    echo "将用户 $SUDO_USER 添加到 docker 组..."
    usermod -aG docker "$SUDO_USER"
    echo "✓ 用户 $SUDO_USER 已添加到 docker 组"
    echo "注意: 需要重新登录才能生效"
fi

echo "========================================="
echo "安装完成！"
echo "========================================="
echo "Docker 版本:"
docker --version
echo ""
echo "Docker Compose 版本:"
docker-compose --version
echo ""
echo "Docker 服务状态:"
systemctl status docker --no-pager
echo ""
if [ -n "$SUDO_USER" ]; then
    echo "提示: 请退出并重新登录，或者运行 'newgrp docker' 来使用 docker 命令而不需要 sudo"
fi