'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');
const Module = require('node:module');
// Node ships Acorn; this keeps the maintenance tool dependency-free.
const parser = new Module('f50-acorn');
parser._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'], 'f50-acorn.cjs');
const acorn = parser.exports;
const parse = source => acorn.parse(source, { ecmaVersion: 'latest' });
function visit(node, callback, parent = null) {
  if (!node || typeof node !== 'object') return;
  if (node.type) callback(node, parent);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => visit(child, callback, node));
    else if (value && typeof value === 'object') visit(value, callback, node);
  }
}
function semantics(ast) {
  return JSON.stringify(ast, (key, value) => {
    if (['start', 'end', 'loc', 'range', 'raw'].includes(key)) return undefined;
    if (value instanceof RegExp) return String(value);
    return value;
  });
}
function compact(input) {
  const sizes = { original: Buffer.byteLength(input) };
  let source = input;
  const close = source.indexOf('//</script >');
  assert.ok(close >= 0 && source.slice(close).includes('GNU AFFERO GENERAL PUBLIC LICENSE'));
  source = source.slice(0, close + '//</script >'.length) + '\r\n';
  sizes.license = Buffer.byteLength(source);
  source = source.replace(/\r\n/g, '\n');
  sizes.lf = Buffer.byteLength(source);
  const before = parse(source), replacements = [];
  visit(before, node => {
    if (node.type !== 'Literal' || typeof node.value !== 'string') {
      if (node.type !== 'TemplateElement') return;
    }
    const raw = source.slice(node.start, node.end);
    const next = raw.replace(/(\\+)u([0-9a-fA-F]{4})/g, (match, slashes, hex) => {
      const value = parseInt(hex, 16);
      return slashes.length % 2 && ((value >= 0x3000 && value <= 0x9fff) || (value >= 0xff00 && value <= 0xffef))
        ? slashes.slice(1) + String.fromCharCode(value) : match;
    });
    if (next !== raw) replacements.push([node.start, node.end, next]);
  });
  // Explicitly exclude all elements of tagged templates.
  const tagged = [];
  visit(before, node => { if (node.type === 'TaggedTemplateExpression') tagged.push(node.quasi); });
  for (const [start, end, next] of replacements.sort((a, b) => b[0] - a[0])) {
    if (!tagged.some(node => start >= node.start && end <= node.end)) source = source.slice(0, start) + next + source.slice(end);
  }
  assert.equal(semantics(parse(source)), semantics(before), 'string / template / regexp semantics changed');
  sizes.utf8 = Buffer.byteLength(source);
  const ast = parse(source), edits = [];
  const identifiers = [];
  visit(ast, node => { if (node.type === 'Identifier') identifiers.push(node); });
  visit(ast, node => {
    if (node.type !== 'VariableDeclaration' || node.declarations.length !== 1) return;
    const binding = node.declarations[0];
    if (binding.id.name === 'setConfigSourceCmd') {
      assert.equal(identifiers.filter(n => n.name === binding.id.name).length, 1, 'setConfigSourceCmd is referenced');
      edits.push([node.start, node.end, '']);
    }
    if (binding.id.name === 'componentsGroup') {
      assert.equal(identifiers.filter(n => n.name === binding.id.name).length, 1, 'componentsGroup is referenced');
      assert.equal(binding.init.type, 'CallExpression');
      assert.equal(binding.init.callee.name, 'appendActionGroup');
      edits.push([node.start, binding.init.start, '']);
    }
  });
  for (const [start, end, next] of edits.sort((a, b) => b[0] - a[0])) source = source.slice(0, start) + next + source.slice(end);
  parse(source);
  sizes.dead = Buffer.byteLength(source);
  return { source, sizes };
}
if (require.main === module) {
  const [input, output] = process.argv.slice(2);
  assert.ok(input && output, 'Usage: node scripts/compact_plugin.js INPUT OUTPUT');
  const result = compact(fs.readFileSync(input, 'utf8'));
  fs.writeFileSync(output, result.source);
  console.log(JSON.stringify(result.sizes));
}
module.exports = { compact, parse, visit, semantics };
