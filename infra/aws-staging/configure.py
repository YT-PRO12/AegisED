"""Generate new staging-only secrets on the EC2 host; never print them."""
import argparse
import os
from pathlib import Path
import re
import secrets


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--domain', required=True)
    parser.add_argument('--email', required=True)
    parser.add_argument('--log-group', required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}', args.domain):
        parser.error('Use a dedicated lowercase staging DNS hostname, without scheme or path')
    if args.domain.endswith('.onrender.com') or args.domain.endswith('.neon.tech'):
        parser.error('Existing provider addresses cannot be staging hostnames')
    if not re.fullmatch(r'[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', args.email):
        parser.error('Invalid certificate contact email')
    if not re.fullmatch(r'/aegised-staging/[A-Za-z0-9_./-]+', args.log_group):
        parser.error('Use the staging stack LogGroup output')
    target = Path(__file__).with_name('.env')
    values = dict(STAGING_DOMAIN=args.domain, ACME_EMAIL=args.email, LOG_GROUP=args.log_group,
                  POSTGRES_PASSWORD=secrets.token_hex(32),
                  ML_SERVICE_TOKEN=secrets.token_hex(32), DEMO_PASSWORD=secrets.token_hex(24))
    # O_EXCL prevents accidentally rotating a database password on a populated volume.
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as output:
        output.write(''.join(f'{key}={value}\n' for key, value in values.items()))
    print('Created private staging configuration. Existing production was not contacted.')


if __name__ == '__main__':
    main()
