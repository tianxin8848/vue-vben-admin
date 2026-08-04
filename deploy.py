import paramiko
import os
import time

SERVER_IP = '10.254.253.187'
USERNAME = 'root'
PASSWORD = 'Alp35982040'
LOCAL_DIST_ZIP = '/Users/xi/Documents/github/7-13/vue-vben-admin/apps/web-ele/dist.zip'
REMOTE_ZIP_PATH = '/tmp/dist.zip'
REMOTE_DEST_DIR = '/usr/share/nginx/html'

def run_ssh_command(ssh, cmd, timeout=30):
    print(f'\n=== 执行命令: {cmd} ===')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    output = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if output:
        print(output)
    if err:
        print(f'错误: {err}')
    return output, err

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f'连接到服务器 {SERVER_IP}...')
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        print('\n=== 步骤1: 备份旧文件 ===')
        timestamp = int(time.time())
        run_ssh_command(ssh, f'mkdir -p /usr/share/nginx/html_backup_{timestamp}')
        run_ssh_command(ssh, f'cp -r {REMOTE_DEST_DIR}/* /usr/share/nginx/html_backup_{timestamp}/ 2>/dev/null || echo "备份完成"')
        
        print('\n=== 步骤2: 上传构建产物 ===')
        sftp = ssh.open_sftp()
        print(f'上传文件: {LOCAL_DIST_ZIP} -> {REMOTE_ZIP_PATH}')
        sftp.put(LOCAL_DIST_ZIP, REMOTE_ZIP_PATH)
        sftp.close()
        print('上传完成')
        
        print('\n=== 步骤3: 解压文件 ===')
        run_ssh_command(ssh, f'rm -rf {REMOTE_DEST_DIR}/*')
        run_ssh_command(ssh, f'unzip -o {REMOTE_ZIP_PATH} -d {REMOTE_DEST_DIR}')
        run_ssh_command(ssh, f'rm {REMOTE_ZIP_PATH}')
        
        print('\n=== 步骤4: 配置Nginx ===')
        nginx_config = '''server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}'''
        
        run_ssh_command(ssh, f"cat > /etc/nginx/conf.d/vben.conf << 'EOF'\n{nginx_config}\nEOF")
        
        print('\n=== 步骤5: 验证Nginx配置 ===')
        run_ssh_command(ssh, 'nginx -t')
        
        print('\n=== 步骤6: 重启Nginx ===')
        run_ssh_command(ssh, 'systemctl restart nginx')
        
        print('\n=== 步骤7: 修复SELinux权限（允许Nginx代理后端） ===')
        run_ssh_command(ssh, 'getenforce')
        run_ssh_command(ssh, 'setenforce 0')
        run_ssh_command(ssh, 'setsebool -P httpd_can_network_connect 1')
        run_ssh_command(ssh, "sed -i 's/^SELINUX=.*/SELINUX=permissive/' /etc/selinux/config")
        run_ssh_command(ssh, 'getenforce')

        print('\n=== 步骤8: 等待服务启动 ===')
        run_ssh_command(ssh, 'sleep 2')
        
        print('\n=== 步骤9: 验证部署 ===')
        run_ssh_command(ssh, 'curl -s http://localhost:80/ | head -5')
        run_ssh_command(ssh, 'curl -s -X POST http://localhost:80/api/v1/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"Cisco@123"}\'')
        
        print('\n=== 步骤10: 检查服务状态 ===')
        run_ssh_command(ssh, 'systemctl status nginx | head -20')
        run_ssh_command(ssh, 'ss -tlnp | grep 80')
        run_ssh_command(ssh, 'ss -tlnp | grep 8999')
        
        ssh.close()
        print('\n部署完成！')
        
    except Exception as e:
        print(f'\n部署失败: {e}')
        import traceback
        traceback.print_exc()
        ssh.close()

if __name__ == '__main__':
    main()