const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const skill = fs.readFileSync(path.join(root, 'SKILL.md'), 'utf8');
const refs = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)].map(match => match[1]);

assert.deepEqual(refs.sort(), [
  'references/condition-based-waiting.md',
  'references/defense-in-depth.md',
  'references/root-cause-tracing.md'
]);
for (const ref of refs) assert(fs.existsSync(path.join(root, ref)), `missing ${ref}`);
assert(!/superpowers:|docs\/superpowers/.test(skill));
console.log('systematic-debugging self-check passed');
