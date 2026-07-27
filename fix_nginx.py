import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('10.254.253.187', username='root', password='Alp35982040', timeout=10)

    commands = [
        'cat > /etc/nginx/conf.d/vben.conf << EOF\nserver {\n    listen 80 default_server;\n    listen [::]:80 default_server;\n    server_name _;\n\n    root /usr/share/nginx/html;\n    index index.html;\n\n    location / {\n        try_files \\$uri \\$uri/ /index.html;\n    }\n\n    location /api {\n        proxy_pass http://localhost:8999;\n        proxy_set_header Host \\$host;\n        proxy_set_header X-Real-IP \\$remote_addr;\n        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\n    }\n\n    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {\n        expires 1y;\n        add_header Cache-Control "public, immutable";\n    }\n}\nEOF',
        'nginx -t',
        'systemctl restart nginx',
        'sleep 2',
        'curl -s -X POST http://localhost:80/api/v1/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"Cisco@123"}\'',
        'curl -s -X POST http://10.254.253.187:80/api/v1/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"Cisco@123"}\''
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
