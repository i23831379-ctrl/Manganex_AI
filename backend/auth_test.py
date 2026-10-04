import requests, sys

base = 'http://127.0.0.1:8000'

def login(username, password):
    resp = requests.post(f'{base}/api/auth/login', json={'username': username, 'password': password})
    print(f'LOGIN {username}:', resp.status_code)
    print(resp.text)
    if resp.status_code != 200:
        sys.exit(1)
    return resp.json().get('access_token')

def me(token):
    resp = requests.get(f'{base}/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    print('ME:', resp.status_code)
    print(resp.text)
    return resp

if __name__ == '__main__':
    admin_token = login('admin@manganex.ai', 'demo123')
    admin_me = me(admin_token)
    try:
        role = admin_me.json().get('role')
        print('Admin role:', role)
    except Exception:
        pass
    geo_token = login('geo@manganex.ai', 'demo123')
    geo_me = me(geo_token)
    try:
        role = geo_me.json().get('role')
        print('Geologist role:', role)
    except Exception:
        pass
