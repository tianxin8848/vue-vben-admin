# Vue Vben Admin 前端部署说明

## 项目概述

本项目是基于 Vue3 + Vben Admin 的人力资源管理系统（fuxi-hr-manager），采用前后端分离架构，前端通过 Nginx 反向代理访问后端 API。

### 技术栈

- **前端框架**: Vue 3 + Vben Admin 5.7.0
- **构建工具**: Vite 8
- **UI 组件**: Element Plus
- **包管理器**: pnpm
- **服务器**: Nginx
- **后端接口**: FastAPI（端口 8999）

---

## 部署环境

| 项目 | 说明 |
|------|------|
| 服务器 IP | 10.254.253.187 |
| 操作系统 | Linux (CentOS/RHEL) |
| Nginx 端口 | 80 (HTTP) |
| 后端服务端口 | 8999 |
| 前端文件目录 | /usr/share/nginx/html |
| Nginx 配置文件 | /etc/nginx/conf.d/vben.conf |

---

## 部署步骤

### 步骤一：本地构建前端项目

在本地开发环境执行以下命令构建生产版本：

```bash
# 进入项目根目录
cd /Users/xi/Documents/github/7-13/vue-vben-admin

# 安装依赖（首次部署）
pnpm install

# 构建前端项目
pnpm build
```

构建成功后，产物会生成在 `apps/web-ele/dist` 目录，并自动打包为 `apps/web-ele/dist.zip`。

### 步骤二：上传构建产物到服务器

使用 SCP 命令将构建产物上传到服务器：

```bash
# 方式一：使用 scp 命令
scp /Users/xi/Documents/github/7-13/vue-vben-admin/apps/web-ele/dist.zip root@10.254.253.187:/tmp/dist.zip

# 方式二：使用项目自带的部署脚本
python3 /Users/xi/Documents/github/7-13/vue-vben-admin/deploy.py
```

### 步骤三：服务器端解压文件

登录服务器后执行以下操作：

```bash
# 备份旧文件（可选）
timestamp=$(date +%s)
mkdir -p /usr/share/nginx/html_backup_${timestamp}
cp -r /usr/share/nginx/html/* /usr/share/nginx/html_backup_${timestamp}/ 2>/dev/null || true

# 删除旧文件
rm -rf /usr/share/nginx/html/*

# 解压新文件
unzip -o /tmp/dist.zip -d /usr/share/nginx/html

# 删除临时压缩包
rm /tmp/dist.zip
```

### 步骤四：配置 Nginx

创建或更新 Nginx 配置文件：

```bash
cat > /etc/nginx/conf.d/vben.conf << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # 允许上传大附件（报销附件、头像等），默认 1MB 不够用
    client_max_body_size 50M;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ^~ /api {
        proxy_pass http://localhost:8999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 步骤五：验证并重启 Nginx

```bash
# 验证配置语法
nginx -t

# 重启 Nginx 服务
systemctl restart nginx

# 检查服务状态
systemctl status nginx
```

### 步骤六：验证部署

```bash
# 验证前端页面是否可访问
curl -s http://localhost:80/ | head -5

# 验证 API 代理是否正常
curl -s -X POST http://localhost:80/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Cisco@123"}'
```

---

## Nginx 配置说明

### 关键配置项

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `listen` | 80 | 监听 HTTP 80 端口 |
| `client_max_body_size` | 50M | 允许上传大附件（报销附件、头像等），默认 1MB 会被 nginx 拦截返回 413 |
| `root` | /usr/share/nginx/html | 前端静态文件根目录 |
| `try_files $uri $uri/ /index.html` | - | SPA 路由支持，所有路径指向 index.html |
| `location ^~ /api` | proxy_pass http://localhost:8999 | API 请求代理到后端服务（`^~` 优先级高于正则，避免 .jpg 等被静态 location 拦截） |
| `proxy_set_header` | Host/X-Real-IP/X-Forwarded-For | 传递客户端真实 IP 和请求头 |
| `expires 1y` | - | 静态资源缓存 1 年 |

### 配置结构

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (端口 80)                   │
├─────────────────────┬───────────────────────────────┤
│   / (前端静态文件)   │           /api (后端代理)       │
│                     │                               │
│ /usr/share/nginx/   │   http://localhost:8999       │
│      html/          │                               │
│                     │                               │
│ index.html          │  FastAPI 后端服务              │
│ js/                 │                               │
│ css/                │                               │
│ favicon/            │                               │
└─────────────────────┴───────────────────────────────┘
```

---

## 自动化部署脚本

项目提供了一键部署脚本 [deploy.py](deploy.py)，执行以下命令即可完成全流程部署：

```bash
python3 deploy.py
```

### 脚本功能

