'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const plugin = fs.readFileSync(path.join(__dirname, '../猫猫TProxy.js'), 'utf8');
const specsStart = plugin.indexOf('const F50_HTTP_CONTROLLER_PATCHES = ') + 'const F50_HTTP_CONTROLLER_PATCHES = '.length;
const registry = JSON.parse(plugin.slice(specsStart, plugin.indexOf('\n};', specsStart) + 2));
const version = plugin.match(/^const F50_COMPAT_VERSION = '([^']+)';$/m)[1];
const expected = Object.values(registry[version])[0];

function generatePatches(original) {
  // The offsets and virtual addresses below belong to the bundled ARM64 compat.2.3 build.
  if (original.subarray(0, 4).toString('hex') !== '7f454c46' || original[4] !== 2 || original.readUInt16LE(18) !== 183) {
    throw new Error('Expected the bundled ARM64 ELF controller.');
  }
  for (const spec of expected) {
    if (!original.subarray(spec.offset, spec.offset + spec.size).equals(Buffer.from(spec.before, 'base64'))) {
      throw new Error(`Unsupported controller bytes at ${spec.offset}.`);
    }
  }
  const patches = [];
  const put = (offset, after) => patches.push({ offset, before: original.subarray(offset, offset + after.length).toString('base64'), after: after.toString('base64'), size: after.length });
  const words = values => {
    const buffer = Buffer.alloc(values.length * 4);
    values.forEach((value, index) => buffer.writeUInt32LE(value >>> 0, index * 4));
    return buffer;
  };
  const branch = (pc, target, condition) => {
    const distance = (target - pc) / 4;
    return condition === undefined
      ? (0x14000000 | (distance & 0x3ffffff)) >>> 0
      : (0x54000000 | ((distance & 0x7ffff) << 5) | condition) >>> 0;
  };
  const adrp = (pc, address, register) => {
    const pages = (Math.floor(address / 4096) - Math.floor(pc / 4096)) & 0x1fffff;
    return (0x90000000 | ((pages & 3) << 29) | ((pages >>> 2) << 5) | register) >>> 0;
  };
  const addImm = (address, register) => (0x91000000 | ((address & 4095) << 10) | (register << 5) | register) >>> 0;

  // validURL: accept four-byte "http" or five-byte "https", then retain the existing URL checks.
  put(0x275e94, words([
    0xf9400404, 0xf100109f, branch(0x285e9c, 0x285ea8, 0), 0xf100149f,
    branch(0x285ea4, 0x285ed4, 1), 0xf9400007, 0xb94000e5, 0xd28e8d06,
    0xf2ae0e86, 0x6b0600bf, branch(0x285ebc, 0x285ed4, 1), 0xf100109f,
    branch(0x285ec4, 0x285edc, 0), 0x394010e5, 0x7101ccbf, branch(0x285ed0, 0x285edc, 0),
  ]));

  // fetchCurl: use a non-calling stub in unused padding to choose 80 or 443; preserve explicit ports.
  const returnPC = 0x2882a4, stubPC = 0x2b0e70;
  const stub = words([
    (0xb5000000 | ((((returnPC - stubPC) / 4) & 0x7ffff) << 5) | 3) >>> 0,
    0xf940c3e4, 0xf9400484, 0xf100109f, branch(0x2b0e80, 0x2b0e98, 0),
    0xd2800063, adrp(0x2b0e88, 0x3469d5, 2), addImm(0x3469d5, 2), branch(0x2b0e90, returnPC),
    0xd503201f, 0xd2800043, adrp(0x2b0e9c, 0x59011b, 2), addImm(0x59011b, 2), branch(0x2b0ea4, returnPC),
  ]);
  if (original.subarray(0x3369d5, 0x3369d8).toString() !== '443') throw new Error('HTTPS port constant mismatch.');
  put(0x27828c, words([branch(0x28828c, stubPC)]));
  put(0x2a0e70, stub);
  const size = Buffer.alloc(8);
  size.writeBigUInt64LE(0x2a0ea8n);
  put(0xd0, size);
  put(0xd8, size);

  // Extend the executable segment over the stub and point curl's string descriptor at data padding.
  put(0x580110, Buffer.from('=http,https80'));
  const descriptor = Buffer.alloc(16);
  descriptor.writeBigUInt64LE(0x590110n, 0);
  descriptor.writeBigUInt64LE(11n, 8);
  put(0x3d47e8, descriptor);
  put(3448114, Buffer.from('subscription URL must use HTTP(S), no userinfo.'));
  return patches;
}

module.exports = { generatePatches };

if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node scripts/patch_controller_http.js <original-controller-or-zip> <output-controller>');
  let original;
  if (path.extname(input).toLowerCase() === '.zip') {
    const result = spawnSync('tar', ['-xOf', input, 'Scripts/clashctl_arm64'], { maxBuffer: 16 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(String(result.stderr));
    original = result.stdout;
  } else original = fs.readFileSync(input);
  const patches = generatePatches(original);
  const patched = Buffer.from(original);
  for (const patch of patches) Buffer.from(patch.after, 'base64').copy(patched, patch.offset);
  fs.writeFileSync(output, patched, { flag: 'wx', mode: 0o755 });
  console.log(`Generated ${patches.length} patches: ${output}`);
}
