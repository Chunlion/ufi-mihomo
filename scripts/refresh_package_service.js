'use strict';
// Maintenance helper: bring Scripts/Clash.Service inside tproxy-yq.zip back in sync
// with the text the installer emits. Only the regions the installer rewrites are
// touched (panel guard check, panel repair line, preservation block); every other
// block stays byte identical. Idempotent.
//
//   tar -xOf tproxy-yq.zip Scripts/Clash.Service > /tmp/svc.service
//   node scripts/refresh_package_service.js /tmp/svc.service
//   python3 scripts/refresh_package_service.py /tmp/svc.service
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, '猫猫TProxy.js'), 'utf8');
function slice(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  if (from < 0 || to <= from) throw new Error(`missing markers: ${start} -> ${end}`);
  return source.slice(from, to);
}
if (!process.argv[2]) throw new Error('usage: node scripts/refresh_package_service.js <service file> [output]');
const input = process.argv[2];
const output = process.argv[3] || input;
const packaged = fs.readFileSync(input, 'utf8').replace(/\r\n/g, '\n');
const configApi = vm.runInNewContext(`${slice('const F50_PORTS', 'const F50_COMPAT_VERSION')}
  ${slice('const F50_ORIGINAL_MANAGED_KEYS', 'let f50BackendReady')}
  ${slice('function createPrivateRouteLogic()', '// SPDX-License-Identifier: AGPL-3.0-or-later')}
  ({ functions: buildF50OriginalConfigFunctions, panelCheck: buildF50PanelConfigCheck })`, {
  F50_ZASHBOARD_UI_URL: 'https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip',
});
const functions = configApi.functions();
function shellQuote(value) { return `'${value.replace(/'/g, `'"'"'`)}'`; }
// The panel guard check line, as inserted by the awk patch (shellQuote of the expression).
const guardLine = '  if "$yq" eval -e ' + shellQuote(configApi.panelCheck()) + ' "$cfg" >/dev/null 2>&1; then';
// The panel repair line: same text the awk patch prints, taken from the shell branch.
const expression = source.match(/\| (\(select\(strenv\(F50_CONFIG_SOURCE\).*?= true\)\)\)\))' 8/);
if (!expression) throw new Error('panel repair expression not found');
const panelLine = '    ' + expression[1] + ' |';
const guardPattern = /^  if "\$yq" eval -e '.*' "\$cfg" >\/dev\/null 2>&1; then$/m;
if (!guardPattern.test(packaged)) throw new Error('packaged panel guard check line was not found');
if (!/^    \(select\(strenv\(F50_CONFIG_SOURCE\).*\n/m.test(packaged)) throw new Error('packaged panel repair line was not found');
let next = packaged.replace(guardPattern, guardLine)
  .replace(/^    \(select\(strenv\(F50_CONFIG_SOURCE\).*\n/m, panelLine + '\n');
const start = next.indexOf('# KANO_ORIGINAL_CONFIG_PRESERVATION=');
const end = next.indexOf('f50_check_mips_version() {', start);
if (start < 0 || end <= start) throw new Error('preservation block not found');
next = next.slice(0, start) + functions + next.slice(end);
fs.writeFileSync(output, next);
console.log(JSON.stringify({
  bytes: next.length, previous: packaged.length,
  guardLine, panelLine, marker: functions.match(/# KANO_ORIGINAL_CONFIG_PRESERVATION=\d+/)[0],
}, null, 2));