1. ✅ 自动连接服务器（SSH）
2. ✅ 备份旧文件
3. ✅ 上传构建产物
4. ✅ 解压文件
5. ✅ 配置 Nginx
6. ✅ 验证配置并重启服务
7. ✅ 验证部署结果

### 脚本配置

编辑 [deploy.py](deploy.py) 修改以下参数：

```python
SERVER_IP = '10.254.253.187'      # 服务器 IP
USERNAME = 'root'                  # 用户名
PASSWORD = 'Alp35982040'           # 密码
LOCAL_DIST_ZIP = '/path/to/dist.zip'  # 本地构建产物路径
REMOTE_DEST_DIR = '/usr/share/nginx/html'  # 远端部署目录
```

---

## 常见问题排查

### 问题 1：前端页面无法访问

**现象**: 浏览器访问显示 404 或空白页

**排查步骤**:

```bash
# 检查 Nginx 服务状态
systemctl status nginx

# 检查端口监听
ss -tlnp | grep 80

# 检查文件是否存在
ls -la /usr/share/nginx/html/

# 检查 Nginx 错误日志
cat /var/log/nginx/error.log | tail -20
```

### 问题 2：API 请求失败

**现象**: 前端页面正常，但登录或其他 API 请求失败

**排查步骤**:

```bash
# 检查后端服务是否运行
ss -tlnp | grep 8999

# 直接测试后端 API
curl -s http://localhost:8999/api/v1/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Cisco@123"}'

# 检查 Nginx access 日志
cat /var/log/nginx/access.log | tail -20
```

### 问题 3：SELinux 权限问题

**现象**: Nginx 无法读取静态文件或代理请求被拒绝

**解决方案**:

```bash
# 临时关闭 SELinux
setenforce 0

# 永久关闭（需要重启）
sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config

# 或为 Nginx 添加必要的 SELinux 规则
chcon -R -t httpd_sys_content_t /usr/share/nginx/html/
```

### 问题 4：防火墙阻止访问

**现象**: 服务器内部可访问，但外部无法访问

**解决方案**:

```bash
# 查看防火墙状态
firewall-cmd --state

# 开放 80 端口
firewall-cmd --zone=public --add-port=80/tcp --permanent

# 重新加载防火墙
firewall-cmd --reload
```

### 问题 5：头像/附件等图片资源 404（API 正常）

**现象**: 登录、列表等 JSON 接口正常，但 `/api/v1/employees/avatars/.../*.jpg`、`/api/v1/claims/attachments/.../*.png` 等图片资源返回 404，头像无法显示。

**根因**: nginx 的 `location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$`（正则匹配）优先级**高于** `location /api`（普通前缀匹配）。任何以 `.jpg/.png/.jpeg` 等结尾的请求会被正则 location 拦截，当作本地静态文件处理，返回 nginx 自身的 404，根本不会转发到后端 :8999。

**判断方法**:

```bash
# 通过 nginx 访问一个不存在的 .jpg 路径
curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" \
  "http://localhost/api/v1/not-exist.jpg"

# 如果输出 "404 text/html 153"  -> 是 nginx 自身 404，说明被正则拦截了（有问题）
# 如果输出 "404 application/json 22" -> 是后端返回的 JSON 404，说明 /api 转发正常（已修复）
```

**解决方案**: 给 `location /api` 加上 `^~` 修饰符，使其优先级高于正则匹配。`^~` 的作用是：一旦最长前缀匹配命中带 `^~` 的 location，就不再检查后面的正则 location。

```bash
# 1. 备份
cp /etc/nginx/conf.d/vben.conf /etc/nginx/conf.d/vben.conf.bak.$(date +%s)

# 2. 把 location /api { 改成 location ^~ /api {
sed -i 's|location /api {|location ^~ /api {|' /etc/nginx/conf.d/vben.conf

# 3. 验证 + 重启
nginx -t && systemctl restart nginx
```

修改后的关键配置：

```nginx
location ^~ /api {                              # ← 加 ^~ 修饰符
    proxy_pass http://localhost:8999;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**验证**:

```bash
# 修复后应返回后端的 JSON 404
curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" \
  "http://localhost/api/v1/not-exist.jpg"
# 预期输出: 404 application/json 22
```

### 问题 6：上传附件 / 创建报销时 413 Request Entity Too Large

**现象**: 前端调用 `POST /api/v1/me/claims`（创建报销，FormData 带附件）或其它上传接口时返回 413，浏览器 Console 报错 `POST http://10.254.253.187/api/v1/me/claims 413 (Request Entity Too Large)`。但直连后端 `:8999` 测试同一接口正常。

