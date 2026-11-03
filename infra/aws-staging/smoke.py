"""Read-only HTTPS checks. Optional auth uses local environment, never CLI passwords."""
import argparse
import http.cookiejar
import json
import os
import urllib.error
import urllib.parse
import urllib.request


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('origin')
    a = p.parse_args()
    origin = a.origin.rstrip('/')
    u = urllib.parse.urlsplit(origin)
    if u.scheme != 'https' or not u.hostname or u.path or u.username or u.password:
        p.error('Provide an HTTPS origin only')
    if u.hostname.endswith('.onrender.com') or u.hostname.endswith('.neon.tech'):
        p.error('This script targets independent staging only')
    cookies = http.cookiejar.CookieJar()
    client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))

    def get(path, expected=200, body=None, headers=None):
        req = urllib.request.Request(origin + path, headers={'Origin': origin, **(headers or {})},
                                     data=None if body is None else json.dumps(body).encode())
        if body is not None:
            req.add_header('Content-Type', 'application/json')
        try:
            response = client.open(req, timeout=20)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            assert response.status == expected, f'{path}: HTTP {response.status}, expected {expected}'
            raw = response.read()
            return json.loads(raw) if path.startswith('/api/') else raw

    assert b'<html' in get('/').lower()
    assert get('/api/health')['data']['status'] == 'ok'
    assert get('/api/ready')['data']['database'] == 'ok'
    get('/api/users', 401)
    print('PASS: HTTPS, frontend, API liveness, database readiness, anonymous access denied')
    email, password = os.getenv('STAGING_TEST_EMAIL'), os.getenv('STAGING_TEST_PASSWORD')
    if not (email and password):
        print('SKIP: authenticated services/RBAC (set STAGING_TEST_EMAIL and STAGING_TEST_PASSWORD locally)')
        return
    login = get('/api/auth/login', body={'email': email, 'password': password})['data']
    session = next(c for c in cookies if c.name == '__Host-AegisED')
    assert session.secure and session.path == '/' and not session.domain_specified
    assert session.has_nonstandard_attr('HttpOnly') and session.get_nonstandard_attr('SameSite').lower() == 'strict'
    assert get('/api/auth/me')['data']['user']['email'] == email
    if login['user']['role'] == 'ADMIN':
        assert get('/api/services')['data']['ml'] == 'ok'
        get('/api/users')
    else:
        get('/api/users', 403)
    get('/api/auth/logout', body={}, headers={'X-CSRF-Token': login['csrfToken']})
    get('/api/auth/me', 401)
    print('PASS: login, secure session cookie, role check, logout' + (', ML readiness' if login['user']['role'] == 'ADMIN' else ''))


if __name__ == '__main__':
    main()
