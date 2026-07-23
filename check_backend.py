import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('10.254.253.187', username='root', password='Alp35982040', timeout=10)
    
    commands = [
        'ss -tlnp | grep 8999',
        'curl -s -X POST http://127.0.0.1:8999/api/v1/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"Cisco@123"}\'',
        'curl -s -X POST http://localhost:8999/api/v1/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"Cisco@123"}\'',
        'cat /var/log/nginx/error.log | tail -10',
        'ping -c 1 localhost'
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
