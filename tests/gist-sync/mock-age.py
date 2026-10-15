#!/usr/bin/env -S python3 -S
"""Protocol test double, NOT age cryptography. SIM-AGE fixtures are plaintext."""
import hashlib, json, sys
if sys.argv[1:] == ['--version']:
 print('v1.3.2');sys.exit(0)
try:
 assert sys.argv[1:3] == ['--decrypt','--identity']
 key=open(sys.argv[3],'rb').read().strip()
 cipher=open(sys.argv[4],'rb').read()
 magic,keyhash,digest,plain=cipher.split(b'\n',3)
 assert magic==b'SIM-AGE-TEST-ONLY'
 assert keyhash.decode()==hashlib.sha256(key).hexdigest()
 assert digest.decode()==hashlib.sha256(plain).hexdigest()
 sys.stdout.buffer.write(plain)
except Exception:
 sys.exit(1)