**根因**: nginx 默认 `client_max_body_size` 为 **1MB**，当 FormData 中携带的附件总大小超过 1MB 时，nginx 在反向代理阶段就拦截并返回 413，请求根本到不了后端。后端业务代码本身没有问题（可用 `curl -X POST http://10.254.253.187:8999/api/v1/me/claims ...` 直连验证，返回 401 表示后端正常处理了请求）。

**判断方法**:

```bash
# 走 80 端口（nginx 反代）上传 2MB 文件 —— 应返回 413
dd if=/dev/zero of=/tmp/test.bin bs=1M count=2 2>/dev/null
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://10.254.253.187/api/v1/me/claims -F "attachment=@/tmp/test.bin"
# 预期输出: 413

# 直连 8999 后端 —— 应返回 401（业务正常，只是没带 token）
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://10.254.253.187:8999/api/v1/me/claims -F "attachment=@/tmp/test.bin"
# 预期输出: 401
```

**解决方案**: 在 nginx 的 server 块（`/etc/nginx/conf.d/vben.conf`）顶部添加 `client_max_body_size 50M;`。该配置已固化到 [deploy.py](deploy.py) 的 nginx 模板中，重新部署会自动应用，无需手动修改。

```bash
# 1. 备份
cp /etc/nginx/conf.d/vben.conf /etc/nginx/conf.d/vben.conf.bak.$(date +%s)

# 2. 在 server 块内添加 client_max_body_size
sed -i '/server_name _;/a\    client_max_body_size 50M;' /etc/nginx/conf.d/vben.conf

# 3. 验证 + 重启
nginx -t && systemctl restart nginx
```

**验证**:

```bash
# 修复后 2MB 文件应返回 401（被后端业务正常处理，不再被 nginx 拦截）
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://10.254.253.187/api/v1/me/claims -F "attachment=@/tmp/test.bin"
# 预期输出: 401
```

---

## 项目文件结构

```
vue-vben-admin/
├── apps/
│   └── web-ele/                    # 前端应用
│       ├── src/                    # 源代码
│       ├── dist/                   # 构建产物（部署时使用）
│       ├── dist.zip                # 构建产物压缩包
│       ├── package.json            # 项目依赖配置
│       └── vite.config.ts          # Vite 配置（含 API 代理）
├── packages/                       # 共享包
├── internal/                       # 内部工具配置
├── deploy.py                       # 一键部署脚本
├── check_api.py                    # API 检查脚本
├── check_backend.py                # 后端检查脚本
├── debug_nginx.py                  # Nginx 调试脚本
├── fix_nginx.py                    # Nginx 配置修复脚本
├── fix_nginx_conf.py               # Nginx 配置文件修复脚本
├── fix_selinux.py                  # SELinux 修复脚本
└── package.json                    # 根项目配置
```

---

## 辅助脚本说明

项目提供了多个辅助脚本用于运维排查：

| 脚本 | 用途 |
|------|------|
| [check_api.py](check_api.py) | 检查 API 接口连通性和服务状态 |
| [check_backend.py](check_backend.py) | 检查后端服务运行状态 |
| [debug_nginx.py](debug_nginx.py) | 调试 Nginx 配置和日志 |
| [fix_nginx.py](fix_nginx.py) | 一键修复 Nginx 配置 |
| [fix_nginx_conf.py](fix_nginx_conf.py) | 修复 Nginx 默认配置冲突 |
| [fix_selinux.py](fix_selinux.py) | 临时关闭 SELinux |

使用方式：

```bash
python3 check_api.py
python3 debug_nginx.py
```

---

## 部署成功验证

部署完成后，通过以下方式验证：

### 浏览器访问

打开浏览器访问：`http://10.254.253.187:80`

- ✅ 应看到登录页面（fuxi-hr-manager）
- ✅ 使用用户名 `admin` 和密码 `Cisco@123` 可登录
- ✅ 登录后可正常访问各个功能模块

### 命令行验证

```bash
# 检查页面响应
curl -I http://10.254.253.187:80/

# 检查 API 响应
curl -s -X POST http://10.254.253.187:80/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Cisco@123"}'
```

---

## 更新部署流程

当代码有更新时，只需重复以下步骤：

```bash
# 1. 本地构建
pnpm build

# 2. 执行部署脚本
python3 deploy.py
```

部署脚本会自动备份旧文件并部署新版本。

---

## 注意事项

1. **安全警告**: 部署脚本中包含明文密码，请在生产环境中使用 SSH 密钥登录
2. **备份**: 每次部署前会自动备份旧文件到 `/usr/share/nginx/html_backup_<timestamp>/`
3. **端口冲突**: 确保 80 端口未被其他服务占用
4. **后端服务**: 部署前确保后端服务（端口 8999）已启动并正常运行
5. **静态资源缓存**: 静态文件设置了 1 年缓存，更新时文件名会带 hash，无需手动清理缓存
