import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect('10.254.253.187', username='root', password='Alp35982040', timeout=10)
    
    commands = [
        'getenforce',
        'setenforce 0',
        'getenforce',
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
