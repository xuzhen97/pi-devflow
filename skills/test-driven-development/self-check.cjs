const assert = require('assert');
const fs = require('fs');
const path = require('path');

const skill = fs.readFileSync(path.join(__dirname, 'SKILL.md'), 'utf8');
const refs = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)].map(match => match[1]);
assert.deepEqual(refs, ['references/writing-good-tests.md']);
assert(fs.existsSync(path.join(__dirname, refs[0])));
assert(skill.includes('TDD not applicable'));
assert(skill.includes('What realistic production defect should this test catch?'));
assert(!/superpowers:|docs\/superpowers/.test(skill));
console.log('test-driven-development self-check passed');
