"""Capture commands, outputs and exit status for the current repository run."""
from pathlib import Path
import datetime,hashlib,json,os,re,subprocess,time

ROOT=Path(__file__).resolve().parents[1]
LOGS=ROOT/'reports/gist-sync/logs'

def redact(text):
    lines=[]
    for line in text.splitlines():
        try:
            value=json.loads(line)
            error=value.get('result',{}).get('error','') if isinstance(value,dict) else ''
            begin=error.find('- fill(');end=error.find('- attempting fill action',begin)
            if begin>=0 and end>begin:
                value['result']['error']=error[:begin]+'[EDITOR_INPUT_REDACTED]\n'+error[end:]
                line=json.dumps(value,ensure_ascii=False)
        except (ValueError,TypeError,AttributeError):pass
        lines.append(line)
    text='\n'.join(lines)+('\n' if text.endswith('\n') else '')
    text=re.sub(r'AGE-SECRET-KEY-1[A-Z0-9]{58}', '[REDACTED_AGE_IDENTITY]',text)
    return re.sub(r'https://gist\.githubusercontent\.com/[^\s"\'<>]+', '[USER_GIST_RAW_URL]',text)

def run(name,category,command,*,cwd=ROOT,env=None,input=None,timeout=600):
    LOGS.mkdir(parents=True,exist_ok=True)
    started=datetime.datetime.now(datetime.timezone.utc).isoformat()
    tick=time.monotonic()
    try:
        result=subprocess.run(command,cwd=cwd,env=env,input=input,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout)
        stdout,stderr,code=result.stdout,result.stderr,result.returncode
    except subprocess.TimeoutExpired as error:
        stdout,stderr,code=error.stdout or b'',(error.stderr or b'')+b'\nEvidence runner timeout\n',124
    identifier=str(time.time_ns())+'-'+re.sub(r'[^A-Za-z0-9_-]','_',name)
    out=LOGS/(identifier+'.stdout.log');err=LOGS/(identifier+'.stderr.log')
    out.write_text(redact(stdout.decode('utf-8',errors='replace')),encoding='utf-8')
    err.write_text(redact(stderr.decode('utf-8',errors='replace')),encoding='utf-8')
    entry={'name':name,'category':category,'command':[redact(str(x)) for x in command],
           'cwd':str(cwd),'platform':os.name,'started':started,'elapsed_seconds':round(time.monotonic()-tick,3),
           'exit_code':code,'result':'PASS' if code==0 else 'FAIL','stdout':str(out.relative_to(ROOT)),
           'stderr':str(err.relative_to(ROOT)),'environment':{k:(env or os.environ).get(k) for k in ['GOOS','GOARCH','CGO_ENABLED']},
           'plugin_sha256':hashlib.sha256((ROOT/'猫猫TProxy.js').read_bytes()).hexdigest()}
    with (ROOT/'reports/gist-sync/evidence.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(entry,ensure_ascii=False)+'\n')
    print(f'{entry["result"]} {category} {name}: exit={code}, {entry["elapsed_seconds"]}s',flush=True)
    if code:print(redact(stderr.decode('utf-8',errors='replace'))[-1200:],flush=True)
    return entry
