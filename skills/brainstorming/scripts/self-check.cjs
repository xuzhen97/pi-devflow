const assert = require('assert');
const vm = require('vm');
const fs = require('fs');

const sent = [];
const context = {
  window: {
    sessionStorage: { getItem: () => 'key' },
    location: { host: 'localhost:1' }
  },
  document: { addEventListener() {}, querySelector: () => null },
  WebSocket: class {
    static OPEN = 1;
    constructor() { this.readyState = 1; }
    send(message) { sent.push(JSON.parse(message)); }
  },
  setTimeout() {},
  clearTimeout() {},
  Date
};
vm.runInNewContext(fs.readFileSync(__dirname + '/helper.js', 'utf8'), context);
context.window.brainstorm.choice('a');
assert.equal(sent.at(-1).choice, 'a');

const root = __dirname + '/../..';
const brainstorming = fs.readFileSync(__dirname + '/../SKILL.md', 'utf8');
const planning = fs.readFileSync(root + '/writing-plans/SKILL.md', 'utf8');
const executing = fs.readFileSync(root + '/executing-plans/SKILL.md', 'utf8');

assert(brainstorming.includes('Approval never carries forward'));
assert(brainstorming.includes('Generate the temporary Spec at <path>?'));
assert(brainstorming.includes('Write or update <ADR path>?'));
assert(brainstorming.includes('Never invoke an implementation workflow from brainstorming'));
assert(planning.includes('implementation files are read-only'));
assert(planning.includes('Execute the reviewed Plan at .tmp/plans/<filename>.md?'));
assert(executing.includes('Invocation is not execution authorization'));
assert(executing.includes('Begin executing the reviewed Plan at <path>?'));

console.log('brainstorming helper and workflow-gate self-check passed');
