#!/usr/bin/env -S python3 -S
"""Test double. PyYAML is not Mike Farah yq; never deploy this file to F50."""
import json, os, sys
args=sys.argv[1:]
if '--version' in args:
 print('yq (https://github.com/mikefarah/yq/) version v4.0.0 SIMULATED'); sys.exit(0)
if '--help' in args:
 print('--yaml-fix-merge-anchor-to-spec'); sys.exit(0)
try:
 path=args[-1]
 with open(path, encoding='utf-8') as f: text=f.read()
 try: data=json.loads(text)
 except Exception:
  import glob
  sys.path.extend(glob.glob('/usr/local/lib/python*/site-packages'))
  import yaml
  data=yaml.safe_load(text)
 expression=args[-2]
 if 'tag == "!!map"' in expression:
  sys.exit(0 if isinstance(data,dict) else 1)
 if '.secret // ""' in expression:
  print(data.get('secret','')); sys.exit(0)
 if '.secret = load' in expression:
  with open(os.environ['F50_LIVE_CONFIG'],encoding='utf-8') as f: live=json.load(f)
  data['secret']=live.get('secret')
 if '.secret = strenv' in expression:
  data['secret']=os.environ['F50_FIXED_SECRET']
 # JSON is a valid YAML subset. Keep fixtures deterministic without mimicking yq formatting.
 print(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False))
except Exception:
 sys.exit(1)
