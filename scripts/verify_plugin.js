'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const plugin = path.join(root, '猫猫TProxy.js');
const source = fs.readFileSync(plugin);
const sourceInfo = { path: '猫猫TProxy.js', baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  bytes: source.length, sha256: crypto.createHash('sha256').update(source).digest('hex') };
const directory = path.join(root, 'tests/tproxy');
const files = ['run_tests.js', ...fs.readdirSync(directory).filter(file => file.endsWith('.test.js')).sort()];
const results = [];
for (const file of files) {
  const args = file === 'run_tests.js' ? [path.join(directory, file)]
    : ['--test', '--test-reporter=tap', '--test-concurrency=1', path.join(directory, file)];
  const run = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  const output = (run.stdout || '') + (run.stderr || '');
  let passed, failed, skipped = 0;
  const cases = [];
  if (file === 'run_tests.js') {
    const totals = output.match(/(\d+) passed \/ (\d+) failed/);
    passed = totals ? Number(totals[1]) : 0;
    failed = totals ? Number(totals[2]) : 1;
    for (const line of output.split('\n')) {
      const item = line.match(/^\s*[✅❌]\s+(.+)$/u);
      if (item) cases.push({ name: item[1].trim(), status: line.includes('✅') ? 'PASS' : 'FAIL' });
    }
  } else {
    const count = name => Number(output.match(new RegExp('^# ' + name + ' (\\d+)$', 'm'))?.[1] || 0);
    passed = count('pass'); failed = count('fail'); skipped = count('skipped');
    for (const line of output.split('\n')) {
      const item = line.match(/^(not ok|ok) \d+ - (.*?)(?: # SKIP(?: .*)?)?$/);
      if (item) cases.push({ name: item[2], status: line.includes(' # SKIP') ? 'NOT_RUN' : item[1] === 'ok' ? 'PASS' : 'FAIL' });
    }
  }
  if (run.error || run.status !== 0 || cases.length === 0) failed = Math.max(failed, 1);
  const result = { file: 'tests/tproxy/' + file, command: 'node ' + args.map(arg => arg.replace(root + path.sep, '').replace(/\\/g, '/')).join(' '),
    status: failed ? 'FAIL' : 'PASS', passed, failed, notRun: skipped, cases };
  results.push(result);
  console.log(`${result.status} ${file}: ${passed} passed, ${failed} failed, ${skipped} not run`);
  if (failed) console.log((run.error?.message || output.match(/\n  error:[\s\S]{0,1800}/)?.[0] || output.slice(-1500)).trim());
}
if (!source.equals(fs.readFileSync(plugin))) throw new Error('Plugin changed during regression tests');
const report = { date: new Date().toISOString(), platform: process.platform, node: process.version, source: sourceInfo,
  invocation: 'node scripts/verify_plugin.js', concurrency: 1,
  totals: results.reduce((sum, result) => ({ passed: sum.passed + result.passed, failed: sum.failed + result.failed, notRun: sum.notRun + result.notRun }), { passed: 0, failed: 0, notRun: 0 }), results };
const destination = path.join(root, 'reports/v9.0.0-regression.json');
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.totals));
process.exitCode = report.totals.failed ? 1 : 0;
