"""Run the unmodified production CLI with real age/yq/Mihomo inside Linux namespaces."""
from pathlib import Path
import argparse,contextlib,hashlib,http.server,json,os,shutil,signal,ssl,subprocess,sys,tempfile,threading,time,urllib.request,zipfile

ROOT=Path(__file__).resolve().parents[2]
CACHE=ROOT/'.cache/gist-sync/tools'
BUILD=ROOT/'build/gist-sync'
IP='93.184.216.34'
URL='https://gist.githubusercontent.com/fixture/0123456789abcdef/raw/config.age'
SHA=lambda b:hashlib.sha256(b).hexdigest()
RESULTS=[]

def call(args,**kwargs):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,**kwargs)
    if p.returncode:raise RuntimeError('Command failed: '+str(args[0])+' exit '+str(p.returncode)+' '+p.stderr.decode(errors='replace')[-500:])
    return p.stdout

class Fixture:
    def __init__(self,base):
        self.jail=base/'root';self.test=self.jail/'test';self.clash=self.jail/'data/clash';self.payload=b'';self.http_status=200;self.requests=0
        for name in ['usr','lib','lib64','bin','proc','dev','etc/ssl/certs','etc','test','tmp','sdcard','data/clash/Tools','data/clash/Proxy','data/clash/Policy','data/clash/Scripts']:(self.jail/name).mkdir(parents=True,exist_ok=True)
        for name in ['usr','lib','lib64','bin']:
            call(['mount','--bind','/'+name,str(self.jail/name)]);call(['mount','-o','remount,bind,ro',str(self.jail/name)])
        (self.jail/'etc/alternatives').mkdir()
        (self.jail/'etc/alternatives/awk').symlink_to(str(Path(shutil.which('awk')).resolve()))
        call(['mount','-t','proc','proc',str(self.jail/'proc')])
        for name,minor in [('null','3'),('urandom','9'),('random','8')]:call(['mknod',str(self.jail/'dev'/name),'c','1',minor]);os.chmod(self.jail/'dev'/name,0o666)
        (self.jail/'dev/fd').symlink_to('/proc/self/fd')
        (self.jail/'etc/hosts').write_text('127.0.0.1 localhost\n'+IP+' gist.githubusercontent.com\n')
        (self.jail/'etc/nsswitch.conf').write_text('hosts: files dns\n');(self.jail/'etc/resolv.conf').write_text('nameserver 127.0.0.1\n')
        (self.jail/'sdcard/ufi_tools_boot.sh').write_text('#!/bin/sh\n# unrelated startup preserved\n')
        for src,relative in [(BUILD/'bin/kano-gist-sync-linux-amd64','Tools/kano-gist-sync'),(CACHE/'age-amd64/age','Tools/age'),(CACHE/'yq-linux-amd64','Tools/yq_linux_arm64'),(CACHE/'mihomo-linux-amd64','Proxy/Clash.Core'),(BUILD/'clash/Scripts/Clash.ConfigCommit','Scripts/Clash.ConfigCommit'),(ROOT/'gist-sync/Clash.GistSync','Scripts/Clash.GistSync')]:
            shutil.copyfile(src,self.clash/relative);os.chmod(self.clash/relative,0o755)
        shutil.copyfile(self.clash/'Scripts/Clash.ConfigCommit',self.test/'commit-real.sh')
        (self.clash/'Scripts/Clash.ConfigCommit').write_text('#!/bin/sh\nsh /test/commit-real.sh "$@" >/test/commit.stdout 2>/test/commit.stderr\nrc=$?\ncat /test/commit.stdout\nexit "$rc"\n')
        shutil.copyfile(ROOT/'tests/gist-sync/service-integration.py',self.test/'service.py')
        (self.clash/'Scripts/Clash.Service').write_text('#!/bin/sh\nexec python3 /test/service.py "$@"\n')
        (self.clash/'Policy/options.conf').write_text('traffic_mode=off\nipv6=off\n')
        (self.clash/'Tools/config_source.conf').write_text('KANO_CONFIG_SOURCE=uploaded_config\n')
        config={'external-controller':'127.0.0.1:7788','secret':'isolated-fixture-secret','mixed-port':7890,'allow-lan':True,'ipv6':False,'mode':'rule','log-level':'silent','proxies':[],'rules':['MATCH,DIRECT']}
        (self.clash/'Proxy/config.yaml').write_text(json.dumps(config))
        (self.clash/'Proxy/WebUI/zashboard').mkdir(parents=True);(self.clash/'Proxy/WebUI/zashboard/index.html').write_text('<title>zashboard</title>')
        with zipfile.ZipFile(ROOT/'tproxy-yq.zip') as z:
            for name in ['Proxy/GeoIP.dat','Proxy/GeoSite.dat']:
                if name in z.namelist():(self.clash/name).write_bytes(z.read(name))
        call(['openssl','req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(self.test/'tls.key'),'-out',str(self.test/'tls.crt'),'-days','1','-subj','/CN=gist.githubusercontent.com','-addext','subjectAltName=DNS:gist.githubusercontent.com,IP:93.184.216.34'])
        shutil.copyfile(self.test/'tls.crt',self.jail/'etc/ssl/certs/ca-certificates.crt')
        call([str(CACHE/'age-amd64/age-keygen'),'-o',str(self.test/'identity.txt')]);os.chmod(self.test/'identity.txt',0o600)
        self.identity=next(s for s in (self.test/'identity.txt').read_text().splitlines() if s.startswith('AGE-SECRET-KEY-1'))
        self.recipient=call([str(CACHE/'age-amd64/age-keygen'),'-y',str(self.test/'identity.txt')]).decode().strip()
        fixture=self
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                fixture.requests+=1
                if getattr(fixture,'hold',False) and '/held.age' in self.path:
                    (fixture.test/'download-held').write_text('1');fixture.release.wait(30)
                data=fixture.payload;status=fixture.http_status
                if self.path.startswith('/manual.yaml'):
                    if 'unavailable' in self.path:status=503
                    data=json.dumps({'proxies':[{'name':'manual-node','type':'ss','server':'example.test','port':443,'cipher':'aes-128-gcm','password':'isolated-fixture'}]}).encode()
                self.send_response(status);self.send_header('Content-Length',str(len(data)));self.end_headers()
                try:self.wfile.write(data)
                except (BrokenPipeError,ssl.SSLError):pass
            def log_message(self,*args):pass
        self.server=http.server.ThreadingHTTPServer((IP,443),Handler)
        context=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);context.load_cert_chain(self.test/'tls.crt',self.test/'tls.key');self.server.socket=context.wrap_socket(self.server.socket,server_side=True)
        threading.Thread(target=self.server.serve_forever,daemon=True).start()
        self.remote(1)
    def cli(self,*args,input=None,allow_error=False,env=None):
        env=env or getattr(self,'driverenv',None)
        proc=subprocess.run(['chroot',str(self.jail),'/data/clash/Tools/kano-gist-sync',*args],input=input,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60,env=env)
        try:result=json.loads(proc.stdout)
        except Exception:raise RuntimeError('CLI response invalid: '+proc.stderr.decode(errors='replace')[-300:])
        if proc.returncode and not allow_error:raise RuntimeError('CLI failed '+str(args[0])+': '+str(result.get('code')))
        return result
    def dispatch(self,action,request=None,env=None):
        key=self.cli('request-key',env=env)
        sealed=call(['node',str(ROOT/'tests/gist-sync/seal-request.js')],cwd=ROOT,input=json.dumps({'key':key,'action':action,'request':request or {}}).encode())
        return self.cli('dispatch-sealed',action,input=sealed,allow_error=True,env=env)
    def wait_job(self,id,timeout=45):
        deadline=time.monotonic()+timeout
        while time.monotonic()<deadline:
            job=self.cli('job',id,allow_error=True)
            if job.get('status') in ['finished','completion_unknown']:return job
            time.sleep(.05)
        raise RuntimeError('Native job did not reach a terminal state')
    def action(self,action,request=None,expect=None,env=None):
        started=self.dispatch(action,request,env)
        if not started.get('job'):raise RuntimeError('Native dispatch rejected: '+str(started.get('code')))
        job=self.wait_job(started['job']);out=job.get('result',{})
        if expect is not None and out.get('code')!=expect:raise RuntimeError('Expected '+expect+', got '+str(out.get('code'))+' warning '+str(out.get('warning')))
        return out
    def save(self,**values):
        settings=self.cli('status')['settings'];req={'url':URL,'identity':self.identity,'auto':False,'intervalHours':6,'revision':settings.get('revision',0)};req.update(values)
        return self.action('save',req,expect='settings_saved')
    def remote(self,generation,plain=None,wrong=False):
        self.plain=(plain if plain is not None else json.dumps({'proxies':[],'rules':['MATCH,DIRECT'],'log-level':'silent','x-fixture-generation':generation}).encode())
        self.payload=call([str(CACHE/'age-amd64/age'),'-r',self.recipient],input=self.plain)
    def due(self):
        # Exercise an actually due run without waiting an hour or changing the production clock.
        for name,field in [('settings.conf','savedAt'),('state.json','lastChecked')]:
            path=self.clash/'Tools/gist-sync'/name;value=json.loads(path.read_text());value[field]='2020-01-01T00:00:00Z';staged=path.with_suffix('.test-new');staged.write_text(json.dumps(value));os.chmod(staged,0o600);os.replace(staged,path)
    def config_hash(self):return SHA((self.clash/'Proxy/config.yaml').read_bytes())
    def wait_file(self,name,timeout=15):
        deadline=time.monotonic()+timeout
        while time.monotonic()<deadline:
            if (self.test/name).exists():return
            time.sleep(.05)
        raise RuntimeError('Expected observation missing: '+name)
    def api(self,path='/configs'):
        req=urllib.request.Request('http://127.0.0.1:7788'+path,headers={'Authorization':'Bearer isolated-fixture-secret'})
        with urllib.request.urlopen(req,timeout=3) as r:return json.load(r)
    def service(self,*args):return call(['chroot',str(self.jail),'python3','/test/service.py',*args])
    def close(self):
        with contextlib.suppress(Exception):self.cli('stop-daemon')
        with contextlib.suppress(Exception):self.cli('stop-jobs')
        with contextlib.suppress(Exception):self.service('stop')
        self.server.shutdown();self.server.server_close()
        for name in ['proc','bin','lib64','lib','usr']:call(['umount',str(self.jail/name)])

def check(name,body):
    start=time.monotonic();body();RESULTS.append({'name':name,'category':'INTEGRATION','result':'PASS','seconds':round(time.monotonic()-start,3)});print('PASS INTEGRATION '+name,flush=True)

def inside():
    assert os.geteuid()==0 and os.getpid()==1, 'Private PID namespace required'
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({})))
    call(['mount','--make-rprivate','/']);call(['ip','link','set','lo','up']);call(['ip','addr','add',IP+'/32','dev','lo'])
    base=Path(tempfile.mkdtemp(prefix='integration-',dir=BUILD));os.chmod(base,0o700)
    call(['mount','-t','tmpfs','-o','size=512m,mode=0700','gist-sync-integration',str(base)])
    fixture=None
    try:
        fixture=Fixture(base);f=fixture
        def initialized_status():
            f.cli('start-daemon')
            status=f.cli('status');assert not status.get('fingerprintError'),status.get('fingerprintError')
            assert all(status['currentFingerprint'].values())
            assert not status['schedulerRunning']
        check('post-install initialization makes first read-only fingerprint available',initialized_status)
        def crypto_and_save():
            out=f.action('test',{'url':URL,'identity':f.identity,'intervalHours':6,'auto':False},expect='test_passed');assert out['downloaded'] and out['decrypted'] and out['validated'] and not out['written']
            f.save();assert f.config_hash()==before
        before=f.config_hash();check('production CLI HTTPS download, genuine age decrypt, YAML and Mihomo -t',crypto_and_save)
        def stopped_commit():
            out=f.action('sync',expect='saved_stopped');assert out['written'] and not out['loaded']
            result=json.loads(call([str(CACHE/'yq-linux-amd64'),'e','-o=json','.',str(f.clash/'Proxy/config.yaml')]))
            assert result['x-fixture-generation']==1
            assert result['secret']=='isolated-fixture-secret'
            assert f.config_hash()!=before
            state=json.loads((f.clash/'Tools/gist-sync/state.json').read_text());assert state['last']['ok'] and state['candidateHash']==state['applied']['config']
        check('real files, backup, atomic commit and matching state while stopped',stopped_commit)
        f.service('start');pid=(f.test/'core.pid').read_text()
        def loaded_commit():
            f.remote(2);out=f.action('sync',expect='synced');assert out['loaded'] and out['runtimeVerified'];assert (f.test/'core.pid').read_text()==pid;assert f.api()['mode']=='rule'
        check('genuine Mihomo hot reload and runtime confirmation',loaded_commit)
        def one_click_apply():
            f.remote(21)
            before=f.cli('status');req={'url':URL,'identity':f.identity,'auto':True,'intervalHours':1,'revision':before['settings']['revision'],'replaceLocal':True,'expectedLocal':before['currentFingerprint']}
            out=f.action('apply',req,expect='synced')
            assert out['ok'] and out['settingsSaved'] and out['written'] and out['loaded'] and out['runtimeVerified']
            assert (f.test/'core.pid').read_text()==pid
            status=f.cli('status');assert status['settings']['auto'] and status['settings']['intervalHours']==1 and status['schedulerRunning']
            state=json.loads((f.clash/'Tools/gist-sync/state.json').read_text());assert state['candidateHash']==state['applied']['config']
            req['revision']=status['settings']['revision'];req['identity']='';out=f.action('apply',req,expect='up_to_date');assert out['settingsSaved'] and out['loaded']
            bad=dict(req,identity='AGE-SECRET-KEY-1'+'A'*58,revision=f.cli('status')['settings']['revision'])
            stable=f.config_hash();saved=f.cli('status')['settings'];out=f.action('apply',bad,expect='age_decrypt_failed')
            assert not out['ok'] and not out.get('settingsSaved') and f.config_hash()==stable and f.cli('status')['settings']==saved
            f.action('disable',expect='auto_disabled');f.remote(2);f.action('apply',dict(req,auto=False,revision=f.cli('status')['settings']['revision']),expect='synced')
        check('single Apply saves credentials, commits and hot loads YAML, starts one scheduler and rejects wrong keys',one_click_apply)
        def unchanged():
            f.remote(2);out=f.action('sync',expect='up_to_date');assert out['loaded'];assert (f.test/'core.pid').read_text()==pid
        check('reencrypted unchanged config keeps genuine core PID',unchanged)
        def manual_merge():
            u='https://93.184.216.34/manual.yaml'
            document={'proxies':[{'name':'remote-node','type':'ss','server':'remote.example.test','port':443,'cipher':'aes-128-gcm','password':'isolated-fixture'}],
                'proxy-groups':[{'name':'Proxy','type':'select','proxies':['remote-node','DIRECT']}],'rules':['MATCH,Proxy'],'x-fixture-generation':30}
            def config():return json.loads(call([str(CACHE/'yq-linux-amd64'),'e','-o=json','.',str(f.clash/'Proxy/config.yaml')]))
            def update(sources,expect='synced'):
                return f.action('sync',{'revision':f.cli('status')['settings']['revision'],'manualSources':sources},expect=expect)
            f.remote(30,plain=json.dumps(document).encode())
            out=update([{'url':u,'enabled':True},{'url':u+'#duplicate','enabled':True}]);assert out['loaded'] and out['runtimeVerified']
            c=config();names=c['x-f50-gist-manual-providers'];assert len(names)==1 and len(c['proxy-providers'])==1
            assert c['proxies']==document['proxies'] and c['rules']==document['rules'] and c['proxy-groups'][0]['use']==names
            assert f.cli('status')['gistActive'];stable=f.config_hash()
            observed=f.api('/providers/proxies')['providers'][names[0]]['proxies'];assert [p['name'] for p in observed]==['manual-node']
            for _ in range(3):f.action('sync',expect='up_to_date');assert f.config_hash()==stable
            assert (f.test/'core.pid').read_text()==pid
            old=f.config_hash();failed=update([{'url':u+'?unavailable=1','enabled':True}],expect='manual_provider_update_failed')
            assert not failed['ok'] and failed['warning']=='old_config_restored' and f.config_hash()==old
            assert 'unavailable' in (f.clash/'Proxy/subscription_urls.txt').read_text()
            update([{'url':u,'enabled':True}],expect='up_to_date')
            # Background scheduler executes the same production merge without a browser.
            document['x-fixture-generation']=31;f.remote(31,plain=json.dumps(document).encode());f.save(auto=True,intervalHours=1);f.due()
            deadline=time.monotonic()+20
            while time.monotonic()<deadline:
                if config().get('x-fixture-generation')==31:break
                time.sleep(.1)
            else:raise AssertionError('background merge not observed')
            assert config()['x-f50-gist-manual-providers']==names and len(config()['proxy-providers'])==1
            f.action('disable',expect='auto_disabled')
            # When upstream gains the same URL, prefer its definition and remove the overlay reference.
            document['proxy-providers']={'remote-provider':{'type':'http','url':u,'path':'./proxies/remote-provider.yaml','interval':3600,'proxy':'DIRECT'}}
            document['proxy-groups'][0]['use']=['remote-provider'];f.remote(32,plain=json.dumps(document).encode());f.action('sync',expect='synced')
            c=config();assert list(c['proxy-providers'])==['remote-provider'] and 'x-f50-gist-manual-providers' not in c
            assert c['proxy-groups'][0]['use']==['remote-provider']
            update([{'url':u,'enabled':False}],expect='up_to_date');assert list(config()['proxy-providers'])==['remote-provider']
            update([],expect='up_to_date');assert config()['proxies']==document['proxies']
            f.remote(2);f.action('sync',expect='synced');assert 'proxy-providers' not in config()
        check('manual sources survive background Gist updates; URL deduplication, upstream adoption, disable and removal preserve remote nodes and rules',manual_merge)
        stable=f.config_hash()
        def invalid_yaml():
            f.remote(3,plain=b'rules: [\n');out=f.action('sync');assert not out['ok'];assert f.config_hash()==stable
        check('real age decrypt followed by invalid YAML preserves current files',invalid_yaml)
        def invalid_cipher():
            f.payload=b'age-encryption.org/v1\nbroken\n';out=f.action('sync');assert not out['ok'] and not out['decrypted'];assert f.config_hash()==stable
        check('corrupt ciphertext never reaches commit',invalid_cipher)
        f.remote(2)
        def conflict():
            p=f.clash/'Proxy/config.yaml';p.write_text(p.read_text()+'\nx-user-local-change: keep\n');changed=f.config_hash();f.remote(3);out=f.action('sync',expect='local_config_conflict');assert f.config_hash()==changed
        check('local edit conflict is never silently overwritten',conflict)
        # Restore the fixture's own local edit, never a production file.
        p=f.clash/'Proxy/config.yaml';p.write_text(p.read_text().replace('\nx-user-local-change: keep\n',''))
        def wrong_key():
            other=f.test/'other.txt';call([str(CACHE/'age-amd64/age-keygen'),'-o',str(other)])
            identity=next(s for s in other.read_text().splitlines() if s.startswith('AGE-SECRET-KEY-1'))
            old=f.config_hash();out=f.action('test',{'url':URL,'identity':identity},expect='age_decrypt_failed');assert not out['ok'] and f.config_hash()==old
        check('genuine age rejects wrong identity without a configuration write',wrong_key)
        def truncated_cipher():
            f.remote(4);f.payload=f.payload[:-20];old=f.config_hash();out=f.action('sync',expect='age_decrypt_failed');assert not out['ok'] and f.config_hash()==old
        check('genuine age rejects truncated authenticated ciphertext',truncated_cipher)
        f.remote(4)
        def http_failure():
            old=f.config_hash();f.http_status=503
            try:out=f.action('sync',expect='http_503');assert not out['ok'] and f.config_hash()==old
            finally:f.http_status=200
        check('real HTTPS 503 retries then preserves configuration',http_failure)
        def cancelled_download():
            f.save(url=URL.replace('config.age','held.age'));f.hold=True;f.release=threading.Event();old=f.config_hash()
            job=f.dispatch('sync')['job'];f.wait_file('download-held');f.cli('cancel',job,allow_error=True);f.release.set();out=f.wait_job(job)['result'];assert not out['ok'] and f.config_hash()==old
            f.hold=False;(f.test/'download-held').unlink();f.save()
        check('real in-flight HTTPS cancellation cannot commit',cancelled_download)
        def source_switch():
            f.save(url=URL.replace('config.age','held.age'));f.hold=True;f.release=threading.Event();old=f.config_hash()
            job=f.dispatch('sync')['job'];f.wait_file('download-held');f.save(url=URL.replace('config.age','new.age'));f.release.set();out=f.wait_job(job)['result'];assert not out['ok'] and f.config_hash()==old
            f.hold=False;(f.test/'download-held').unlink();f.save()
        check('source revision change fences the old downloader before commit',source_switch)
        def crash(stage):
            f.remote(10);old=(f.clash/'Proxy/config.yaml').read_bytes();original=(f.clash/'Tools/kano-gist-sync').read_bytes()
            testbin=f.clash/'Tools/test.new';shutil.copyfile(BUILD/'bin/native.test',testbin);os.chmod(testbin,0o755);os.replace(testbin,f.clash/'Tools/kano-gist-sync')
            env=dict(os.environ,F50_TEST_INTEGRATION_CLI='1',F50_TEST_PAUSE_STAGE=stage)
            try:
                started=f.dispatch('sync',env=env);assert started.get('job'),started.get('code');f.wait_file('paused')
                job=json.loads((f.clash/('Tools/gist-sync/jobs/'+started['job']+'.json')).read_text());pid=job['process']['pid']
                activation=f.clash/'Tools/gist-sync/activation'
                assert (f.test/'paused').read_text()==stage
                if stage in ['before_commit','after_commit','before_state_record']:assert activation.exists(),stage+' journal missing while paused'
                if activation.exists():
                    assert (activation/'config.yaml').read_bytes()==old
                    print('OBSERVATION pause='+stage+' phase='+json.loads((activation/'journal.json').read_text())['phase'],flush=True)
                os.kill(pid,signal.SIGKILL);time.sleep(.1)
            finally:
                # Replace by rename: stopped process may still hold the test executable.
                tmp=f.clash/'Tools/production.new';tmp.write_bytes(original);os.chmod(tmp,0o755);os.replace(tmp,f.clash/'Tools/kano-gist-sync');(f.test/'paused').unlink(missing_ok=True)
            if stage=='before_state_record':assert activation.exists(),'verified journal vanished after SIGKILL'
            receipt=f.cli('job',started['job'],allow_error=True);assert receipt['status']=='completion_unknown'
            recovered=f.cli('recover',allow_error=True)
            if stage=='before_state_record':
                assert recovered.get('code')=='commit_finalized',recovered;assert f.config_hash()!=SHA(old)
                state=json.loads((f.clash/'Tools/gist-sync/state.json').read_text());assert state['applied']==f.cli('status')['currentFingerprint']
            else:
                assert recovered.get('ok'),recovered;assert (f.clash/'Proxy/config.yaml').read_bytes()==old
            assert not activation.exists()
        for stage in ['download_complete','decrypt_complete','before_commit','after_commit','before_state_record']:
            check('SIGKILL recovery at '+stage,lambda stage=stage:crash(stage))
        def disk_failure():
            f.remote(11);old=f.config_hash();target=f.clash/'Proxy';call(['mount','--bind',str(target),str(target)]);call(['mount','-o','remount,bind,ro',str(target)])
            try:out=f.action('sync');assert not out['ok'] and f.config_hash()==old
            finally:call(['umount',str(target)])
            recovered=f.cli('recover',allow_error=True);assert recovered['ok'];assert f.config_hash()==old
        check('actual read-only configuration filesystem fails safely and recovers',disk_failure)
        def reload_failure():
            f.remote(13);old=(f.clash/'Proxy/config.yaml').read_bytes();original=(f.clash/'Tools/kano-gist-sync').read_bytes()
            tmp=f.clash/'Tools/test.new';shutil.copyfile(BUILD/'bin/native.test',tmp);os.chmod(tmp,0o755);os.replace(tmp,f.clash/'Tools/kano-gist-sync')
            f.driverenv=dict(os.environ,F50_TEST_INTEGRATION_CLI='1',F50_TEST_PAUSE_STAGE='after_commit',F50_TEST_WAIT_GATE='1')
            try:
                job=f.dispatch('sync')['job'];f.wait_file('paused');f.service('stop');(f.test/'deny-restart').write_text('1');(f.test/'release').write_text('1')
                out=f.wait_job(job)['result'];assert not out['ok'];assert not out['runtimeVerified'];assert (f.clash/'Proxy/config.yaml').read_bytes()==old
                assert (f.clash/'Tools/gist-sync/activation').exists()
            finally:
                f.driverenv=None;tmp=f.clash/'Tools/production.new';tmp.write_bytes(original);os.chmod(tmp,0o755);os.replace(tmp,f.clash/'Tools/kano-gist-sync')
                for name in ['paused','release','deny-restart']:(f.test/name).unlink(missing_ok=True)
            recovered=f.cli('recover');assert recovered['code']=='interrupted_transaction_restored';assert (f.clash/'Proxy/config.yaml').read_bytes()==old;assert f.api()['mode']=='rule'
        check('genuine API connection loss, denied restart, rollback and later recovery',reload_failure)
        def scheduler():
            f.remote(12);f.save(auto=True,intervalHours=1)
            runtime=f.jail/'dev/kano_gist_sync';records=list((f.jail/'dev').rglob('daemon.json'));assert len(records)==1
            record=json.loads(records[0].read_text());pid=record['pid'];os.kill(pid,0)
            # Persisted deadlines are moved into the past, without changing the
            # production clock or shortening the production scheduling interval.
            f.due();deadline=time.monotonic()+15
            while time.monotonic()<deadline:
                st=json.loads((f.clash/'Tools/gist-sync/state.json').read_text())
                if st['last'].get('code') in ['synced','up_to_date'] and st.get('applied',{})==f.cli('status')['currentFingerprint']:
                    result=json.loads(call([str(CACHE/'yq-linux-amd64'),'e','-o=json','.',str(f.clash/'Proxy/config.yaml')]))
                    if result.get('x-fixture-generation')==12:break
                time.sleep(.1)
            else:raise AssertionError('Detached scheduler did not apply the due configuration')
            for _ in range(2):f.save(auto=True,intervalHours=12)
            assert json.loads(records[0].read_text())['pid']==pid
            assert (f.jail/'sdcard/ufi_tools_boot.sh').read_text().count('# KANO_GIST_SYNC_BEGIN')==1
            f.cli('stop-daemon');f.cli('boot');assert len(list((f.jail/'dev').rglob('daemon.json')))==1
            assert f.cli('status')['settings']['intervalHours']==12
            f.action('disable');assert not records[0].exists();assert not f.cli('status')['settings']['auto']
            # Recovery remains available at boot even when scheduled sync is off.
            f.cli('boot');assert not records[0].exists()
            before=f.requests;time.sleep(6);assert f.requests==before
        check('detached daemon, due work, repeated saves, boot hook and disable',scheduler)
        def private_cleanup():
            for p in f.clash.rglob('*'):
                if p.is_file() and p.name not in ['identity.txt'] and p.suffix not in ['.yaml','.age']:
                    assert f.identity.encode() not in p.read_bytes(),'Identity leaked into '+p.name
            assert not list((f.clash/'Tools/gist-sync/work').iterdir())
        check('private identity absent from logs, receipts and leftover work',private_cleanup)
        (ROOT/'reports/gist-sync/integration.json').write_text(json.dumps({'binary_sha256':SHA((BUILD/'bin/kano-gist-sync-linux-amd64').read_bytes()),'components':'genuine production CLI, age, yq, Mihomo; local TLS fixture; isolated Off service adapter','tests':RESULTS},indent=2)+'\n')
    except Exception:
        if fixture:
            for name in ['commit.stdout','commit.stderr','mihomo.log']:
                p=fixture.test/name
                if p.exists():print('DIAGNOSTIC '+name+' '+p.read_text()[-2500:],flush=True)
        raise
    finally:
        if fixture:
            with contextlib.suppress(Exception):fixture.close()
        # Never recurse through a bound system directory, including partial setup failures.
        for name in ['proc','bin','lib64','lib','usr']:
            target=base/'root'/name
            if os.path.ismount(target):call(['umount','-l',str(target)])
        if os.path.ismount(base):call(['umount','-l',str(base)])
        if base.resolve().is_relative_to(BUILD.resolve()) and not os.path.ismount(base):shutil.rmtree(base)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--inside',action='store_true');args=parser.parse_args()
    if args.inside:inside()
    else:
        if sys.platform!='linux':raise SystemExit('Run under Linux/WSL with mount, network and PID namespaces')
        subprocess.run(['unshare','-m','-n','-p','-f','--mount-proc',sys.executable,str(Path(__file__).resolve()),'--inside'],check=True)
