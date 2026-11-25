"""Open or seal a private answer JSON file. Requires Python cryptography."""
import argparse
import base64
import getpass
import hashlib
import json
import os
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

BUNDLE = Path(__file__).resolve().parents[1] / 'answer-data.js'
PREFIX = 'const encryptedAnswerKey = '
ROUNDS = 600_000


def key(password, salt):
    return hashlib.pbkdf2_hmac('sha256', password.encode(), salt, ROUNDS, 32)


def seal(plaintext, password):
    salt, iv = os.urandom(16), os.urandom(12)
    ciphertext = AESGCM(key(password, salt)).encrypt(iv, plaintext, None)
    payload = {name: base64.b64encode(value).decode() for name, value in
               [('salt', salt), ('iv', iv), ('ciphertext', ciphertext)]}
    BUNDLE.write_text(PREFIX + json.dumps(payload) + ';\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['open', 'seal'])
    parser.add_argument('private_file', type=Path, help='JSON file outside the repository')
    args = parser.parse_args()
    if args.private_file.resolve().is_relative_to(BUNDLE.parent):
        parser.error('Keep the private answer file outside this repository.')
    password = getpass.getpass('Workbook answer password: ')
    if args.action == 'open':
        bundle = json.loads(BUNDLE.read_text().removeprefix(PREFIX).strip().removesuffix(';'))
        salt, iv, data = (base64.b64decode(bundle[k]) for k in ('salt', 'iv', 'ciphertext'))
        args.private_file.write_bytes(AESGCM(key(password, salt)).decrypt(iv, data, None))
    else:
        data = args.private_file.read_bytes()
        json.loads(data)
        seal(data, password)
