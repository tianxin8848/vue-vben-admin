import paramiko
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('10.254.253.187', username='root', password='Alp35982040', timeout=10)
    print('SSH connected successfully')
    
    sftp = ssh.open_sftp()
    local_path = '/Users/xi/Documents/github/7-13/vue-vben-admin/apps/web-ele/dist.zip'
    remote_path = '/root/dist.zip'
    
    sftp.put(local_path, remote_path)
    print(f'File transferred successfully to {remote_path}')
    sftp.close()
    
    commands = [
        'rm -rf /root/dist',
        'unzip -o /root/dist.zip -d /root/dist',
        'rm -rf /usr/share/nginx/html/*',
        'cp -r /root/dist/* /usr/share/nginx/html/',
        'chown -R nginx:nginx /usr/share/nginx/html/',
        'chmod -R 755 /usr/share/nginx/html/',
        'nginx -t',
        'systemctl restart nginx',
        'sleep 2',
        'curl -s -X POST http://localhost:80/api/v1/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"Cisco@123"}\''
    ]
    
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
        print(f'=== {cmd} ===')
        output = stdout.read().decode('utf-8')
        print(output)
        err = stderr.read().decode('utf-8')
        if err:
            print(f'Error: {err}')
    
    ssh.close()
    print('Done')
except Exception as e:
    print(f'Error: {e}')
